import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import { Loader2, Plus, AlertCircle, FileText, CheckCircle, Trash2 } from 'lucide-react';

export default function PurchaseOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [vendors, setVendors] = useState([]);

  // Form State
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    vendor_id: '',
    items: [{ name: '', quantity: 1, unit_price: 0 }]
  });

  useEffect(() => {
    fetchOrders();
    fetchVendors();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await api.get('/procurement/purchase-orders');
      setOrders(res.data || []);
      setError(null);
    } catch (err) {
      setError('Failed to load purchase orders.');
    } finally {
      setLoading(false);
    }
  };

  const fetchVendors = async () => {
    try {
      const res = await api.get('/procurement/vendors');
      setVendors(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddItemRow = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { name: '', quantity: 1, unit_price: 0 }]
    });
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    setFormData({ ...formData, items: newItems });
  };

  const handleRemoveItem = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await api.post('/procurement/purchase-orders', formData);
      setShowForm(false);
      setFormData({ vendor_id: '', items: [{ name: '', quantity: 1, unit_price: 0 }] });
      fetchOrders();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create purchase order');
    }
  };

  const handleReceive = async (id) => {
    setError(null);
    try {
      await api.post(`/procurement/purchase-orders/${id}/receive`);
      fetchOrders();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to mark as received');
    }
  };

  if (loading) return (
    <div className="flex h-64 items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
    </div>
  );

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Purchase Orders</h1>
          <p className="text-sm text-gray-500 mt-1">Create and track procurement orders.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-brand-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> Create PO
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {showForm && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">New Purchase Order</h3>
          <form onSubmit={handleAddSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Select Vendor</label>
              <select 
                required
                className="w-full sm:w-1/2 px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-500"
                value={formData.vendor_id}
                onChange={e => setFormData({...formData, vendor_id: e.target.value})}
              >
                <option value="">-- Choose a vendor --</option>
                {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </div>
            
            <div className="space-y-3">
              <label className="block text-xs font-medium text-gray-700">Order Items</label>
              {formData.items.map((item, index) => (
                <div key={index} className="flex flex-wrap sm:flex-nowrap gap-3 items-center">
                  <input required placeholder="Item Name" type="text" className="flex-1 min-w-[150px] px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-500 text-sm" value={item.name} onChange={e => handleItemChange(index, 'name', e.target.value)} />
                  <input required placeholder="Qty" type="number" min="1" className="w-24 px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-500 text-sm" value={item.quantity} onChange={e => handleItemChange(index, 'quantity', parseInt(e.target.value))} />
                  <input required placeholder="Price" type="number" min="0" step="0.01" className="w-32 px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-500 text-sm" value={item.unit_price} onChange={e => handleItemChange(index, 'unit_price', parseFloat(e.target.value))} />
                  {formData.items.length > 1 && (
                    <button type="button" onClick={() => handleRemoveItem(index)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              <button type="button" onClick={handleAddItemRow} className="text-sm font-medium text-brand-600 hover:text-brand-800 flex items-center gap-1 mt-2">
                <Plus className="w-4 h-4" /> Add Another Item
              </button>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors">Cancel</button>
              <button type="submit" className="bg-gray-900 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors">Submit Order</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">PO Number</th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Vendor</th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Total Amount</th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-gray-500">No purchase orders found.</td>
                </tr>
              ) : (
                orders.map((po) => (
                  <tr key={po.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-6 font-medium text-gray-900 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-brand-500" />
                      {po.po_number || `PO-${po.id.toString().padStart(4, '0')}`}
                    </td>
                    <td className="py-3 px-6 text-gray-600 text-sm font-medium">{po.vendor?.name || 'Unknown Vendor'}</td>
                    <td className="py-3 px-6 text-right font-medium text-gray-900">${po.total_amount?.toFixed(2)}</td>
                    <td className="py-3 px-6">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        po.status === 'Received' ? 'bg-green-100 text-green-700' :
                        po.status === 'Submitted' ? 'bg-blue-100 text-blue-700' :
                        po.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {po.status || 'Draft'}
                      </span>
                    </td>
                    <td className="py-3 px-6 text-right">
                      {po.status !== 'Received' && po.status !== 'Cancelled' && (
                        <button 
                          onClick={() => handleReceive(po.id)}
                          className="text-sm font-medium text-brand-600 hover:text-brand-800 flex items-center justify-end gap-1 ml-auto"
                        >
                          <CheckCircle className="w-4 h-4" /> Mark Received
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
