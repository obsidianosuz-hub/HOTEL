import React, { useState, useEffect } from 'react';
import { CalendarDays, Search, UserCheck, UserMinus, Globe, Building2, MoreVertical, Edit, XCircle } from 'lucide-react';
import api from '../../lib/api';

export default function ReceptionBookingsArrivals() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stats, setStats] = useState({ checkIns: 0, checkOuts: 0 });

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const res = await api.get('/api/bookings').catch(() => ({ data: null }));
      let data = res?.data;
      
      // If API returns empty or fails, use mock data for demonstration
      if (!Array.isArray(data) || data.length === 0) {
        data = [
          { id: 1, booking_code: 'BKG-2026-001', guest: { full_name: 'John Doe' }, source: 'BookingCom', check_in_date: today, check_out_date: new Date(Date.now() + 86400000).toISOString(), room: { room_number: '101' }, status: 'Active' },
          { id: 2, booking_code: 'BKG-2026-002', guest: { full_name: 'Jane Smith' }, source: 'Direct', check_in_date: new Date(Date.now() - 86400000).toISOString(), check_out_date: today, room: { room_number: '102' }, status: 'PendingPayment' },
          { id: 3, booking_code: 'BKG-2026-003', guest: { full_name: 'Ali Valiyev' }, source: 'BookingCom', check_in_date: today, check_out_date: new Date(Date.now() + 86400000 * 2).toISOString(), room: { room_number: '205' }, status: 'Active' },
          { id: 4, booking_code: 'BKG-2026-004', guest: { full_name: 'Zarina Akramova' }, source: 'Direct', check_in_date: new Date(Date.now() + 86400000).toISOString(), check_out_date: new Date(Date.now() + 86400000 * 3).toISOString(), room: { room_number: '302' }, status: 'Active' },
          { id: 5, booking_code: 'BKG-2026-005', guest: { full_name: 'Michael Brown' }, source: 'BookingCom', check_in_date: today, check_out_date: new Date(Date.now() + 86400000 * 4).toISOString(), room: { room_number: '405' }, status: 'Active' },
          { id: 6, booking_code: 'BKG-2026-006', guest: { full_name: 'Sarah Connor' }, source: 'Direct', check_in_date: today, check_out_date: new Date(Date.now() + 86400000 * 1).toISOString(), room: { room_number: null }, status: 'PendingPayment' },
          { id: 7, booking_code: 'BKG-2026-007', guest: { full_name: 'Aziz Rakhimov' }, source: 'BookingCom', check_in_date: new Date(Date.now() - 86400000 * 2).toISOString(), check_out_date: today, room: { room_number: '105' }, status: 'Completed' },
          { id: 8, booking_code: 'BKG-2026-008', guest: { full_name: 'Dilnoza Karimova' }, source: 'Direct', check_in_date: new Date(Date.now() + 86400000 * 2).toISOString(), check_out_date: new Date(Date.now() + 86400000 * 5).toISOString(), room: { room_number: null }, status: 'Cancelled' },
          { id: 9, booking_code: 'BKG-2026-009', guest: { full_name: 'Robert Taylor' }, source: 'BookingCom', check_in_date: today, check_out_date: new Date(Date.now() + 86400000 * 7).toISOString(), room: { room_number: '210' }, status: 'Active' },
          { id: 10, booking_code: 'BKG-2026-010', guest: { full_name: 'Emily Davis' }, source: 'Direct', check_in_date: today, check_out_date: new Date(Date.now() + 86400000 * 2).toISOString(), room: { room_number: '305' }, status: 'PendingPayment' },
          { id: 11, booking_code: 'BKG-2026-011', guest: { full_name: 'Jasur Bek' }, source: 'BookingCom', check_in_date: new Date(Date.now() - 86400000 * 1).toISOString(), check_out_date: new Date(Date.now() + 86400000 * 1).toISOString(), room: { room_number: '501' }, status: 'Active' },
          { id: 12, booking_code: 'BKG-2026-012', guest: { full_name: 'Malika Turaeva' }, source: 'Direct', check_in_date: today, check_out_date: new Date(Date.now() + 86400000 * 3).toISOString(), room: { room_number: null }, status: 'PendingPayment' }
        ];
      }
      
      setBookings(data);
      
      // Calculate simple stats for today
      const checkIns = data.filter(b => b.check_in_date?.startsWith(today)).length;
      const checkOuts = data.filter(b => b.check_out_date?.startsWith(today)).length;
      setStats({ checkIns, checkOuts });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredBookings = bookings.filter(b => {
    const q = search.toLowerCase();
    return b.booking_code?.toLowerCase().includes(q) || 
           b.guest?.full_name?.toLowerCase().includes(q);
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PendingPayment': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400';
      case 'Active': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400';
      case 'Completed': return 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400';
      case 'Cancelled': return 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400';
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* Top Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-3xl p-6 text-white shadow-lg shadow-emerald-500/20 flex items-center justify-between">
          <div>
            <p className="text-emerald-100 font-medium">Today's Check-ins</p>
            <h2 className="text-5xl font-bold mt-2">{stats.checkIns}</h2>
          </div>
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
            <UserCheck className="w-8 h-8 text-white" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-3xl p-6 text-white shadow-lg shadow-orange-500/20 flex items-center justify-between">
          <div>
            <p className="text-orange-100 font-medium">Today's Check-outs</p>
            <h2 className="text-5xl font-bold mt-2">{stats.checkOuts}</h2>
          </div>
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
            <UserMinus className="w-8 h-8 text-white" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col h-[600px] transition-colors">
        
        {/* Header & Search */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-brand-500" />
            All Bookings & Arrivals
          </h2>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by Name or Code..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full focus:ring-2 focus:ring-brand-500 dark:text-white outline-none transition-all"
            />
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="p-8 text-center text-slate-500">Loading bookings...</div>
          ) : filteredBookings.length === 0 ? (
            <div className="p-12 text-center text-slate-500 flex flex-col items-center">
              <CalendarDays className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-4" />
              <p>No bookings found.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-sm sticky top-0 z-10 backdrop-blur-sm">
                <tr>
                  <th className="py-4 px-6 font-medium">Guest & Code</th>
                  <th className="py-4 px-6 font-medium">Source</th>
                  <th className="py-4 px-6 font-medium">Dates</th>
                  <th className="py-4 px-6 font-medium">Room</th>
                  <th className="py-4 px-6 font-medium">Status</th>
                  <th className="py-4 px-6 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-sm">
                {filteredBookings.map(b => {
                  const isBookingCom = b.source === 'BookingCom';
                  return (
                    <tr key={b.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors group">
                      <td className="py-4 px-6">
                        <p className="font-bold text-slate-900 dark:text-white">{b.guest?.full_name}</p>
                        <p className="text-xs text-slate-500 font-mono mt-0.5">{b.booking_code}</p>
                      </td>
                      <td className="py-4 px-6">
                        {isBookingCom ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#003580]/10 text-[#003580] dark:bg-[#003580]/30 dark:text-[#6699CC] font-semibold text-xs">
                            <Globe className="w-3.5 h-3.5" />
                            Booking.com
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-brand-50 text-brand-700 dark:bg-brand-500/20 dark:text-brand-400 font-semibold text-xs">
                            <Building2 className="w-3.5 h-3.5" />
                            Direct
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <p className="text-slate-700 dark:text-slate-300">{new Date(b.check_in_date).toLocaleDateString()} &rarr;</p>
                        <p className="text-slate-500 text-xs">{new Date(b.check_out_date).toLocaleDateString()}</p>
                      </td>
                      <td className="py-4 px-6">
                        <span className="font-medium text-slate-900 dark:text-white">{b.room?.room_number || 'N/A'}</span>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusBadge(b.status)}`}>
                          {b.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        {isBookingCom ? (
                          <span className="text-xs text-slate-400 italic">Managed externally</span>
                        ) : (
                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="p-1.5 text-slate-400 hover:text-brand-600 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button className="p-1.5 text-slate-400 hover:text-red-600 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm">
                              <XCircle className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
