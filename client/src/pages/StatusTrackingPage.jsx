import { useState } from 'react';
import Layout from '../components/Layout';
import KioskButton from '../components/KioskButton';
import api from '../services/api';

export default function StatusTrackingPage() {
  const [requestId, setRequestId] = useState('');
  const [result, setResult] = useState(null);
  const [message, setMessage] = useState('');

  const track = async () => {
    try {
      const { data } = await api.get(`/api/services/application-status/${requestId}`);
      setResult(data);
      setMessage('Status fetched successfully');
    } catch (error) {
      setResult(null);
      setMessage(error.response?.data?.message || 'Unable to fetch status');
    }
  };

  return (
    <Layout title="Request Status Tracking">
      <div className="hero-strip mb-4 p-5">
        <h2 className="text-2xl font-bold">Track Request Status</h2>
        <p className="mt-1 text-sm text-slate-100">Enter 4-digit reference ID and see real-time progress instantly.</p>
      </div>
      <div className="panel-card panel-card-hover mx-auto max-w-2xl p-6">
        <div className="space-y-3">
          <input
            className="w-full rounded-lg border p-3 text-lg"
            placeholder="Enter 4-digit reference ID"
            type="text"
            inputMode="numeric"
            value={requestId}
            onChange={(e) => setRequestId(e.target.value)}
          />
          <KioskButton onClick={track}>Track Status</KioskButton>
          {message && <p className="rounded-lg bg-slate-100 p-3 text-sm text-slate-700">{message}</p>}
          {result && (
            <div className="rounded-lg bg-gradient-to-r from-sky-50 to-cyan-50 p-4 text-sm">
              <p><strong>Application Type:</strong> {result.applicationType}</p>
              <p><strong>Reference ID:</strong> {result.referenceCode || result.id}</p>
              <p><strong>Category:</strong> {result.category}</p>
              <p><strong>Status:</strong> <span className="status-chip">{result.status}</span></p>
              <p><strong>Description:</strong> {result.description}</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
