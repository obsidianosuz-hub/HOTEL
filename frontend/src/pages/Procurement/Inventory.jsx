import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import { Loader2, Plus, AlertCircle, Search, AlertTriangle, RefreshCw } from 'lucide-react';

export default function Inventory() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  
  // Form State
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    current_quantity: 0,
    min_level: 0,
    max_level: 100
  });

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const res = await api.get('/procurement/inventory');
      setInventory(res.data || []);
      setError(null);
    } catch (err) {
      setError('Failed to load inventory data.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await api.post('/procurement/inventory', formData);
      setShowForm(false);
      setFormData({ name: '', category: '', current_quantity: 0, min_level: 0, max_level: 100 });
      fetchInventory();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add item');
    }
  };

  const handleReorder = async (id) => {
    setError(null);
    try {
      await api.post(`/procurement/inventory/${id}/reorder`);
      fetchInventory();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to trigger reorder');
    }
  };

  const filteredInventory = inventory.filter(item => 
    item.name?.toLowerCase().includes(search.toLowerCase()) || 
    item.category?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div className="flex h-64 items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
    </div>
  );

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Inventory</h1>
          <p className="text-sm text-gray-500 mt-1">Manage stock levels and track hotel supplies.</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search items..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none text-sm"
            />
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-brand-700 transition-colors shadow-sm flex-shrink-0"
          >
            <Plus className="w-4 h-4" /> Add Item
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
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Add New Item</h3>
          <form onSubmit={handleAddSubmit} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Item Name</label>
              <input required type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-brand-500 outline-none" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
              <input required type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-brand-500 outline-none" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Current Quantity</label>
              <input required type="number" min="0" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-brand-500 outline-none" value={formData.current_quantity} onChange={e => setFormData({...formData, current_quantity: parseInt(e.target.value)})} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Min Level</label>
              <input required type="number" min="0" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-brand-500 outline-none" value={formData.min_level} onChange={e => setFormData({...formData, min_level: parseInt(e.target.value)})} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Max Level</label>
              <input required type="number" min="0" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-brand-500 outline-none" value={formData.max_level} onChange={e => setFormData({...formData, max_level: parseInt(e.target.value)})} />
            </div>
            <div className="flex items-end">
              <button type="submit" className="w-full bg-gray-900 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-800 transition-colors">Save Item</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Item Name</th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Quantity</th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Min Level</th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredInventory.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-gray-500">No items match your criteria.</td>
                </tr>
              ) : (
                filteredInventory.map((item) => {
                  const isLow = item.isLowStock ?? (item.current_quantity <= item.min_level);
                  return (
                    <tr key={item.id} className={`hover:bg-gray-50 transition-colors ${isLow ? 'bg-red-50/30' : ''}`}>
                      <td className="py-3 px-6 font-medium text-gray-900">{item.name}</td>
                      <td className="py-3 px-6 text-gray-600 text-sm">{item.category}</td>
                      <td className={`py-3 px-6 text-right font-medium ${isLow ? 'text-red-600' : 'text-gray-900'}`}>
                        {item.current_quantity}
                      </td>
                      <td className="py-3 px-6 text-right text-gray-600 text-sm">{item.min_level}</td>
                      <td className="py-3 px-6">
                        {isLow ? (
                          <span className="flex items-center gap-1 text-xs font-medium text-red-600 bg-red-100 px-2 py-1 rounded-full w-fit">
                            <AlertTriangle className="w-3 h-3" /> Low Stock
                          </span>
                        ) : (
                          <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded-full">
                            In Stock
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-6 text-right">
                        {isLow && (
                          <button 
                            onClick={() => handleReorder(item.id)}
                            className="text-sm font-medium text-brand-600 hover:text-brand-800 flex items-center justify-end gap-1 ml-auto"
                          >
                            <RefreshCw className="w-4 h-4" /> Reorder
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
