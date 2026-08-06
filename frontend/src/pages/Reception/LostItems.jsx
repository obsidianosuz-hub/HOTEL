import React, { useState, useEffect } from 'react';
import { Loader2, AlertCircle, Package, Calendar, MapPin, CheckCircle2, Search, Info } from 'lucide-react';
import api from '../../lib/api';

export default function ReceptionLostItems() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const res = await api.get('/reception/lost-items');
      setItems(res.data || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch lost items');
    } finally {
      setLoading(false);
    }
  };

  const handleReturnItem = async (id) => {
    if (!window.confirm("Barcha ma'lumotlar to'g'riligiga ishonchingiz komilmi? (Buyum egasiga qaytariladi)")) return;
    try {
      await api.put(`/reception/lost-items/${id}/status`, { status: 'Returned' });
      setMessage('Buyum muvaffaqiyatli qaytarildi.');
      fetchItems();
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update item status');
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const filteredItems = items.filter(item => 
    item.description?.toLowerCase().includes(search.toLowerCase()) || 
    item.room?.room_number?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Package className="h-6 w-6 text-brand-600" />
            Lost & Found
          </h1>
          <p className="text-gray-500 text-sm mt-1">Mehmonlar unutib qoldirgan buyumlar (Housekeeping tomonidan topilgan).</p>
        </div>
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Qidirish (xona yoki tavsif)..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
          />
          <Search className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" />
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

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-sm font-medium text-gray-500">
                  <th className="p-4">Buyum Tavsifi</th>
                  <th className="p-4">Topilgan Xona</th>
                  <th className="p-4">Topgan Xodim</th>
                  <th className="p-4">Sana</th>
                  <th className="p-4">Holati</th>
                  <th className="p-4">Harakat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                {filteredItems.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 font-medium text-gray-900">
                      <div className="flex items-center gap-3">
                        {item.photo_url ? (
                          <a href={`http://localhost:5000${item.photo_url}`} target="_blank" rel="noopener noreferrer">
                            <img src={`http://localhost:5000${item.photo_url}`} alt="Lost Item" className="w-12 h-12 object-cover rounded-lg border border-gray-200" />
                          </a>
                        ) : (
                          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                            <Package className="h-6 w-6" />
                          </div>
                        )}
                        <span>{item.description}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 text-gray-600">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        Xona {item.room?.room_number || 'N/A'}
                      </div>
                    </td>
                    <td className="p-4 text-gray-600">
                      {item.finder?.full_name || 'N/A'}
                    </td>
                    <td className="p-4 text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        {formatDate(item.created_at)}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        item.status === 'Returned' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {item.status || 'Stored'}
                      </span>
                    </td>
                    <td className="p-4">
                      {item.status !== 'Returned' && (
                        <button
                          onClick={() => handleReturnItem(item.id)}
                          className="px-3 py-1.5 text-sm bg-brand-50 text-brand-600 hover:bg-brand-100 rounded-lg transition-colors font-medium"
                        >
                          Qaytarish
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredItems.length === 0 && (
                  <tr>
                    <td colSpan="6" className="p-12 text-center text-gray-500">
                      <Info className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                      <p>Hech qanday buyum topilmadi.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
