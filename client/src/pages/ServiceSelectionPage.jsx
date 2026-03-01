import { useState } from 'react';
import Layout from '../components/Layout';
import KioskButton from '../components/KioskButton';
import api from '../services/api';

export default function ServiceSelectionPage() {
  const [serviceType, setServiceType] = useState('electricity');
  const [description, setDescription] = useState('');
  const [message, setMessage] = useState('');

  const submitRequest = async () => {
    try {
      const { data } = await api.post('/api/services/request', { serviceType, description });
      setMessage(`Request created with ID: ${data.id}`);
      setDescription('');
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to submit request');
    }
  };

  return (
    <Layout title="Service Request Submission">
      <div className="hero-strip mb-4 p-5">
        <h2 className="text-2xl font-bold">Create Service Request</h2>
        <p className="mt-1 text-sm text-slate-100">Submit utility and municipal requests in one place.</p>
      </div>
      <div className="panel-card panel-card-hover mx-auto max-w-2xl p-6">
        <div className="space-y-3">
          <select
            className="w-full rounded-lg border p-3 text-lg"
            value={serviceType}
            onChange={(e) => setServiceType(e.target.value)}
          >
            <option value="electricity">Electricity</option>
            <option value="water">Water</option>
            <option value="gas">Gas</option>
            <option value="municipal">Municipal</option>
          </select>
          <textarea
            className="w-full rounded-lg border p-3 text-lg"
            rows={5}
            placeholder="Describe your request"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <KioskButton onClick={submitRequest}>Submit Service Request</KioskButton>
          {message && <p className="rounded-lg bg-slate-100 p-3 text-sm text-slate-700">{message}</p>}
        </div>
      </div>
    </Layout>
  );
}
