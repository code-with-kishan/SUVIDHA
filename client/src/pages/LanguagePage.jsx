import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import LanguageToggle from '../components/LanguageToggle';
import KioskButton from '../components/KioskButton';

export default function LanguagePage() {
  const navigate = useNavigate();

  return (
    <Layout title="Language Selection">
      <div className="hero-strip animate-float-soft mx-auto max-w-xl p-5">
        <h2 className="text-2xl font-bold">Select Language</h2>
        <p className="mt-1 text-sm text-slate-100">Choose your preferred language to continue.</p>
      </div>
      <div className="panel-card panel-card-hover mx-auto mt-4 max-w-xl p-6">
        <LanguageToggle />
        <div className="mt-6">
          <KioskButton onClick={() => navigate('/login')}>Continue</KioskButton>
        </div>
      </div>
    </Layout>
  );
}
