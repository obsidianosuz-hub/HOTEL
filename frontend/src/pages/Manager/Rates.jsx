import React, { useState, useEffect } from 'react';
import { Loader2, Plus, Trash2, Percent, AlertTriangle, CheckCircle2 } from 'lucide-react';
import api from '../../lib/api';
import ConfirmDialog from '../../components/ConfirmDialog';
import useConfirm from '../../hooks/useConfirm';

const emptyForm = { room_type_id: '', start_date: '', end_date: '', price_override: '' };

export default function Rates() {
  const [rates, setRates] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const { confirm, dialogProps } = useConfirm();

  useEffect(() => {
    fetchRates();
    fetchRoomTypes();
  }, []);

  const fetchRates = async () => {
    try {
      setLoading(true);
      const res = await api.get('/manager/settings/rates');
      setRates(res.data || []);
    } catch (err) {
      setError('Failed to load seasonal rates.');
    } finally {
      setLoading(false);
    }
  };

  const fetchRoomTypes = async () => {
    try {
      const res = await api.get('/manager/rooms');
      const types = [];
      const seen = new Set();
      (res.data || []).forEach(r => {
        if (r.room_type && !seen.has(r.room_type.id)) { seen.add(r.room_type.id); types.push(r.room_type); }
      });
      setRoomTypes(types);
      setForm(f => ({ ...f, room_type_id: f.room_type_id || types[0]?.id || '' }));
    } catch (err) {
      // non-fatal
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api.put('/manager/settings/rates', form);
      setForm(f => ({ ...emptyForm, room_type_id: f.room_type_id }));
      setMessage('Seasonal rate added.');
      setTimeout(() => setMessage(null), 3000);
      fetchRates();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add rate');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (rate) => {
    const ok = await confirm({
      title: 'Remove this rate override?',
      message: `${rate.room_type?.name} — ${new Date(rate.start_date).toLocaleDateString()} to ${new Date(rate.end_date).toLocaleDateString()}`,
      confirmLabel: 'Remove',
      danger: true
    });
    if (!ok) return;
    setError(null);
    try {
      await api.delete(`/manager/settings/rates/${rate.id}`);
      setMessage('Rate removed.');
      setTimeout(() => setMessage(null), 3000);
      fetchRates();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to remove rate');
    }
  };

  const today = new Date();
  const isActive = (rate) => new Date(rate.start_date) <= today && today <= new Date(rate.end_date);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Rates & Dynamic Pricing</h1>
        <p className="text-gray-500 mt-1">Override a room type's nightly price for specific date ranges — e.g. holidays or peak season.</p>
      </div>

      {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-2"><AlertTriangle className="w-5 h-5" /> {error}</div>}
      {message && <div className="bg-green-50 text-green-700 p-4 rounded-xl flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> {message}</div>}

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-3">Add Seasonal Rate</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Room Type</label>
            <select required value={form.room_type_id} onChange={e => setForm({ ...form, room_type_id: e.target.value })} className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none bg-white">
              <option value="" disabled>Select</option>
              {roomTypes.map(rt => <option key={rt.id} value={rt.id}>{rt.name} ({Number(rt.base_price).toLocaleString()} so'm)</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input required type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input required type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Price Override (so'm/night)</label>
            <input required type="number" min="0" value={form.price_override} onChange={e => setForm({ ...form, price_override: e.target.value })} className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none" placeholder="e.g. 700000" />
          </div>
        </div>
        <div className="flex justify-end">
          <button type="submit" disabled={saving} className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors shadow-sm font-medium">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Add Rate
          </button>
        </div>
      </form>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2"><Percent className="h-5 w-5 text-brand-600" /> Active & Upcoming Overrides</h2>
        </div>
        {loading ? (
          <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-brand-600" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="p-4 font-semibold text-gray-600">Room Type</th>
                  <th className="p-4 font-semibold text-gray-600">Dates</th>
                  <th className="p-4 font-semibold text-gray-600">Base Price</th>
                  <th className="p-4 font-semibold text-gray-600">Override Price</th>
                  <th className="p-4 font-semibold text-gray-600">Status</th>
                  <th className="p-4 font-semibold text-gray-600 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rates.map(rate => (
                  <tr key={rate.id} className="hover:bg-gray-50">
                    <td className="p-4 font-medium text-gray-900">{rate.room_type?.name}</td>
                    <td className="p-4 text-gray-600">{new Date(rate.start_date).toLocaleDateString()} — {new Date(rate.end_date).toLocaleDateString()}</td>
                    <td className="p-4 text-gray-500">{Number(rate.room_type?.base_price || 0).toLocaleString()} so'm</td>
                    <td className="p-4 font-semibold text-brand-700">{Number(rate.price_override).toLocaleString()} so'm</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${isActive(rate) ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                        {isActive(rate) ? 'Active' : 'Upcoming'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button onClick={() => handleDelete(rate)} className="p-1.5 text-gray-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {rates.length === 0 && (
                  <tr><td colSpan="6" className="p-8 text-center text-gray-500">No seasonal rate overrides yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog {...dialogProps} />
    </div>
  );
}
