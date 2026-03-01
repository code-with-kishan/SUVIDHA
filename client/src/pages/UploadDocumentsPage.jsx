import { useState } from 'react';
import Layout from '../components/Layout';
import KioskButton from '../components/KioskButton';
import api from '../services/api';

export default function UploadDocumentsPage() {
  const [docType, setDocType] = useState('ID_PROOF');
  const [file, setFile] = useState(null);
  const [consent, setConsent] = useState(false);
  const [message, setMessage] = useState('');

  const upload = async () => {
    if (!file) {
      setMessage('Please select a file');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('docType', docType);
    formData.append('consent', String(consent));

    try {
      const { data } = await api.post('/api/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setMessage(`Uploaded: ${data.fileUrl}`);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Upload failed');
    }
  };

  return (
    <Layout title="Document Upload">
      <div className="hero-strip mb-4 p-5">
        <h2 className="text-2xl font-bold">Upload Documents</h2>
        <p className="mt-1 text-sm text-slate-100">Securely upload required files with consent validation.</p>
      </div>
      <div className="panel-card panel-card-hover mx-auto max-w-2xl p-6">
        <div className="space-y-3">
          <select
            className="w-full rounded-lg border p-3 text-lg"
            value={docType}
            onChange={(e) => setDocType(e.target.value)}
          >
            <option value="ID_PROOF">ID Proof</option>
            <option value="ADDRESS_PROOF">Address Proof</option>
            <option value="BILL_COPY">Bill Copy</option>
          </select>
          <input
            className="w-full rounded-lg border p-3"
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) => setFile(e.target.files[0])}
          />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
            I provide consent to upload and process this document.
          </label>
          <KioskButton onClick={upload}>Upload Document</KioskButton>
          {message && <p className="break-all rounded-lg bg-slate-100 p-3 text-sm text-slate-700">{message}</p>}
        </div>
      </div>
    </Layout>
  );
}
