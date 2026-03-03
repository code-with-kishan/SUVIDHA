import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import KioskButton from '../components/KioskButton';
import Layout from '../components/Layout';
import { enterGuestMode } from '../redux/store';

const govtBadges = [
  { title: 'Government of India', sub: 'Public Service Interface' },
  { title: 'Digital India', sub: 'Empowered Citizen Access' },
  { title: 'Smart City Mission', sub: 'Integrated Civic Delivery' }
];

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

const steps = [
  'Select your language from top menu.',
  'Click Citizen Start for public services.',
  'Complete secure OTP login.',
  'Choose service: Request, Complaint, Payment, Documents, or Tracking.',
  'Submit details and keep your generated reference ID.'
];

const keyServices = [
  'Citizen Login & OTP Verification',
  'Service Request Registration',
  'Complaint Registration & Resolution Tracking',
  'Utility Bill Payment & Receipt Download',
  'Status Tracking by Reference ID',
  'Document Upload Support'
];

export default function WelcomePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  return (
    <Layout title={`${t('welcome')} • National Civic Service Display`}>
      <section className="hero-strip p-6">
        <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr] lg:items-start">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-100">
              Ministry-aligned Public Service Interface
            </p>
            <h2 className="mt-2 text-3xl font-bold">{t('welcome')} to SUVIDHA Digital Kiosk</h2>
            <p className="mt-2 max-w-3xl text-sm text-slate-100">
              Unified access to electricity, water, gas, municipal services, payments, document upload,
              grievance registration, and live status tracking for citizens.
            </p>
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              {govtBadges.map((badge) => (
                <div key={badge.title} className="rounded-xl bg-white/10 p-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-lg">🇮🇳</div>
                    <p className="text-xs font-bold text-white">{badge.title}</p>
                  </div>
                  <p className="mt-1 text-xs text-slate-100">{badge.sub}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-white/10 p-4">
            <h3 className="text-lg font-semibold text-white">Quick Access</h3>
            <div className="mt-3 grid gap-2">
              <KioskButton onClick={() => navigate('/language')}>Citizen Start / नागरिक सेवा शुरू करें</KioskButton>
              <KioskButton className="bg-slate-700" onClick={() => navigate('/admin')}>
                Administrative Access Portal
              </KioskButton>
              <button
                className="touch-btn w-full rounded-xl border border-white/40 bg-white/10 px-4 py-3 text-lg font-semibold text-white"
                onClick={() => {
                  dispatch(enterGuestMode());
                  navigate('/dashboard');
                }}
              >
                Explore in Guest Mode
              </button>
            </div>
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

      <section className="mt-6 grid gap-6 lg:grid-cols-3">
        <article className="rounded-2xl bg-white p-5 shadow lg:col-span-2">
          <h3 className="text-lg font-semibold text-primary">How to Use This Kiosk (Strict Steps)</h3>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-slate-700">
            {steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </article>
        <article className="rounded-2xl bg-white p-5 shadow">
          <h3 className="text-lg font-semibold text-primary">Core Citizen Services</h3>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-700">
            {keyServices.map((service) => (
              <li key={service}>{service}</li>
            ))}
          </ul>
        </article>
      </section>

      <section className="mt-6 grid gap-6 md:grid-cols-3">
        {schemes.map((scheme) => (
          <article key={scheme.name} className="rounded-2xl bg-white p-5 shadow">
            <h3 className="text-lg font-semibold text-primary">{scheme.name}</h3>
            <p className="mt-2 text-sm text-slate-600">{scheme.detail}</p>
          </article>
        ))}
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        <article className="rounded-2xl bg-white p-5 shadow">
          <h3 className="text-lg font-semibold text-primary">Public Notices & Updates</h3>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-700">
            <li>Water service maintenance notice for Ward 14 on Sunday, 8:00 AM to 12:00 PM.</li>
            <li>Electricity bill digital payment rebate available for this billing cycle.</li>
            <li>All grievance status can now be tracked online with service request ID.</li>
            <li>Document upload support desk available from 10:00 AM to 6:00 PM.</li>
          </ul>
        </article>
        <article className="rounded-2xl bg-white p-5 shadow">
          <h3 className="text-lg font-semibold text-primary">Help & Support</h3>
          <div className="mt-3 space-y-2 text-sm text-slate-700">
            <p>
              <strong>Helpline:</strong> 1800-000-0000 (Demo)
            </p>
            <p>
              <strong>Email:</strong> support@suvidha.gov.in (Demo)
            </p>
            <p>
              <strong>Kiosk Timing:</strong> 8:00 AM to 8:00 PM
            </p>
            <p>
              <strong>Assistance:</strong> Use voice guidance and Suvidha chatbot for offline help on each step.
            </p>
          </div>
        </article>
      </section>
    </Layout>
  );
}
