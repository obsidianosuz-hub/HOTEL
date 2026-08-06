import React, { useState, useEffect } from 'react';
import { Loader2, AlertCircle, Percent, Zap, Tag, Calendar, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import api from '../../lib/api';
import ConfirmDialog from '../../components/ConfirmDialog';
import useConfirm from '../../hooks/useConfirm';

export default function Rates() {
  const [activeTab, setActiveTab] = useState('dynamic'); // dynamic, promo
  const [rates, setRates] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Promo codes mock state
  const [promos, setPromos] = useState([
    { id: 1, code: 'SUMMER20', discount: 20, expiry: '2026-08-31', active: true },
    { id: 2, code: 'EARLYBIRD', discount: 15, expiry: '2026-09-15', active: true },
  ]);

  const [dynamicForm, setDynamicForm] = useState({ name: '', adjustment: 0, startDate: '', endDate: '', roomTypeId: '' });
  const [promoForm, setPromoForm] = useState({ code: '', discount: 0, expiry: '' });
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);

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
      setError(null);
    } catch (err) {
      setError('Narxlar ma\'lumotlarini yuklashda xatolik.');
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
    } catch (err) {}
  };

  const handleDeleteDynamic = async (id) => {
    const ok = await confirm({ title: 'Qoidani o\'chirish?', message: 'Bu narx qoidasi o\'chiriladi.', danger: true, confirmLabel: 'O\'chirish' });
    if (!ok) return;
    try {
      await api.delete(`/manager/settings/rates/${id}`);
      setRates(rates.filter(r => r.id !== id));
      setSuccessMsg('Qoida o\'chirildi.');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'O\'chirishda xatolik');
    }
  };

  const handleAddDynamic = async (e) => {
    e.preventDefault();
    if (!dynamicForm.roomTypeId) return setError('Xona turini tanlang');
    setSaving(true);
    setError(null);
    try {
      await api.put('/manager/settings/rates', {
        room_type_id: parseInt(dynamicForm.roomTypeId),
        name: dynamicForm.name,
        adjustment_percent: parseFloat(dynamicForm.adjustment),
        start_date: dynamicForm.startDate,
        end_date: dynamicForm.endDate,
      });
      setDynamicForm({ name: '', adjustment: 0, startDate: '', endDate: '', roomTypeId: '' });
      setSuccessMsg('Yangi qoida saqlandi!');
      setTimeout(() => setSuccessMsg(null), 3000);
      fetchRates();
    } catch (err) {
      setError(err.response?.data?.error || 'Saqlashda xatolik');
    } finally {
      setSaving(false);
    }
  };

  const handleAddPromo = (e) => {
    e.preventDefault();
    if (!promoForm.code || !promoForm.discount || !promoForm.expiry) return;
    setPromos([...promos, { id: Date.now(), ...promoForm, active: true }]);
    setPromoForm({ code: '', discount: 0, expiry: '' });
    setSuccessMsg('Promo kod qo\'shildi!');
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleDeletePromo = async (id) => {
    const ok = await confirm({ title: 'Promo kodni o\'chirish?', message: 'Bu promo kod o\'chiriladi.', danger: true, confirmLabel: 'O\'chirish' });
    if (ok) {
      setPromos(promos.filter(p => p.id !== id));
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <Percent className="w-5 h-5 text-white" />
            </div>
            Rates & Pricing
          </h1>
          <p className="text-gray-500 mt-1 ml-[52px]">Manage dynamic pricing and promotional campaigns.</p>
        </div>
      </div>
      {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm">{error}</div>}
      {successMsg && <div className="bg-green-50 text-green-700 p-4 rounded-xl text-sm flex items-center gap-2"><CheckCircle2 className="w-4 h-4"/>{successMsg}</div>}
      <div className="flex gap-2 p-1 bg-white border border-gray-200 rounded-xl w-fit shadow-sm">
        <button
          onClick={() => setActiveTab('dynamic')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'dynamic' ? 'bg-brand-50 text-brand-700 shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Zap className="w-4 h-4" /> Dynamic Pricing
        </button>
        <button
          onClick={() => setActiveTab('promo')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'promo' ? 'bg-brand-50 text-brand-700 shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Tag className="w-4 h-4" /> Promo Codes
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-brand-600" /></div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          
          {/* DYNAMIC PRICING TAB */}
          {activeTab === 'dynamic' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-gray-100">
              <div className="p-6 col-span-1 bg-gray-50/50">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2"><Plus className="w-5 h-5 text-brand-600"/>Yangi Qoida</h2>
                <form onSubmit={handleAddDynamic} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Qoida Nomi</label>
                    <input required type="text" placeholder="Masalan: Baland Mavsum" value={dynamicForm.name} onChange={e => setDynamicForm({...dynamicForm, name: e.target.value})} className="w-full p-2.5 border border-gray-200 rounded-lg outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Xona Turi</label>
                    <select required value={dynamicForm.roomTypeId} onChange={e => setDynamicForm({...dynamicForm, roomTypeId: e.target.value})} className="w-full p-2.5 border border-gray-200 rounded-lg outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 bg-white">
                      <option value="" disabled>Xona turini tanlang...</option>
                      {roomTypes.map(rt => (
                        <option key={rt.id} value={rt.id}>{rt.name} — {Number(rt.base_price).toLocaleString()} so'm/kun</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">O'zgartirish (%)</label>
                    <input required type="number" placeholder="Masalan: 15 yoki -10" value={dynamicForm.adjustment || ''} onChange={e => setDynamicForm({...dynamicForm, adjustment: Number(e.target.value)})} className="w-full p-2.5 border border-gray-200 rounded-lg outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20" />
                    <p className="text-xs text-gray-500 mt-1">Chegirma uchun manfiy qiymat kiriting.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Boshlanish</label>
                      <input required type="date" value={dynamicForm.startDate} onChange={e => setDynamicForm({...dynamicForm, startDate: e.target.value})} className="w-full p-2.5 border border-gray-200 rounded-lg outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tugash</label>
                      <input required type="date" value={dynamicForm.endDate} onChange={e => setDynamicForm({...dynamicForm, endDate: e.target.value})} className="w-full p-2.5 border border-gray-200 rounded-lg outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20" />
                    </div>
                  </div>
                  <button type="submit" disabled={saving} className="w-full btn-primary py-2.5 flex items-center justify-center gap-2 disabled:opacity-60">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin"/> : <Plus className="w-4 h-4" />}
                    {saving ? 'Saqlanmoqda...' : 'Qoida Yaratish'}
                  </button>
                </form>
              </div>
              <div className="p-6 col-span-2">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Active Pricing Rules</h2>
                <div className="space-y-3">
                  {rates.map(r => (
                    <div key={r.id} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-white hover:border-gray-200 transition-colors shadow-sm">
                      <div>
                        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                          <Zap className={`w-4 h-4 ${r.adjustment_percent > 0 ? 'text-amber-500' : 'text-emerald-500'}`}/>
                          {r.name}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1 flex items-center gap-4">
                          <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5"/> {r.start_date && r.start_date.split('T')[0]} to {r.end_date && r.end_date.split('T')[0]}</span>
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`px-3 py-1 rounded-lg font-bold text-sm ${r.adjustment_percent > 0 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                          {r.adjustment_percent > 0 ? '+' : ''}{r.adjustment_percent}%
                        </span>
                        <button onClick={() => handleDeleteDynamic(r.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {rates.length === 0 && <p className="text-center text-gray-500 py-8">No dynamic pricing rules active.</p>}
                </div>
              </div>
            </div>
          )}

          {/* PROMO CODES TAB */}
          {activeTab === 'promo' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-gray-100">
              <div className="p-6 col-span-1 bg-gray-50/50">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Create Promo</h2>
                <form onSubmit={handleAddPromo} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
                    <input required type="text" placeholder="e.g. VIP20" value={promoForm.code} onChange={e => setPromoForm({...promoForm, code: e.target.value.toUpperCase()})} className="w-full p-2.5 border border-gray-200 rounded-lg outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 font-mono uppercase" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Discount (%)</label>
                    <input required type="number" min="1" max="100" placeholder="e.g. 20" value={promoForm.discount || ''} onChange={e => setPromoForm({...promoForm, discount: Number(e.target.value)})} className="w-full p-2.5 border border-gray-200 rounded-lg outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                    <input required type="date" value={promoForm.expiry} onChange={e => setPromoForm({...promoForm, expiry: e.target.value})} className="w-full p-2.5 border border-gray-200 rounded-lg outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20" />
                  </div>
                  <button type="submit" className="w-full btn-primary py-2.5 flex items-center justify-center gap-2">
                    <Plus className="w-4 h-4" /> Create Promo
                  </button>
                </form>
              </div>
              <div className="p-6 col-span-2">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Active Promo Codes</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {promos.map(p => (
                    <div key={p.id} className="relative p-5 rounded-2xl border-2 border-dashed border-gray-200 bg-white hover:border-brand-300 transition-colors shadow-sm">
                      <div className="flex justify-between items-start mb-3">
                        <span className="inline-block px-3 py-1 bg-brand-50 text-brand-700 font-mono font-bold tracking-widest rounded-md border border-brand-100">
                          {p.code}
                        </span>
                        <span className="text-2xl font-black text-gray-900">-{p.discount}%</span>
                      </div>
                      <div className="flex justify-between items-center text-sm text-gray-500 mt-4">
                        <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4"/> Expires: {p.expiry}</span>
                        <button onClick={() => handleDeletePromo(p.id)} className="text-red-500 hover:text-red-700 p-1">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {promos.length === 0 && <p className="col-span-full text-center text-gray-500 py-8">No promo codes available.</p>}
                </div>
              </div>
            </div>
          )}

        </div>
      )}
      
      <ConfirmDialog {...dialogProps} />
    </div>
  );
}
