import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import Layout from '../layout/Layout';
import djangoApi from '../config/djangoApi';

const TermsView = () => {
  const [terms, setTerms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [updatedBy, setUpdatedBy] = useState(null);

  useEffect(() => {
    djangoApi.get('/terms')
      .then(({ data }) => {
        if (data.content && data.content.length > 0) {
          setTerms(data.content);
        } else {
          // Set default terms if none exists
          const defaultTerms = [
            { title: 'Responsible Use of Resources', body: 'You agree to use all borrowed resources with care and in accordance with their intended purpose.' },
            { title: 'Liability for Damage or Loss', body: 'If a resource is damaged or lost, you will be held financially responsible for repair or replacement.' },
            { title: 'Pick-Up Hours', body: 'All approved resources must be picked up between 8:00 AM and 8:00 PM only.' },
            { title: 'Pick-Up Deadline', body: 'You must pick up your approved booking on the first day specified. Failure results in automatic cancellation.' },
            { title: 'Timely Return', body: 'All resources must be returned by the agreed return date.' },
            { title: 'Booking Accuracy', body: 'You are responsible for ensuring your booking details are accurate.' },
            { title: 'Cancellation Policy', body: 'You may cancel before pick-up. Once picked up, you are responsible until returned.' },
            { title: 'Compliance', body: 'Repeated violations may result in permanent suspension of your account.' },
          ];
          setTerms(defaultTerms);
        }
        setUpdatedAt(data.updated_at);
        setUpdatedBy(data.updated_by);
      })
      .catch(() => {
        // Set default terms on error
        const defaultTerms = [
          { title: 'Responsible Use of Resources', body: 'You agree to use all borrowed resources with care and in accordance with their intended purpose.' },
          { title: 'Liability for Damage or Loss', body: 'If a resource is damaged or lost, you will be held financially responsible for repair or replacement.' },
          { title: 'Pick-Up Hours', body: 'All approved resources must be picked up between 8:00 AM and 8:00 PM only.' },
          { title: 'Pick-Up Deadline', body: 'You must pick up your approved booking on the first day specified. Failure results in automatic cancellation.' },
          { title: 'Timely Return', body: 'All resources must be returned by the agreed return date.' },
          { title: 'Booking Accuracy', body: 'You are responsible for ensuring your booking details are accurate.' },
          { title: 'Cancellation Policy', body: 'You may cancel before pick-up. Once picked up, you are responsible until returned.' },
          { title: 'Compliance', body: 'Repeated violations may result in permanent suspension of your account.' },
        ];
        setTerms(defaultTerms);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <Layout title="Terms & Conditions" subtitle="Community guidelines and policies">
      <div className="max-w-3xl mx-auto">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400 gap-2">
            <Loader2 className="w-5 h-5 animate-spin" /> Loading…
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-md p-6 sa">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-bold text-gray-800 text-lg">Terms & Conditions</h2>
                {updatedAt && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    Last updated {new Date(updatedAt).toLocaleDateString()} by {updatedBy}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-5">
              {terms.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-8">No terms and conditions have been set yet.</p>
              ) : terms.map((term, i) => (
                <div key={i} className="border-l-4 pl-4" style={{ borderColor: '#667eea' }}>
                  <p className="font-bold text-gray-800 text-sm mb-1">{i + 1}. {term.title}</p>
                  <p className="text-sm text-gray-600 leading-relaxed">{term.body}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default TermsView;