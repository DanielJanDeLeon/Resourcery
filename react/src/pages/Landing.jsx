import { Link } from 'react-router-dom';
import { Boxes, CalendarDays, Users, ShieldCheck, ArrowRight, CheckCircle } from 'lucide-react';
import resourceManagersImg from '../assets/resource-managers.jpg';
import storageImg from '../assets/storage.png';
import { useEffect, useRef } from 'react';

// Add CSS animations
const animations = `
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes fadeInLeft {
    from {
      opacity: 0;
      transform: translateX(-30px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @keyframes fadeInRight {
    from {
      opacity: 0;
      transform: translateX(30px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
  }

  @keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
  }

  @keyframes slideInFromTop {
    from {
      opacity: 0;
      transform: translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes slideInFromBottom {
    from {
      opacity: 0;
      transform: translateY(50px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes scaleIn {
    from {
      opacity: 0;
      transform: scale(0.8);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  .animate-fade-in-up {
    animation: fadeInUp 0.8s ease-out forwards;
  }

  .animate-fade-in-left {
    animation: fadeInLeft 0.8s ease-out forwards;
  }

  .animate-fade-in-right {
    animation: fadeInRight 0.8s ease-out forwards;
  }

  .animate-float {
    animation: float 3s ease-in-out infinite;
  }

  .animate-pulse {
    animation: pulse 2s ease-in-out infinite;
  }

  .animate-slide-in-top {
    animation: slideInFromTop 0.6s ease-out forwards;
  }

  .animate-slide-in-bottom {
    animation: slideInFromBottom 0.8s ease-out forwards;
  }

  .animate-scale-in {
    animation: scaleIn 0.6s ease-out forwards;
  }

  .hover-lift {
    transition: transform 0.3s ease, box-shadow 0.3s ease;
  }

  .hover-lift:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 25px rgba(0,0,0,0.15);
  }

  .stagger-1 { animation-delay: 0.1s; }
  .stagger-2 { animation-delay: 0.2s; }
  .stagger-3 { animation-delay: 0.3s; }
  .stagger-4 { animation-delay: 0.4s; }

  /* Scroll-triggered animations */
  .scroll-animate {
    opacity: 0;
    transform: translateY(30px);
    transition: all 0.8s ease-out;
  }

  .scroll-animate.animate-in {
    opacity: 1;
    transform: translateY(0);
  }

  .scroll-animate-left {
    opacity: 0;
    transform: translateX(-30px);
    transition: all 0.8s ease-out;
  }

  .scroll-animate-left.animate-in {
    opacity: 1;
    transform: translateX(0);
  }

  .scroll-animate-right {
    opacity: 0;
    transform: translateX(30px);
    transition: all 0.8s ease-out;
  }

  .scroll-animate-right.animate-in {
    opacity: 1;
    transform: translateX(0);
  }

  .scroll-animate-scale {
    opacity: 0;
    transform: scale(0.8);
    transition: all 0.8s ease-out;
  }

  .scroll-animate-scale.animate-in {
    opacity: 1;
    transform: scale(1);
  }
`;

// Scroll animation hook
const useScrollAnimation = () => {
  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
        } else {
          // Remove the class when element goes out of view so it can animate again
          entry.target.classList.remove('animate-in');
        }
      });
    }, observerOptions);

    // Observe all scroll-animate elements
    const scrollElements = document.querySelectorAll('.scroll-animate, .scroll-animate-left, .scroll-animate-right, .scroll-animate-scale');
    scrollElements.forEach((el) => observer.observe(el));

    return () => {
      scrollElements.forEach((el) => observer.unobserve(el));
    };
  }, []);
};

const FEATURES = [
  {
    icon: Boxes,
    title: 'Browse Resources',
    desc: 'Explore all available community resources — vehicles, equipment, venues, and more.',
    color: '#667eea',
  },
  {
    icon: CalendarDays,
    title: 'Easy Booking',
    desc: 'Book what you need in seconds. Pick your dates, confirm, and wait for approval.',
    color: '#FF8C42',
  },
  {
    icon: Users,
    title: 'Community First',
    desc: 'Built for residents. Manage your bookings, track history, and stay informed.',
    color: '#10b981',
  },
  {
    icon: ShieldCheck,
    title: 'Admin Oversight',
    desc: 'Admins approve requests, manage resources, and keep everything running smoothly.',
    color: '#8b5cf6',
  },
];

const HOW_IT_WORKS = [
  { step: '01', title: 'Create an Account', desc: 'Sign up as a resident and agree to the community terms.' },
  { step: '02', title: 'Browse & Book', desc: 'Find the resource you need and submit a booking request.' },
  { step: '03', title: 'Get Approved', desc: 'The admin reviews and approves your request.' },
  { step: '04', title: 'Pick Up & Return', desc: 'Pick up on your scheduled date and return it on time.' },
];

const Landing = () => {
  useScrollAnimation();

  return (
  <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', color: '#111827' }}>
    <style dangerouslySetInnerHTML={{ __html: animations }} />

    {/* Nav */}
    <nav className="animate-slide-in-top" style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)', borderBottom: '1px solid #e5e7eb', padding: '0 24px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
        <div className="animate-fade-in-left" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src="/resourcery-logo.png" alt="R" style={{ width: 36, height: 36, borderRadius: 10, objectFit: 'cover' }}
            onError={e => { e.target.style.display='none'; }} />
          <span style={{ fontWeight: 800, fontSize: 20, background: 'linear-gradient(135deg,#667eea,#764ba2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Resourcery
          </span>
        </div>
        <div className="animate-fade-in-right" style={{ display: 'flex', gap: 12 }}>
          <Link to="/login?from=landing" className="hover-lift" style={{ padding: '8px 20px', borderRadius: 999, border: '1.5px solid #667eea', color: '#667eea', fontWeight: 600, fontSize: 14, textDecoration: 'none', transition: 'all 0.2s' }}>
            Sign In
          </Link>
          <Link to="/register?from=landing" className="hover-lift" style={{ padding: '8px 20px', borderRadius: 999, background: 'linear-gradient(135deg,#667eea,#764ba2)', color: '#fff', fontWeight: 600, fontSize: 14, textDecoration: 'none' }}>
            Get Started
          </Link>
        </div>
      </div>
    </nav>

    {/* Hero */}
    <section style={{ 
      padding: '100px 24px', 
      textAlign: 'center',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background Image */}
      <img 
        src={storageImg} 
        alt="Storage Resources"
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
        background: 'linear-gradient(135deg, rgba(30,27,75,0.85) 0%, rgba(49,46,129,0.85) 60%, rgba(76,29,149,0.85) 100%)',
        zIndex: 2
      }} />
      
      {/* Content */}
      <div style={{ position: 'relative', zIndex: 3 }}>
      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        <span style={{ display: 'inline-block', background: 'rgba(255,255,255,0.12)', color: '#c4b5fd', fontSize: 13, fontWeight: 600, padding: '6px 16px', borderRadius: 999, marginBottom: 24, border: '1px solid rgba(255,255,255,0.15)' }}>
          Community Resource Management
        </span>
        <h1 style={{ fontSize: 52, fontWeight: 900, color: '#fff', lineHeight: 1.15, margin: '0 0 20px' }}>
          Book Community Resources <span style={{ color: '#a78bfa' }}>Effortlessly</span>
        </h1>
        <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, marginBottom: 40 }}>
          Resourcery makes it simple for residents to discover, book, and manage shared community resources — all in one place.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/register?from=landing" className="hover-lift" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 32px', borderRadius: 999, background: '#FF8C42', color: '#fff', fontWeight: 700, fontSize: 16, textDecoration: 'none', boxShadow: '0 8px 24px rgba(255,140,66,0.4)' }}>
            Get Started <ArrowRight size={18} />
          </Link>
          <Link to="/login?from=landing" className="hover-lift" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 32px', borderRadius: 999, background: 'rgba(255,255,255,0.1)', color: '#fff', fontWeight: 600, fontSize: 16, textDecoration: 'none', border: '1px solid rgba(255,255,255,0.2)' }}>
            Sign In
          </Link>
        </div>
      </div>
      </div>
    </section>

    {/* Features */}
    <section style={{ padding: '80px 24px', background: '#f8fafc' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div className="scroll-animate" style={{ textAlign: 'center', marginBottom: 56 }}>
          <h2 style={{ fontSize: 36, fontWeight: 800, margin: '0 0 12px' }}>Everything you need</h2>
          <p style={{ color: '#6b7280', fontSize: 17 }}>A complete platform for managing community resources.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24 }}>
          {FEATURES.map((f, index) => (
            <div key={f.title} className={`scroll-animate hover-lift`} style={{ background: '#fff', borderRadius: 20, padding: '28px 24px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9', transitionDelay: `${index * 0.1}s` }}>
              <div className="animate-float" style={{ width: 48, height: 48, borderRadius: 14, background: f.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <f.icon size={22} style={{ color: f.color }} />
              </div>
              <h3 style={{ fontWeight: 700, fontSize: 17, margin: '0 0 8px' }}>{f.title}</h3>
              <p style={{ color: '#6b7280', fontSize: 14, lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* How it works */}
    <section style={{ padding: '80px 24px', background: '#fff' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <div className="scroll-animate" style={{ textAlign: 'center', marginBottom: 56 }}>
          <h2 style={{ fontSize: 36, fontWeight: 800, margin: '0 0 12px' }}>How it works</h2>
          <p style={{ color: '#6b7280', fontSize: 17 }}>Four simple steps to get started.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 32 }}>
          {HOW_IT_WORKS.map((h, index) => (
            <div key={h.step} className="scroll-animate-scale" style={{ textAlign: 'center', transitionDelay: `${index * 0.15}s` }}>
              <div className="animate-pulse" style={{ width: 56, height: 56, borderRadius: 999, background: 'linear-gradient(135deg,#667eea,#764ba2)', color: '#fff', fontWeight: 800, fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                {h.step}
              </div>
              <h3 style={{ fontWeight: 700, fontSize: 16, margin: '0 0 8px' }}>{h.title}</h3>
              <p style={{ color: '#6b7280', fontSize: 14, lineHeight: 1.6, margin: 0 }}>{h.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* CTA */}
    <section style={{ 
      padding: '80px 24px', 
      background: 'linear-gradient(135deg,#1e1b4b,#4c1d95)',
      textAlign: 'center',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background Image */}
      <img 
        src={resourceManagersImg} 
        alt="Resource Managers"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          opacity: 0.3,
          zIndex: 1
        }}
        onError={(e) => {
          console.log('Image failed to load:', e.target.src);
          e.target.style.display = 'none';
        }}
      />
      
      {/* Gradient Overlay */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'linear-gradient(135deg, rgba(30,27,75,0.7) 0%, rgba(76,29,149,0.7) 100%)',
        zIndex: 2
      }} />
      
      {/* Content */}
      <div style={{ position: 'relative', zIndex: 3 }}>
      <div className="scroll-animate" style={{ maxWidth: 600, margin: '0 auto' }}>
        <h2 style={{ fontSize: 36, fontWeight: 800, color: '#fff', margin: '0 0 16px' }}>Ready to get started?</h2>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 17, marginBottom: 36 }}>
          Join your community on Resourcery and start booking resources today.
        </p>
        <Link to="/register?from=landing" className="hover-lift" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 36px', borderRadius: 999, background: '#FF8C42', color: '#fff', fontWeight: 700, fontSize: 16, textDecoration: 'none', boxShadow: '0 8px 24px rgba(255,140,66,0.4)' }}>
          Create an Account <ArrowRight size={18} />
        </Link>
      </div>
      </div>
    </section>

    {/* Footer */}
    <footer style={{ background: '#111827', padding: '32px 24px', textAlign: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 16 }}>
        <img src="/resourcery-logo.png" alt="R" style={{ width: 28, height: 28, borderRadius: 8, objectFit: 'cover' }}
          onError={e => { e.target.style.display='none'; }} />
        <span style={{ fontWeight: 700, color: '#fff', fontSize: 16 }}>Resourcery</span>
      </div>
      
      {/* Terms and Privacy Links */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24, marginBottom: 16 }}>
        <Link to="/terms-of-use" style={{ color: '#9ca3af', fontSize: 14, textDecoration: 'none', transition: 'color 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.color = '#fff'}
          onMouseLeave={e => e.currentTarget.style.color = '#9ca3af'}>
          Terms of Use
        </Link>
        <Link to="/privacy" style={{ color: '#9ca3af', fontSize: 14, textDecoration: 'none', transition: 'color 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.color = '#fff'}
          onMouseLeave={e => e.currentTarget.style.color = '#9ca3af'}>
          Privacy Policy
        </Link>
      </div>
      
      <p style={{ color: '#6b7280', fontSize: 13, margin: 0 }}>© {new Date().getFullYear()} Resourcery. All rights reserved.</p>
    </footer>
  </div>
  );
};

export default Landing;
