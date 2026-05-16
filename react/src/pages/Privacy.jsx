import { useEffect, useState } from 'react';
import { Loader2, Plus, Trash2, Save, Edit2, X } from 'lucide-react';
import Layout from '../layout/Layout';
import djangoApi from '../config/djangoApi';
import { useAuth } from '../hooks/useAuth';

const Privacy = () => {
  const { isAdmin } = useAuth();
  const [privacy, setPrivacy] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState([]);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [updatedBy, setUpdatedBy] = useState(null);

  useEffect(() => {
    djangoApi.get('/privacy')
      .then(({ data }) => {
        if (data.content && data.content.length > 0) {
          setPrivacy(data.content);
          setDraft(data.content);
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
          setDraft(defaultPrivacy);
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
        setDraft(defaultPrivacy);
      })
      .finally(() => setLoading(false));
  }, []);

  const [saveError, setSaveError] = useState('');

  const save = async () => {
    const empty = draft.find(c => !c.title.trim() || !c.body.trim());
    if (empty) { 
      setSaveError('All sections must have a title and description.'); 
      return; 
    }
    setSaveError('');
    setSaving(true);
    try {
      const { data } = await djangoApi.put('/privacy', { content: draft });
      setPrivacy(data.content);
      setDraft(data.content);
      setUpdatedAt(data.updated_at);
      setUpdatedBy(data.updated_by);
      setEditing(false);
    } catch (error) {
      console.error('Error saving privacy policy:', error);
      const errorMsg = error.response?.data?.error || error.response?.data?.message || error.message || 'Unknown error';
      setSaveError(`Failed to save privacy policy: ${errorMsg}`);
    }
    finally { 
      setSaving(false); 
    }
  };

  const addSection = () => setDraft(d => [...d, { title: '', body: '' }]);
  const removeSection = (i) => setDraft(d => d.filter((_, idx) => idx !== i));
  const updateSection = (i, field, val) => {
    setDraft(d => d.map((c, idx) => idx === i ? { ...c, [field]: val } : c));
    setSaveError('');
  };

  const inputCls = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 bg-gray-50";

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
              {isAdmin && !editing && (
                <button onClick={() => { setDraft([...privacy]); setEditing(true); }}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white rounded-xl hover:opacity-90 transition-all"
                  style={{ background: 'linear-gradient(135deg,#667eea,#764ba2)' }}>
                  <Edit2 className="w-4 h-4" /> Edit
                </button>
              )}
              {isAdmin && editing && (
                <div className="flex gap-2">
                  <button onClick={() => { setDraft([...privacy]); setEditing(false); }}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-all">
                    <X className="w-4 h-4" /> Cancel
                  </button>
                  <button onClick={save} disabled={saving}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white rounded-xl hover:opacity-90 disabled:opacity-50 transition-all"
                    style={{ background: '#FF8C42' }}>
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save
                  </button>
                </div>
              )}
            </div>

            {editing ? (
              <div className="space-y-4">
                <button onClick={addSection}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-2 border-dashed border-purple-300 text-purple-600 rounded-xl hover:bg-purple-50 transition-all w-full justify-center">
                  <Plus className="w-4 h-4" /> Add Section
                </button>
                {saveError && (
                  <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-xl px-4 py-2">{saveError}</p>
                )}
                {[...draft].reverse().map((section, revIdx) => {
                  const i = draft.length - 1 - revIdx;
                  return (
                    <div key={i} className="border border-gray-200 rounded-xl p-4 space-y-3 bg-gray-50">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-purple-600 flex-shrink-0 w-6">{i + 1}.</span>
                        <input type="text" value={section.title} onChange={e => updateSection(i, 'title', e.target.value)}
                          placeholder="Section title…"
                          className={`${inputCls} font-semibold ${!section.title.trim() && saveError ? 'border-red-400 ring-1 ring-red-300' : ''}`} />
                        <button onClick={() => removeSection(i)}
                          className="text-red-400 hover:text-red-600 flex-shrink-0 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <textarea value={section.body} onChange={e => updateSection(i, 'body', e.target.value)}
                        placeholder="Section description…" rows={4}
                        className={`${inputCls} resize-none ${!section.body.trim() && saveError ? 'border-red-400 ring-1 ring-red-300' : ''}`} />
                    </div>
                  );
                })}
              </div>
            ) : (
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
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Privacy;