import React, { useState, useEffect } from 'react';
import { Loader2, RefreshCw, AlertCircle, Search, Home, Wrench, X, CheckCircle2, ChevronDown, CheckSquare, Squircle, Camera, Image as ImageIcon } from 'lucide-react';
import api, { API_ORIGIN } from '../../lib/api';
import CameraCapture from '../../components/CameraCapture';

export default function RoomStatus() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState(null);

  // Nosozlik bildirish modal
  const [reportModal, setReportModal] = useState(null); // room object
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState(null);
  const [reporting, setReporting] = useState(false);
  const [showCamera, setShowCamera] = useState(false);

  // Status popover
  const [activeMenu, setActiveMenu] = useState(null);

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
      setRooms(rooms.map(r => r.id === id ? { ...r, housekeeping_status: newStatus } : r));
      await api.put(`/housekeeping/rooms/${id}/status`, { housekeeping_status: newStatus });
      setActiveMenu(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update status');
      fetchRooms();
    }
  };

  const showMsg = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 4000);
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim()) return;
    setReporting(true);
    try {
      const formData = new FormData();
      formData.append('room_id', reportModal.id);
      formData.append('description', description.trim());
      if (photo) {
        formData.append('photo', photo);
      }

      await api.post('/housekeeping/maintenance-report', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      showMsg(`✅ Xona ${reportModal.room_number} — nosozlik menejer va ustaga yuborildi!`);
      setReportModal(null);
      setDescription('');
      setPhoto(null);
    } catch (err) {
      showMsg(err.response?.data?.error || 'Yuborishda xatolik', 'error');
    } finally {
      setReporting(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'clean':
      case 'vacantclean':
      case 'occupiedclean': return 'bg-green-100 text-green-800 border-green-200';
      case 'vacantdirty': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'occupieddirty': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'outofservice': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const statuses = ['VacantClean', 'VacantDirty', 'OccupiedClean', 'OccupiedDirty', 'OutOfService'];
  const statusLabels = {
    VacantClean: 'Bo\'sh & Toza',
    VacantDirty: 'Bo\'sh & Iflos',
    OccupiedClean: 'Band & Toza',
    OccupiedDirty: 'Band & Iflos',
    OutOfService: 'Xizmatdan tashqari'
  };

  const filteredRooms = rooms.filter(r =>
    r.room_number?.toString().includes(search) ||
    r.room_type?.name?.toLowerCase().includes(search.toLowerCase())
  );

  // Group by floor
  const groupedRooms = filteredRooms.reduce((acc, room) => {
    const floor = room.floor || 'Noma\'lum qavat';
    if (!acc[floor]) acc[floor] = [];
    acc[floor].push(room);
    return acc;
  }, {});
  
  const sortedFloors = Object.keys(groupedRooms).sort((a, b) => parseInt(a) - parseInt(b));

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Xonalar Holati</h1>
          <p className="text-gray-500 text-sm mt-1">Xonalarning tozalik holatini o'zgartirish va nazorat qilish.</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Xona raqami..."
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
          <AlertCircle className="h-5 w-5" /> <p>{error}</p>
        </div>
      )}
      {message && (
        <div className={`p-4 rounded-xl flex items-center gap-3 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
          <CheckCircle2 className="h-5 w-5 shrink-0" /> {message.text}
        </div>
      )}

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
        </div>
      ) : (
        <div className="space-y-8">
          {sortedFloors.length > 0 ? sortedFloors.map(floor => (
            <div key={floor} className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800 border-b pb-2 flex items-center gap-2">
                <span className="bg-brand-100 text-brand-800 text-sm py-1 px-3 rounded-full font-bold">{floor}</span>
                Qavat
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {groupedRooms[floor].map(room => (
                  <div key={room.id} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-xl bg-gray-50 flex items-center justify-center border border-gray-100 shrink-0">
                           <Home className="h-6 w-6 text-gray-400" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-gray-900 leading-none">{room.room_number}</h3>
                          <p className="text-xs font-medium text-gray-500 mt-1">{room.room_type?.name || 'Standard'}</p>
                        </div>
                      </div>
                      
                      {/* Status Popover Container */}
                      <div className="relative">
                        <button 
                          onClick={() => setActiveMenu(activeMenu === room.id ? null : room.id)}
                          className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors ${getStatusColor(room.housekeeping_status)}`}
                        >
                          {statusLabels[room.housekeeping_status] || room.housekeeping_status || 'Holat'}
                          <ChevronDown className="h-3 w-3" />
                        </button>

                        {/* Dropdown menu */}
                        {activeMenu === room.id && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setActiveMenu(null)} />
                            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-lg z-20 py-2 overflow-hidden">
                              <p className="px-3 py-1.5 text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-50">Holatni o'zgartirish</p>
                              {statuses.map(s => (
                                <button
                                  key={s}
                                  onClick={() => handleStatusChange(room.id, s)}
                                  className="w-full text-left px-4 py-2.5 text-sm font-medium hover:bg-gray-50 flex items-center gap-2"
                                >
                                  {room.housekeeping_status === s ? <CheckSquare className="h-4 w-4 text-brand-600" /> : <Squircle className="h-4 w-4 text-gray-300" />}
                                  {statusLabels[s] || s}
                                </button>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="mt-auto pt-4 border-t border-gray-100">
                      <button
                        onClick={() => { setReportModal(room); setDescription(''); setPhoto(null); }}
                        className="w-full flex items-center justify-center gap-2 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-xl text-sm font-medium transition-colors border border-amber-100"
                      >
                        <Wrench className="w-4 h-4" /> Nosozlik bildirish
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )) : (
            <div className="py-16 text-center text-gray-500 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              Hech qanday xona topilmadi.
            </div>
          )}
        </div>
      )}

      {/* Nosozlik Bildirish Modal */}
      {reportModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden transform transition-all">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-amber-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center shadow-inner">
                  <Wrench className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900">Nosozlik Bildirish</h2>
                  <p className="text-xs font-medium text-amber-800">Xona {reportModal.room_number} ({reportModal.floor}-qavat)</p>
                </div>
              </div>
              <button
                onClick={() => setReportModal(null)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white/50 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReportSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nosozlik tavsifi <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  autoFocus
                  rows="3"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Masalan: konditsioner ishlamayapti, kran oqmoqda, elektr ulanishi buzuq..."
                  className="w-full p-3.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none resize-none shadow-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nosozlik surati (ixtiyoriy)
                </label>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowCamera(true)}
                    className="flex-1 flex flex-col items-center justify-center p-4 bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 rounded-xl cursor-pointer transition-colors"
                  >
                    <Camera className="w-6 h-6 mb-1" />
                    <span className="text-xs font-semibold">📸 KAMERANI OCHISH</span>
                  </button>

                  <label className="flex-1 flex flex-col items-center justify-center p-4 bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200 rounded-xl cursor-pointer transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => setPhoto(e.target.files[0])}
                    />
                    <ImageIcon className="w-6 h-6 mb-1" />
                    <span className="text-xs font-semibold">Galereyadan tanlash</span>
                  </label>
                </div>

                {photo && (
                  <div className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-xl mt-3">
                    <div className="flex items-center gap-2 text-amber-600">
                      <ImageIcon className="w-5 h-5 shrink-0" />
                      <span className="text-sm font-medium truncate max-w-[200px]">{photo.name || 'Rasm biriktirildi'}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPhoto(null)}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>

              <div className="bg-blue-50 border border-blue-100 p-3.5 rounded-xl text-xs text-blue-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-blue-500" />
                <span>Bu bildirishnoma avtomatik ravishda <strong>Menejer</strong> va <strong>Usta</strong> paneliga real-time yuboriladi.</span>
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setReportModal(null)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-xl text-sm font-medium transition-colors"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={reporting}
                  className="flex items-center gap-2 px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-semibold transition-all shadow-sm"
                >
                  {reporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wrench className="w-4 h-4" />}
                  Yuborish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Kamera interfeysi */}
      {showCamera && (
        <CameraCapture 
          onCapture={(file) => {
            setPhoto(file);
            setShowCamera(false);
          }}
          onCancel={() => setShowCamera(false)}
        />
      )}
    </div>
  );
}
