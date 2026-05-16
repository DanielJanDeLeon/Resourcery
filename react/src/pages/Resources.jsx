import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Search, X, Loader2, CheckCircle, Trash2, Plus, CalendarDays, Pencil,
  Car, Wrench, MapPin, Tv, Bike, Package,
} from 'lucide-react';
import Layout from '../layout/Layout';
import phpApi from '../config/phpApi';
import djangoApi from '../config/djangoApi';
import { useAuth } from '../hooks/useAuth';

// ── Type → icon + color map ───────────────────────────────────────────────────
export const RESOURCE_TYPES = [
  { value: 'Vehicle',     label: 'Vehicle',     Icon: Car,     color: '#6366f1' },
  { value: 'Equipment',   label: 'Equipment',   Icon: Wrench,  color: '#f59e0b' },
  { value: 'Venue',       label: 'Venue',       Icon: MapPin,  color: '#10b981' },
  { value: 'Electronics', label: 'Electronics', Icon: Tv,      color: '#8b5cf6' },
  { value: 'Sports',      label: 'Sports',      Icon: Bike,    color: '#ef4444' },
  { value: 'Other',       label: 'Other',       Icon: Package, color: '#FF8C42' },
];

const to12h = (t) => {
  if (!t) return '';
  const [h, m] = t.slice(0, 5).split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${ampm}`;
};

const getTypeInfo = (type) =>
  RESOURCE_TYPES.find(t => t.value === type) || RESOURCE_TYPES[RESOURCE_TYPES.length - 1];

const fmt = (d) => d ? new Date(d + 'T00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';

// ── Book Modal ────────────────────────────────────────────────────────────────
const BookModal = ({ resource, onClose }) => {
  const isVenue = resource.type === 'Venue';
  const [step, setStep] = useState(1);
  const [date, setDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [multiDay, setMultiDay] = useState(false);
  const [quantity, setQuantity] = useState('1');
  const [quantityError, setQuantityError] = useState('');
  const [availableQty, setAvailableQty] = useState(resource.quantity || 1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [extensionData, setExtensionData] = useState(null);
  const [success, setSuccess] = useState(null);
  const today = new Date().toISOString().split('T')[0];

  const dateRange = isVenue && !multiDay
    ? (date ? fmt(date) : '')
    : (date && returnDate ? `${fmt(date)} – ${fmt(returnDate)}` : date ? fmt(date) : '');

  // Fetch available quantity when dates are selected
  React.useEffect(() => {
    if (!date || resource.quantity <= 1) {
      setAvailableQty(resource.quantity || 1);
      return;
    }
    djangoApi.get('/bookings/availability', {
      params: { resource_id: resource.id, date, return_date: returnDate || date }
    }).then(({ data }) => {
      const avail = data.available ?? resource.quantity;
      setAvailableQty(avail);
      // Only clamp down if something is actually booked for these dates
      const current = parseInt(quantity) || 1;
      if (current > avail) {
        setQuantity(String(Math.max(1, avail)));
      }
    }).catch(() => {
      setAvailableQty(resource.quantity || 1);
    });
  }, [date, returnDate]);

  const timeRange = isVenue && !multiDay && startTime && endTime
    ? `${startTime} – ${endTime}`
    : null;

  const submit = async () => {
    setLoading(true); setError(''); setExtensionData(null);
    try {
      const payload = {
        resource_id: resource.id,
        resource_name: resource.name,
        resource_type: resource.type,
        date,
        return_date: (isVenue && !multiDay) ? null : (returnDate || null),
        time: (isVenue && !multiDay && startTime) ? startTime : '00:00',
        quantity_requested: parseInt(quantity) || 1,
      };
      const res = await djangoApi.post('/bookings', payload);
      setSuccess(res.data?.merged ? 'merged' : 'booked');
      setTimeout(onClose, 2200);
    } catch (err) {
      const data = err.response?.data;
      if (data?.conflict_type === 'approved_extension') {
        setExtensionData(data);
        setStep(2);
      } else {
        setError(data?.error || 'Booking failed. Please try again.');
        setStep(1);
      }
    } finally { setLoading(false); }
  };

  const confirmExtension = async () => {
    setLoading(true); setError('');
    try {
      await djangoApi.patch(`/bookings/${extensionData.booking_id}/extend`, {
        merged_start: extensionData.merged_start,
        merged_end: extensionData.merged_end,
        is_extension: extensionData.is_extension,
      });
      setSuccess(extensionData.is_extension ? 'extended' : 'updated');
      setTimeout(onClose, 2200);
    } catch (err) {
      setError(err.response?.data?.error || 'Update failed. Please try again.');
      setExtensionData(null);
      setStep(1);
    } finally { setLoading(false); }
  };

  const { color, Icon: TypeIcon } = getTypeInfo(resource.type);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white flex-shrink-0" style={{ background: color }}>
                <TypeIcon className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-gray-800 text-base leading-tight">{resource.name}</h2>
                <p className="text-xs text-gray-400">{resource.type}</p>
              </div>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          {!success && (
            <div className="flex items-center gap-2 mt-1">
              {[1, 2].map(s => (
                <React.Fragment key={s}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${step >= s ? 'text-white' : 'bg-gray-100 text-gray-400'}`}
                    style={step >= s ? { background: 'linear-gradient(135deg, #667eea, #764ba2)' } : {}}>
                    {s}
                  </div>
                  {s < 2 && <div className={`flex-1 h-0.5 rounded transition-all ${step > s ? 'bg-purple-400' : 'bg-gray-200'}`} />}
                </React.Fragment>
              ))}
              <span className="text-xs text-gray-400 ml-1">{step === 1 ? 'Select dates' : 'Confirm booking'}</span>
            </div>
          )}
        </div>

        <div className="px-6 py-5">
          {success ? (
            <div className="text-center py-4">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3 ${success === 'booked' ? 'bg-green-100' : 'bg-blue-100'}`}>
                <CheckCircle className={`w-8 h-8 ${success === 'booked' ? 'text-green-600' : 'text-blue-500'}`} />
              </div>
              <p className="font-bold text-gray-800">
                {success === 'booked' ? 'Booking Submitted!' : success === 'merged' ? 'Booking Updated!' : success === 'updated' ? 'Update Requested!' : 'Extension Requested!'}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {success === 'booked' ? 'Awaiting admin approval.'
                  : success === 'merged' ? 'Your pending booking dates have been updated.'
                  : success === 'updated' ? 'Your booking update is awaiting admin re-approval.'
                  : 'Awaiting admin re-approval.'}
              </p>
            </div>
          ) : step === 1 ? (
            <div className="space-y-4">
              {error && (
                <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                  <X className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm font-medium text-red-700">{error}</p>
                </div>
              )}

              {/* Venue: toggle single day vs multi-day */}
              {isVenue && (
                <div className="flex gap-2">
                  <button type="button" onClick={() => { setMultiDay(false); setReturnDate(''); }}
                    className={`flex-1 py-2 text-xs font-semibold rounded-xl border transition-all ${!multiDay ? 'text-white border-transparent' : 'border-gray-200 text-gray-500 bg-gray-50'}`}
                    style={!multiDay ? { background: 'linear-gradient(135deg,#667eea,#764ba2)' } : {}}>
                    Single Day
                  </button>
                  <button type="button" onClick={() => { setMultiDay(true); setStartTime(''); setEndTime(''); }}
                    className={`flex-1 py-2 text-xs font-semibold rounded-xl border transition-all ${multiDay ? 'text-white border-transparent' : 'border-gray-200 text-gray-500 bg-gray-50'}`}
                    style={multiDay ? { background: 'linear-gradient(135deg,#667eea,#764ba2)' } : {}}>
                    Multiple Days
                  </button>
                </div>
              )}

              {/* Date fields */}
              {isVenue && !multiDay ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input type="date" value={date} min={today}
                    onChange={e => setDate(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 bg-gray-50" />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{isVenue ? 'Start Date' : 'Pickup Date'}</label>
                    <input type="date" value={date} min={today}
                      onChange={e => { setDate(e.target.value); if (returnDate && e.target.value > returnDate) setReturnDate(''); }}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 bg-gray-50" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{isVenue ? 'End Date' : 'Return Date'}</label>
                    <input type="date" value={returnDate} min={date || today}
                      onChange={e => setReturnDate(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 bg-gray-50" />
                  </div>
                </div>
              )}

              {/* Time slot for single-day venue */}
              {isVenue && !multiDay && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                    <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 bg-gray-50" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                    <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 bg-gray-50" />
                  </div>
                </div>
              )}

              {(dateRange || timeRange) && (
                <div className="text-xs text-center text-purple-700 bg-purple-50 border border-purple-100 rounded-xl px-3 py-2 font-medium">
                  {dateRange}{timeRange ? ` · ${timeRange}` : ''}
                </div>
              )}

              {/* Quantity selector for non-venue resources with qty > 1 */}
              {!isVenue && resource.quantity > 1 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity{' '}
                    {date && <span className={`text-xs font-semibold ${availableQty === 0 ? 'text-red-500' : 'text-gray-400'}`}>
                      ({availableQty} available for selected dates)
                    </span>}
                  </label>
                  <input
                    type="number"
                    value={quantity}
                    min={1}
                    max={availableQty}
                    step={1}
                    onChange={e => {
                      const raw = parseInt(e.target.value.replace(/[^0-9]/g, '')) || 1;
                      const max = availableQty > 0 ? availableQty : 1;
                      // Clamp to max available — never let user exceed it
                      const clamped = Math.min(raw, max);
                      setQuantity(String(clamped));
                      setQuantityError('');
                    }}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 bg-gray-50"
                  />
                  {quantityError && <p className="text-xs text-red-500 mt-1">{quantityError}</p>}
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button type="button" onClick={onClose}
                  className="flex-1 py-2.5 text-sm border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-all">
                  Cancel
                </button>
                <button type="button"
                  disabled={!date || (isVenue && !multiDay && (!startTime || !endTime))}
                  onClick={() => {
                    if (resource.quantity > 1 && !isVenue) {
                      const qty = parseInt(quantity);
                      if (!qty || qty <= 0) { setQuantityError('Quantity must be at least 1.'); return; }
                      if (availableQty === 0 && date) { setQuantityError('No units available for the selected dates.'); return; }
                      if (qty > availableQty) { setQuantityError(`Only ${availableQty} unit${availableQty !== 1 ? 's' : ''} available.`); return; }
                    }
                    setStep(2);
                  }}
                  className="flex-1 py-2.5 text-sm text-white rounded-xl font-semibold hover:opacity-90 disabled:opacity-40 transition-all"
                  style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                  Next →
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {extensionData ? (
                <>
                  <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                    <CalendarDays className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-amber-800">
                        {extensionData.is_extension ? 'Extend your booking?' : 'Update your booking?'}
                      </p>
                      <p className="text-xs text-amber-700 mt-1">
                        Your approved booking will be {extensionData.is_extension ? 'extended' : 'updated'} to{' '}
                        <span className="font-bold">{fmt(extensionData.merged_start)} – {fmt(extensionData.merged_end)}</span>{' '}
                        and reset to pending for admin re-approval.
                      </p>
                    </div>
                  </div>
                  {error && (
                    <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                      <X className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                      <p className="text-sm font-medium text-red-700">{error}</p>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button type="button" onClick={() => { setExtensionData(null); setStep(1); }}
                      className="flex-1 py-2.5 text-sm border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-all">
                      Cancel
                    </button>
                    <button type="button" onClick={confirmExtension} disabled={loading}
                      className="flex-1 py-2.5 text-sm text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-all"
                      style={{ background: '#FF8C42' }}>
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : extensionData.is_extension ? 'Confirm Extension' : 'Confirm Update'}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm text-gray-600">Please confirm your booking details:</p>
                  <div className="bg-gray-50 rounded-xl p-4 space-y-3 border border-gray-100">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Resource</span>
                      <span className="font-medium text-gray-800">{resource.name}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Type</span>
                      <span className="text-gray-700">{resource.type}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Date</span>
                      <span className="font-medium text-gray-800">{dateRange}</span>
                    </div>
                    {timeRange && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Time</span>
                        <span className="font-medium text-gray-800">{timeRange}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Status</span>
                      <span className="text-amber-600 font-medium">Pending approval</span>
                    </div>
                    {!isVenue && quantity > 1 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Quantity</span>
                        <span className="font-medium text-gray-800">{quantity}</span>
                      </div>
                    )}
                  </div>
                  {error && <p className="text-red-500 text-xs bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setStep(1)}
                      className="flex-1 py-2.5 text-sm border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-all">
                      ← Back
                    </button>
                    <button type="button" onClick={submit} disabled={loading}
                      className="flex-1 py-2.5 text-sm text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-all"
                      style={{ background: '#FF8C42' }}>
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Booking'}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Edit Modal ────────────────────────────────────────────────────────────────
const EditModal = ({ resource, onSave, onClose }) => {
  const [form, setForm] = useState({
    name: resource.name,
    type: resource.type,
    description: resource.description || '',
    quantity: resource.quantity || 1,
    status: resource.status,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      const { data } = await phpApi.put(`/resources/${resource.id}`, form);
      onSave(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Update failed.');
    } finally { setSaving(false); }
  };

  const inputCls = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 bg-gray-50";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="px-6 pt-6 pb-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-gray-800">Edit Resource</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={submit} className="px-6 py-5 space-y-4">
          {error && <p className="text-red-500 text-xs bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Name</label>
            <input type="text" value={form.name} onChange={set('name')} required className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Description <span className="text-gray-400 font-normal">(optional)</span></label>
            <textarea value={form.description} onChange={set('description')} rows={2}
              placeholder="Brief description…" className={inputCls + ' resize-none'} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Type</label>
            <div className="grid grid-cols-4 gap-1.5">
              {RESOURCE_TYPES.map(({ value, label, Icon, color }) => (
                <button key={value} type="button"
                  onClick={() => setForm(p => ({ ...p, type: value }))}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all text-xs font-semibold ${
                    form.type === value ? 'text-white border-transparent' : 'border-gray-200 text-gray-500 bg-gray-50'
                  }`}
                  style={form.type === value ? { background: color } : {}}>
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Quantity</label>
            <input type="number" value={form.quantity} onChange={set('quantity')} min={1} required className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Status</label>
            <select value={form.status} onChange={set('status')} className={inputCls}>
              <option value="available">Available</option>
              <option value="under maintenance">Unavailable</option>
            </select>
          </div>
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 text-sm border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-all">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 text-sm text-white font-semibold rounded-xl flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-all"
              style={{ background: '#FF8C42' }}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Delete Confirm Modal ──────────────────────────────────────────────────────
const DeleteConfirmModal = ({ resource, onConfirm, onCancel, deleting }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
          <Trash2 className="w-5 h-5 text-red-500" />
        </div>
        <div>
          <h2 className="font-bold text-gray-800">Delete Resource?</h2>
          <p className="text-sm text-gray-500 mt-0.5">This cannot be undone.</p>
        </div>
      </div>
      <div className="bg-gray-50 rounded-xl px-4 py-3 mb-5 text-sm text-gray-700 border border-gray-100">
        <span className="font-semibold">{resource.name}</span> · {resource.type}
      </div>
      <div className="flex gap-2">
        <button onClick={onCancel} disabled={deleting}
          className="flex-1 py-2.5 text-sm border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-all">
          Cancel
        </button>
        <button onClick={onConfirm} disabled={deleting}
          className="flex-1 py-2.5 text-sm text-white font-semibold rounded-xl flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-all bg-red-500">
          {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
          Delete
        </button>
      </div>
    </div>
  </div>
);

// ── Status styles ─────────────────────────────────────────────────────────────
const STATUS_STYLES = {
  available:           { bg: 'bg-green-100', text: 'text-green-700', label: 'Available' },
  'under maintenance': { bg: 'bg-red-100',   text: 'text-red-600',   label: 'Unavailable' },
};

// ── Resource Card ─────────────────────────────────────────────────────────────
const ResourceCard = ({ resource, bookings = [], isAdmin, onBook, onEdit, onDelete, staggerClass = '' }) => {
  const { Icon, color } = getTypeInfo(resource.type);
  const s = STATUS_STYLES[resource.status] || STATUS_STYLES.available;

  return (
    <div className={`sa ${staggerClass} bg-white rounded-2xl shadow-md overflow-hidden flex flex-col hover-lift`}>
      <div className="h-1.5 w-full" style={{ background: color }} />
      <div className="p-5 flex flex-col gap-3 flex-1">
        <div className="flex items-start justify-between">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white flex-shrink-0" style={{ background: color }}>
            <Icon className="w-6 h-6" />
          </div>
          <span className={`text-xs font-bold px-3 py-1 rounded-full ${s.bg} ${s.text}`}>{s.label}</span>
        </div>
        <div>
          <h3 className="font-bold text-gray-800 text-base leading-snug">{resource.name}</h3>
          <p className="text-sm font-semibold mt-0.5" style={{ color }}>{resource.type}</p>
          {resource.description && (
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">{resource.description}</p>
          )}
          {resource.quantity > 1 && (
            <p className="text-xs text-gray-400 mt-1">
              Total qty: <span className="font-semibold text-gray-600">{resource.quantity}</span>
              {bookings.length > 0 && (
                <span className="ml-1">
                  · Available: <span className="font-semibold text-green-600">
                    {Math.max(0, resource.quantity - bookings.reduce((sum, b) => sum + (b.quantity_requested || 1), 0))}
                  </span>
                </span>
              )}
            </p>
          )}
        </div>
        {bookings.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <CalendarDays className="w-3.5 h-3.5" /> Booked Dates
            </p>
            <div className="flex flex-col gap-1 max-h-28 overflow-y-auto pr-0.5">
              {bookings.map(b => (
                <div key={b.id} className={`flex items-center justify-between text-xs px-2.5 py-1.5 rounded-lg font-medium ${b.status === 'pending' ? 'bg-amber-50 text-amber-700' : 'bg-gray-100 text-gray-700'}`}>
                  <span>
                    {b.return_date ? `${fmt(b.date)} – ${fmt(b.return_date)}` : fmt(b.date)}
                    {b.time && b.end_time && !b.return_date ? ` · ${to12h(b.time)}–${to12h(b.end_time)}` : ''}
                  </span>
                  {b.status === 'pending' && (
                    <span className="ml-2 text-xs font-bold bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded-full">Pending</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="flex gap-2 mt-auto pt-1">
          {!isAdmin && (
            <button onClick={() => onBook(resource)} disabled={resource.status === 'under maintenance'}
              className="flex-1 py-2.5 text-sm text-white font-bold rounded-xl hover:opacity-90 disabled:opacity-40 transition-all"
              style={{ background: resource.status !== 'under maintenance' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#d1d5db' }}>
              {resource.status !== 'under maintenance' ? 'Book Now' : 'Unavailable'}
            </button>
          )}
          {isAdmin && (
            <>
              <button onClick={() => onEdit(resource)}
                className="flex-1 py-2.5 text-sm text-purple-500 font-medium hover:bg-purple-50 rounded-xl transition-all border border-purple-200 flex items-center justify-center gap-1">
                <Pencil className="w-4 h-4" /> Edit
              </button>
              <button onClick={() => onDelete(resource)}
                className="px-3 py-2.5 text-sm text-red-500 font-medium hover:bg-red-50 rounded-xl transition-all border border-red-200">
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Resources Page ────────────────────────────────────────────────────────────
const Resources = () => {
  const { isAdmin } = useAuth();
  const location = useLocation();
  const [resources, setResources] = useState([]);
  const [bookingMap, setBookingMap] = useState({});
  const [search, setSearch] = useState('');
  const [bookTarget, setBookTarget] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(location.state?.toast ? { type: 'success', msg: location.state.toast } : null);

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const [resRes, bookRes] = await Promise.all([
          phpApi.get('/resources'),
          djangoApi.get('/bookings/resources').catch(() => ({ data: [] })),
        ]);
        setResources(resRes.data);
        const map = {};
        bookRes.data
          .filter(b => ['pending', 'for_pickup', 'not_returned'].includes(b.status))
          .forEach(b => {
            if (!map[b.resource_id]) map[b.resource_id] = [];
            map[b.resource_id].push(b);
          });
        setBookingMap(map);
      } catch {}
      finally { setLoading(false); }
    };
    loadData();
  }, [isAdmin]);

  const filtered = resources.filter(r =>
    (r.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (r.type || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await phpApi.delete(`/resources/${deleteTarget.id}`);
      setResources(prev => prev.filter(r => r.id !== deleteTarget.id));
      showToast('success', `"${deleteTarget.name}" deleted successfully.`);
      setDeleteTarget(null);
    } catch (err) {
      const msg = err.response?.status === 401
        ? 'You must be logged in as admin to delete resources.'
        : err.response?.data?.error || 'Delete failed. Please try again.';
      showToast('error', msg);
      setDeleteTarget(null);
    } finally { setDeleting(false); }
  };

  return (
    <Layout title="Resources" subtitle="Browse and book community resources">
      {toast && (
        <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2 ${
          toast.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          {toast.type === 'success' ? <CheckCircle className="w-4 h-4 flex-shrink-0" /> : <X className="w-4 h-4 flex-shrink-0" />}
          {toast.msg}
        </div>
      )}

      <div className="flex items-center justify-between mb-5 sa">
        <h2 className="text-gray-800 font-semibold text-lg">All Resources ({filtered.length})</h2>
        {isAdmin && (
          <Link to="/resources/add"
            className="flex items-center gap-2 px-4 py-2 text-sm text-white font-semibold rounded-full hover:opacity-90 transition-all"
            style={{ background: '#FF8C42' }}>
            <Plus className="w-4 h-4" /> Add Resource
          </Link>
        )}
      </div>

      <div className="relative mb-6 sa">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input type="text" placeholder="Search resources by name or type..."
          value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-11 pr-4 py-3 bg-white rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 shadow-sm" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-white gap-3">
          <Loader2 className="w-6 h-6 animate-spin" /> Loading…
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-md p-8 text-center text-gray-400">No resources found.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map((r, idx) => (
            <ResourceCard key={r.id} resource={r} bookings={bookingMap[r.id] || []}
              isAdmin={isAdmin} onBook={setBookTarget} onEdit={setEditTarget} onDelete={setDeleteTarget}
              staggerClass={`sa-d${(idx % 4) + 1}`} />
          ))}
        </div>
      )}

      {bookTarget && <BookModal resource={bookTarget} onClose={() => setBookTarget(null)} />}

      {editTarget && (
        <EditModal
          resource={editTarget}
          onSave={(updated) => {
            setResources(prev => prev.map(r => r.id === updated.id ? updated : r));
            setEditTarget(null);
            showToast('success', `"${updated.name}" updated.`);
          }}
          onClose={() => setEditTarget(null)}
        />
      )}

      {deleteTarget && (
        <DeleteConfirmModal
          resource={deleteTarget}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          deleting={deleting}
        />
      )}
    </Layout>
  );
};

export default Resources;
