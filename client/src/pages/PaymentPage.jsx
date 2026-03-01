import { useState } from 'react';
import Layout from '../components/Layout';
import KioskButton from '../components/KioskButton';
import api from '../services/api';

export default function PaymentPage() {
  const [amount, setAmount] = useState('');
  const [serviceType, setServiceType] = useState('electricity');
  const [payment, setPayment] = useState(null);
  const [receiptUrl, setReceiptUrl] = useState('');
  const [message, setMessage] = useState('');

  const createPayment = async () => {
    try {
      const { data } = await api.post('/api/payments/create', { amount: Number(amount), serviceType });
      setPayment(data.payment);
      setReceiptUrl('');
      setMessage(`Payment created. Txn: ${data.payment.transactionId}`);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Payment creation failed');
    }
  };

  const verify = async (status) => {
    try {
      const { data } = await api.post('/api/payments/verify', {
        paymentId: payment.id,
        status
      });
      const generatedUrl = data.receipt?.receiptUrl || '';
      setReceiptUrl(generatedUrl);
      setMessage(`Payment ${data.payment.status}.`);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Payment verification failed');
    }
  };

  return (
    <Layout title="Utility Bill Payment">
      <div className="hero-strip mb-4 p-5">
        <h2 className="text-2xl font-bold">Utility Bill Payment</h2>
        <p className="mt-1 text-sm text-slate-100">Create payment, verify outcome, and generate receipt.</p>
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
          <input
            className="w-full rounded-lg border p-3 text-lg"
            placeholder="Amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <KioskButton onClick={createPayment}>Create Payment</KioskButton>
          {payment && (
            <div className="grid gap-3 md:grid-cols-2">
              <KioskButton className="bg-gradient-to-r from-emerald-500 to-teal-600" onClick={() => verify('SUCCESS')}>
                Mark Success
              </KioskButton>
              <KioskButton className="bg-gradient-to-r from-rose-500 to-pink-600" onClick={() => verify('FAILED')}>
                Mark Failed
              </KioskButton>
            </div>
          )}
          {message && <p className="rounded-lg bg-slate-100 p-3 text-sm text-slate-700">{message}</p>}
          {receiptUrl && (
            <a
              href={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${receiptUrl}`}
              target="_blank"
              rel="noreferrer"
              className="touch-btn inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-4 py-3 text-lg font-semibold text-white shadow transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              Download PDF Receipt
            </a>
          )}
        </div>
      </div>
    </Layout>
  );
}
