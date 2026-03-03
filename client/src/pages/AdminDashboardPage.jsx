import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../services/api';

const cardStyles = [
  'from-cyan-500 to-blue-600',
  'from-emerald-500 to-teal-600',
  'from-violet-500 to-purple-600',
  'from-rose-500 to-pink-600',
  'from-amber-500 to-orange-600'
];

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [health, setHealth] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);

  useEffect(() => {
    (async () => {
      const [dashboardRes, healthRes, logsRes] = await Promise.all([
        api.get('/api/admin/dashboard'),
        api.get('/api/admin/health'),
        api.get('/api/admin/audit-logs?limit=8')
      ]);

      setStats(dashboardRes.data);
      setHealth(healthRes.data);
      setAuditLogs(logsRes.data || []);
    })();
  }, []);

  return (
    <Layout title="Admin Dashboard Analytics">
      <div className="mb-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 p-5 text-white shadow-lg">
        <h2 className="text-2xl font-bold">Administrative Command Center</h2>
        <p className="mt-1 text-sm text-slate-200">
          Real-time insights for service requests, complaints, users, and payment performance.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        {stats &&
          Object.entries(stats).map(([key, value], index) => (
            <div
              key={key}
              className={`dashboard-card rounded-2xl bg-gradient-to-r ${cardStyles[index % cardStyles.length]} p-4 text-center text-white shadow-lg`}
            >
              <p className="text-sm capitalize text-slate-100">{key.replace(/([A-Z])/g, ' $1')}</p>
              <p className="mt-1 text-3xl font-bold">{value}</p>
            </div>
          ))}
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-4">
        <Link
          className="dashboard-card rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 p-4 text-center font-semibold text-white shadow"
          to="/admin/requests"
        >
          Requests Management
        </Link>
        <Link
          className="dashboard-card rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 p-4 text-center font-semibold text-white shadow"
          to="/admin/complaints"
        >
          Complaints Management
        </Link>
        <Link
          className="dashboard-card rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 p-4 text-center font-semibold text-white shadow"
          to="/admin/users"
        >
          Users Management
        </Link>
        <Link
          className="dashboard-card rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 p-4 text-center font-semibold text-white shadow"
          to="/admin/reports"
        >
          Reports
        </Link>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <section className="panel-card p-5">
          <h3 className="text-lg font-semibold text-primary">Kiosk & System Health</h3>
          {!health && <p className="mt-2 text-sm text-slate-600">Loading health metrics...</p>}
          {health && (
            <div className="mt-3 space-y-2 text-sm text-slate-700">
              <p>Uptime (seconds): {health.uptimeSeconds}</p>
              <p>Environment: {health.environment}</p>
              <p>
                Kiosks Online/Offline: {health.kiosks?.online || 0}/{health.kiosks?.offline || 0}
              </p>
              <p>Recent Audit Actions (24h): {health.recentAuditActions}</p>
              <p>Failed Payments: {health.failedPayments}</p>
            </div>
          )}
        </section>

        <section className="panel-card p-5">
          <h3 className="text-lg font-semibold text-primary">Recent Audit Logs</h3>
          {!auditLogs.length && <p className="mt-2 text-sm text-slate-600">No recent logs.</p>}
          {!!auditLogs.length && (
            <div className="mt-3 space-y-2 text-sm text-slate-700">
              {auditLogs.map((log) => (
                <div key={log.id} className="rounded-lg border border-slate-200 bg-slate-50 p-2">
                  <p className="font-semibold">{log.action}</p>
                  <p className="text-xs text-slate-500">{new Date(log.timestamp).toLocaleString()}</p>
                  <p className="text-xs text-slate-600">
                    Actor: {log.user?.name || 'System'} {log.user?.role ? `(${log.user.role})` : ''}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
}
