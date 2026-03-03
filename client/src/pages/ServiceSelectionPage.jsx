import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Layout from '../components/Layout';
import KioskButton from '../components/KioskButton';
import OnScreenKeyboard from '../components/OnScreenKeyboard';
import api from '../services/api';
import { enqueueOfflineAction } from '../services/offlineSync';

export default function ServiceSelectionPage() {
  const { t } = useTranslation();
  const [serviceType, setServiceType] = useState('electricity');
  const [description, setDescription] = useState('');
  const [message, setMessage] = useState('');
  const [showKeyboard, setShowKeyboard] = useState(true);

  const startVoiceFill = useCallback(() => {
    window.dispatchEvent(
      new CustomEvent('suvidha:voice-capture-request', {
        detail: {
          field: 'service_description',
          prompt: 'Please describe your service request now.',
          source: 'service-description'
        }
      })
    );
    setMessage('Listening for service request description...');
  }, []);

  useEffect(() => {
    const onVoiceFill = (event) => {
      const payload = event?.detail || {};
      if (payload.field !== 'service_description') return;

      const nextValue = String(payload.value || '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 500);

      if (!nextValue) return;
      setDescription(nextValue);
      setMessage('Service request description filled from voice.');
    };

    window.addEventListener('suvidha:voice-fill', onVoiceFill);
    return () => window.removeEventListener('suvidha:voice-fill', onVoiceFill);
  }, []);

  const submitRequest = async () => {
    if (!description.trim()) {
      setMessage('Description is required.');
      return;
    }

    try {
      const { data } = await api.post('/api/services/request', { serviceType, description });
      setMessage(`Request created. Your Reference ID: ${data.referenceCode || data.id}`);
      setDescription('');
    } catch (error) {
      if (!error.response) {
        const queueLength = await enqueueOfflineAction({
          type: 'SERVICE_REQUEST_CREATE',
          payload: { serviceType, description }
        });
        setMessage(`Offline detected. Request queued securely. Queue size: ${queueLength}`);
        setDescription('');
        return;
      }
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
          <KioskButton onClick={submitRequest}>Submit Service Request</KioskButton>
          {message && <p className="rounded-lg bg-slate-100 p-3 text-sm text-slate-700">{message}</p>}
        </div>
      </div>
    </Layout>
  );
}
