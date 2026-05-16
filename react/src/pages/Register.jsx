import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ArrowLeft, Eye, EyeOff, ArrowRight } from 'lucide-react';
import barangayImg from '../assets/barangay.jpg';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const TERMS = [
  { title: 'Responsible Use of Resources', body: 'You agree to use all borrowed resources with care and in accordance with their intended purpose.' },
  { title: 'Liability for Damage or Loss', body: 'If a resource is damaged or lost, you will be held financially responsible for repair or replacement.' },
  { title: 'Pick-Up Hours', body: 'All approved resources must be picked up between 8:00 AM and 8:00 PM only.' },
  { title: 'Pick-Up Deadline', body: 'You must pick up your approved booking on the first day specified. Failure results in automatic cancellation.' },
  { title: 'Timely Return', body: 'All resources must be returned by the agreed return date.' },
  { title: 'Booking Accuracy', body: 'You are responsible for ensuring your booking details are accurate.' },
  { title: 'Cancellation Policy', body: 'You may cancel before pick-up. Once picked up, you are responsible until returned.' },
  { title: 'Compliance', body: 'Repeated violations may result in permanent suspension of your account.' },
];

const TermsModal = ({ onAccept, onDecline, terms: termsList }) => (
  <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(109,40,217,0.15)', backdropFilter: 'blur(6px)', padding: 16 }}>
    <div style={{ background: '#fff', border: '1px solid #ede9fe', borderRadius: 20, width: '100%', maxWidth: 520, maxHeight: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 24px 60px rgba(109,40,217,0.15)' }}>
      <div style={{ padding: '22px 26px 18px', borderBottom: '1px solid #f5f3ff' }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, background: 'linear-gradient(135deg,#6366f1,#7c3aed)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>User Agreement</h2>
        <p style={{ color: '#94a3b8', fontSize: 13, marginTop: 4, marginBottom: 0 }}>Please read and accept before creating your account.</p>
      </div>
      <div style={{ overflowY: 'auto', padding: '18px 26px', flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {(termsList || TERMS).map((t, i) => (
          <div key={i} style={{ background: '#faf9ff', borderRadius: 10, padding: '11px 14px', border: '1px solid #ede9fe' }}>
            <p style={{ fontWeight: 700, fontSize: 13, color: '#374151', marginBottom: 3, marginTop: 0 }}>{i + 1}. {t.title}</p>
            <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.6, margin: 0 }}>{t.body}</p>
          </div>
        ))}
      </div>
      <div style={{ padding: '14px 26px', borderTop: '1px solid #f5f3ff', display: 'flex', gap: 10 }}>
        <button onClick={onDecline} style={{ flex: 1, padding: '10px', borderRadius: 9, border: '1px solid #e5e7eb', background: '#fff', color: '#6b7280', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          Decline
        </button>
        <button onClick={onAccept} style={{ flex: 1, padding: '10px', borderRadius: 9, border: 'none', background: 'linear-gradient(135deg,#6366f1,#7c3aed)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
          I Agree & Create Account
        </button>
      </div>
    </div>
  </div>
);

const Register = () => {
    const [form, setForm] = useState({ username: '', email: '', password: '', confirmPassword: '' });
    const [showPw, setShowPw] = useState(false);
    const [showCPw, setShowCPw] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [showTerms, setShowTerms] = useState(false);
    const [pendingGoogleToken, setPendingGoogleToken] = useState(null);
    const [terms, setTerms] = useState(TERMS);
    const { register, googleLogin, googleCheck } = useAuth();
    const googleBtnRef = useRef(null);

    // Check if we were redirected here from login with a pending Google token
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('google') === '1') {
            const token = sessionStorage.getItem('google_pending_token');
            if (token) {
                setPendingGoogleToken(token);
                setShowTerms(true);
            }
        }
    }, []);
    useEffect(() => {
        fetch(`${import.meta.env.VITE_DJANGO_API_URL || 'http://localhost:8082'}/terms`)
            .then(r => r.json())
            .then(data => { if (data.content?.length) setTerms(data.content); })
            .catch(() => {});
    }, []);

    const handleGoogleCallback = useCallback(async (response) => {
        setGoogleLoading(true);
        setError('');
        try {
            const { isNewUser } = await googleCheck(response.credential);
            if (isNewUser) {
                // New user — show terms before creating account
                setPendingGoogleToken(response.credential);
                setShowTerms(true);
            } else {
                await googleLogin(response.credential);
            }
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
                    width: googleBtnRef.current.offsetWidth || 396,
                    text: 'signup_with',
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
        // Google sign-up flow
        if (pendingGoogleToken) {
            setGoogleLoading(true);
            try {
                sessionStorage.removeItem('google_pending_token');
                await googleLogin(pendingGoogleToken);
            } catch (err) {
                setError(err.response?.data?.message || 'Google sign-up failed. Please try again.');
            } finally {
                setPendingGoogleToken(null);
                setGoogleLoading(false);
            }
            return;
        }
        // Regular sign-up flow
        setIsLoading(true);
        try {
            await register(form.username, form.password, form.email);
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const inp = (extra = {}) => ({
        style: {
            width: '100%', padding: '11px 14px', border: '1.5px solid #e2e8f0', borderRadius: 10,
            fontSize: 14, background: '#f8fafc', color: '#0f172a', boxSizing: 'border-box',
            outline: 'none', transition: 'border-color 0.15s, background 0.15s', ...extra,
        },
        onFocus: e => { e.target.style.borderColor = '#6366f1'; e.target.style.background = '#fff'; },
        onBlur: e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#f8fafc'; },
    });

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
                        Start booking<br />in minutes
                    </h2>
                    <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 18, lineHeight: 1.75, margin: '0 0 48px', maxWidth: 380 }}>
                        Create your account, agree to the community terms, and you're ready to go.
                    </p>
                </div>

                {/* Footer */}
                <div style={{ position: 'relative', zIndex: 3, borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 28 }}>
                    <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, margin: 0 }}>
                        Trusted by residents to manage shared community resources.
                    </p>
                </div>
            </div>

            {/* Right: form panel */}
            <div style={{ flex: '0 0 auto', width: '100%', maxWidth: 500, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '48px 52px', background: '#fff' }}>
                <div style={{ marginBottom: 36 }}>
                    <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#9ca3af', fontSize: 13, fontWeight: 500, textDecoration: 'none' }}
                        onMouseEnter={e => e.currentTarget.style.color = '#6366f1'}
                        onMouseLeave={e => e.currentTarget.style.color = '#9ca3af'}>
                        <ArrowLeft size={14} /> Back to home
                    </Link>
                </div>

                <div style={{ marginBottom: 32 }}>
                    <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', margin: '0 0 8px', letterSpacing: '-0.4px' }}>Create your account</h1>
                    <p style={{ color: '#94a3b8', fontSize: 14, margin: 0 }}>Welcome! Please fill in your details to get started</p>
                </div>

                {error && (
                    <div style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca', borderRadius: 10, padding: '11px 14px', marginBottom: 18, fontSize: 13 }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                        <div>
                            <label style={{ display: 'block', color: '#374151', fontSize: 13, fontWeight: 600, marginBottom: 7 }}>Username</label>
                            <input type="text" value={form.username} onChange={set('username')} required {...inp()} />
                        </div>
                        <div>
                            <label style={{ display: 'block', color: '#374151', fontSize: 13, fontWeight: 600, marginBottom: 7 }}>Email address</label>
                            <input type="email" value={form.email} onChange={set('email')} required {...inp()} />
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 28 }}>
                        <div style={{ position: 'relative' }}>
                            <label style={{ display: 'block', color: '#374151', fontSize: 13, fontWeight: 600, marginBottom: 7 }}>Password</label>
                            <input type={showPw ? 'text' : 'password'} value={form.password} onChange={set('password')} required minLength={6} {...inp({ paddingRight: 42 })} />
                            <button type="button" onClick={() => setShowPw(p => !p)} style={{ position: 'absolute', right: 13, top: 36, background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0, display: 'flex' }}>
                                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                        <div style={{ position: 'relative' }}>
                            <label style={{ display: 'block', color: '#374151', fontSize: 13, fontWeight: 600, marginBottom: 7 }}>Confirm password</label>
                            <input type={showCPw ? 'text' : 'password'} value={form.confirmPassword} onChange={set('confirmPassword')} required {...inp({ paddingRight: 42 })} />
                            <button type="button" onClick={() => setShowCPw(p => !p)} style={{ position: 'absolute', right: 13, top: 36, background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0, display: 'flex' }}>
                                {showCPw ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>
                    <button type="submit" disabled={isLoading}
                        style={{ width: '100%', padding: '12px', borderRadius: 10, border: 'none', background: isLoading ? '#a5b4fc' : 'linear-gradient(135deg,#6366f1,#7c3aed)', color: '#fff', fontWeight: 700, fontSize: 15, cursor: isLoading ? 'not-allowed' : 'pointer', letterSpacing: '0.01em' }}>
                        {isLoading ? 'Creating account…' : 'Create Account'}
                    </button>
                </form>

                {GOOGLE_CLIENT_ID && GOOGLE_CLIENT_ID !== 'your-google-client-id-here' && (
                    <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
                            <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
                            <span style={{ color: '#94a3b8', fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap' }}>or sign up with</span>
                            <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
                        </div>
                        <div ref={googleBtnRef} style={{ width: '100%', minHeight: 44 }} />
                        {googleLoading && (
                            <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: 13, marginTop: 8 }}>Signing up with Google…</p>
                        )}
                    </>
                )}

                <p style={{ marginTop: 22, color: '#94a3b8', fontSize: 13, textAlign: 'center' }}>
                    Already have an account?{' '}
                    <Link to="/login" style={{ color: '#6366f1', fontWeight: 700, textDecoration: 'none' }}>
                        Sign in
                    </Link>
                </p>
            </div>

            {showTerms && <TermsModal onAccept={handleAccept} onDecline={() => { setShowTerms(false); setPendingGoogleToken(null); sessionStorage.removeItem('google_pending_token'); }} terms={terms} />}
        </div>
    );
};

export default Register;