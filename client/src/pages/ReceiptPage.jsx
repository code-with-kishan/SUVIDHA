import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import api from '../services/api';

export default function ReceiptPage() {
  const [payments, setPayments] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/api/admin/requests');
        setPayments(data || []);
      } catch (_error) {
        setMessage('Use admin reports for centralized receipts.');
      }
    })();
  }, []);

  return (
    <Layout title="Receipt & Records">
      <div className="hero-strip mb-4 p-5">
        <h2 className="text-2xl font-bold">Receipts & Records</h2>
        <p className="mt-1 text-sm text-slate-100">View recent records and print digital receipts.</p>
      </div>
      <div className="panel-card panel-card-hover p-6">
        <p className="mb-4 text-sm text-slate-600">
          Latest transactional records can be printed from admin reports and payment success responses.
        </p>
        {message && <p className="rounded-lg bg-slate-100 p-3 text-sm text-slate-700">{message}</p>}
        <div className="space-y-2 text-sm">
          {payments.slice(0, 8).map((item) => (
            <div key={item.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              Request #{item.id} - {item.serviceType} - {item.status}
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
