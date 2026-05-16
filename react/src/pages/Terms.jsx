import { useEffect, useState } from 'react';
import { Loader2, Plus, Trash2, Save, Edit2, X } from 'lucide-react';
import Layout from '../layout/Layout';
import djangoApi from '../config/djangoApi';
import { useAuth } from '../hooks/useAuth';

const Terms = () => {
  const { isAdmin } = useAuth();
  const [terms, setTerms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState([]);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [updatedBy, setUpdatedBy] = useState(null);

  useEffect(() => {
    djangoApi.get('/terms')
      .then(({ data }) => {
        setTerms(data.content || []);
        setDraft(data.content || []);
        setUpdatedAt(data.updated_at);
        setUpdatedBy(data.updated_by);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const [saveError, setSaveError] = useState('');

  const save = async () => {
    const empty = draft.find(c => !c.title.trim() || !c.body.trim());
    if (empty) { setSaveError('All clauses must have a title and description.'); return; }
    setSaveError('');
    setSaving(true);
    try {
      const { data } = await djangoApi.put('/terms', { content: draft });
      setTerms(data.content);
      setDraft(data.content);
      setUpdatedAt(data.updated_at);
      setUpdatedBy(data.updated_by);
      setEditing(false);
    } catch {}
    finally { setSaving(false); }
  };

  const addClause = () => setDraft(d => [...d, { title: '', body: '' }]);
  const removeClause = (i) => setDraft(d => d.filter((_, idx) => idx !== i));
  const updateClause = (i, field, val) => {
    setDraft(d => d.map((c, idx) => idx === i ? { ...c, [field]: val } : c));
    setSaveError('');
  };

  const inputCls = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 bg-gray-50";

  return (
    <Layout title="Terms & Conditions" subtitle="Community resource usage agreement">
      <div className="max-w-3xl mx-auto">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400 gap-2">
            <Loader2 className="w-5 h-5 animate-spin" /> Loading…
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-md p-6 sa">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-bold text-gray-800 text-lg">User Agreement</h2>
                {updatedAt && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    Last updated {new Date(updatedAt).toLocaleDateString()} by {updatedBy}
                  </p>
                )}
              </div>
              {isAdmin && !editing && (
                <button onClick={() => { setDraft([...terms]); setEditing(true); }}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white rounded-xl hover:opacity-90 transition-all"
                  style={{ background: 'linear-gradient(135deg,#667eea,#764ba2)' }}>
                  <Edit2 className="w-4 h-4" /> Edit
                </button>
              )}
              {isAdmin && editing && (
                <div className="flex gap-2">
                  <button onClick={() => { setDraft([...terms]); setEditing(false); }}
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
                <button onClick={addClause} disabled={draft.some(c => !c.title.trim() || !c.body.trim())}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-2 border-dashed border-purple-300 text-purple-600 rounded-xl hover:bg-purple-50 transition-all w-full justify-center disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent">
                  <Plus className="w-4 h-4" /> Add Clause
                </button>
                {saveError && (
                  <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-xl px-4 py-2">{saveError}</p>
                )}
                {[...draft].reverse().map((clause, revIdx) => {
                  const i = draft.length - 1 - revIdx;
                  return (
                    <div key={i} className="border border-gray-200 rounded-xl p-4 space-y-3 bg-gray-50">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-purple-600 flex-shrink-0 w-6">{i + 1}.</span>
                        <input type="text" value={clause.title} onChange={e => updateClause(i, 'title', e.target.value)}
                          placeholder="Clause title…"
                          className={`${inputCls} font-semibold ${!clause.title.trim() && saveError ? 'border-red-400 ring-1 ring-red-300' : ''}`} />
                        <button onClick={() => removeClause(i)}
                          className="text-red-400 hover:text-red-600 flex-shrink-0 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <textarea value={clause.body} onChange={e => updateClause(i, 'body', e.target.value)}
                        placeholder="Clause description…" rows={3}
                        className={`${inputCls} resize-none ${!clause.body.trim() && saveError ? 'border-red-400 ring-1 ring-red-300' : ''}`} />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-5">
                {terms.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-8">No terms have been set yet.</p>
                ) : terms.map((clause, i) => (
                  <div key={i} className="border-l-4 pl-4" style={{ borderColor: '#667eea' }}>
                    <p className="font-bold text-gray-800 text-sm mb-1">{i + 1}. {clause.title}</p>
                    <p className="text-sm text-gray-600 leading-relaxed">{clause.body}</p>
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

export default Terms;
