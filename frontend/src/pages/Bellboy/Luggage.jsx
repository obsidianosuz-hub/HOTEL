import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import { Loader2, Briefcase, Plus, AlertCircle, Package } from 'lucide-react';

export default function Luggage() {
  const [luggage, setLuggage] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Form State
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    guest_id: '',
    description: ''
  });
  const [deliveringId, setDeliveringId] = useState(null);

  useEffect(() => {
    fetchLuggage();
  }, []);

  const fetchLuggage = async () => {
    try {
      setLoading(true);
      const res = await api.get('/bellboy/luggage');
      setLuggage(res.data || []);
      setError(null);
    } catch (err) {
      setError('Failed to load luggage data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await api.post('/bellboy/luggage/store', {
        guest_id: parseInt(formData.guest_id),
        description: formData.description
      });
      setShowForm(false);
      setFormData({ guest_id: '', description: '' });
      fetchLuggage();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add luggage');
    }
  };

  const handleDeliver = async (id) => {
    setDeliveringId(id);
    setError(null);
    try {
      await api.post(`/bellboy/luggage/${id}/deliver`);
      fetchLuggage();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to mark as delivered');
    } finally {
      setDeliveringId(null);
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
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Luggage Tracking</h1>
          <p className="text-sm text-gray-500 mt-1">Manage guest luggage storage and deliveries.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-brand-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add Luggage
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
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Add New Luggage</h3>
          <form onSubmit={handleAddSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Guest ID</label>
              <input
                type="number"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                value={formData.guest_id}
                onChange={(e) => setFormData({...formData, guest_id: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
              <input
                type="text"
                required
                placeholder="e.g. 2 suitcases, 1 backpack"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
            </div>
            <div className="flex items-end">
              <button type="submit" className="w-full bg-gray-900 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-800 transition-colors">
                Save
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tag #</th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Guest</th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {luggage.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-gray-500">No luggage records found.</td>
                </tr>
              ) : (
                luggage.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-6 font-medium text-gray-900 flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-brand-500" />
                      {item.tag_id}
                    </td>
                    <td className="py-3 px-6 text-gray-600">{item.guest?.full_name || item.guest_id}</td>
                    <td className="py-3 px-6 text-gray-600">{item.description}</td>
                    <td className="py-3 px-6">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        item.status === 'Stored' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3 px-6 text-right">
                      {item.status === 'Stored' && (
                        <button
                          onClick={() => handleDeliver(item.id)}
                          disabled={deliveringId === item.id}
                          className="text-sm font-medium text-brand-600 hover:text-brand-800 flex items-center justify-end gap-1 ml-auto disabled:opacity-50"
                        >
                          {deliveringId === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Package className="w-4 h-4" />} Deliver
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
