import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import KioskButton from '../components/KioskButton';
import Layout from '../components/Layout';
import { enterGuestMode } from '../redux/store';

const schemes = [
  {
    name: 'PM Surya Ghar Yojana',
    detail: 'Rooftop solar support, subsidy guidance, and application tracking.'
  },
  {
    name: 'Jal Jeevan Mission',
    detail: 'Water supply complaint logging and service continuity updates.'
  },
  {
    name: 'Smart City Citizen Connect',
    detail: 'Urban issue reporting, request tracking, and digital grievance support.'
  }
];

const highlights = [
  { label: 'Active Service Requests', value: '12,840+' },
  { label: 'Complaints Resolved', value: '9,420+' },
  { label: 'Digital Receipts Generated', value: '31,700+' },
  { label: 'Kiosk Languages Available', value: '3' }
];

export default function WelcomePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  return (
    <Layout title={`${t('welcome')} • National Civic Service Display`}>
      <section className="rounded-2xl bg-white p-6 shadow">
        <p className="text-sm font-semibold uppercase tracking-wide text-secondary">
          Ministry-aligned Public Service Interface
        </p>
        <h2 className="mt-2 text-3xl font-bold text-primary">{t('welcome')} to SUVIDHA Digital Kiosk</h2>
        <p className="mt-2 max-w-3xl text-slate-600">
          Unified access to electricity, water, gas, municipal services, payment systems, document
          upload, and grievance redressal for urban citizens.
        </p>
        <div className="mt-6 grid gap-3 md:grid-cols-2">
          <KioskButton onClick={() => navigate('/language')}>Citizen Start / नागरिक सेवा शुरू करें</KioskButton>
          <KioskButton className="bg-slate-700" onClick={() => navigate('/admin')}>
            Administrative Access Portal
          </KioskButton>
          <div className="md:col-span-2">
            <button
              className="touch-btn w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-lg font-semibold text-slate-700"
              onClick={() => {
                dispatch(enterGuestMode());
                navigate('/dashboard');
              }}
            >
              Explore in Guest Mode
            </button>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-4">
        {highlights.map((item) => (
          <div key={item.label} className="rounded-xl bg-white p-4 shadow">
            <p className="text-sm text-slate-500">{item.label}</p>
            <p className="mt-1 text-2xl font-bold text-primary">{item.value}</p>
          </div>
        ))}
      </section>

      <section className="mt-6 grid gap-6 md:grid-cols-3">
        {schemes.map((scheme) => (
          <article key={scheme.name} className="rounded-2xl bg-white p-5 shadow">
            <h3 className="text-lg font-semibold text-primary">{scheme.name}</h3>
            <p className="mt-2 text-sm text-slate-600">{scheme.detail}</p>
          </article>
        ))}
      </section>

      <section className="mt-6 rounded-2xl bg-white p-5 shadow">
        <h3 className="text-lg font-semibold text-primary">Public Notices & Updates</h3>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-700">
          <li>Water service maintenance notice for Ward 14 on Sunday, 8:00 AM to 12:00 PM.</li>
          <li>Electricity bill digital payment rebate available for this billing cycle.</li>
          <li>All grievance status can now be tracked online with service request ID.</li>
        </ul>
      </section>
    </Layout>
  );
}
