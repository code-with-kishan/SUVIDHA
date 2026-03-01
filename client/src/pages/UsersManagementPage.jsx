import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import api from '../services/api';

export default function UsersManagementPage() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    (async () => {
      const { data } = await api.get('/api/admin/users');
      setUsers(data);
    })();
  }, []);

  return (
    <Layout title="Users Management">
      <div className="hero-strip mb-4 p-5">
        <h2 className="text-2xl font-bold">Users Management</h2>
        <p className="mt-1 text-sm text-slate-100">View citizen and administrator records.</p>
      </div>
      <div className="panel-card panel-card-hover overflow-x-auto p-4">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b">
              <th className="p-2">ID</th>
              <th className="p-2">Name</th>
              <th className="p-2">Mobile</th>
              <th className="p-2">Email</th>
              <th className="p-2">Role</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b">
                <td className="p-2">{user.id}</td>
                <td className="p-2">{user.name || '-'}</td>
                <td className="p-2">{user.mobile}</td>
                <td className="p-2">{user.email || '-'}</td>
                <td className="p-2">{user.role}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}
