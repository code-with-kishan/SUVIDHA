import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { logout } from '../redux/store';
import LanguageToggle from './LanguageToggle';

export default function Layout({ children, title }) {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const citizenNav = [
    { label: 'Dashboard', to: '/dashboard' },
    { label: 'Services', to: '/services' },
    { label: 'Complaints', to: '/complaints' },
    { label: 'Documents', to: '/upload-documents' },
    { label: 'Payment', to: '/payment' },
    { label: 'Tracking', to: '/status-tracking' }
  ];

  const adminNav = [
    { label: 'Admin Dashboard', to: '/admin/dashboard' },
    { label: 'Requests', to: '/admin/requests' },
    { label: 'Complaints', to: '/admin/complaints' },
    { label: 'Users', to: '/admin/users' },
    { label: 'Reports', to: '/admin/reports' }
  ];

  const guestNav = [
    { label: 'Home', to: '/' },
    { label: 'Language', to: '/language' },
    { label: 'Guest Dashboard', to: '/dashboard' },
    { label: 'Citizen Login', to: '/login' },
    { label: 'Admin Login', to: '/admin' }
  ];

  const navItems = user
    ? ['ADMIN', 'SUPER_ADMIN'].includes(user.role)
      ? adminNav
      : citizenNav
    : guestNav;

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-100">
      <header className="sticky top-0 z-20 border-b bg-white shadow-sm">
        <div className="bg-primary text-white">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
            <div>
              <h1 className="text-xl font-bold">{t('appTitle')}</h1>
              {title && <p className="text-sm text-slate-100">{title}</p>}
            </div>
            <div className="flex items-center gap-3">
              <LanguageToggle />
              <div className="rounded-md bg-white/10 px-3 py-1 text-sm">
                {user ? `${user.name || 'Citizen'} (${user.role})` : 'Guest'}
              </div>
              {user && (
                <button
                  className="touch-btn rounded-lg border border-white/30 px-3 py-2 text-sm font-semibold"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              )}
            </div>
          </div>
        </div>
        <div className="border-t bg-white">
          <nav className="mx-auto flex max-w-6xl flex-wrap gap-2 px-4 py-3">
            {navItems.map((item) => {
              const active = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`touch-btn rounded-lg px-3 py-2 text-sm font-semibold ${
                    active ? 'bg-secondary text-white' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 p-4">{children}</main>

      <footer className="mt-8 border-t bg-white px-4 py-3 text-sm text-slate-600">
        <div className="mx-auto grid max-w-6xl gap-3 md:grid-cols-2 md:items-center">
          <div>
            <p className="font-semibold text-slate-700">Government of India • Digital Public Service Interface</p>
            <p>SUVIDHA Smart City Kiosk</p>
          </div>
          <div className="text-right">
            <p>
              Contact Email:{' '}
              <a className="font-semibold text-secondary" href="mailto:knishad0004@gmail.com">
                knishad0004@gmail.com
              </a>
            </p>
            <p>
              LinkedIn:{' '}
              <a
                className="font-semibold text-secondary"
                href="https://www.linkedin.com/in/kishan-nishad-161a73392"
                target="_blank"
                rel="noreferrer"
              >
                www.linkedin.com/in/kishan-nishad-161a73392
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
