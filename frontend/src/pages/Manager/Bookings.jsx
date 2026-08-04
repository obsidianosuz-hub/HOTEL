import React, { useState, useEffect } from 'react';
import { Loader2, Ban, Search } from 'lucide-react';
import api from '../../lib/api';
import ConfirmDialog from '../../components/ConfirmDialog';
import useConfirm from '../../hooks/useConfirm';

export default function Bookings() {
  const [filter, setFilter] = useState('All');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { confirm, dialogProps } = useConfirm();

  useEffect(() => {
    fetchBookings();
  }, [filter]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/manager/bookings?status=${filter === 'All' ? '' : filter}`);
      setBookings(res.data || []);
      setError(null);
    } catch (err) {
      setError('Failed to load bookings.');
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">All Bookings</h1>
          <p className="text-gray-500 mt-1">Manager overview and overrides.</p>
        </div>
      </div>

      {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl">{error}</div>}

      <div className="flex gap-2 overflow-x-auto pb-2">
        {['All', 'Upcoming', 'Active', 'Completed', 'Cancelled'].map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-xl font-medium transition-all ${filter === status ? 'bg-brand-600 text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
          >
            {status}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-brand-600" /></div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="p-4 font-semibold text-gray-600">Code</th>
                <th className="p-4 font-semibold text-gray-600">Guest</th>
                <th className="p-4 font-semibold text-gray-600">Room</th>
                <th className="p-4 font-semibold text-gray-600">Dates</th>
                <th className="p-4 font-semibold text-gray-600">Status</th>
                <th className="p-4 font-semibold text-gray-600">Override</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {bookings.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-gray-500">No bookings found.</td>
                </tr>
              ) : (
                bookings.map(b => (
                  <tr key={b.booking_code} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 font-medium text-gray-900">{b.booking_code}</td>
                    <td className="p-4 text-gray-700">{b.guest?.full_name}</td>
                    <td className="p-4 text-gray-700">{b.room?.room_number || 'N/A'}</td>
                    <td className="p-4 text-sm text-gray-600">
                      {new Date(b.check_in_date).toLocaleDateString()} - {new Date(b.check_out_date).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[b.status] || 'bg-gray-100 text-gray-700'}`}>
                        {b.status}
                      </span>
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
                            <Ban className="w-4 h-4" /> Cancel
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
      )}
      <ConfirmDialog {...dialogProps} />
    </div>
  );
}
