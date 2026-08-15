import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Home, Search, Filter, Loader2, CheckCircle2, Image as ImageIcon, Camera } from 'lucide-react';
import api from '../../lib/api';

export default function AdminRooms() {
  const [rooms, setRooms] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  
  const [form, setForm] = useState({
    room_number: '',
    floor: '',
    room_type_id: '',
    reception_status: 'Available',
    housekeeping_status: 'VacantClean',
    notes: ''
  });
  const [photoFile, setPhotoFile] = useState(null);

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('All');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [rRes, rtRes] = await Promise.all([
        api.get('/admin/rooms'),
        api.get('/admin/room-types')
      ]);
      setRooms(rRes.data || []);
      setRoomTypes(rtRes.data || []);
      if (rtRes.data?.length > 0 && !form.room_type_id) {
        setForm(f => ({ ...f, room_type_id: rtRes.data[0].id }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (room = null) => {
    if (room) {
      setEditItem(room);
      setForm({
        room_number: room.room_number,
        floor: room.floor,
        room_type_id: room.room_type_id,
        reception_status: room.reception_status,
        housekeeping_status: room.housekeeping_status,
        notes: room.notes || ''
      });
    } else {
      setEditItem(null);
      setForm({
        room_number: '',
        floor: '',
        room_type_id: roomTypes[0]?.id || '',
        reception_status: 'Available',
        housekeeping_status: 'VacantClean',
        notes: ''
      });
    }
    setPhotoFile(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        floor: parseInt(form.floor),
        room_type_id: parseInt(form.room_type_id)
      };

      let roomId;
      if (editItem) {
        await api.put(`/admin/rooms/${editItem.id}`, payload);
        roomId = editItem.id;
      } else {
        const res = await api.post('/admin/rooms', payload);
        roomId = res.data.id;
      }

      if (photoFile && roomId) {
        const fd = new FormData();
        fd.append('photo', photoFile);
        await api.post(`/admin/rooms/${roomId}/photo`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Xatolik yuz berdi');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Xonani o'chirishni tasdiqlaysizmi?")) return;
    try {
      await api.delete(`/admin/rooms/${id}`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || "O'chirishda xatolik");
    }
  };

  const filtered = rooms.filter(r => {
    if (filterType !== 'All' && r.room_type_id.toString() !== filterType) return false;
    if (search && !r.room_number.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><Home className="w-6 h-6 text-brand-600"/> Xonalar boshqaruvi</h1>
          <p className="text-gray-500 mt-1">Mehmonxonadagi mavjud aniq xonalar va ularning holatlari</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2.5 rounded-xl font-medium flex items-center gap-2 shadow-sm transition-colors"
        >
          <Plus className="w-5 h-5" /> Yangi Xona
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex-1 relative">
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
          <input 
            type="text" 
            placeholder="Xona raqami bo'yicha qidiruv..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
          />
        </div>
        <div className="relative min-w-[200px]">
          <Filter className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none appearance-none"
          >
            <option value="All">Barcha toifalar</option>
            {roomTypes.map(rt => (
              <option key={rt.id} value={rt.id}>{rt.name}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-brand-600" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(room => (
            <div key={room.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all">
              <div className="h-40 bg-gray-100 relative group">
                {room.photo_url || room.room_type?.photo_url ? (
                  <img src={room.photo_url || room.room_type?.photo_url} alt="Room" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 gap-2">
                    <ImageIcon className="w-8 h-8 opacity-50" />
                    <span className="text-sm font-medium">Rasm yo'q</span>
                  </div>
                )}
                <div className="absolute top-2 right-2 flex gap-1">
                  <span className={`px-2.5 py-1 text-xs font-bold rounded-lg shadow-sm backdrop-blur-md ${room.reception_status === 'Available' ? 'bg-green-500/90 text-white' : room.reception_status === 'Occupied' ? 'bg-blue-500/90 text-white' : 'bg-red-500/90 text-white'}`}>
                    {room.reception_status}
                  </span>
                </div>
              </div>
              
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Xona {room.room_number}</h3>
                    <p className="text-sm text-gray-500 font-medium">{room.room_type?.name} • {room.floor}-qavat</p>
                  </div>
                </div>
                
                <div className="mt-3 space-y-2 text-sm">
                  <div className="flex justify-between items-center py-1 border-b border-gray-50">
                    <span className="text-gray-500">Tozalik:</span>
                    <span className={`font-semibold ${room.housekeeping_status.includes('Clean') ? 'text-green-600' : 'text-orange-600'}`}>
                      {room.housekeeping_status}
                    </span>
                  </div>
                </div>
                
                <div className="flex gap-2 pt-4 mt-2">
                  <button onClick={() => handleOpenModal(room)} className="flex-1 flex justify-center items-center gap-1.5 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">
                    <Edit2 className="w-4 h-4" /> Tahrirlash
                  </button>
                  <button onClick={() => handleDelete(room.id)} className="flex-1 flex justify-center items-center gap-1.5 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors">
                    <Trash2 className="w-4 h-4" /> O'chirish
                  </button>
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-dashed border-gray-300">
              <Home className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">Hech qanday xona topilmadi</p>
            </div>
          )}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                {editItem ? <Edit2 className="w-5 h-5 text-brand-600" /> : <Plus className="w-5 h-5 text-brand-600" />}
                {editItem ? 'Xonani tahrirlash' : 'Yangi xona qo\'shish'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors">
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Xona raqami</label>
                  <input required type="text" value={form.room_number} onChange={e => setForm({...form, room_number: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none font-medium" placeholder="Masalan: 101" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Qavat</label>
                  <input required type="number" value={form.floor} onChange={e => setForm({...form, floor: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none" placeholder="Masalan: 1" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Xona toifasi (Room Type)</label>
                <select value={form.room_type_id} onChange={e => setForm({...form, room_type_id: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none">
                  {roomTypes.map(rt => <option key={rt.id} value={rt.id}>{rt.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Qabul holati</label>
                  <select value={form.reception_status} onChange={e => setForm({...form, reception_status: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none">
                    <option value="Available">Available (Bo'sh)</option>
                    <option value="Occupied">Occupied (Band)</option>
                    <option value="Maintenance">Maintenance (Ta'mirda)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tozalik holati</label>
                  <select value={form.housekeeping_status} onChange={e => setForm({...form, housekeeping_status: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none">
                    <option value="VacantClean">Bo'sh, Toza</option>
                    <option value="VacantDirty">Bo'sh, Iflos</option>
                    <option value="OccupiedClean">Band, Toza</option>
                    <option value="OccupiedDirty">Band, Iflos</option>
                    <option value="OutOfService">Xizmat ko'rsatilmaydi</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Eslatma (Notes)</label>
                <textarea rows="2" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none resize-none"></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Xona Rasmi (Maxsus)</label>
                <label className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 border-dashed rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                  <Camera className="w-5 h-5 text-gray-400" />
                  <span className="text-sm text-gray-600 font-medium">
                    {photoFile ? photoFile.name : "Yangi rasm yuklash"}
                  </span>
                  <input type="file" accept="image/*" className="hidden" onChange={e => setPhotoFile(e.target.files[0])} />
                </label>
                <p className="text-xs text-gray-400 mt-1">Agar bo'sh qoldirilsa, Room Type rasmi ishlatiladi.</p>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors">Bekor qilish</button>
                <button type="submit" className="flex-1 px-4 py-2.5 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition-colors shadow-sm">Saqlash</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
