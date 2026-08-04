import React, { useState, useEffect } from 'react';
import { Loader2, Globe2, Building2, AlertTriangle, Calendar } from 'lucide-react';
import api from '../../lib/api';

export default function ChannelPerformance() {
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().setDate(1)).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/manager/analytics/channel-performance?from=${dateRange.from}&to=${dateRange.to}`);
      setData(res.data);
      setError(null);
    } catch (err) {
      setError('Failed to load channel performance data.');
    } finally {
      setLoading(false);
    }
  };

  const fmt = (n) => Number(n || 0).toLocaleString();

  const cards = data ? [
    { key: 'direct', title: 'Direct (Walk-in/Phone)', icon: Building2, color: 'from-slate-600 to-slate-800', group: data.direct, showCommission: false },
    { key: 'bookingComGuestPaid', title: 'Booking.com — Guest Paid', icon: Globe2, color: 'from-indigo-600 to-indigo-800', group: data.bookingComGuestPaid, showCommission: true },
    { key: 'bookingComHotelCollect', title: 'Booking.com — Pay at Hotel', icon: Globe2, color: 'from-sky-600 to-sky-800', group: data.bookingComHotelCollect, showCommission: true }
  ] : [];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Channel Performance</h1>
          <p className="text-gray-500 mt-1">Revenue and commission breakdown by booking source.</p>
        </div>

        <div className="flex items-center gap-2 bg-white p-2 rounded-xl shadow-sm border border-gray-100">
          <Calendar className="w-5 h-5 text-gray-400 ml-2" />
          <input
            type="date"
            value={dateRange.from}
            onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
            className="p-2 outline-none text-sm font-medium"
          />
          <span className="text-gray-400">-</span>
          <input
            type="date"
            value={dateRange.to}
            onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
            className="p-2 outline-none text-sm font-medium"
          />
        </div>
      </div>

      {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl">{error}</div>}

      {loading ? (
        <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-brand-600" /></div>
      ) : data && (
        <div className="space-y-6">
          {data.highCommissionWarning && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>Booking.com dependency is high — commission is {data.commissionRateOfTotal}% of total revenue. Consider promoting Direct bookings.</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {cards.map(c => (
              <div key={c.key} className={`bg-gradient-to-br ${c.color} p-6 rounded-2xl shadow-lg text-white`}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-white/80 font-medium text-sm">{c.title}</p>
                    <h3 className="text-3xl font-bold mt-2">{fmt(c.group?.grossRevenue)} so'm</h3>
                  </div>
                  <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                    <c.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
                <p className="text-sm text-white/80 mt-4">{c.group?.bookingCount || 0} booking(s)</p>
                {c.showCommission && (
                  <div className="mt-3 pt-3 border-t border-white/20 space-y-1 text-sm text-white/90">
                    <div className="flex justify-between"><span>Commission paid</span><span>{fmt(c.group?.commissionPaid)} so'm</span></div>
                    <div className="flex justify-between font-semibold"><span>Net to hotel</span><span>{fmt(c.group?.netRevenue)} so'm</span></div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Summary</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Total gross revenue</p>
                <p className="text-xl font-bold text-gray-900">{fmt(data.totalGrossRevenue)} so'm</p>
              </div>
              <div>
                <p className="text-gray-500">Total commission paid</p>
                <p className="text-xl font-bold text-gray-900">{fmt(data.totalCommissionPaid)} so'm</p>
              </div>
              <div>
                <p className="text-gray-500">Commission as % of revenue</p>
                <p className={`text-xl font-bold ${data.highCommissionWarning ? 'text-amber-600' : 'text-gray-900'}`}>{data.commissionRateOfTotal}%</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
