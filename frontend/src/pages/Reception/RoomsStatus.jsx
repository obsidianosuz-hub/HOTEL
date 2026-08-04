import React, { useState, useEffect, useMemo } from 'react';
import { BedDouble, CheckCircle2, AlertTriangle, PenTool, X, DoorOpen, User, Search, ClipboardCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import useStore from '../../store/useStore';
import useHotelStore from '../../store/useHotelStore';

export default function ReceptionRoomsStatus() {
  const navigate = useNavigate();
  const { rooms, checkInGuest } = useHotelStore();
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [toast, setToast] = useState(null); // { type: 'success'|'error', message: '' }

  // Check-in Form State
  const [checkInForm, setCheckInForm] = useState({
    guest_name: '',
    guest_phone: '',
    email: '',
    passport: '',
    dob: '',
    adults: 1,
    children: 0,
    nights: 1
  });

  // Group rooms by floor
  const floors = useMemo(() => {
    const map = new Map();
    rooms.forEach(room => {
      if (!map.has(room.floor)) {
        map.set(room.floor, []);
      }
      map.get(room.floor).push(room);
    });
    // Sort floors ascending
    return Array.from(map.entries()).sort((a, b) => a[0] - b[0]);
  }, [rooms]);

  const getStatusInfo = (room) => {
    if (room.reception_status === 'Maintenance') return { color: 'bg-blue-500', label: 'Out of Order', ring: 'ring-blue-500' };
    if (room.reception_status === 'Occupied') return { color: 'bg-red-500', label: 'Occupied', ring: 'ring-red-500' };
    if (room.reception_status === 'Cleaning' || room.housekeeping_status?.includes('Dirty')) return { color: 'bg-yellow-400', label: 'Dirty/Cleaning', ring: 'ring-yellow-400' };
    return { color: 'bg-emerald-500', label: 'Clean & Available', ring: 'ring-emerald-500' };
  };

  const handleRoomClick = (room) => {
    const status = getStatusInfo(room);
    if (status.label === 'Clean & Available') {
      setSelectedRoom(room);
    }
  };

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const handleQuickCheckIn = async (e) => {
    e.preventDefault();
    
    // Call our store action
    checkInGuest(selectedRoom, checkInForm);
    
    showToast('success', `✅ ${checkInForm.guest_name} — Room ${selectedRoom.room_number} ga muvaffaqiyatli joylashtirildi!`);
    
    setSelectedRoom(null);
    setCheckInForm({ guest_name: '', guest_phone: '', email: '', passport: '', dob: '', adults: 1, children: 0, nights: 1 });
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading map...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* Header & Legends */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <BedDouble className="w-8 h-8 text-brand-500" />
            Rooms Map
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">Interactive floor map and status monitoring.</p>
        </div>

        <div className="flex flex-wrap items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-emerald-500"></div><span className="text-sm font-medium text-slate-700 dark:text-slate-300">Clean</span></div>
          <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-red-500"></div><span className="text-sm font-medium text-slate-700 dark:text-slate-300">Occupied</span></div>
          <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-yellow-400"></div><span className="text-sm font-medium text-slate-700 dark:text-slate-300">Dirty</span></div>
          <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-blue-500"></div><span className="text-sm font-medium text-slate-700 dark:text-slate-300">Out of Order</span></div>
        </div>
      </div>

      {/* Map Layout */}
      <div className="space-y-8">
        {floors.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700">
            <p className="text-slate-500 dark:text-slate-400">No rooms configured yet.</p>
          </div>
        ) : (
          floors.map(([floor, floorRooms]) => (
            <div key={floor} className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 relative overflow-hidden transition-colors">
              
              <div className="absolute top-0 left-0 w-2 h-full bg-brand-500"></div>
              
              <div className="mb-6 flex items-center justify-between pl-4">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Floor {floor}</h2>
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400 px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full">{floorRooms.length} Rooms</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 pl-4">
                {floorRooms.map(room => {
                  const status = getStatusInfo(room);
                  const isAvailable = status.label === 'Clean & Available';
                  return (
                    <button
                      key={room.id}
                      onClick={() => handleRoomClick(room)}
                      disabled={!isAvailable}
                      className={`relative group flex flex-col text-left p-4 rounded-2xl border-2 transition-all duration-300 
                        ${ isAvailable 
                          ? 'hover:-translate-y-1 hover:shadow-xl hover:border-emerald-400 cursor-pointer bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700' 
                          : 'cursor-default bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 opacity-90 hover:shadow-md'}`}
                    >
                      {/* Status dot */}
                      <div className={`absolute top-3 right-3 w-3 h-3 rounded-full ${status.color} shadow ring-2 ring-white dark:ring-slate-900`} />

                      {/* Room number + Type */}
                      <div className="mb-2">
                        <span className="text-2xl font-black text-slate-800 dark:text-white">№ {room.room_number}</span>
                        <span className={`ml-2 text-xs font-bold px-2 py-0.5 rounded-full ${
                          room.room_type?.name === 'Presidential' ? 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300' :
                          room.room_type?.name === 'Suite'        ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300' :
                          room.room_type?.name === 'Deluxe'       ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300' :
                          'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                        }`}>{room.room_type?.name}</span>
                      </div>

                      {/* Price */}
                      <div className="flex items-baseline gap-1 mb-2">
                        <span className="text-lg font-bold text-brand-600 dark:text-brand-400">${room.price_per_night}</span>
                        <span className="text-xs text-slate-400">/kecha</span>
                      </div>

                      {/* Capacity */}
                      <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mb-2">
                        <span>🛏️ {room.bed}</span>
                        <span>👤 {room.adults} katta</span>
                        {room.children > 0 && <span>👶 {room.children}</span>}
                      </div>

                      {/* Amenities */}
                      <div className="flex flex-wrap gap-1">
                        {room.amenities?.slice(0, 3).map(a => (
                          <span key={a} className="text-[10px] px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-md">{a}</span>
                        ))}
                        {room.amenities?.length > 3 && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-md">+{room.amenities.length - 3}</span>
                        )}
                      </div>

                      {/* Status label & Actions */}
                      <div className="mt-3 flex items-center justify-between">
                        <div className={`text-xs font-semibold ${
                          isAvailable ? 'text-emerald-600 dark:text-emerald-400' :
                          status.label === 'Occupied' ? 'text-red-500' :
                          status.label === 'Dirty/Cleaning' ? 'text-amber-500' : 'text-blue-500'
                        }`}>{status.label}</div>
                        
                        {!isAvailable && (
                          <button
                            onClick={(e) => { e.stopPropagation(); navigate('/reception/tasks'); }}
                            className="p-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-500 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-500/20 transition-colors tooltip z-10 opacity-0 group-hover:opacity-100"
                            title="Assign Task"
                          >
                            <ClipboardCheck className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {/* Hover overlay */}
                      {isAvailable && (
                        <div className="absolute inset-0 bg-emerald-500/90 rounded-xl opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity gap-1">
                          <DoorOpen className="w-7 h-7 text-white" />
                          <span className="text-white font-bold text-sm">Check In</span>
                          <span className="text-emerald-100 text-xs">${room.price_per_night}/kecha</span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Quick Check-in Modal */}
      {selectedRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-brand-50 dark:bg-brand-500/10">
              <div>
                <h3 className="text-xl font-bold text-brand-700 dark:text-brand-400">Quick Check-in</h3>
                <p className="text-sm text-brand-600/80 dark:text-brand-300/80">Room {selectedRoom.room_number} ({selectedRoom.room_type?.name})</p>
              </div>
              <button onClick={() => setSelectedRoom(null)} className="p-2 bg-white dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full transition-colors shadow-sm">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleQuickCheckIn} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Guest Full Name *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input 
                    type="text" 
                    required
                    autoFocus
                    value={checkInForm.guest_name}
                    onChange={e => setCheckInForm({...checkInForm, guest_name: e.target.value})}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 dark:text-white outline-none transition-all"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Phone Number *</label>
                  <input 
                    type="text" 
                    required
                    value={checkInForm.guest_phone}
                    onChange={e => setCheckInForm({...checkInForm, guest_phone: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 dark:text-white outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
                  <input 
                    type="email" 
                    value={checkInForm.email}
                    onChange={e => setCheckInForm({...checkInForm, email: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 dark:text-white outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Passport / ID *</label>
                  <input 
                    type="text" 
                    required
                    value={checkInForm.passport}
                    onChange={e => setCheckInForm({...checkInForm, passport: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 dark:text-white outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Date of Birth</label>
                  <input 
                    type="date" 
                    value={checkInForm.dob}
                    onChange={e => setCheckInForm({...checkInForm, dob: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 dark:text-white outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Adults</label>
                  <input 
                    type="number" 
                    min="1"
                    required
                    value={checkInForm.adults}
                    onChange={e => setCheckInForm({...checkInForm, adults: parseInt(e.target.value)})}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 dark:text-white outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Children</label>
                  <input 
                    type="number" 
                    min="0"
                    value={checkInForm.children}
                    onChange={e => setCheckInForm({...checkInForm, children: parseInt(e.target.value)})}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 dark:text-white outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nights *</label>
                  <input 
                    type="number" 
                    min="1"
                    required
                    value={checkInForm.nights}
                    onChange={e => setCheckInForm({...checkInForm, nights: parseInt(e.target.value)})}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 dark:text-white outline-none transition-all"
                  />
                </div>
              </div>
              
              <div className="pt-4 sticky bottom-0 bg-white dark:bg-slate-900 pb-2">
                <button type="submit" className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold shadow-md shadow-brand-500/20 transition-all flex justify-center items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  Confirm Check-in
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-[100] flex items-center gap-4 px-6 py-4 rounded-2xl shadow-2xl border animate-in slide-in-from-bottom-4 duration-300 ${
          toast.type === 'success' 
            ? 'bg-emerald-600 border-emerald-500 text-white' 
            : 'bg-red-600 border-red-500 text-white'
        }`}>
          <div className="text-base font-semibold">{toast.message}</div>
          <button onClick={() => setToast(null)} className="ml-2 opacity-70 hover:opacity-100 transition-opacity">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

    </div>
  );
}
