import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Layout from '../components/Layout';
import KioskButton from '../components/KioskButton';
import OnScreenKeypad from '../components/OnScreenKeypad';
import api from '../services/api';

export default function PaymentPage() {
  const { t } = useTranslation();
  const [amount, setAmount] = useState('');
  const [serviceType, setServiceType] = useState('electricity');
  const [payment, setPayment] = useState(null);
  const [receiptUrl, setReceiptUrl] = useState('');
  const [message, setMessage] = useState('');
  const [risk, setRisk] = useState(null);
  const [activeField, setActiveField] = useState('');

  const normalizeSpokenAmount = useCallback((raw) => {
    const value = String(raw || '').trim();
    if (!value) return '';

    const tokenMap = {
      zero: '0',
      oh: '0',
      o: '0',
      one: '1',
      two: '2',
      to: '2',
      too: '2',
      three: '3',
      four: '4',
      for: '4',
      five: '5',
      six: '6',
      seven: '7',
      eight: '8',
      ate: '8',
      nine: '9',
      point: '.',
      dot: '.',
      decimal: '.',
      शून्य: '0',
      एक: '1',
      दो: '2',
      तीन: '3',
      चार: '4',
      पांच: '5',
      पाँच: '5',
      छह: '6',
      सात: '7',
      आठ: '8',
      नौ: '9'
    };

    const unicodeDigitNormalized = value.replace(/[०-९]/g, (char) => String(char.charCodeAt(0) - 2406));
    const direct = unicodeDigitNormalized.match(/\d+(?:\.\d+)?/);
    if (direct?.[0]) return direct[0];

    const normalized = unicodeDigitNormalized
      .toLowerCase()
      .replace(/[-,]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const tokens = normalized.split(' ');
    let built = '';
    for (const token of tokens) {
      if (tokenMap[token]) built += tokenMap[token];
    }

    const safe = built.replace(/[^\d.]/g, '');
    const firstDot = safe.indexOf('.');
    if (firstDot === -1) return safe;
    const integerPart = safe.slice(0, firstDot + 1);
    const fractionPart = safe.slice(firstDot + 1).replace(/\./g, '');
    return `${integerPart}${fractionPart}`;
  }, []);

  const startVoiceFillAmount = useCallback(() => {
    window.dispatchEvent(
      new CustomEvent('suvidha:voice-capture-request', {
        detail: {
          field: 'payment_amount',
          prompt: 'Please say the payment amount now.',
          source: 'payment-amount'
        }
      })
    );
    setMessage('Listening for amount...');
  }, []);

  useEffect(() => {
    const onVoiceFill = (event) => {
      const payload = event?.detail || {};
      if (payload.field !== 'payment_amount') return;

      const normalized = normalizeSpokenAmount(payload.value);
      if (!normalized) {
        setMessage('Could not capture amount from voice. Please try again.');
        return;
      }

      setAmount(normalized);
      setMessage('Amount filled from voice.');
    };

    window.addEventListener('suvidha:voice-fill', onVoiceFill);
    return () => window.removeEventListener('suvidha:voice-fill', onVoiceFill);
  }, [normalizeSpokenAmount]);

  const createPayment = async () => {
    if (!amount || Number(amount) <= 0) {
      setMessage('Please enter a valid amount.');
      return;
    }

    try {
      const { data } = await api.post('/api/payments/create', { amount: Number(amount), serviceType });
      setPayment(data.payment);
      setRisk(data.risk || null);
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
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            onFocus={() => setActiveField('amount')}
          />
          {activeField === 'amount' && (
            <OnScreenKeypad
              value={amount}
              onChange={setAmount}
              allowDecimal
              onClose={() => setActiveField('')}
            />
          )}
          <button
            type="button"
            className="touch-btn rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700"
            onClick={startVoiceFillAmount}
          >
            Voice Fill Amount
          </button>
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
          {risk && (
            <div className="rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-700">
              <p>
                <strong>Fraud Risk:</strong> {risk.riskLevel} ({risk.riskScore}/100)
              </p>
              {risk.reasons?.length > 0 && <p className="mt-1">Signals: {risk.reasons.join(', ')}</p>}
            </div>
          )}
          {receiptUrl && (
            <a
              href={`${import.meta.env.VITE_API_URL || 'http://localhost:5003'}${receiptUrl}`}
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
