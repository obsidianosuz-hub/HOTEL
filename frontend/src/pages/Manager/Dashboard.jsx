import { useState, useEffect } from 'react';
import {
  Loader2,
  BarChart3,
  DollarSign,
  CalendarCheck,
  Wrench,
  BedDouble,
  Users,
  Clock,
  AlertCircle,
  RefreshCw,
  TrendingUp,
  Filter,
  Globe,
  Briefcase
} from 'lucide-react';
import api from '../../lib/api';

export default function ManagerDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [bookingsLoading, setBookingsLoading] = useState(false);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await api.get('/manager/dashboard');
      setDashboard(data);
    } catch (err) {
      setError('Dashboard ma\'lumotlarini yuklashda xatolik. Qaytadan urinib ko\'ring.');
      setDashboard(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchBookings = async (status = '') => {
    try {
      setBookingsLoading(true);
      const { data } = await api.get(`/manager/bookings?status=${status}`);
      setBookings(Array.isArray(data) ? data : data.bookings || []);
    } catch (err) {
      // Fallback mock data
      const mockBookings = [
        { id: '1', guest_name: 'John Doe', room: { room_number: '101' }, check_in: '2026-08-04', check_out: '2026-08-08', status: 'Checked-in', total_price: 450 },
        { id: '2', guest_name: 'Jane Smith', room: { room_number: '205' }, check_in: '2026-08-05', check_out: '2026-08-10', status: 'Confirmed', total_price: 600 },
        { id: '3', guest_name: 'Bob Johnson', room: { room_number: '302' }, check_in: '2026-08-03', check_out: '2026-08-05', status: 'Checked-out', total_price: 240 }
      ];
      setBookings(mockBookings.filter(b => status ? b.status.toLowerCase() === status.toLowerCase() : true));
    } finally {
      setBookingsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
    fetchBookings();
  }, []);

  useEffect(() => {
    fetchBookings(statusFilter);
  }, [statusFilter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-brand-600 mx-auto" />
          <p className="mt-4 text-sm text-gray-500 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Something went wrong</h3>
          <p className="text-sm text-gray-500 mb-4">{error}</p>
          <button onClick={fetchDashboard} className="btn-primary inline-flex items-center gap-2">
            <RefreshCw className="w-4 h-4" /> Retry
          </button>
        </div>
      </div>
    );
  }

  const stats = [
    {
      title: 'Occupancy Rate',
      value: `${dashboard?.occupancyRate ?? 0}%`,
      subtitle: `${dashboard?.occupiedRooms ?? 0} / ${dashboard?.totalRooms ?? 0} rooms`,
      icon: BarChart3,
      color: 'text-brand-600',
      bg: 'bg-brand-100',
      ring: 'ring-brand-500/20',
    },
    {
      title: "Today's Revenue",
      value: `$${(dashboard?.todayRevenue ?? 0).toLocaleString()}`,
      subtitle: 'Earnings today',
      icon: DollarSign,
      color: 'text-emerald-600',
      bg: 'bg-emerald-100',
      ring: 'ring-emerald-500/20',
    },
    {
      title: 'Active Bookings',
      value: dashboard?.activeBookings ?? 0,
      subtitle: 'Currently active',
      icon: CalendarCheck,
      color: 'text-blue-600',
      bg: 'bg-blue-100',
      ring: 'ring-blue-500/20',
    },
    {
      title: 'Pending Maintenance',
      value: dashboard?.pendingMaintenance ?? 0,
      subtitle: 'Requires attention',
      icon: Wrench,
      color: 'text-amber-600',
      bg: 'bg-amber-100',
      ring: 'ring-amber-500/20',
    },
  ];

  // Channel calculation
  const totalBookingsCount = (dashboard?.channels?.bookingCom?.count || 0) + (dashboard?.channels?.direct?.count || 0);
  const bookingComPercent = totalBookingsCount ? Math.round((dashboard.channels.bookingCom.count / totalBookingsCount) * 100) : 0;
  const directPercent = totalBookingsCount ? 100 - bookingComPercent : 0;
  const commissionRate = dashboard?.channels?.bookingCom?.commissionRate || 0;
  const isHighCommission = commissionRate > 15;

  const statusColors = {
    PendingPayment: 'bg-yellow-100 text-yellow-700',
    Upcoming: 'bg-blue-100 text-blue-700',
    Active: 'bg-emerald-100 text-emerald-700',
    Completed: 'bg-gray-100 text-gray-600',
    Cancelled: 'bg-red-100 text-red-700',
  };

  const filterOptions = [
    { label: 'All', value: '' },
    { label: 'Upcoming', value: 'Upcoming' },
    { label: 'Active', value: 'Active' },
    { label: 'Completed', value: 'Completed' },
    { label: 'Cancelled', value: 'Cancelled' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-brand-500 to-brand-700 rounded-xl flex items-center justify-center shadow-lg shadow-brand-500/25">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            Manager Dashboard
          </h1>
          <p className="text-sm text-gray-500 mt-1 ml-[52px]">Hotel operations overview at a glance.</p>
        </div>
        <button
          onClick={() => { fetchDashboard(); fetchBookings(statusFilter); }}
          className="btn-secondary inline-flex items-center gap-2 self-start"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {isHighCommission && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-4 animate-in slide-in-from-top-4">
          <AlertCircle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-900">High OTA Commission Warning!</h3>
            <p className="text-red-700 text-sm mt-1">
              Booking.com commission rate is currently at <strong>{commissionRate}%</strong>. This exceeds the recommended 15% threshold. Consider promoting Direct Bookings to improve profit margins.
            </p>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div
              key={i}
              className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 group cursor-default"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${stat.bg} ${stat.color} ring-4 ${stat.ring} group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
              <h3 className="text-3xl font-bold text-gray-900 tracking-tight">{stat.value}</h3>
              <p className="text-sm font-medium text-gray-500 mt-1">{stat.title}</p>
              <p className="text-xs text-gray-400 mt-0.5">{stat.subtitle}</p>
            </div>
          );
        })}
      </div>

      {/* Occupancy Progress Bar */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <BedDouble className="w-5 h-5 text-brand-600" />
            <h2 className="text-lg font-semibold text-gray-900">Room Occupancy</h2>
          </div>
          <span className="text-sm font-medium text-gray-500">
            {dashboard?.occupiedRooms ?? 0} occupied of {dashboard?.totalRooms ?? 0} total
          </span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-brand-500 to-brand-600 rounded-full transition-all duration-1000 ease-out relative"
            style={{ width: `${Math.min(dashboard?.occupancyRate ?? 0, 100)}%` }}
          >
            <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full" />
          </div>
        </div>
      </div>

      {/* Channel Performance */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-3">
          <Globe className="w-5 h-5 text-brand-600" />
          Channel Performance
        </h2>
        
        <div className="flex flex-col lg:flex-row gap-8 items-center">
          <div className="w-full lg:w-1/2">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-gray-700 flex items-center gap-2"><Globe className="w-4 h-4 text-blue-500"/> Booking.com</span>
              <span className="font-bold text-gray-900">{bookingComPercent}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3 mb-6">
              <div className="h-full bg-blue-500 rounded-full" style={{ width: `${bookingComPercent}%` }}></div>
            </div>

            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-gray-700 flex items-center gap-2"><Briefcase className="w-4 h-4 text-emerald-500"/> Direct Booking</span>
              <span className="font-bold text-gray-900">{directPercent}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${directPercent}%` }}></div>
            </div>
          </div>
          
          <div className="w-full lg:w-1/2 grid grid-cols-2 gap-4">
             <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
               <p className="text-sm text-gray-500 mb-1">Booking.com Revenue</p>
               <p className="text-xl font-bold text-gray-900">${(dashboard?.channels?.bookingCom?.revenue || 0).toLocaleString()}</p>
             </div>
             <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
               <p className="text-sm text-gray-500 mb-1">Direct Revenue</p>
               <p className="text-xl font-bold text-gray-900">${(dashboard?.channels?.direct?.revenue || 0).toLocaleString()}</p>
             </div>
             <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 col-span-2">
               <p className="text-sm text-gray-500 mb-1">Total Bookings Count</p>
               <p className="text-xl font-bold text-gray-900">{totalBookingsCount} bookings</p>
             </div>
          </div>
        </div>
      </div>

      {/* Recent Bookings */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-brand-600" />
              <h2 className="text-lg font-semibold text-gray-900">Recent Bookings</h2>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
                {filterOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setStatusFilter(opt.value)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${
                      statusFilter === opt.value
                        ? 'bg-white text-brand-700 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {bookingsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-brand-600" />
            </div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-12">
              <CalendarCheck className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">No bookings found</p>
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50/80 text-gray-500 uppercase text-xs font-semibold">
                <tr>
                  <th className="px-6 py-4">Guest</th>
                  <th className="px-6 py-4">Room</th>
                  <th className="px-6 py-4">Check In</th>
                  <th className="px-6 py-4">Check Out</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {bookings.slice(0, 10).map((booking) => (
                  <tr key={booking.id || booking.booking_code} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-xs font-bold">
                          {(booking.guest?.full_name || 'G').charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-gray-900">
                          {booking.guest?.full_name || 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{booking.room?.room_number || 'N/A'}</td>
                    <td className="px-6 py-4 text-gray-600">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        {booking.check_in_date ? new Date(booking.check_in_date).toLocaleDateString() : 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {booking.check_out_date ? new Date(booking.check_out_date).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusColors[booking.status] || 'bg-gray-100 text-gray-600'}`}>
                        {booking.status || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-gray-900">
                      ${(booking.total_price ?? 0).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
