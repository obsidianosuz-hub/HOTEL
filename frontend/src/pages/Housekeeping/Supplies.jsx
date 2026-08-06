import React, { useState } from 'react';
import { Loader2, Plus, AlertCircle, ShoppingCart, CheckCircle2, Edit3 } from 'lucide-react';
import api from '../../lib/api';

const PREDEFINED_ITEMS = [
  "Sovun (Kichik)",
  "Sovun (Suyuq)",
  "Shampun",
  "Qo'lqop (Kauchuk)",
  "Qo'lqop (Bir martalik)",
  "Katta sochiq",
  "Yuz sochiq",
  "Oyoq sochiq",
  "Tualet qog'ozi",
  "Oyna tozalagich",
  "Pol yuvish vositasi"
];

export default function HousekeepingSupplies() {
  const [requests, setRequests] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  const [formData, setFormData] = useState({
    itemType: 'predefined', // predefined or custom
    selectedItem: PREDEFINED_ITEMS[0],
    customText: '',
    quantity: 1
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setMessage(null);

    const custom_item = formData.itemType === 'predefined' ? formData.selectedItem : formData.customText;
    
    if (!custom_item.trim()) {
      setError("Iltimos, mahsulot nomini kiriting.");
      setSubmitting(false);
      return;
    }

    try {
      await api.post('/housekeeping/supplies/request', {
        custom_item: custom_item,
        quantity: parseInt(formData.quantity) || 1
      });
      setMessage("Ta'minot so'rovi muvaffaqiyatli jo'natildi.");
      setFormData({
        itemType: 'predefined',
        selectedItem: PREDEFINED_ITEMS[0],
        customText: '',
        quantity: 1
      });
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setError(err.response?.data?.error || "So'rov jo'natishda xatolik yuz berdi");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ShoppingCart className="h-6 w-6 text-brand-600" />
            Ta'minot (Supplies)
          </h1>
          <p className="text-gray-500 text-sm mt-1">Tozalash vositalari va kerakli mahsulotlarga buyurtma berish.</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-3">
          <AlertCircle className="h-5 w-5" />
          <p>{error}</p>
        </div>
      )}
      {message && (
        <div className="bg-green-50 text-green-700 p-4 rounded-xl flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5" />
          <p>{message}</p>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden max-w-2xl">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900">Yangi so'rov yaratish</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          <div className="flex gap-4 mb-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="radio" 
                name="itemType" 
                value="predefined" 
                checked={formData.itemType === 'predefined'} 
                onChange={() => setFormData({...formData, itemType: 'predefined'})}
                className="w-4 h-4 text-brand-600 focus:ring-brand-500"
              />
              <span className="text-gray-700 font-medium">Ro'yxatdan tanlash</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="radio" 
                name="itemType" 
                value="custom" 
                checked={formData.itemType === 'custom'} 
                onChange={() => setFormData({...formData, itemType: 'custom'})}
                className="w-4 h-4 text-brand-600 focus:ring-brand-500"
              />
              <span className="text-gray-700 font-medium">O'zim yozaman</span>
            </label>
          </div>

          {formData.itemType === 'predefined' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mahsulotni tanlang</label>
              <select 
                value={formData.selectedItem} 
                onChange={e => setFormData({...formData, selectedItem: e.target.value})} 
                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none bg-white"
              >
                {PREDEFINED_ITEMS.map((item, idx) => (
                  <option key={idx} value={item}>{item}</option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nima kerak? (Qo'lda yozing)</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={formData.customText} 
                  onChange={e => setFormData({...formData, customText: e.target.value})} 
                  placeholder="Masalan: Maxsus dog' ketkazgich..." 
                  className="w-full p-3 pl-10 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                  required={formData.itemType === 'custom'}
                />
                <Edit3 className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Miqdori (Soni)</label>
            <input 
              type="number" 
              min="1"
              value={formData.quantity} 
              onChange={e => setFormData({...formData, quantity: e.target.value})} 
              className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
              required
            />
          </div>

          <div className="pt-4 flex justify-end">
            <button 
              type="submit" 
              disabled={submitting} 
              className="px-6 py-2.5 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors font-medium flex items-center gap-2 shadow-sm shadow-brand-500/20"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              <ShoppingCart className="h-4 w-4" />
              So'rov yuborish
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
