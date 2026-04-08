import React, { useState } from 'react';
import Layout from '../layout/Layout';
import { useAuth } from '../hooks/useAuth';
import api from '../config/axios';
import { KeyRound, User, ShieldCheck, CheckCircle } from 'lucide-react';

const Profile = () => {
  const { user } = useAuth();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [status, setStatus] = useState(null); // { type: 'success'|'error', msg }
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus(null);

    if (form.newPassword.length < 6) {
      setStatus({ type: 'error', msg: 'New password must be at least 6 characters.' });
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      setStatus({ type: 'error', msg: 'New passwords do not match.' });
      return;
    }

    setLoading(true);
    try {
      // Verify current password by attempting login
      await api.post('/api/auth/login', { username: user.username, password: form.currentPassword });
      // If login succeeds, update password via change-password endpoint
      await api.post('/api/auth/change-password', {
        username: user.username,
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      setStatus({ type: 'success', msg: 'Password updated successfully!' });
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update password.';
      setStatus({ type: 'error', msg: msg.includes('Invalid') ? 'Current password is incorrect.' : msg });
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 bg-gray-50 transition-all";

  return (
    <Layout title="My Profile" subtitle="Manage your account details">
      <div className="max-w-sm mx-auto space-y-5">

        {/* Account info card */}
        <div className="bg-white rounded-2xl shadow-md p-6 space-y-4">
          <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wider">Account Info</h3>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
              <User className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-gray-800">{user?.username}</p>
              {user?.email && <p className="text-xs text-gray-500">{user.email}</p>}
              <p className="text-xs text-gray-400">{user?.role === 'ROLE_ADMIN' ? 'Administrator' : 'Resident'}</p>
            </div>
            <div className="ml-auto">
              <ShieldCheck className="w-5 h-5 text-purple-400" />
            </div>
          </div>
        </div>

        {/* Change password card */}
        <div className="bg-white rounded-2xl shadow-md p-6">
          <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
            <KeyRound className="w-4 h-4" /> Change Password
          </h3>

          {status && (
            <div className={`flex items-center gap-2 text-sm rounded-xl px-4 py-3 mb-4 ${
              status.type === 'success'
                ? 'bg-green-50 border border-green-200 text-green-700'
                : 'bg-red-50 border border-red-200 text-red-600'
            }`}>
              {status.type === 'success' && <CheckCircle className="w-4 h-4 flex-shrink-0" />}
              {status.msg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
              <input type="password" value={form.currentPassword} onChange={set('currentPassword')}
                required className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <input type="password" value={form.newPassword} onChange={set('newPassword')}
                required minLength={6} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
              <input type="password" value={form.confirmPassword} onChange={set('confirmPassword')}
                required className={inputCls} />
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3 text-white font-semibold rounded-xl hover:opacity-90 transition-all disabled:opacity-50 mt-1"
              style={{ background: '#FF8C42' }}>
              {loading ? 'Updating…' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;
