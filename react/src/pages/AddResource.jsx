import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../layout/Layout';
import phpApi from '../config/phpApi';
import { RESOURCE_TYPES } from './Resources';

const AddResource = () => {

  const [form, setForm] = useState({
    name: '',
    type: 'Equipment',
    description: '',
    quantity: 1,
    status: 'available',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await phpApi.post('/resources', {
        name: form.name,
        type: form.type,
        description: form.description || null,
        quantity: form.quantity,
        status: form.status,
      });
      navigate('/resources', { state: { toast: `"${form.name}" added successfully.` } });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add resource.');
    } finally { setLoading(false); }
  };

  const inputCls = "w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 bg-gray-50";
  const labelCls = "block text-sm font-semibold text-gray-600 mb-1.5";

  const selectedType = RESOURCE_TYPES.find(t => t.value === form.type) || RESOURCE_TYPES[0];

  return (
    <Layout title="Add Resource" subtitle="Add a new resource to the system">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-2xl shadow-md p-6">
          <form onSubmit={submit} className="space-y-5">
            {error && (
              <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>
            )}

            <div>
              <label className={labelCls}>Resource Name</label>
              <input type="text" value={form.name} onChange={set('name')} required
                className={inputCls} />
            </div>

            <div>
              <label className={labelCls}>Description <span className="text-gray-400 font-normal">(optional)</span></label>
              <textarea value={form.description} onChange={set('description')} rows={2}
                placeholder="Brief description of this resource…"
                className={inputCls + ' resize-none'} />
            </div>

            {/* Type selector with icons */}
            <div>
              <label className={labelCls}>Resource Type</label>
              <div className="grid grid-cols-4 gap-2">
                {RESOURCE_TYPES.map(({ value, label, Icon, color }) => (
                  <button key={value} type="button"
                    onClick={() => setForm(p => ({ ...p, type: value }))}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-xs font-semibold ${
                      form.type === value
                        ? 'border-transparent text-white shadow-md'
                        : 'border-gray-200 text-gray-500 hover:border-gray-300 bg-gray-50'
                    }`}
                    style={form.type === value ? { background: color, borderColor: color } : {}}>
                    <Icon className="w-5 h-5" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className={labelCls}>Quantity</label>
              <input type="number" value={form.quantity} onChange={set('quantity')} min={1} required className={inputCls} />
            </div>

            <div>
              <label className={labelCls}>Initial Status</label>
              <select value={form.status} onChange={set('status')} className={inputCls}>
                <option value="available">Available</option>
                <option value="under maintenance">Unavailable</option>
              </select>
            </div>

            {/* Preview card */}
            <div className="rounded-xl border-2 border-dashed border-gray-200 p-4 bg-gray-50">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Preview</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white flex-shrink-0"
                  style={{ background: selectedType.color }}>
                  <selectedType.Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-gray-800 text-sm">{form.name || 'Resource Name'}</p>
                  <p className="text-xs font-semibold" style={{ color: selectedType.color }}>{form.type}</p>
                </div>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3 text-white font-bold rounded-xl hover:opacity-90 transition-all disabled:opacity-50"
              style={{ background: '#FF8C42' }}>
              {loading ? 'Adding…' : 'Add Resource'}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default AddResource;
