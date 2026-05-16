import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield, Clock } from 'lucide-react';

const PrivacyPolicy = () => {
  const [privacy, setPrivacy] = useState([]);
  const [loading, setLoading] = useState(true);

  const defaultPrivacySections = [
    {
      title: 'Information We Collect',
      content: 'We collect information you provide when creating an account (username, email address) and when using our services (booking requests, resource usage history). We also collect basic usage data to improve our platform.'
    },
    {
      title: 'How We Use Your Information',
      content: 'Your information is used to manage your account, process booking requests, communicate about your reservations, and improve our community resource management services. We do not sell or share your personal information with third parties.'
    },
    {
      title: 'Data Storage and Security',
      content: 'Your data is stored securely on our servers with appropriate technical and organizational measures to protect against unauthorized access, alteration, disclosure, or destruction of your personal information.'
    },
    {
      title: 'Community Administrators',
      content: 'Community administrators can view your booking history and account information as necessary to manage resource allocation and ensure fair usage within the community.'
    },
    {
      title: 'Booking and Usage Records',
      content: 'We maintain records of your resource bookings, pickup and return dates, and any damage reports for accountability and community management purposes. This information may be shared with community administrators.'
    },
    {
      title: 'Communications',
      content: 'We may send you notifications about your bookings, account status, and important community announcements. You can manage your notification preferences in your account settings.'
    },
    {
      title: 'Data Retention',
      content: 'We retain your account information and booking history for as long as your account is active and for a reasonable period thereafter for record-keeping purposes, unless you request deletion of your account.'
    },
    {
      title: 'Your Rights',
      content: 'You have the right to access, update, or delete your personal information. You can update most information through your account settings or contact your community administrator for assistance.'
    },
    {
      title: 'Cookies and Tracking',
      content: 'We use essential cookies to maintain your login session and provide core functionality. We do not use tracking cookies or third-party analytics that collect personal information.'
    },
    {
      title: 'Changes to This Policy',
      content: 'We may update this privacy policy from time to time. We will notify users of any material changes through the platform or via email. Continued use of the service constitutes acceptance of the updated policy.'
    },
    {
      title: 'Contact Information',
      content: 'If you have questions about this privacy policy or how we handle your data, please contact your community administrator or the platform administrators through the appropriate channels.'
    }
  ];

  useEffect(() => {
    const fetchPrivacy = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_DJANGO_API_URL || 'http://localhost:8082'}/privacy`);
        const data = await response.json();
        
        if (data.content && data.content.length > 0) {
          // Convert admin format to display format
          const formattedPrivacy = data.content.map(section => ({
            title: section.title,
            content: section.body
          }));
          setPrivacy(formattedPrivacy);
        } else {
          // Use default privacy policy if none set by admin
          setPrivacy(defaultPrivacySections);
        }
      } catch (err) {
        // Use default privacy policy on error
        setPrivacy(defaultPrivacySections);
        console.error('Error fetching privacy policy:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPrivacy();
  }, []);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, border: '4px solid #e2e8f0', borderTop: '4px solid #667eea', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 20px' }} />
          <p style={{ color: '#64748b', fontSize: 16, fontWeight: 500 }}>Loading privacy policy...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `
      }} />
      
      {/* Header */}
      <div style={{ background: 'white', borderBottom: '1px solid #e2e8f0', padding: '20px 24px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 44 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src="/resourcery-logo.png" alt="R" style={{ width: 36, height: 36, borderRadius: 10, objectFit: 'cover' }}
              onError={e => { e.target.style.display='none'; }} />
            <span style={{ fontWeight: 800, fontSize: 20, background: 'linear-gradient(135deg,#667eea,#764ba2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Resourcery
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ background: 'white', borderRadius: 20, padding: '40px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)', border: '1px solid #e2e8f0', position: 'relative' }}>
          
          {/* Back to Home Button */}
          <Link to="/" style={{ position: 'absolute', top: 20, left: 20, display: 'inline-flex', alignItems: 'center', gap: 8, color: '#64748b', fontSize: 14, fontWeight: 500, textDecoration: 'none', transition: 'all 0.2s', padding: '8px 16px', borderRadius: 8, background: '#f8fafc', border: '1px solid #e2e8f0' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#667eea'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = '#667eea'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#64748b'; e.currentTarget.style.borderColor = '#e2e8f0'; }}>
            <ArrowLeft size={16} /> Back to Home
          </Link>

          {/* Header Section */}
          <div style={{ textAlign: 'center', marginBottom: 40, paddingBottom: 24, borderBottom: '1px solid #f1f5f9', paddingTop: 40 }}>
            <h1 style={{ fontSize: 32, fontWeight: 800, color: '#1e293b', margin: '0 0 12px', letterSpacing: '-0.5px' }}>
              Privacy Policy
            </h1>
            <p style={{ color: '#64748b', fontSize: 16, margin: 0, lineHeight: 1.6, maxWidth: 500, marginLeft: 'auto', marginRight: 'auto' }}>
              This privacy policy explains how Resourcery collects, uses, and protects your personal information. Your privacy and data security are our top priorities.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {privacy.map((section, index) => (
              <div key={index} style={{ background: '#f8fafc', borderRadius: 16, padding: '24px', border: '1px solid #e2e8f0', position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #667eea, #764ba2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 8px rgba(102, 126, 234, 0.25)' }}>
                    <span style={{ color: '#fff', fontSize: 14, fontWeight: 'bold' }}>{index + 1}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1e293b', margin: '0 0 12px', lineHeight: 1.3 }}>
                      {section.title}
                    </h3>
                    <p style={{ color: '#475569', fontSize: 15, lineHeight: 1.6, margin: 0 }}>
                      {section.content}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer Section */}
          <div style={{ marginTop: 40, padding: '24px', background: '#f8fafc', borderRadius: 16, border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <Clock size={16} style={{ color: '#64748b' }} />
              <span style={{ color: '#64748b', fontSize: 14, fontWeight: 600 }}>Effective Date:</span>
              <span style={{ color: '#1e293b', fontSize: 14, fontWeight: 500 }}>{new Date().toLocaleDateString()}</span>
            </div>
            <p style={{ color: '#64748b', fontSize: 14, margin: 0, lineHeight: 1.6 }}>
              This privacy policy is effective as of the date listed above and applies to all users of the Resourcery platform. We are committed to protecting your privacy and will notify you of any material changes to this policy. If you have questions about how we handle your data, please contact your community administrator.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;