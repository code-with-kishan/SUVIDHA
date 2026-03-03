import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Layout from '../components/Layout';
import KioskButton from '../components/KioskButton';
import OnScreenKeyboard from '../components/OnScreenKeyboard';
import api from '../services/api';
import { enqueueOfflineAction } from '../services/offlineSync';

export default function ComplaintPage() {
  const { t } = useTranslation();
  const [category, setCategory] = useState('sanitation');
  const [description, setDescription] = useState('');
  const [message, setMessage] = useState('');
  const [showKeyboard, setShowKeyboard] = useState(true);

  const startVoiceFill = useCallback(() => {
    window.dispatchEvent(
      new CustomEvent('suvidha:voice-capture-request', {
        detail: {
          field: 'complaint_description',
          prompt: 'Please describe your complaint now.',
          source: 'complaint-description'
        }
      })
    );
    setMessage('Listening for complaint description...');
  }, []);

  useEffect(() => {
    const onVoiceFill = (event) => {
      const payload = event?.detail || {};
      if (payload.field !== 'complaint_description') return;

      const nextValue = String(payload.value || '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 500);

      if (!nextValue) return;
      setDescription(nextValue);
      setMessage('Complaint description filled from voice.');
    };

    window.addEventListener('suvidha:voice-fill', onVoiceFill);
    return () => window.removeEventListener('suvidha:voice-fill', onVoiceFill);
  }, []);

  const submitComplaint = async () => {
    if (!description.trim()) {
      setMessage('Description is required.');
      return;
    }

    try {
      const { data } = await api.post('/api/complaints', { category, description });
      setMessage(`Complaint registered. Your Reference ID: ${data.referenceCode || data.id}`);
      setDescription('');
    } catch (error) {
      if (!error.response) {
        const queueLength = await enqueueOfflineAction({
          type: 'COMPLAINT_CREATE',
          payload: { category, description }
        });
        setMessage(`Offline detected. Complaint queued securely. Queue size: ${queueLength}`);
        setDescription('');
        return;
      }
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
          <button
            type="button"
            className="touch-btn rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700"
            onClick={() => setShowKeyboard((value) => !value)}
          >
            {t('toggleKeyboard')}
          </button>
          <button
            type="button"
            className="touch-btn rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700"
            onClick={startVoiceFill}
          >
            Voice Fill Description
          </button>
          {showKeyboard && <OnScreenKeyboard value={description} onChange={setDescription} maxLength={500} />}
          <KioskButton onClick={submitComplaint}>Submit Complaint</KioskButton>
          {message && <p className="rounded-lg bg-slate-100 p-3 text-sm text-slate-700">{message}</p>}
        </div>
      </div>
    </Layout>
  );
}
