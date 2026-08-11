import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import { Loader2, Plus, AlertCircle, Building2, Phone, Mail, Edit } from 'lucide-react';

export default function Vendors() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Form State
  const [showForm, setShowForm] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    contact_info: '',
    email: '',
    phone: '',
    address: '',
    tax_id: '',
    website: ''
  });

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const res = await api.get('/procurement/vendors');
      setVendors(res.data || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load vendors data.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEdit = (vendor) => {
    setEditingVendor(vendor);
    setFormData({ 
      name: vendor.name, 
      category: vendor.category, 
      contact_info: vendor.contact_info || '',
      email: vendor.email || '',
      phone: vendor.phone || '',
      address: vendor.address || '',
      tax_id: vendor.tax_id || '',
      website: vendor.website || ''
    });
    setShowForm(true);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingVendor(null);
    setFormData({ name: '', category: '', contact_info: '', email: '', phone: '', address: '', tax_id: '', website: '' });
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      if (editingVendor) {
        await api.put(`/procurement/vendors/${editingVendor.id}`, formData);
      } else {
        await api.post('/procurement/vendors', formData);
      }
      handleCancelForm();
      fetchVendors();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save vendor');
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
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Vendors</h1>
          <p className="text-sm text-gray-500 mt-1">Manage supplier relationships and contact info.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-brand-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add Vendor
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
          <h3 className="text-lg font-semibold mb-4 text-gray-800">{editingVendor ? 'Edit Vendor' : 'New Vendor'}</h3>
          <form onSubmit={handleAddSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Company Name</label>
              <input required type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-500" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
              <input required type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-500" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Main Contact / Director</label>
              <input required type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-500" value={formData.contact_info} onChange={e => setFormData({...formData, contact_info: e.target.value})} placeholder="Name & Position" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
              <input type="email" className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-500" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
              <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-500" value={formData.phone || ''} onChange={e => setFormData({...formData, phone: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Tax ID (INN)</label>
              <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-500" value={formData.tax_id || ''} onChange={e => setFormData({...formData, tax_id: e.target.value})} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Address</label>
              <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-500" value={formData.address || ''} onChange={e => setFormData({...formData, address: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Website</label>
              <input type="url" className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-500" value={formData.website || ''} onChange={e => setFormData({...formData, website: e.target.value})} placeholder="https://" />
            </div>
            <div className="col-span-full flex justify-end gap-2 mt-2">
              <button type="button" onClick={handleCancelForm} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors">Cancel</button>
              <button type="submit" className="bg-gray-900 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors">{editingVendor ? 'Save Changes' : 'Save Vendor'}</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {vendors.length === 0 ? (
          <div className="col-span-full py-12 text-center text-gray-500 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
            No vendors configured yet.
          </div>
        ) : (
          vendors.map((vendor) => (
            <div key={vendor.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all group">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{vendor.name}</h3>
                    <p className="text-xs text-brand-600 font-medium">{vendor.category}</p>
                  </div>
                </div>
                <button onClick={() => handleOpenEdit(vendor)} className="text-gray-400 hover:text-brand-600 opacity-0 group-hover:opacity-100 transition-opacity p-1">
                  <Edit className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 bg-gray-50 p-4 rounded-xl">
                <div className="flex flex-col gap-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-gray-400" />
                    <span>{vendor.contact_info || 'N/A'}</span>
                  </div>
                  {vendor.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span>{vendor.phone}</span>
                    </div>
                  )}
                  {vendor.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <a href={`mailto:${vendor.email}`} className="text-brand-600 hover:underline">{vendor.email}</a>
                    </div>
                  )}
                </div>
                
                {/* Additional details on hover or expanded */}
                {(vendor.address || vendor.tax_id || vendor.website) && (
                  <div className="pt-2 border-t border-gray-200 text-xs text-gray-500 space-y-1">
                    {vendor.address && <p><span className="font-medium">Manzil:</span> {vendor.address}</p>}
                    {vendor.tax_id && <p><span className="font-medium">INN:</span> {vendor.tax_id}</p>}
                    {vendor.website && <p><span className="font-medium">Web:</span> <a href={vendor.website} target="_blank" rel="noreferrer" className="text-brand-600 hover:underline">{vendor.website}</a></p>}
                  </div>
                )}

                {vendor.rating && (
                  <div className="flex items-center gap-1 mt-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg key={star} className={`w-4 h-4 ${star <= vendor.rating ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
