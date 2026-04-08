import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            await login(username, password);
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid username or password.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 16px', position: 'relative' }}>
            {/* Background */}
            <div className="grid-overlay" />
            <div className="bg-shape bg-shape-1" /><div className="bg-shape bg-shape-2" />
            <div className="bg-shape bg-shape-3" /><div className="bg-shape bg-shape-4" />
            <div className="bg-circle bg-circle-1" /><div className="bg-circle bg-circle-2" /><div className="bg-circle bg-circle-3" />

            <div className="glass-card" style={{ width: '100%', maxWidth: 400, padding: '32px 28px', position: 'relative', zIndex: 1 }}>
                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                    <img src="/resourcery-logo.png" alt="Resourcery" style={{ height: 48, marginBottom: 10 }}
                        onError={e => { e.target.style.display = 'none'; }} />
                    <h2 className="gradient-text" style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>Resourcery</h2>
                    <p style={{ color: '#6b7280', fontSize: 14, marginTop: 6 }}>Sign in to your account</p>
                </div>

                {error && (
                    <div style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca', borderRadius: 12, padding: '10px 14px', marginBottom: 18, fontSize: 13 }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin}>
                    <div style={{ marginBottom: 18 }}>
                        <label style={{ display: 'block', color: '#4b5563', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            required
                            placeholder="Enter your username"
                            style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 14, background: '#f9fafb', boxSizing: 'border-box', outline: 'none', transition: 'border-color 0.15s' }}
                            onFocus={e => { e.target.style.borderColor = '#4f46e5'; e.target.style.background = '#fff'; }}
                            onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.background = '#f9fafb'; }}
                        />
                    </div>
                    <div style={{ marginBottom: 24 }}>
                        <label style={{ display: 'block', color: '#4b5563', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                            placeholder="••••••••"
                            style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 14, background: '#f9fafb', boxSizing: 'border-box', outline: 'none', transition: 'border-color 0.15s' }}
                            onFocus={e => { e.target.style.borderColor = '#4f46e5'; e.target.style.background = '#fff'; }}
                            onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.background = '#f9fafb'; }}
                        />
                    </div>
                    <button type="submit" disabled={isLoading} className="btn-primary"
                        style={{ width: '100%', padding: '11px', fontSize: 15, opacity: isLoading ? 0.7 : 1 }}>
                        {isLoading ? 'Signing in…' : 'Sign In'}
                    </button>
                </form>

                <p style={{ textAlign: 'center', marginTop: 18, color: '#6b7280', fontSize: 13 }}>
                    Don't have an account?{' '}
                    <Link to="/register" style={{ color: '#667eea', fontWeight: 600, textDecoration: 'none' }}>Create one</Link>
                </p>
            </div>
        </div>
    );
};

export default Login;
