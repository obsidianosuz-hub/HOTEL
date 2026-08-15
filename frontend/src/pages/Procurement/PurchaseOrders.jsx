import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import { Loader2, Plus, AlertCircle, FileText, CheckCircle, Trash2, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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
    if (!formData.vendor_id) return setError('Iltimos, yetkazib beruvchini tanlang');
    for (const item of formData.items) {
       if (!item.name.trim() || !item.quantity || item.unit_price === '') {
           return setError("Barcha mahsulot ma'lumotlarini to'ldiring");
       }
    }
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

  const handleDownloadAllPDF = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text('Hotel ERP - All Purchase Orders', 14, 22);
    
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 32);
    
    // Items table
    const tableColumn = ["PO Number", "Vendor", "Products", "Status", "Date", "Total Amount"];
    const tableRows = [];
    
    let grandTotal = 0;

    orders.forEach(po => {
      const rowData = [
        po.po_number || `PO-${po.id.toString().padStart(4, '0')}`,
        po.vendor?.name || 'Unknown',
        po.items?.map(i => i.product_name).join(', ') || '-',
        po.status,
        new Date(po.created_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        `$${po.total_amount?.toFixed(2) || '0.00'}`
      ];
      tableRows.push(rowData);
      grandTotal += po.total_amount || 0;
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 40,
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42] } // slate-900
    });

    const finalY = (doc.lastAutoTable && doc.lastAutoTable.finalY) ? doc.lastAutoTable.finalY : 40;
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text(`Grand Total: $${grandTotal.toFixed(2)}`, 14, finalY + 10);

    doc.save(`All_Purchase_Orders_${new Date().getTime()}.pdf`);
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
        <div className="flex gap-2">
          <button
            onClick={handleDownloadAllPDF}
            className="flex items-center gap-2 bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" /> Download All PDF
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-brand-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> Create PO
          </button>
        </div>
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
                <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Mahsulotlar</th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date & Time</th>
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
                    <td className="py-3 px-6 text-gray-600 text-sm">
                      <div className="max-w-[200px] truncate" title={po.items?.map(i => i.product_name).join(', ')}>
                        {po.items?.map(i => i.product_name).join(', ') || '-'}
                      </div>
                    </td>
                    <td className="py-3 px-6 text-gray-500 text-sm">
                      {new Date(po.created_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
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
                      <div className="flex items-center justify-end gap-3">
                        {po.status !== 'Received' && po.status !== 'Cancelled' && (
                          <button 
                            onClick={() => handleReceive(po.id)}
                            className="text-sm font-medium text-brand-600 hover:text-brand-800 flex items-center gap-1"
                          >
                            <CheckCircle className="w-4 h-4" /> Receive
                          </button>
                        )}
                      </div>
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
