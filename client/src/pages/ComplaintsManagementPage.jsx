import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import api from '../services/api';

const statuses = ['PENDING', 'IN_PROGRESS', 'RESOLVED', 'REJECTED'];

export default function ComplaintsManagementPage() {
  const [complaints, setComplaints] = useState([]);

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

  return (
    <Layout title="Complaints Management">
      <div className="hero-strip mb-4 p-5">
        <h2 className="text-2xl font-bold">Complaints Management</h2>
        <p className="mt-1 text-sm text-slate-100">Track complaint resolution and response quality.</p>
      </div>
      <div className="space-y-3">
        {complaints.map((item) => (
          <div key={item.id} className="panel-card panel-card-hover p-4">
            <p className="font-semibold">#{item.id} - {item.category}</p>
            <p className="text-sm">Citizen: {item.user?.mobile}</p>
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
            </div>
          </div>
        ))}
      </div>
    </Layout>
  );
}
