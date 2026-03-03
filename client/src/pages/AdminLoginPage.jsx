import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import KioskButton from '../components/KioskButton';
import OnScreenKeypad from '../components/OnScreenKeypad';
import OnScreenKeyboard from '../components/OnScreenKeyboard';
import api from '../services/api';
import { setAuth } from '../redux/store';

export default function AdminLoginPage() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [mfaToken, setMfaToken] = useState('');
  const [message, setMessage] = useState('');
  const [activeField, setActiveField] = useState('');

  const startMfa = async () => {
    if (!mobile || !password) {
      setMessage('Admin mobile and password are required.');
      return;
    }

    try {
      const { data } = await api.post('/api/admin/login', { mobile, password });
      setMfaToken(data.mfaToken);
      const devHint = data.devOtp ? ` Dev OTP: ${data.devOtp}` : '';
      setMessage(`OTP sent for admin verification.${devHint}`);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Admin login failed');
    }
  };

  const verifyMfa = async () => {
    if (!otp) {
      setMessage('Admin OTP is required.');
      return;
    }

    try {
      const { data } = await api.post('/api/admin/login/verify', { mfaToken, otp });
      dispatch(setAuth(data));
      navigate('/admin/dashboard');
    } catch (error) {
      setMessage(error.response?.data?.message || 'Admin OTP verification failed');
    }
  };

  return (
    <Layout title="Admin Login">
      <div className="hero-strip mb-4 p-5">
        <h2 className="text-2xl font-bold">Administrative Access</h2>
        <p className="mt-1 text-sm text-slate-100">Secure sign-in for admin operations and analytics.</p>
      </div>
      <div className="panel-card panel-card-hover mx-auto max-w-xl p-6">
        <div className="space-y-3">
          <input
            className="w-full rounded-lg border p-3 text-lg"
            placeholder="Admin Mobile"
            inputMode="numeric"
            aria-label="Admin mobile"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            onFocus={() => setActiveField('mobile')}
          />
          {activeField === 'mobile' && (
            <OnScreenKeypad value={mobile} onChange={setMobile} onClose={() => setActiveField('')} />
          )}
          <input
            className="w-full rounded-lg border p-3 text-lg"
            placeholder="Password"
            type="password"
            aria-label="Admin password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onFocus={() => setActiveField('password')}
          />
          {activeField === 'password' && (
            <OnScreenKeyboard
              value={password}
              onChange={setPassword}
              maxLength={128}
              language={localStorage.getItem('suvidha_lang') || 'en'}
              mode="email"
              onClose={() => setActiveField('')}
            />
          )}
          {!mfaToken ? (
            <KioskButton onClick={startMfa}>Send Admin OTP</KioskButton>
          ) : (
            <>
              <input
                className="w-full rounded-lg border p-3 text-lg"
                placeholder="Enter admin OTP"
                inputMode="numeric"
                aria-label="Admin OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                onFocus={() => setActiveField('otp')}
              />
              {activeField === 'otp' && (
                <OnScreenKeypad value={otp} onChange={setOtp} onClose={() => setActiveField('')} />
              )}
              <KioskButton onClick={verifyMfa}>Verify OTP & Login</KioskButton>
            </>
          )}
          {message && <p className="rounded-lg bg-slate-100 p-3 text-sm text-slate-700">{message}</p>}
        </div>
      </div>
    </Layout>
  );
}
