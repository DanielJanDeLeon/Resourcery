import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import barangayImg from '../assets/barangay.jpg';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPw, setShowPw] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const { login, googleLogin, googleCheck } = useAuth();
    const googleBtnRef = useRef(null);

    const handleGoogleCallback = useCallback(async (response) => {
        setGoogleLoading(true);
        setError('');
        try {
            const { isNewUser } = await googleCheck(response.credential);
            if (isNewUser) {
                setError('No account found for this Google account. Please register first.');
                return;
            }
            await googleLogin(response.credential);
        } catch (err) {
            setError(err.response?.data?.message || 'Google sign-in failed. Please try again.');
        } finally {
            setGoogleLoading(false);
        }
    }, [googleLogin, googleCheck]);

    useEffect(() => {
        if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID === 'your-google-client-id-here') return;

        const initGoogle = () => {
            window.google.accounts.id.initialize({
                client_id: GOOGLE_CLIENT_ID,
                callback: handleGoogleCallback,
            });
            if (googleBtnRef.current) {
                window.google.accounts.id.renderButton(googleBtnRef.current, {
                    theme: 'outline',
                    size: 'large',
                    width: googleBtnRef.current.offsetWidth || 376,
                    text: 'signin_with',
                    shape: 'rectangular',
                });
            }
        };

        if (window.google?.accounts?.id) {
            initGoogle();
        } else {
            const script = document.createElement('script');
            script.src = 'https://accounts.google.com/gsi/client';
            script.async = true;
            script.defer = true;
            script.onload = initGoogle;
            document.body.appendChild(script);
            return () => { document.body.removeChild(script); };
        }
    }, [handleGoogleCallback]);

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

    const showGoogleBtn = GOOGLE_CLIENT_ID && GOOGLE_CLIENT_ID !== 'your-google-client-id-here';

    return (
        <div style={{ minHeight: '100vh', display: 'flex', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>

            {/* Left: branding panel */}
            <div style={{
                flex: 1,
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '48px 56px',
                overflow: 'hidden',
            }} className="hidden md:flex">
                {/* Background Image */}
                <img 
                    src={barangayImg} 
                    alt="Barangay Community"
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        zIndex: 1
                    }}
                />
                
                {/* Gradient Overlay */}
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'linear-gradient(160deg, rgba(30,27,75,0.85) 0%, rgba(49,46,129,0.85) 55%, rgba(76,29,149,0.85) 100%)',
                    zIndex: 2
                }} />

                {/* Logo */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative', zIndex: 3 }}>
                    <img src="/resourcery-logo.png" alt="Resourcery" style={{ width: 40, height: 40, borderRadius: 10, objectFit: 'cover' }}
                        onError={e => { e.target.style.display = 'none'; }} />
                    <span style={{ fontWeight: 800, fontSize: 20, color: '#fff', letterSpacing: '-0.3px' }}>Resourcery</span>
                </div>

                {/* Center content */}
                <div style={{ position: 'relative', zIndex: 3 }}>
                    <h2 style={{ color: '#fff', fontSize: 42, fontWeight: 800, lineHeight: 1.2, margin: '0 0 20px', letterSpacing: '-0.5px' }}>
                        Everything your<br />community needs
                    </h2>
                    <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 18, lineHeight: 1.75, margin: '0 0 48px', maxWidth: 380 }}>
                        Book vehicles, equipment, venues and more — managed transparently for every resident.
                    </p>
                </div>

                {/* Footer quote */}
                <div style={{ position: 'relative', zIndex: 3, borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 28 }}>
                    <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, margin: 0 }}>
                        Trusted by residents to manage shared community resources.
                    </p>
                </div>
            </div>

            {/* Right: form panel */}
            <div style={{ flex: '0 0 auto', width: '100%', maxWidth: 480, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '48px 52px', background: '#fff' }}>
                <div style={{ marginBottom: 40 }}>
                    <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#9ca3af', fontSize: 13, fontWeight: 500, textDecoration: 'none', transition: 'color 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.color = '#6366f1'}
                        onMouseLeave={e => e.currentTarget.style.color = '#9ca3af'}>
                        <ArrowLeft size={14} /> Back to home
                    </Link>
                </div>

                <div style={{ marginBottom: 36 }}>
                    <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', margin: '0 0 8px', letterSpacing: '-0.4px' }}>Sign in to your account</h1>
                    <p style={{ color: '#94a3b8', fontSize: 14, margin: 0 }}>Welcome! Please enter your credentials below</p>
                </div>

                {error && (
                    <div style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca', borderRadius: 10, padding: '11px 14px', marginBottom: 20, fontSize: 13 }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin}>
                    <div style={{ marginBottom: 18 }}>
                        <label style={{ display: 'block', color: '#374151', fontSize: 13, fontWeight: 600, marginBottom: 7, letterSpacing: '0.01em' }}>Username</label>
                        <input type="text" value={username} onChange={e => setUsername(e.target.value)} required
                            style={{ width: '100%', padding: '11px 14px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 14, background: '#f8fafc', color: '#0f172a', boxSizing: 'border-box', outline: 'none', transition: 'border-color 0.15s, background 0.15s' }}
                            onFocus={e => { e.target.style.borderColor = '#6366f1'; e.target.style.background = '#fff'; }}
                            onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#f8fafc'; }} />
                    </div>
                    <div style={{ marginBottom: 28, position: 'relative' }}>
                        <label style={{ display: 'block', color: '#374151', fontSize: 13, fontWeight: 600, marginBottom: 7, letterSpacing: '0.01em' }}>Password</label>
                        <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required
                            style={{ width: '100%', padding: '11px 42px 11px 14px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 14, background: '#f8fafc', color: '#0f172a', boxSizing: 'border-box', outline: 'none', transition: 'border-color 0.15s, background 0.15s' }}
                            onFocus={e => { e.target.style.borderColor = '#6366f1'; e.target.style.background = '#fff'; }}
                            onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#f8fafc'; }} />
                        <button type="button" onClick={() => setShowPw(p => !p)}
                            style={{ position: 'absolute', right: 13, top: 38, background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0, display: 'flex' }}>
                            {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
                        </button>
                    </div>
                    <button type="submit" disabled={isLoading}
                        style={{ width: '100%', padding: '12px', borderRadius: 10, border: 'none', background: isLoading ? '#a5b4fc' : 'linear-gradient(135deg,#6366f1,#7c3aed)', color: '#fff', fontWeight: 700, fontSize: 15, cursor: isLoading ? 'not-allowed' : 'pointer', transition: 'opacity 0.2s', letterSpacing: '0.01em' }}>
                        {isLoading ? 'Signing in…' : 'Sign In'}
                    </button>
                </form>

                {showGoogleBtn && (
                    <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
                            <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
                            <span style={{ color: '#94a3b8', fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap' }}>or continue with</span>
                            <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
                        </div>
                        <div ref={googleBtnRef} style={{ width: '100%', minHeight: 44 }} />
                        {googleLoading && (
                            <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: 13, marginTop: 8 }}>Signing in with Google…</p>
                        )}
                    </>
                )}

                <p style={{ marginTop: 24, color: '#94a3b8', fontSize: 13, textAlign: 'center' }}>
                    Don't have an account?{' '}
                    <Link to="/register" style={{ color: '#6366f1', fontWeight: 700, textDecoration: 'none' }}>
                        Create one
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Login;