import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { Loader2, Package, CheckCircle, Clock, ShoppingCart, X } from 'lucide-react';

export default function SupplyRequests() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Selection state
  const [selectedIds, setSelectedIds] = useState([]);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState('');
  const [itemsToOrder, setItemsToOrder] = useState([]);
  const [submittingPO, setSubmittingPO] = useState(false);

  useEffect(() => {
    fetchRequests();
    fetchVendors();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await api.get('/procurement/supply-requests');
      setRequests(res.data || []);
      setError(null);
    } catch (err) {
      setError('Failed to load supply requests.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchVendors = async () => {
    try {
      const res = await api.get('/procurement/vendors');
      setVendors((res.data || []).filter(v => v.status === 'Active'));
    } catch (err) {
      console.error('Failed to load vendors', err);
    }
  };

  const handleFulfill = async (id) => {
    try {
      await api.put(`/procurement/supply-requests/${id}/fulfill`);
      fetchRequests(); // Refresh the list
    } catch (err) {
      console.error('Failed to fulfill request:', err);
      alert('Failed to fulfill request.');
    }
  };

  const toggleSelection = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const pendingIds = requests.filter(r => r.status !== 'Fulfilled').map(r => r.id);
      setSelectedIds(pendingIds);
    } else {
      setSelectedIds([]);
    }
  };

  const openCreatePOModal = () => {
    if (selectedIds.length === 0) return;
    
    const selectedRequests = requests.filter(r => selectedIds.includes(r.id));
    
    // Convert requests to PO items format
    const initialItems = selectedRequests.map(req => ({
      product_name: req.supply_item?.name || req.custom_item || 'Unknown Item',
      quantity: req.quantity,
      unit: 'pcs',
      unit_price: 0
    }));

    setItemsToOrder(initialItems);
    setSelectedVendor('');
    setShowModal(true);
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...itemsToOrder];
    newItems[index][field] = value;
    setItemsToOrder(newItems);
  };

  const handleSubmitPO = async (e) => {
    e.preventDefault();
    if (!selectedVendor) return alert('Iltimos, yetkazib beruvchini tanlang (Please select a vendor).');

    for (const item of itemsToOrder) {
      if (!item.product_name.trim() || !item.quantity || !item.unit.trim() || item.unit_price === '') {
        return alert("Iltimos, barcha mahsulot ma'lumotlarini to'liq kiriting.");
      }
    }

    try {
      setSubmittingPO(true);
      await api.post('/procurement/purchase-orders/from-requests', {
        vendor_id: selectedVendor,
        items: itemsToOrder,
        request_ids: selectedIds
      });

      setShowModal(false);
      setSelectedIds([]);
      fetchRequests(); // Refresh list to show them as fulfilled
      navigate('/procurement/orders');
    } catch (err) {
      console.error('Failed to create PO from requests', err);
      alert('Failed to create Purchase Order.');
    } finally {
      setSubmittingPO(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-brand-600">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  const pendingRequestsCount = requests.filter(r => r.status !== 'Fulfilled').length;
  const isAllSelected = pendingRequestsCount > 0 && selectedIds.length === pendingRequestsCount;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Talabnomalar (Supply Requests)</h1>
          <p className="text-sm text-gray-500 mt-1">Boshqa bo'limlardan kelgan ta'minot so'rovlari</p>
        </div>
        {selectedIds.length > 0 && (
          <button 
            onClick={openCreatePOModal}
            className="bg-brand-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-brand-700 transition flex items-center gap-2 shadow-sm"
          >
            <ShoppingCart className="w-4 h-4" />
            Buyurtma Yaratish ({selectedIds.length})
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl">
          {error}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Yangi Buyurtma Yaratish (Create PO)</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <form id="createPOForm" onSubmit={handleSubmitPO} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Yetkazib beruvchi (Vendor)</label>
                  <select
                    required
                    value={selectedVendor}
                    onChange={(e) => setSelectedVendor(e.target.value)}
                    className="w-full border-gray-300 rounded-lg shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm py-2 px-3 border outline-none"
                  >
                    <option value="">Tanlang...</option>
                    {vendors.map(v => (
                      <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Buyurtma Qilinadigan Mahsulotlar</h3>
                  <div className="space-y-3">
                    {itemsToOrder.map((item, index) => (
                      <div key={index} className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
                        <div className="flex-1">
                          <input
                            type="text"
                            required
                            value={item.product_name}
                            onChange={(e) => handleItemChange(index, 'product_name', e.target.value)}
                            className="w-full border-gray-300 rounded-lg text-sm p-2 outline-none border focus:border-brand-500"
                            placeholder="Mahsulot nomi"
                          />
                        </div>
                        <div className="w-24">
                          <input
                            type="number"
                            required
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                            className="w-full border-gray-300 rounded-lg text-sm p-2 outline-none border focus:border-brand-500"
                            placeholder="Soni"
                          />
                        </div>
                        <div className="w-24">
                          <input
                            type="text"
                            required
                            value={item.unit}
                            onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                            className="w-full border-gray-300 rounded-lg text-sm p-2 outline-none border focus:border-brand-500"
                            placeholder="Birligi"
                          />
                        </div>
                        <div className="w-32 relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 sm:text-sm">$</span>
                          </div>
                          <input
                            type="number"
                            required
                            step="0.01"
                            min="0"
                            value={item.unit_price}
                            onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)}
                            className="w-full border-gray-300 rounded-lg text-sm p-2 pl-7 outline-none border focus:border-brand-500"
                            placeholder="Narxi"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </form>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 rounded-b-2xl">
              <button 
                type="button" 
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Bekor qilish
              </button>
              <button 
                type="submit" 
                form="createPOForm"
                disabled={submittingPO}
                className="px-5 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 disabled:opacity-50 flex items-center gap-2"
              >
                {submittingPO && <Loader2 className="w-4 h-4 animate-spin" />}
                Tasdiqlash va Yaratish
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider w-10">
                  <input 
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={handleSelectAll}
                    disabled={pendingRequestsCount === 0}
                    className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                  />
                </th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">ID</th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Mahsulot (Item)</th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Miqdori</th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">So'rovchi</th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Sana</th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Holati</th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Amal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {requests.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-gray-500">Hech qanday talabnoma topilmadi.</td>
                </tr>
              ) : (
                requests.map((req) => (
                  <tr 
                    key={req.id} 
                    onClick={() => {
                      if (req.status !== 'Fulfilled') {
                        toggleSelection(req.id);
                      }
                    }}
                    className={`transition-colors ${req.status !== 'Fulfilled' ? 'cursor-pointer hover:bg-brand-50' : 'hover:bg-gray-50'}`}
                  >
                    <td className="py-3 px-6">
                      <input 
                        type="checkbox"
                        checked={selectedIds.includes(req.id)}
                        readOnly
                        disabled={req.status === 'Fulfilled'}
                        className="rounded border-gray-300 text-brand-600 focus:ring-brand-500 disabled:opacity-50 cursor-pointer pointer-events-none"
                      />
                    </td>
                    <td className="py-3 px-6 font-medium text-gray-900">
                      #{req.id.toString().padStart(4, '0')}
                    </td>
                    <td className="py-3 px-6 font-medium text-gray-900 flex items-center gap-2">
                      <Package className="w-4 h-4 text-brand-500" />
                      {req.supply_item?.name || req.custom_item || 'Noma\'lum'}
                    </td>
                    <td className="py-3 px-6 text-gray-600 text-sm font-medium">
                      {req.quantity}
                    </td>
                    <td className="py-3 px-6 text-gray-600 text-sm">
                      {req.requester?.full_name || 'Noma\'lum'}
                    </td>
                    <td className="py-3 px-6 text-gray-500 text-sm">
                      {new Date(req.created_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3 px-6">
                      <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${
                        req.status === 'Fulfilled' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {req.status === 'Fulfilled' ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        {req.status === 'Fulfilled' ? 'Bajarildi' : 'Kutmoqda'}
                      </span>
                    </td>
                    <td className="py-3 px-6 text-right">
                      {req.status !== 'Fulfilled' && (
                        <button 
                          onClick={() => handleFulfill(req.id)}
                          className="text-sm font-medium text-brand-600 hover:text-brand-800 flex items-center justify-end gap-1 ml-auto"
                        >
                          <CheckCircle className="w-4 h-4" /> Bajarildi
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
