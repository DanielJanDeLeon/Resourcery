import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const TERMS = [
  {
    title: '1. Responsible Use of Resources',
    body: 'You agree to use all borrowed resources with care and in accordance with their intended purpose. Misuse, negligence, or unauthorized use of any resource is strictly prohibited.',
  },
  {
    title: '2. Liability for Damage or Loss',
    body: 'If a resource is damaged, lost, or returned in a condition worse than when borrowed, you will be held financially responsible for the cost of repair or replacement. This includes accidental damage.',
  },
  {
    title: '3. Pick-Up Hours',
    body: 'All approved resources must be picked up between 8:00 AM and 8:00 PM only. Pick-ups outside these hours will not be accommodated.',
  },
  {
    title: '4. Pick-Up Deadline',
    body: 'You must pick up your approved booking on the first day specified in your booking. Failure to pick up the resource on that day will result in automatic cancellation of your booking.',
  },
  {
    title: '5. Timely Return',
    body: 'All resources must be returned by the agreed return date. Failure to return a resource on time may result in penalties, suspension of booking privileges, or further action.',
  },
  {
    title: '6. Booking Accuracy',
    body: 'You are responsible for ensuring that your booking details (dates, resource type) are accurate. Misrepresentation of booking information may result in cancellation of your request.',
  },
  {
    title: '7. Cancellation Policy',
    body: 'You may cancel a booking before it is picked up. Once a resource has been picked up, you are responsible for it until it is returned and confirmed by an administrator.',
  },
  {
    title: '8. Compliance',
    body: 'You agree to comply with all rules and guidelines set by the community administrators. Repeated violations may result in permanent suspension of your account.',
  },
];

const TermsModal = ({ onAccept, onDecline }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col" style={{ maxHeight: '85vh' }}>
      <div className="px-6 py-5 border-b border-gray-100">
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, background: 'linear-gradient(135deg, #667eea, #764ba2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          User Agreement
        </h2>
        <p style={{ color: '#6b7280', fontSize: 13, marginTop: 4 }}>
          Please read and accept the following terms before creating your account.
        </p>
      </div>

      <div className="overflow-y-auto px-6 py-4 flex-1" style={{ gap: 16, display: 'flex', flexDirection: 'column' }}>
        {TERMS.map((t, i) => (
          <div key={i} style={{ background: '#f9fafb', borderRadius: 12, padding: '14px 16px', border: '1px solid #e5e7eb' }}>
            <p style={{ fontWeight: 700, fontSize: 13, color: '#374151', marginBottom: 6 }}>{t.title}</p>
            <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.6 }}>{t.body}</p>
          </div>
        ))}
      </div>

      <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
        <button onClick={onDecline}
          style={{ flex: 1, padding: '10px', borderRadius: 10, border: '1px solid #e5e7eb', background: '#fff', color: '#6b7280', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
          Decline
        </button>
        <button onClick={onAccept}
          style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #667eea, #764ba2)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
          I Agree & Create Account
        </button>
      </div>
    </div>
  </div>
);

const Register = () => {
    const [form, setForm] = useState({ username: '', email: '', password: '', confirmPassword: '' });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showTerms, setShowTerms] = useState(false);
    const { register } = useAuth();

    const set = field => e => setForm(p => ({ ...p, [field]: e.target.value }));

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');
        if (form.password !== form.confirmPassword) { setError('Passwords do not match.'); return; }
        if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return; }
        if (/\s/.test(form.username)) { setError('Username cannot contain spaces.'); return; }
        if (!emailRegex.test(form.email)) { setError('Please enter a valid email address.'); return; }
        setShowTerms(true);
    };

    const handleAccept = async () => {
        setShowTerms(false);
        setIsLoading(true);
        try {
            await register(form.username, form.password, form.email);
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const inputStyle = { width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 14, background: '#f9fafb', boxSizing: 'border-box', outline: 'none' };
    const labelStyle = { display: 'block', color: '#4b5563', fontSize: 13, fontWeight: 500, marginBottom: 6 };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 16px', position: 'relative' }}>
            <div className="grid-overlay" />
            <div className="bg-shape bg-shape-1" /><div className="bg-shape bg-shape-2" />
            <div className="bg-shape bg-shape-3" /><div className="bg-shape bg-shape-4" />
            <div className="bg-circle bg-circle-1" /><div className="bg-circle bg-circle-2" /><div className="bg-circle bg-circle-3" />

            <div className="glass-card" style={{ width: '100%', maxWidth: 420, padding: '32px 28px', position: 'relative', zIndex: 1 }}>
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                    <img src="/resourcery-logo.png" alt="Resourcery" style={{ height: 48, marginBottom: 10 }}
                        onError={e => { e.target.style.display = 'none'; }} />
                    <h2 className="gradient-text" style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>Create Account</h2>
                    <p style={{ color: '#6b7280', fontSize: 14, marginTop: 6 }}>Join Resourcery to start booking</p>
                </div>

                {error && (
                    <div style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca', borderRadius: 12, padding: '10px 14px', marginBottom: 18, fontSize: 13 }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: 18 }}>
                        <label style={labelStyle}>Username</label>
                        <input type="text" value={form.username} onChange={set('username')} required style={inputStyle}
                            onFocus={e => { e.target.style.borderColor = '#4f46e5'; e.target.style.background = '#fff'; }}
                            onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.background = '#f9fafb'; }} />
                    </div>
                    <div style={{ marginBottom: 18 }}>
                        <label style={labelStyle}>Email</label>
                        <input type="email" value={form.email} onChange={set('email')} required style={inputStyle}
                            onFocus={e => { e.target.style.borderColor = '#4f46e5'; e.target.style.background = '#fff'; }}
                            onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.background = '#f9fafb'; }} />
                    </div>
                    <div style={{ marginBottom: 18 }}>
                        <label style={labelStyle}>Password</label>
                        <input type="password" value={form.password} onChange={set('password')} required minLength={6} style={inputStyle}
                            onFocus={e => { e.target.style.borderColor = '#4f46e5'; e.target.style.background = '#fff'; }}
                            onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.background = '#f9fafb'; }} />
                    </div>
                    <div style={{ marginBottom: 24 }}>
                        <label style={labelStyle}>Confirm Password</label>
                        <input type="password" value={form.confirmPassword} onChange={set('confirmPassword')} required minLength={6} style={inputStyle}
                            onFocus={e => { e.target.style.borderColor = '#4f46e5'; e.target.style.background = '#fff'; }}
                            onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.background = '#f9fafb'; }} />
                    </div>
                    <button type="submit" disabled={isLoading} className="btn-primary"
                        style={{ width: '100%', padding: '11px', fontSize: 15, opacity: isLoading ? 0.7 : 1 }}>
                        {isLoading ? 'Creating account…' : 'Create Account'}
                    </button>
                </form>

                <p style={{ textAlign: 'center', marginTop: 18, color: '#6b7280', fontSize: 13 }}>
                    Already have an account?{' '}
                    <Link to="/login" style={{ color: '#667eea', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
                </p>
            </div>

            {showTerms && <TermsModal onAccept={handleAccept} onDecline={() => setShowTerms(false)} />}
        </div>
    );
};

export default Register;
