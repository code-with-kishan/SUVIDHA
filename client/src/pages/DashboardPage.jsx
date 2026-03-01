import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Layout from '../components/Layout';

const tiles = [
  {
    label: 'Service Selection',
    subtitle: 'Electricity, Water, Gas, Municipal',
    path: '/services',
    icon: '⚙️',
    style: 'from-cyan-500 to-blue-600'
  },
  {
    label: 'Register Complaint',
    subtitle: 'Raise and monitor civic complaints',
    path: '/complaints',
    icon: '📢',
    style: 'from-rose-500 to-pink-600'
  },
  {
    label: 'Upload Documents',
    subtitle: 'Submit PDF/Image with consent',
    path: '/upload-documents',
    icon: '📄',
    style: 'from-amber-500 to-orange-600'
  },
  {
    label: 'Pay Utility Bill',
    subtitle: 'Pay online and get instant receipt',
    path: '/payment',
    icon: '💳',
    style: 'from-emerald-500 to-teal-600'
  },
  {
    label: 'Track Status',
    subtitle: 'Check live progress with request ID',
    path: '/status-tracking',
    icon: '📍',
    style: 'from-violet-500 to-purple-600'
  },
  {
    label: 'Receipts',
    subtitle: 'View and print payment records',
    path: '/receipt',
    icon: '🧾',
    style: 'from-sky-500 to-indigo-600'
  }
];

export default function DashboardPage() {
  const navigate = useNavigate();
  const { guestMode } = useSelector((state) => state.auth);

  return (
    <Layout title="Citizen Service Dashboard">
      <div className="animate-float-soft mb-5 rounded-2xl bg-gradient-to-r from-primary via-secondary to-primary p-[1px]">
        <div className="rounded-2xl bg-white px-5 py-4">
          <h2 className="text-2xl font-bold text-primary">Welcome to your SUVIDHA Dashboard</h2>
          <p className="mt-1 text-sm text-slate-600">
            Fast, touch-friendly civic actions with multilingual support and real-time request tracking.
          </p>
        </div>
      </div>

      {guestMode && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          You are in Guest Mode. For service requests, payments, and submissions, please login first.
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {tiles.map((tile) => (
          <button
            key={tile.path}
            onClick={() => navigate(tile.path)}
            className={`dashboard-card touch-btn animate-pulse-glow rounded-2xl bg-gradient-to-r ${tile.style} p-4 text-left text-white shadow-lg`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-xl font-bold">{tile.label}</h3>
                <p className="mt-1 text-sm text-slate-100">{tile.subtitle}</p>
              </div>
              <span className="text-3xl">{tile.icon}</span>
            </div>
          </button>
        ))}
      </div>
    </Layout>
  );
}
