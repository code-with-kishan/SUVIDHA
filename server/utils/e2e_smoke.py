import json
import mimetypes
import os
import urllib.request
import uuid

BASE = "http://localhost:5001"
MOBILE = "88" + str(uuid.uuid4().int)[:8]
EMAIL = "knishad0004@gmail.com"
NAME = "Kishan Nishad"
AADHAAR = "123412341234"


def post_json(path, data, token=None):
    payload = json.dumps(data).encode("utf-8")
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(BASE + path, data=payload, headers=headers, method="POST")
    with urllib.request.urlopen(req) as resp:
        return resp.status, json.loads(resp.read().decode("utf-8"))


def get_json(path, token=None):
    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(BASE + path, headers=headers, method="GET")
    with urllib.request.urlopen(req) as resp:
        return resp.status, json.loads(resp.read().decode("utf-8"))


def put_json(path, data, token=None):
    payload = json.dumps(data).encode("utf-8")
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(BASE + path, data=payload, headers=headers, method="PUT")
    with urllib.request.urlopen(req) as resp:
        return resp.status, json.loads(resp.read().decode("utf-8"))


def post_multipart(path, fields, file_field, file_path, token=None):
    boundary = "----Boundary" + uuid.uuid4().hex
    parts = []

    for key, value in fields.items():
        parts.append(
            f"--{boundary}\r\nContent-Disposition: form-data; name=\"{key}\"\r\n\r\n{value}\r\n".encode()
        )

    filename = os.path.basename(file_path)
    ctype = mimetypes.guess_type(filename)[0] or "application/octet-stream"
    with open(file_path, "rb") as uploaded_file:
        file_data = uploaded_file.read()

    parts.append(
        (
            f"--{boundary}\r\n"
            f"Content-Disposition: form-data; name=\"{file_field}\"; filename=\"{filename}\"\r\n"
            f"Content-Type: {ctype}\r\n\r\n"
        ).encode()
        + file_data
        + b"\r\n"
    )

    parts.append(f"--{boundary}--\r\n".encode())
    body = b"".join(parts)

    headers = {"Content-Type": f"multipart/form-data; boundary={boundary}"}
    if token:
        headers["Authorization"] = f"Bearer {token}"

    req = urllib.request.Request(BASE + path, data=body, headers=headers, method="POST")
    with urllib.request.urlopen(req) as resp:
        return resp.status, json.loads(resp.read().decode("utf-8"))


def head(path):
    req = urllib.request.Request(BASE + path, method="HEAD")
    with urllib.request.urlopen(req) as resp:
        return resp.status, dict(resp.headers)


def run():
    results = {}

    status, send = post_json("/api/auth/send-otp", {"mobile": MOBILE, "email": EMAIL})
    results["send_otp"] = {"status": status, "channels": send.get("channels")}
    otp = send["devOtp"]

    status, verify = post_json(
        "/api/auth/verify-otp",
        {
            "mobile": MOBILE,
            "otp": otp,
            "name": NAME,
            "email": EMAIL,
            "aadhaar": AADHAAR,
        },
    )
    results["verify_otp"] = {"status": status, "has_token": bool(verify.get("token"))}
    token = verify["token"]

    status, complaint = post_json(
        "/api/complaints",
        {"category": "water-leakage", "description": "Leak near Ward 12 main road"},
        token,
    )
    results["complaint"] = {"status": status, "id": complaint.get("id")}

    status, service = post_json(
        "/api/services/request",
        {"serviceType": "electricity", "description": "New meter installation request"},
        token,
    )
    results["service"] = {"status": status, "id": service.get("id")}

    status, service_status = get_json(f"/api/services/status/{service['id']}", token)
    results["service_status"] = {"status": status, "value": service_status.get("status")}

    with open("/tmp/suvidha_doc_test.pdf", "wb") as test_file:
        test_file.write(b"test doc content")

    status, document = post_multipart(
        "/api/documents/upload",
        {"docType": "BILL_COPY", "consent": "true"},
        "file",
        "/tmp/suvidha_doc_test.pdf",
        token,
    )
    results["document_upload"] = {"status": status, "has_url": bool(document.get("fileUrl"))}

    status, payment = post_json(
        "/api/payments/create", {"amount": 450.75, "serviceType": "electricity"}, token
    )
    payment_id = payment["payment"]["id"]
    results["payment_create"] = {"status": status, "id": payment_id}

    status, payment_verify = post_json(
        "/api/payments/verify", {"paymentId": payment_id, "status": "SUCCESS"}, token
    )
    receipt_url = payment_verify["receipt"]["receiptUrl"]
    results["payment_verify"] = {"status": status, "receipt_url": receipt_url}

    status, headers = head(receipt_url)
    results["receipt_head"] = {
        "status": status,
        "content_type": headers.get("Content-Type"),
    }

    status, admin_login = post_json(
        "/api/admin/login", {"mobile": "9999999999", "password": "Admin@123"}
    )
    admin_token = admin_login["token"]
    results["admin_login"] = {"status": status, "has_token": bool(admin_token)}

    status, dashboard = get_json("/api/admin/dashboard", admin_token)
    results["admin_dashboard"] = {"status": status, "keys": sorted(list(dashboard.keys()))}

    req_status, requests = get_json("/api/admin/requests", admin_token)
    comp_status, complaints = get_json("/api/admin/complaints", admin_token)
    usr_status, users = get_json("/api/admin/users", admin_token)
    results["admin_lists"] = {
        "requests_status": req_status,
        "complaints_status": comp_status,
        "users_status": usr_status,
        "requests_count": len(requests),
        "complaints_count": len(complaints),
        "users_count": len(users),
    }

    status, update = put_json(
        f"/api/admin/update-status/{complaint['id']}",
        {"type": "complaint", "status": "IN_PROGRESS"},
        admin_token,
    )
    results["admin_update"] = {"status": status, "updated_status": update.get("status")}

    print(json.dumps(results, indent=2))


if __name__ == "__main__":
    run()
