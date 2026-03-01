import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import KioskButton from '../components/KioskButton';
import api from '../services/api';
import { setAuth } from '../redux/store';

export default function AdminLoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const login = async () => {
    try {
      const { data } = await api.post('/api/admin/login', { mobile, password });
      dispatch(setAuth(data));
      navigate('/admin/dashboard');
    } catch (error) {
      setMessage(error.response?.data?.message || 'Admin login failed');
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
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
          />
          <input
            className="w-full rounded-lg border p-3 text-lg"
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <KioskButton onClick={login}>Login as Admin</KioskButton>
          {message && <p className="rounded-lg bg-slate-100 p-3 text-sm text-slate-700">{message}</p>}
        </div>
      </div>
    </Layout>
  );
}
