import { useState } from 'react';
import Layout from '../components/Layout';
import KioskButton from '../components/KioskButton';
import api from '../services/api';

export default function ComplaintPage() {
  const [category, setCategory] = useState('sanitation');
  const [description, setDescription] = useState('');
  const [message, setMessage] = useState('');

  const submitComplaint = async () => {
    try {
      const { data } = await api.post('/api/complaints', { category, description });
      setMessage(`Complaint registered. ID: ${data.id}`);
      setDescription('');
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to register complaint');
    }
  };

  return (
    <Layout title="Complaint Registration">
      <div className="hero-strip mb-4 p-5">
        <h2 className="text-2xl font-bold">Register Complaint</h2>
        <p className="mt-1 text-sm text-slate-100">Raise civic issues and track their status quickly.</p>
      </div>
      <div className="panel-card panel-card-hover mx-auto max-w-2xl p-6">
        <div className="space-y-3">
          <select
            className="w-full rounded-lg border p-3 text-lg"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="sanitation">Sanitation</option>
            <option value="water-leakage">Water Leakage</option>
            <option value="street-light">Street Light</option>
            <option value="road-damage">Road Damage</option>
          </select>
          <textarea
            rows={5}
            className="w-full rounded-lg border p-3 text-lg"
            placeholder="Describe your complaint"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <KioskButton onClick={submitComplaint}>Submit Complaint</KioskButton>
          {message && <p className="rounded-lg bg-slate-100 p-3 text-sm text-slate-700">{message}</p>}
        </div>
      </div>
    </Layout>
  );
}
