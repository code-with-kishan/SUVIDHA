import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Layout from '../components/Layout';
import KioskButton from '../components/KioskButton';
import { enterGuestMode, setAuth } from '../redux/store';

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [form, setForm] = useState({ mobile: '', otp: '', name: '', email: '', aadhaar: '' });
  const [otpSent, setOtpSent] = useState(false);
  const [message, setMessage] = useState('');

  const handleSendOtp = async () => {
    if (!form.mobile || !form.name || !form.email || !form.aadhaar) {
      setMessage('Mobile, Name, Email, and Aadhaar are required.');
      return;
    }
    try {
      const { data } = await api.post('/api/auth/send-otp', {
        mobile: form.mobile,
        email: form.email
      });
      setOtpSent(true);
      const delivery = data.channels?.email
        ? 'OTP sent to mobile and email.'
        : 'OTP sent to mobile.';
      const devHint = data.devOtp ? ` Dev OTP: ${data.devOtp}` : '';
      setMessage(`${delivery}${devHint}`);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to send OTP');
    }
  };

  const handleVerifyOtp = async () => {
    if (!form.mobile || !form.otp || !form.name || !form.email || !form.aadhaar) {
      setMessage('Please fill all required details and OTP.');
      return;
    }
    try {
      const { data } = await api.post('/api/auth/verify-otp', form);
      dispatch(setAuth(data));
      navigate('/dashboard');
    } catch (error) {
      setMessage(error.response?.data?.message || 'OTP verification failed');
    }
  };

  const handleGuestMode = () => {
    dispatch(enterGuestMode());
    navigate('/dashboard');
  };

  return (
    <Layout title="Citizen Login & OTP Authentication">
      <div className="grid gap-5 md:grid-cols-2">
        <section className="rounded-2xl bg-primary p-6 text-white shadow">
          <h2 className="text-3xl font-bold">Secure Citizen Access</h2>
          <p className="mt-3 text-sm text-slate-100">
            Access civic utilities in one place with OTP-based secure verification for mobile and
            email-enabled alerts.
          </p>
          <div className="mt-6 space-y-3 text-sm">
            <div className="rounded-xl bg-white/10 p-3">1. Enter mobile and optional email</div>
            <div className="rounded-xl bg-white/10 p-3">2. Receive 6-digit OTP (valid for 2 minutes)</div>
            <div className="rounded-xl bg-white/10 p-3">3. Verify OTP and access your dashboard</div>
          </div>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow">
          <h3 className="mb-4 text-2xl font-semibold text-primary">Citizen Login</h3>
          <div className="space-y-3">
            <input
              className="w-full rounded-lg border p-3 text-lg"
              placeholder="Mobile Number"
              value={form.mobile}
              onChange={(e) => setForm({ ...form, mobile: e.target.value })}
            />
            <input
              className="w-full rounded-lg border p-3 text-lg"
              placeholder="Full Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <input
              className="w-full rounded-lg border p-3 text-lg"
              placeholder="Email Address"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <input
              className="w-full rounded-lg border p-3 text-lg"
              placeholder="Aadhaar Number"
              value={form.aadhaar}
              onChange={(e) => setForm({ ...form, aadhaar: e.target.value })}
            />

            {!otpSent ? (
              <KioskButton onClick={handleSendOtp}>Send OTP</KioskButton>
            ) : (
              <>
                <input
                  className="w-full rounded-lg border p-3 text-lg"
                  placeholder="Enter 6 digit OTP"
                  value={form.otp}
                  onChange={(e) => setForm({ ...form, otp: e.target.value })}
                />
                <KioskButton className="bg-secondary" onClick={handleVerifyOtp}>
                  Verify OTP
                </KioskButton>
              </>
            )}
            {message && <p className="rounded-lg bg-slate-100 p-3 text-sm text-slate-700">{message}</p>}
            <button
              className="touch-btn w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700"
              onClick={handleGuestMode}
            >
              Continue in Guest Mode
            </button>
          </div>
        </section>
      </div>
      <div className="mt-5 rounded-2xl bg-white p-4 text-sm text-slate-600 shadow">
        Need language support first? Use the language selector in the top bar before login.
      </div>
    </Layout>
  );
}
