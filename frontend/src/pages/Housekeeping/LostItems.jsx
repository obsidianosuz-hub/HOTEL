import React, { useState, useEffect } from 'react';
import { Loader2, Plus, AlertCircle, Package, Search, Calendar, MapPin, CheckCircle2 } from 'lucide-react';
import api from '../../lib/api';

export default function LostItems() {
  const [items, setItems] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ description: '', room_id: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchItems();
    api.get('/housekeeping/rooms').then(res => setRooms(res.data || [])).catch(() => setRooms([]));
  }, []);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const res = await api.get('/housekeeping/lost-items');
      setItems(res.data || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch lost items');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await api.post('/housekeeping/lost-items', {
        description: formData.description,
        room_id: parseInt(formData.room_id)
      });
      setIsModalOpen(false);
      setFormData({ description: '', room_id: '' });
      setMessage('Item reported successfully.');
      fetchItems();
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to report item');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lost & Found</h1>
          <p className="text-gray-500 text-sm mt-1">Track items left behind by guests.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" />
          Report Found Item
        </button>
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

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-sm font-medium text-gray-500">
                  <th className="p-4">Item Description</th>
                  <th className="p-4">Room</th>
                  <th className="p-4">Date Found</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                {items.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 font-medium text-gray-900 flex items-center gap-3">
                      <div className="p-2 bg-gray-100 rounded-lg text-gray-500">
                        <Package className="h-5 w-5" />
                      </div>
                      {item.description}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 text-gray-600">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        Room {item.room?.room_number || 'N/A'}
                      </div>
                    </td>
                    <td className="p-4 text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        {formatDate(item.created_at)}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${item.status?.toLowerCase() === 'claimed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {item.status || 'Pending'}
                      </span>
                    </td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td colSpan="4" className="p-12 text-center text-gray-500">
                      <Package className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                      <p>No lost items reported.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900">Report Found Item</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea required rows="3" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none resize-none" placeholder="e.g. Black leather wallet with IDs..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Room</label>
                <select required value={formData.room_id} onChange={e => setFormData({...formData, room_id: e.target.value})} className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none bg-white">
                  <option value="" disabled>Select a room</option>
                  {rooms.map(r => <option key={r.id} value={r.id}>Room {r.room_number}</option>)}
                </select>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors font-medium">Cancel</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors font-medium flex items-center gap-2">
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Submit Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
