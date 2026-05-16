import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import Layout from '../layout/Layout';
import djangoApi from '../config/djangoApi';

const PrivacyView = () => {
  const [privacy, setPrivacy] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [updatedBy, setUpdatedBy] = useState(null);

  useEffect(() => {
    djangoApi.get('/privacy')
      .then(({ data }) => {
        if (data.content && data.content.length > 0) {
          setPrivacy(data.content);
        } else {
          // Set default privacy policy content if none exists
          const defaultPrivacy = [
            { title: 'Information We Collect', body: 'We collect information you provide when creating an account (username, email address) and when using our services (booking requests, resource usage history). We also collect basic usage data to improve our platform.' },
            { title: 'How We Use Your Information', body: 'Your information is used to manage your account, process booking requests, communicate about your reservations, and improve our community resource management services. We do not sell or share your personal information with third parties.' },
            { title: 'Data Storage and Security', body: 'Your data is stored securely on our servers with appropriate technical and organizational measures to protect against unauthorized access, alteration, disclosure, or destruction of your personal information.' },
            { title: 'Community Administrators', body: 'Community administrators can view your booking history and account information as necessary to manage resource allocation and ensure fair usage within the community.' },
            { title: 'Booking and Usage Records', body: 'We maintain records of your resource bookings, pickup and return dates, and any damage reports for accountability and community management purposes. This information may be shared with community administrators.' },
            { title: 'Communications', body: 'We may send you notifications about your bookings, account status, and important community announcements. You can manage your notification preferences in your account settings.' },
            { title: 'Data Retention', body: 'We retain your account information and booking history for as long as your account is active and for a reasonable period thereafter for record-keeping purposes, unless you request deletion of your account.' },
            { title: 'Your Rights', body: 'You have the right to access, update, or delete your personal information. You can update most information through your account settings or contact your community administrator for assistance.' },
            { title: 'Cookies and Tracking', body: 'We use essential cookies to maintain your login session and provide core functionality. We do not use tracking cookies or third-party analytics that collect personal information.' },
            { title: 'Changes to This Policy', body: 'We may update this privacy policy from time to time. We will notify users of any material changes through the platform or via email. Continued use of the service constitutes acceptance of the updated policy.' },
            { title: 'Contact Information', body: 'If you have questions about this privacy policy or how we handle your data, please contact your community administrator or the platform administrators through the appropriate channels.' }
          ];
          setPrivacy(defaultPrivacy);
        }
        setUpdatedAt(data.updated_at);
        setUpdatedBy(data.updated_by);
      })
      .catch(() => {
        // Set default privacy policy content on error
        const defaultPrivacy = [
          { title: 'Information We Collect', body: 'We collect information you provide when creating an account (username, email address) and when using our services (booking requests, resource usage history). We also collect basic usage data to improve our platform.' },
          { title: 'How We Use Your Information', body: 'Your information is used to manage your account, process booking requests, communicate about your reservations, and improve our community resource management services. We do not sell or share your personal information with third parties.' },
          { title: 'Data Storage and Security', body: 'Your data is stored securely on our servers with appropriate technical and organizational measures to protect against unauthorized access, alteration, disclosure, or destruction of your personal information.' },
          { title: 'Community Administrators', body: 'Community administrators can view your booking history and account information as necessary to manage resource allocation and ensure fair usage within the community.' },
          { title: 'Booking and Usage Records', body: 'We maintain records of your resource bookings, pickup and return dates, and any damage reports for accountability and community management purposes. This information may be shared with community administrators.' },
          { title: 'Communications', body: 'We may send you notifications about your bookings, account status, and important community announcements. You can manage your notification preferences in your account settings.' },
          { title: 'Data Retention', body: 'We retain your account information and booking history for as long as your account is active and for a reasonable period thereafter for record-keeping purposes, unless you request deletion of your account.' },
          { title: 'Your Rights', body: 'You have the right to access, update, or delete your personal information. You can update most information through your account settings or contact your community administrator for assistance.' },
          { title: 'Cookies and Tracking', body: 'We use essential cookies to maintain your login session and provide core functionality. We do not use tracking cookies or third-party analytics that collect personal information.' },
          { title: 'Changes to This Policy', body: 'We may update this privacy policy from time to time. We will notify users of any material changes through the platform or via email. Continued use of the service constitutes acceptance of the updated policy.' },
          { title: 'Contact Information', body: 'If you have questions about this privacy policy or how we handle your data, please contact your community administrator or the platform administrators through the appropriate channels.' }
        ];
        setPrivacy(defaultPrivacy);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <Layout title="Privacy Policy" subtitle="Data collection and usage policies">
      <div className="max-w-3xl mx-auto">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400 gap-2">
            <Loader2 className="w-5 h-5 animate-spin" /> Loading…
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-md p-6 sa">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-bold text-gray-800 text-lg">Privacy Policy</h2>
                {updatedAt && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    Last updated {new Date(updatedAt).toLocaleDateString()} by {updatedBy}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-5">
              {privacy.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-8">No privacy policy has been set yet.</p>
              ) : privacy.map((section, i) => (
                <div key={i} className="border-l-4 pl-4" style={{ borderColor: '#667eea' }}>
                  <p className="font-bold text-gray-800 text-sm mb-1">{i + 1}. {section.title}</p>
                  <p className="text-sm text-gray-600 leading-relaxed">{section.body}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default PrivacyView;