import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import api, { getApiBaseUrl } from '../services/api';

const statuses = ['PENDING', 'IN_PROGRESS', 'RESOLVED', 'REJECTED'];

export default function ComplaintsManagementPage() {
  const [complaints, setComplaints] = useState([]);

  const resolveDocUrl = (url) => {
    if (!url) return '#';
    const apiBase = String(getApiBaseUrl()).replace(/\/$/, '');
    return url.replace(/^http:\/\/localhost:5000/i, apiBase);
  };

  const load = async () => {
    const { data } = await api.get('/api/admin/complaints');
    setComplaints(data);
  };

  useEffect(() => {
    load();
  }, []);

  const update = async (id, status) => {
    await api.put(`/api/admin/update-status/${id}`, { type: 'complaint', status });
    await load();
  };

  const closeItem = async (id) => {
    const ok = window.confirm('Close this complaint and delete it permanently?');
    if (!ok) return;
    await api.delete(`/api/admin/close/${id}`, { data: { type: 'complaint' } });
    await load();
  };

  return (
    <Layout title="Complaints Management">
      <div className="hero-strip mb-4 p-5">
        <h2 className="text-2xl font-bold">Complaints Management</h2>
        <p className="mt-1 text-sm text-slate-100">Track complaint resolution and response quality.</p>
      </div>
      <div className="space-y-3">
        {complaints.map((item) => (
          <div key={item.id} className="panel-card panel-card-hover p-4">
            <p className="font-semibold">Ref #{item.referenceCode || item.id} - {item.category}</p>
            <p className="text-sm">Citizen: {item.user?.mobile}</p>
            <p className="mt-1 text-sm text-slate-700"><strong>Complaint:</strong> {item.description}</p>
            {!!item.user?.documents?.length && (
              <div className="mt-2 rounded-lg bg-slate-50 p-2 text-xs text-slate-700">
                <p className="font-semibold">User Documents</p>
                <div className="mt-1 flex flex-wrap gap-2">
                  {item.user.documents.map((doc) => (
                    <a
                      key={doc.id}
                      href={resolveDocUrl(doc.fileUrl)}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full border border-slate-300 bg-white px-2 py-1 font-medium text-slate-700 hover:bg-slate-100"
                    >
                      {doc.docType}
                    </a>
                  ))}
                </div>
              </div>
            )}
            <p className="text-sm">Current: <span className="status-chip">{item.status}</span></p>
            <div className="mt-2 flex flex-wrap gap-2">
              {statuses.map((status) => (
                <button
                  key={status}
                  className="rounded-full border border-slate-300 bg-slate-100 px-3 py-1 text-sm font-semibold transition hover:bg-slate-200"
                  onClick={() => update(item.id, status)}
                >
                  {status}
                </button>
              ))}
              {(item.status === 'RESOLVED' || item.status === 'REJECTED') && (
                <button
                  className="rounded-full border border-rose-300 bg-rose-100 px-3 py-1 text-sm font-semibold text-rose-700 transition hover:bg-rose-200"
                  onClick={() => closeItem(item.id)}
                >
                  Close & Delete
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </Layout>
  );
}
