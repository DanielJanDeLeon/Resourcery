import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileText, Clock } from 'lucide-react';

const TermsOfUse = () => {
  const [terms, setTerms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTerms = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_DJANGO_API_URL || 'http://localhost:8082'}/terms`);
        const data = await response.json();
        
        if (data.content && data.content.length > 0) {
          setTerms(data.content);
        } else {
          // Default terms if none are set by admin
          setTerms([
            { title: 'Responsible Use of Resources', body: 'You agree to use all borrowed resources with care and in accordance with their intended purpose.' },
            { title: 'Liability for Damage or Loss', body: 'If a resource is damaged or lost, you will be held financially responsible for repair or replacement.' },
            { title: 'Pick-Up Hours', body: 'All approved resources must be picked up between 8:00 AM and 8:00 PM only.' },
            { title: 'Pick-Up Deadline', body: 'You must pick up your approved booking on the first day specified. Failure results in automatic cancellation.' },
            { title: 'Timely Return', body: 'All resources must be returned by the agreed return date.' },
            { title: 'Booking Accuracy', body: 'You are responsible for ensuring your booking details are accurate.' },
            { title: 'Cancellation Policy', body: 'You may cancel before pick-up. Once picked up, you are responsible until returned.' },
            { title: 'Compliance', body: 'Repeated violations may result in permanent suspension of your account.' },
          ]);
        }
      } catch (err) {
        // Use default terms on error
        setTerms([
          { title: 'Responsible Use of Resources', body: 'You agree to use all borrowed resources with care and in accordance with their intended purpose.' },
          { title: 'Liability for Damage or Loss', body: 'If a resource is damaged or lost, you will be held financially responsible for repair or replacement.' },
          { title: 'Pick-Up Hours', body: 'All approved resources must be picked up between 8:00 AM and 8:00 PM only.' },
          { title: 'Pick-Up Deadline', body: 'You must pick up your approved booking on the first day specified. Failure results in automatic cancellation.' },
          { title: 'Timely Return', body: 'All resources must be returned by the agreed return date.' },
          { title: 'Booking Accuracy', body: 'You are responsible for ensuring your booking details are accurate.' },
          { title: 'Cancellation Policy', body: 'You may cancel before pick-up. Once picked up, you are responsible until returned.' },
          { title: 'Compliance', body: 'Repeated violations may result in permanent suspension of your account.' },
        ]);
        console.error('Error fetching terms:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTerms();
  }, []);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, border: '4px solid #e2e8f0', borderTop: '4px solid #667eea', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 20px' }} />
          <p style={{ color: '#64748b', fontSize: 16, fontWeight: 500 }}>Loading terms...</p>
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
              Terms of Use
            </h1>
            <p style={{ color: '#64748b', fontSize: 16, margin: 0, lineHeight: 1.6, maxWidth: 500, marginLeft: 'auto', marginRight: 'auto' }}>
              Please read these terms carefully before using Resourcery services. By using our platform, you agree to these terms and conditions.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {terms.map((term, index) => (
              <div key={index} style={{ background: '#f8fafc', borderRadius: 16, padding: '24px', border: '1px solid #e2e8f0', position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #667eea, #764ba2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 8px rgba(102, 126, 234, 0.25)' }}>
                    <span style={{ color: '#fff', fontSize: 14, fontWeight: 'bold' }}>{index + 1}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1e293b', margin: '0 0 12px', lineHeight: 1.3 }}>
                      {term.title}
                    </h3>
                    <p style={{ color: '#475569', fontSize: 15, lineHeight: 1.6, margin: 0 }}>
                      {term.body}
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
              By using Resourcery, you agree to these terms of use. If you have any questions about these terms, please contact your community administrator. These terms may be updated from time to time, and continued use of the service constitutes acceptance of any changes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfUse;