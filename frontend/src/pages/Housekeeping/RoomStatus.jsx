import React, { useState, useEffect } from 'react';
import { Loader2, RefreshCw, AlertCircle, Search, Home } from 'lucide-react';
import api, { API_ORIGIN } from '../../lib/api';

export default function RoomStatus() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const res = await api.get('/housekeeping/rooms');
      setRooms(res.data || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch room statuses');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      // Optimistic update
      setRooms(rooms.map(r => r.id === id ? { ...r, housekeeping_status: newStatus } : r));
      await api.put(`/housekeeping/rooms/${id}/status`, { housekeeping_status: newStatus });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update status');
      fetchRooms(); // Revert on failure
    }
  };

  const getStatusColor = (status) => {
    switch(status?.toLowerCase()) {
      case 'clean': return 'bg-green-100 text-green-800 border-green-200';
      case 'vacantdirty': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'occupieddirty': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'outofservice': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const statuses = ['Clean', 'VacantDirty', 'OccupiedDirty', 'OutOfService'];

  const filteredRooms = rooms.filter(r => r.room_number?.toString().includes(search) || r.room_type?.name?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Room Status Grid</h1>
          <p className="text-gray-500 text-sm mt-1">Live view of room conditions.</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search room..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 w-full border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
            />
          </div>
          <button onClick={fetchRooms} className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 transition-colors">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-3">
          <AlertCircle className="h-5 w-5" />
          <p>{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filteredRooms.map(room => (
            <div key={room.id} className={`rounded-xl border ${getStatusColor(room.housekeeping_status)} flex flex-col items-center justify-center p-4 aspect-square shadow-sm relative group transition-all hover:shadow-md overflow-hidden`}>
              {(room.photo_url || room.room_type?.photo_url) ? (
                <img src={`${API_ORIGIN}${room.photo_url || room.room_type.photo_url}`} alt={room.room_number} className="h-10 w-10 rounded-lg object-cover mb-2" />
              ) : (
                <Home className="h-8 w-8 mb-2 opacity-80" />
              )}
              <h3 className="text-2xl font-bold">{room.room_number}</h3>
              <p className="text-xs font-medium opacity-80 mt-1 truncate w-full text-center">{room.room_type?.name || 'Standard'}</p>
              
              <div className="absolute inset-0 bg-white/95 backdrop-blur-sm rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-2 z-10">
                <p className="text-xs font-semibold text-gray-500 mb-2">Set Status</p>
                <div className="flex flex-col gap-1.5 w-full">
                  {statuses.map(s => (
                    <button
                      key={s}
                      onClick={() => handleStatusChange(room.id, s)}
                      className={`text-xs py-1.5 px-2 rounded-md font-medium transition-colors ${room.housekeeping_status === s ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                    >
                      {s.replace(/([A-Z])/g, ' $1').trim()}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}

          {filteredRooms.length === 0 && (
            <div className="col-span-full py-16 text-center text-gray-500">
              No rooms match your search.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
