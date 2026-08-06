import React, { useState, useEffect } from 'react';
import { Loader2, Ban, Search } from 'lucide-react';
import api from '../../lib/api';
import ConfirmDialog from '../../components/ConfirmDialog';
import useConfirm from '../../hooks/useConfirm';

export default function Bookings() {
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { confirm, dialogProps } = useConfirm();

  useEffect(() => {
    fetchBookings();
  }, [filter, dateFrom, dateTo]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter !== 'All') params.set('status', filter);
      if (dateFrom) params.set('from', dateFrom);
      if (dateTo) params.set('to', dateTo);
      const res = await api.get(`/manager/bookings?${params.toString()}`);
      setBookings(res.data || []);
      setError(null);
    } catch (err) {
      setError('Bronlarni yuklashda xatolik.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOverride = async (booking_code) => {
    const ok = await confirm({
      title: 'Manager override — cancel booking?',
      message: `This bypasses the normal cancellation restrictions for ${booking_code}.`,
      confirmLabel: 'Cancel Booking',
      danger: true,
      requireText: 'CANCEL'
    });
    if (!ok) return;
    try {
      await api.patch(`/manager/bookings/${booking_code}/cancel`);
      fetchBookings();
    } catch (err) {
      setError(err.response?.data?.error || 'Cancellation override failed');
    }
  };

  const statusColors = {
    Upcoming: 'bg-blue-100 text-blue-700',
    Active: 'bg-green-100 text-green-700',
    Completed: 'bg-gray-100 text-gray-700',
    Cancelled: 'bg-red-100 text-red-700'
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Barcha Bronlar</h1>
        <p className="text-gray-500 dark:text-slate-400 mt-1">Menejer ko'rinishi va bekor qilish override.</p>
      </div>

      {/* Search + Date filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Mehmon ismi yoki bron kodi bo'yicha qidiring..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-sm dark:text-white outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <div className="flex gap-2 items-center">
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            className="px-3 py-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-sm dark:text-white outline-none focus:ring-2 focus:ring-brand-500" />
          <span className="text-gray-400">—</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
            className="px-3 py-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-sm dark:text-white outline-none focus:ring-2 focus:ring-brand-500" />
        </div>
      </div>

      {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl">{error}</div>}

      {/* Status filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {['All', 'Upcoming', 'Active', 'Completed', 'Cancelled'].map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-xl font-medium transition-all whitespace-nowrap ${
              filter === status
                ? 'bg-brand-600 text-white shadow-md'
                : 'bg-white dark:bg-slate-900 text-gray-600 dark:text-slate-300 hover:bg-gray-50 border border-gray-200 dark:border-slate-700'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
        </div>
      ) : (() => {
        const filtered = bookings.filter(b => {
          if (!search) return true;
          const q = search.toLowerCase();
          return (
            b.booking_code?.toLowerCase().includes(q) ||
            b.guest?.full_name?.toLowerCase().includes(q) ||
            b.room?.room_number?.toString().includes(q)
          );
        });

        return (
          <div className="space-y-3">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700 overflow-x-auto shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 dark:bg-slate-800 border-b border-gray-100 dark:border-slate-700">
                  <tr>
                    <th className="p-4 font-semibold text-gray-600 dark:text-slate-300">Kod</th>
                    <th className="p-4 font-semibold text-gray-600 dark:text-slate-300">Mehmon</th>
                    <th className="p-4 font-semibold text-gray-600 dark:text-slate-300">Xona</th>
                    <th className="p-4 font-semibold text-gray-600 dark:text-slate-300">Sanalar</th>
                    <th className="p-4 font-semibold text-gray-600 dark:text-slate-300">Summa</th>
                    <th className="p-4 font-semibold text-gray-600 dark:text-slate-300">Manba</th>
                    <th className="p-4 font-semibold text-gray-600 dark:text-slate-300">Holat</th>
                    <th className="p-4 font-semibold text-gray-600 dark:text-slate-300">Yaratilgan</th>
                    <th className="p-4 font-semibold text-gray-600 dark:text-slate-300">Override</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="p-8 text-center text-gray-500 dark:text-slate-400">
                        {search ? `"${search}" bo'yicha natija topilmadi.` : 'Bronlar topilmadi.'}
                      </td>
                    </tr>
                  ) : (
                    filtered.map(b => (
                      <tr key={b.booking_code} className="hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
                        <td className="p-4 font-medium text-gray-900 dark:text-white text-sm">{b.booking_code}</td>
                        <td className="p-4">
                          <p className="text-gray-900 dark:text-white font-medium text-sm">{b.guest?.full_name}</p>
                          {b.guest?.phone && <p className="text-xs text-gray-400">{b.guest.phone}</p>}
                        </td>
                        <td className="p-4 text-gray-700 dark:text-slate-300 text-sm">{b.room?.room_number || 'N/A'}</td>
                        <td className="p-4 text-sm text-gray-600 dark:text-slate-400">
                          {new Date(b.check_in_date).toLocaleDateString()} → {new Date(b.check_out_date).toLocaleDateString()}
                        </td>
                        <td className="p-4 text-sm font-semibold text-gray-900 dark:text-white">
                          {Number(b.total_price || 0).toLocaleString()} so'm
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            b.source === 'BookingCom' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {b.source === 'BookingCom' ? 'Booking.com' : "To'g'ridan"}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[b.status] || 'bg-gray-100 text-gray-700'}`}>
                            {b.status}
                          </span>
                        </td>
                        <td className="p-4 text-xs text-gray-500 dark:text-slate-400">
                          {new Date(b.created_at).toLocaleDateString()}
                        </td>
                        <td className="p-4">
                          {b.status !== 'Cancelled' && (
                            b.source === 'BookingCom' && b.payment_model === 'booking_com_collect' ? (
                              <span className="text-xs text-gray-400 italic" title="Guest already paid Booking.com — only Booking.com can cancel this reservation">
                                Managed by Booking.com
                              </span>
                            ) : (
                              <button
                                onClick={() => handleCancelOverride(b.booking_code)}
                                className="flex items-center gap-1 px-3 py-1.5 text-red-600 hover:bg-red-50 hover:text-red-700 rounded-lg transition-colors text-sm font-medium border border-transparent hover:border-red-200"
                                title="Force Cancel Booking"
                              >
                                <Ban className="w-4 h-4" /> Bekor
                              </button>
                            )
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <p className="text-sm text-gray-500 dark:text-slate-400 text-right">
              Jami: {filtered.length} ta bron
            </p>
          </div>
        );
      })()}

      <ConfirmDialog {...dialogProps} />
    </div>
  );
}
