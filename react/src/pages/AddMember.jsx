import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../layout/Layout';
import api from '../config/axios';

const AddMember = () => {
  const [form, setForm] = useState({ username: '', email: '', password: '', confirmPassword: '', role: 'ROLE_USER' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  const submit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) { setError('Passwords do not match.'); return; }
    if (/\s/.test(form.username)) { setError('Username cannot contain spaces.'); return; }
    if (!emailRegex.test(form.email)) { setError('Please enter a valid email address.'); return; }
    setLoading(true); setError('');
    try {
      await api.post('/api/auth/admin/create-member', { username: form.username, email: form.email, password: form.password, role: form.role });
      navigate('/members');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register member.');
    } finally { setLoading(false); }
  };

  const inputCls = "w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 bg-gray-50";

  return (
    <Layout title="Add Member" subtitle="Register a new user to the system">
      <div className="max-w-sm mx-auto">
        <div className="bg-white rounded-2xl shadow-md p-6">
          <form onSubmit={submit} className="space-y-4">
            {error && <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <input type="text" value={form.username} onChange={set('username')} required className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" value={form.email} onChange={set('email')} required className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input type="password" value={form.password} onChange={set('password')} required minLength={6} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
              <input type="password" value={form.confirmPassword} onChange={set('confirmPassword')} required className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select value={form.role} onChange={set('role')} className={inputCls}>
                <option value="ROLE_USER">Resident</option>
                <option value="ROLE_ADMIN">Admin</option>
              </select>
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3 text-white font-semibold rounded-xl hover:opacity-90 transition-all disabled:opacity-50 mt-2"
              style={{ background: '#FF8C42' }}>
              {loading ? 'Registering…' : 'Register Member'}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default AddMember;
