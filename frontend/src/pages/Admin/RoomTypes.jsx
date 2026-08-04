import React, { useState, useEffect, useRef } from 'react';
import { Loader2, AlertCircle, CheckCircle2, Image as ImageIcon, Edit2, Save, X, Upload, Users, DollarSign, Plus, Trash2, Search, LayoutGrid, BedDouble } from 'lucide-react';
import api, { API_ORIGIN } from '../../lib/api';
import ConfirmDialog from '../../components/ConfirmDialog';
import useConfirm from '../../hooks/useConfirm';

const STATUS_STYLES = {
  Available: 'bg-green-100 text-green-800',
  Occupied: 'bg-blue-100 text-blue-800',
  Cleaning: 'bg-amber-100 text-amber-800',
  Maintenance: 'bg-red-100 text-red-800'
};

const AMENITIES_LIST = ['WiFi', 'TV', 'AC', 'Minibar', 'Jacuzzi', 'Balcony', 'Kitchen', 'Safe', 'Hair Dryer', 'Bathrobe'];
const BED_TYPES = ['Single', 'Twin', 'Double', 'Queen', 'King'];

const emptyRoomForm = { 
  room_number: '', floor: '', room_type_id: '', reception_status: 'Available', 
  notes: '', bed_type: 'Double', adults: 2, children: 0, amenities: [] 
};

export default function RoomTypes() {
  const [view, setView] = useState('rooms'); // 'rooms' | 'types'

  // Rooms
  const [rooms, setRooms] = useState([]);
  const [roomsLoading, setRoomsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [roomModalOpen, setRoomModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [roomForm, setRoomForm] = useState(emptyRoomForm);
  const [roomPhotoFile, setRoomPhotoFile] = useState(null);
  const [roomSaving, setRoomSaving] = useState(false);
  const { confirm, dialogProps } = useConfirm();

  // Room Types
  const [roomTypes, setRoomTypes] = useState([]);
  const [typesLoading, setTypesLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: '', base_price: '', capacity: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [uploadingId, setUploadingId] = useState(null);
  const fileInputRefs = useRef({});
  const [newTypeModalOpen, setNewTypeModalOpen] = useState(false);
  const [newTypeForm, setNewTypeForm] = useState({ name: '', base_price: '', capacity: '', description: '' });
  const [newTypeSaving, setNewTypeSaving] = useState(false);
  const { confirm: confirmType, dialogProps: dialogPropsType } = useConfirm();

  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchRooms();
    fetchRoomTypes();
  }, []);

  const fetchRooms = async () => {
    try {
      setRoomsLoading(true);
      const res = await api.get('/admin/rooms');
      setRooms(res.data || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load rooms');
    } finally {
      setRoomsLoading(false);
    }
  };

  const fetchRoomTypes = async () => {
    try {
      setTypesLoading(true);
      const res = await api.get('/admin/room-types');
      setRoomTypes(res.data || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load room types');
    } finally {
      setTypesLoading(false);
    }
  };

  const showSuccess = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(null), 3000);
  };

  // ---- Room CRUD ----
  const openAddRoom = () => {
    setEditingRoom(null);
    setRoomForm({ ...emptyRoomForm, room_type_id: roomTypes[0]?.id || '' });
    setRoomPhotoFile(null);
    setRoomModalOpen(true);
  };

  const openEditRoom = (room) => {
    setEditingRoom(room);
    setRoomForm({
      room_number: room.room_number,
      floor: room.floor,
      room_type_id: room.room_type_id,
      reception_status: room.reception_status,
      notes: room.notes || '',
      bed_type: room.bed_type || 'Double',
      adults: room.adults || 2,
      children: room.children || 0,
      amenities: room.amenities || []
    });
    setRoomPhotoFile(null);
    setRoomModalOpen(true);
  };

  const closeRoomModal = () => {
    setRoomModalOpen(false);
    setEditingRoom(null);
    setRoomForm(emptyRoomForm);
    setRoomPhotoFile(null);
  };

  const uploadRoomPhoto = async (roomId, file) => {
    const form = new FormData();
    form.append('photo', file);
    await api.post(`/admin/rooms/${roomId}/photo`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
  };

  const handleRoomSubmit = async (e) => {
    e.preventDefault();
    setRoomSaving(true);
    setError(null);
    try {
      let roomId = editingRoom?.id;
      if (editingRoom) {
        await api.put(`/admin/rooms/${editingRoom.id}`, roomForm);
      } else {
        const res = await api.post('/admin/rooms', roomForm);
        roomId = res.data.id;
      }
      if (roomPhotoFile && roomId) {
        await uploadRoomPhoto(roomId, roomPhotoFile);
      }
      showSuccess(editingRoom ? 'Room updated.' : 'Room created.');
      closeRoomModal();
      fetchRooms();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save room');
    } finally {
      setRoomSaving(false);
    }
  };

  const handleDeleteRoom = async (room) => {
    const ok = await confirm({
      title: `Delete room ${room.room_number}?`,
      message: 'This only works if the room has no booking history. Rooms with history should be marked Maintenance instead.',
      confirmLabel: 'Delete Room',
      danger: true
    });
    if (!ok) return;
    setError(null);
    try {
      await api.delete(`/admin/rooms/${room.id}`);
      showSuccess('Room deleted.');
      fetchRooms();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete room');
    }
  };

  const filteredRooms = rooms.filter(r => {
    if (statusFilter !== 'All' && r.reception_status !== statusFilter) return false;
    if (search && !r.room_number.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  // ---- Room Type edit (existing) ----
  const startEdit = (rt) => {
    setEditingId(rt.id);
    setFormData({ name: rt.name, base_price: rt.base_price, capacity: rt.capacity, description: rt.description || '' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({ name: '', base_price: '', capacity: '', description: '' });
  };

  const saveEdit = async (id) => {
    setSaving(true);
    setError(null);
    try {
      await api.put(`/admin/room-types/${id}`, formData);
      cancelEdit();
      fetchRoomTypes();
      showSuccess('Room type updated.');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save room type');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateType = async (e) => {
    e.preventDefault();
    setNewTypeSaving(true);
    setError(null);
    try {
      await api.post('/admin/room-types', newTypeForm);
      setNewTypeModalOpen(false);
      fetchRoomTypes();
      showSuccess('Room type created.');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create room type');
    } finally {
      setNewTypeSaving(false);
    }
  };

  const handleDeleteType = async (rt) => {
    const ok = await confirmType({
      title: `Delete "${rt.name}"?`,
      message: 'Only works if no rooms currently use this type.',
      confirmLabel: 'Delete Type',
      danger: true
    });
    if (!ok) return;
    setError(null);
    try {
      await api.delete(`/admin/room-types/${rt.id}`);
      showSuccess('Room type deleted.');
      fetchRoomTypes();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete room type');
    }
  };

  const handlePhotoSelect = async (id, file) => {
    if (!file) return;
    setUploadingId(id);
    setError(null);
    try {
      const form = new FormData();
      form.append('photo', file);
      await api.post(`/admin/room-types/${id}/photo`, form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      fetchRoomTypes();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to upload photo');
    } finally {
      setUploadingId(null);
    }
  };

  const loading = view === 'rooms' ? roomsLoading : typesLoading;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Room Management</h1>
          <p className="text-gray-500 text-sm mt-1">Manage individual rooms, their status, and the room type catalog.</p>
        </div>
        <div className="flex items-center gap-3">
          {view === 'rooms' ? (
            <button onClick={openAddRoom} className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors shadow-sm">
              <Plus className="h-4 w-4" /> Add New Room
            </button>
          ) : (
            <button onClick={() => { setNewTypeForm({ name: '', base_price: '', capacity: '', description: '' }); setNewTypeModalOpen(true); }} className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors shadow-sm">
              <Plus className="h-4 w-4" /> New Room Type
            </button>
          )}
          <button
            onClick={() => setView(v => (v === 'rooms' ? 'types' : 'rooms'))}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            {view === 'rooms' ? <><LayoutGrid className="h-4 w-4" /> Room Types Catalog</> : <><BedDouble className="h-4 w-4" /> Back to Rooms</>}
          </button>
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

      {loading ? (
        <div className="flex h-96 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-brand-600" /></div>
      ) : view === 'rooms' ? (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              <input
                type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search by room number..."
                className="pl-10 w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
              />
            </div>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="p-2 border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none">
              <option value="All">All Statuses</option>
              <option value="Available">Available</option>
              <option value="Occupied">Occupied</option>
              <option value="Cleaning">Cleaning</option>
              <option value="Maintenance">Maintenance</option>
            </select>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 border-b border-gray-100 text-sm font-medium text-gray-500">
                  <tr>
                    <th className="p-4"></th>
                    <th className="p-4">Room #</th>
                    <th className="p-4">Floor</th>
                    <th className="p-4">Type</th>
                    <th className="p-4">Capacity</th>
                    <th className="p-4">Price/Night</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Notes</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                  {filteredRooms.map(room => (
                    <tr key={room.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4">
                        {(room.photo_url || room.room_type?.photo_url) ? (
                          <img src={`${API_ORIGIN}${room.photo_url || room.room_type.photo_url}`} alt={room.room_number} className="w-12 h-12 rounded-lg object-cover border border-gray-200" />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center border border-gray-200">
                            <ImageIcon className="w-5 h-5 text-gray-300" />
                          </div>
                        )}
                      </td>
                      <td className="p-4 font-semibold text-gray-900">{room.room_number}</td>
                      <td className="p-4 text-gray-600">{room.floor || '—'}</td>
                      <td className="p-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-50 text-brand-700">{room.room_type?.name}</span>
                      </td>
                      <td className="p-4 flex items-center gap-1.5"><Users className="w-4 h-4 text-gray-400" /> {room.room_type?.capacity}</td>
                      <td className="p-4">{Number(room.room_type?.base_price || 0).toLocaleString()} so'm</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[room.reception_status] || 'bg-gray-100 text-gray-700'}`}>
                          {room.reception_status}
                        </span>
                      </td>
                      <td className="p-4 text-gray-500 max-w-xs truncate">{room.notes || '—'}</td>
                      <td className="p-4 text-right space-x-2">
                        <button onClick={() => openEditRoom(room)} className="p-1.5 text-gray-400 hover:text-brand-600 transition-colors rounded-lg hover:bg-brand-50">
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDeleteRoom(room)} title="Delete room" className="p-1.5 text-gray-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredRooms.length === 0 && (
                    <tr>
                      <td colSpan="8" className="p-8 text-center text-gray-500">No rooms match the current filters.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {roomTypes.map(rt => (
            <div key={rt.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="relative h-40 bg-gray-100 flex items-center justify-center group">
                {rt.photo_url ? (
                  <img src={`${API_ORIGIN}${rt.photo_url}`} alt={rt.name} className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="w-10 h-10 text-gray-300" />
                )}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  ref={el => (fileInputRefs.current[rt.id] = el)}
                  onChange={(e) => handlePhotoSelect(rt.id, e.target.files?.[0])}
                />
                <button
                  onClick={() => fileInputRefs.current[rt.id]?.click()}
                  disabled={uploadingId === rt.id}
                  className="absolute inset-0 bg-black/0 group-hover:bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-2 text-sm font-medium"
                >
                  {uploadingId === rt.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Upload className="w-4 h-4" /> Change Photo</>}
                </button>
              </div>

              <div className="p-4 space-y-3">
                {editingId === rt.id ? (
                  <>
                    <input
                      type="text" value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className="w-full p-2 border border-gray-200 rounded-lg text-sm font-semibold"
                      placeholder="Name"
                    />
                    <textarea
                      rows="2" value={formData.description}
                      onChange={e => setFormData({ ...formData, description: e.target.value })}
                      className="w-full p-2 border border-gray-200 rounded-lg text-sm resize-none"
                      placeholder="Description"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number" value={formData.base_price}
                        onChange={e => setFormData({ ...formData, base_price: e.target.value })}
                        className="w-full p-2 border border-gray-200 rounded-lg text-sm"
                        placeholder="Price/night"
                      />
                      <input
                        type="number" value={formData.capacity}
                        onChange={e => setFormData({ ...formData, capacity: e.target.value })}
                        className="w-full p-2 border border-gray-200 rounded-lg text-sm"
                        placeholder="Capacity"
                      />
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button onClick={cancelEdit} className="flex-1 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium flex items-center justify-center gap-1.5">
                        <X className="w-4 h-4" /> Cancel
                      </button>
                      <button onClick={() => saveEdit(rt.id)} disabled={saving} className="flex-1 px-3 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-1.5">
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Save</>}
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between items-start">
                      <h3 className="font-semibold text-gray-900">{rt.name}</h3>
                      <div className="flex items-center gap-1">
                        <button onClick={() => startEdit(rt)} className="text-gray-400 hover:text-brand-600 p-1">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeleteType(rt)} className="text-gray-400 hover:text-red-600 p-1">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-2">{rt.description || 'No description yet.'}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-600 pt-1">
                      <span className="flex items-center gap-1"><DollarSign className="w-3.5 h-3.5" /> {Number(rt.base_price).toLocaleString()} so'm/night</span>
                      <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {rt.capacity} guests</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}

          {roomTypes.length === 0 && (
            <div className="col-span-full p-12 text-center text-gray-400 bg-white rounded-2xl border border-dashed border-gray-200">
              No room types found.
            </div>
          )}
        </div>
      )}

      {roomModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900">{editingRoom ? 'Edit Room' : 'Add New Room'}</h2>
            </div>
            <form onSubmit={handleRoomSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              
              {/* Room number & Floor */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Room Number *</label>
                  <input required type="text" value={roomForm.room_number} onChange={e => setRoomForm({ ...roomForm, room_number: e.target.value })} className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none" placeholder="205" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Floor *</label>
                  <input required type="number" value={roomForm.floor} onChange={e => setRoomForm({ ...roomForm, floor: e.target.value })} className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none" placeholder="2" />
                </div>
              </div>

              {/* Room Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Room Type *</label>
                <select required value={roomForm.room_type_id} onChange={e => setRoomForm({ ...roomForm, room_type_id: e.target.value })} className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none bg-white">
                  <option value="" disabled>Select a room type</option>
                  {roomTypes.map(rt => <option key={rt.id} value={rt.id}>{rt.name} — {Number(rt.base_price).toLocaleString()} so'm/night</option>)}
                </select>
              </div>

              {/* Bed type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bed Type *</label>
                <select value={roomForm.bed_type} onChange={e => setRoomForm({ ...roomForm, bed_type: e.target.value })} className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none bg-white">
                  {BED_TYPES.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>

              {/* Adults & Children */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Adults *</label>
                  <input required type="number" min="1" max="10" value={roomForm.adults} onChange={e => setRoomForm({ ...roomForm, adults: parseInt(e.target.value) })} className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Children</label>
                  <input type="number" min="0" max="10" value={roomForm.children} onChange={e => setRoomForm({ ...roomForm, children: parseInt(e.target.value) })} className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none" />
                </div>
              </div>

              {/* Amenities */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Qulayliklar (Amenities)</label>
                <div className="flex flex-wrap gap-2">
                  {AMENITIES_LIST.map(a => {
                    const checked = roomForm.amenities?.includes(a);
                    return (
                      <button
                        key={a}
                        type="button"
                        onClick={() => setRoomForm(prev => ({
                          ...prev,
                          amenities: checked
                            ? prev.amenities.filter(x => x !== a)
                            : [...(prev.amenities || []), a]
                        }))}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                          checked
                            ? 'bg-brand-600 text-white border-brand-600'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-brand-400'
                        }`}
                      >
                        {a}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Status (edit only) */}
              {editingRoom && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select value={roomForm.reception_status} onChange={e => setRoomForm({ ...roomForm, reception_status: e.target.value })} className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none bg-white">
                    <option value="Available">Available</option>
                    <option value="Occupied">Occupied</option>
                    <option value="Cleaning">Cleaning</option>
                    <option value="Maintenance">Maintenance (Out of Order)</option>
                  </select>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
                <textarea rows="2" value={roomForm.notes} onChange={e => setRoomForm({ ...roomForm, notes: e.target.value })} className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none resize-none" placeholder="e.g. Corner room, city view" />
              </div>

              {/* Photo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Room Photo (optional)</label>
                <div className="flex items-center gap-3">
                  {(roomPhotoFile || editingRoom?.photo_url) && (
                    <img
                      src={roomPhotoFile ? URL.createObjectURL(roomPhotoFile) : `${API_ORIGIN}${editingRoom.photo_url}`}
                      alt="Room preview"
                      className="w-14 h-14 rounded-lg object-cover border border-gray-200"
                    />
                  )}
                  <label className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium cursor-pointer">
                    <Upload className="w-4 h-4" /> {roomPhotoFile ? roomPhotoFile.name : 'Choose photo'}
                    <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={e => setRoomPhotoFile(e.target.files?.[0] || null)} />
                  </label>
                </div>
                <p className="text-xs text-gray-400 mt-1">Falls back to the room type's photo if not set.</p>
              </div>

              <div className="pt-2 flex justify-end gap-3 sticky bottom-0 bg-white pb-2">
                <button type="button" onClick={closeRoomModal} className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors font-medium">Cancel</button>
                <button type="submit" disabled={roomSaving} className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors font-medium flex items-center gap-2">
                  {roomSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {editingRoom ? 'Save Changes' : 'Create Room'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {newTypeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900">New Room Type</h2>
            </div>
            <form onSubmit={handleCreateType} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input required type="text" value={newTypeForm.name} onChange={e => setNewTypeForm({ ...newTypeForm, name: e.target.value })} className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none" placeholder="e.g. Family Room" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price/Night</label>
                  <input required type="number" min="0" value={newTypeForm.base_price} onChange={e => setNewTypeForm({ ...newTypeForm, base_price: e.target.value })} className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none" placeholder="500000" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
                  <input required type="number" min="1" value={newTypeForm.capacity} onChange={e => setNewTypeForm({ ...newTypeForm, capacity: e.target.value })} className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none" placeholder="2" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea rows="2" value={newTypeForm.description} onChange={e => setNewTypeForm({ ...newTypeForm, description: e.target.value })} className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none resize-none" placeholder="Short description" />
              </div>
              <div className="pt-2 flex justify-end gap-3">
                <button type="button" onClick={() => setNewTypeModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors font-medium">Cancel</button>
                <button type="submit" disabled={newTypeSaving} className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors font-medium flex items-center gap-2">
                  {newTypeSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog {...dialogProps} />
      <ConfirmDialog {...dialogPropsType} />
    </div>
  );
}
