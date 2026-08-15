import React, { useState, useEffect } from 'react';
import { Loader2, DollarSign, TrendingUp, TrendingDown, ArrowRightLeft, Calendar, RefreshCw, AlertCircle } from 'lucide-react';
import api from '../../lib/api';

export default function Finances() {
  const [period, setPeriod] = useState('month');
  const [revenueData, setRevenueData] = useState(null);
  const [dailyData, setDailyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Date ranges per period
  const getDateRange = (p) => {
    if (p === 'custom') return { from: dateFrom, to: dateTo };
    const now = new Date();
    const to = now.toISOString().split('T')[0];
    let from;
    if (p === 'week') {
      const d = new Date(now); d.setDate(d.getDate() - 7);
      from = d.toISOString().split('T')[0];
    } else if (p === 'month') {
      from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    } else {
      from = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
    }
    return { from, to };
  };

  useEffect(() => {
    if (period !== 'custom') {
      fetchData();
    }
  }, [period]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const { from, to } = getDateRange(period);
      if (period === 'custom' && (!from || !to)) {
        setError('Iltimos, sanalarni kiriting.');
        setLoading(false);
        return;
      }
      
      const [revRes, dailyRes] = await Promise.all([
        api.get(`/manager/analytics/revenue?from=${from}&to=${to}`),
        api.get('/manager/reports/daily'), // Note: this endpoint might not support custom dates yet, we'll leave it as is
      ]);
      setRevenueData(revRes.data);
      setDailyData(dailyRes.data);
    } catch (err) {
      setError('Moliyaviy ma\'lumotlarni yuklashda xatolik.');
    } finally {
      setLoading(false);
    }
  };

  const total = revenueData?.totalRevenue || 0;
  const txCount = revenueData?.transactionCount || 0;
  const byMethod = revenueData?.byMethod || {};

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/25">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            Moliya va Kassa
          </h1>
          <p className="text-gray-500 dark:text-slate-400 mt-1 ml-[52px]">Daromad va to'lovlar tahlili.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 rounded-xl p-1 border border-gray-200 dark:border-slate-700">
            {['week', 'month', 'year', 'custom'].map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${period === p ? 'bg-gray-100 dark:bg-slate-700 text-gray-900 dark:text-white' : 'text-gray-500 dark:text-slate-400 hover:text-gray-700'}`}
              >
                {p === 'week' ? 'Hafta' : p === 'month' ? 'Oy' : p === 'year' ? 'Yil' : 'Maxsus'}
              </button>
            ))}
          </div>
          
          {period === 'custom' && (
            <div className="flex items-center gap-2">
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-500" />
              <span className="text-gray-400">-</span>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-500" />
              <button onClick={fetchData} className="px-3 py-1.5 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors">Ko'rish</button>
            </div>
          )}

          <button onClick={fetchData} className="p-2 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition-colors" title="Yangilash">
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 p-4 rounded-xl flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-brand-600" /></div>
      ) : (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Total Revenue */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-gray-100 dark:border-slate-700 shadow-sm relative overflow-hidden group">
              <div className="absolute -right-6 -top-6 w-24 h-24 bg-emerald-50 dark:bg-emerald-900/20 rounded-full group-hover:scale-150 transition-transform duration-500" />
              <div className="relative">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-slate-400 mb-2">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                  Jami Daromad
                </div>
                <h3 className="text-3xl font-bold text-emerald-600">
                  {Number(total).toLocaleString()} <span className="text-lg font-normal">so'm</span>
                </h3>
                <p className="text-xs text-gray-400 dark:text-slate-500 mt-2">
                  {period === 'week' ? "So'nggi 7 kun" : period === 'month' ? 'Joriy oy' : 'Joriy yil'}
                </p>
              </div>
            </div>

            {/* Transactions */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-gray-100 dark:border-slate-700 shadow-sm relative overflow-hidden group">
              <div className="absolute -right-6 -top-6 w-24 h-24 bg-blue-50 dark:bg-blue-900/20 rounded-full group-hover:scale-150 transition-transform duration-500" />
              <div className="relative">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-slate-400 mb-2">
                  <ArrowRightLeft className="w-4 h-4 text-blue-500" />
                  To'lovlar Soni
                </div>
                <h3 className="text-3xl font-bold text-gray-900 dark:text-white">{txCount}</h3>
                <p className="text-xs text-gray-400 dark:text-slate-500 mt-2">Bajarilgan to'lovlar</p>
              </div>
            </div>

            {/* Today */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-gray-100 dark:border-slate-700 shadow-sm relative overflow-hidden group">
              <div className="absolute -right-6 -top-6 w-24 h-24 bg-brand-50 dark:bg-brand-900/20 rounded-full group-hover:scale-150 transition-transform duration-500" />
              <div className="relative">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-slate-400 mb-2">
                  <Calendar className="w-4 h-4 text-brand-500" />
                  Bugungi Daromad
                </div>
                <h3 className="text-3xl font-bold text-brand-600">
                  {dailyData ? Number(dailyData.revenue).toLocaleString() : '—'} <span className="text-lg font-normal">so'm</span>
                </h3>
                <p className="text-xs text-gray-400 dark:text-slate-500 mt-2">{dailyData?.date}</p>
              </div>
            </div>
          </div>

          {/* Payment Methods Breakdown */}
          {Object.keys(byMethod).length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-100 dark:border-slate-700 flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-brand-600" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">To'lov Usullari Bo'yicha</h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {Object.entries(byMethod).map(([method, amount]) => {
                    const pct = total > 0 ? Math.round((amount / total) * 100) : 0;
                    return (
                      <div key={method}>
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="text-sm font-medium text-gray-700 dark:text-slate-300 capitalize">{method}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-gray-400">{pct}%</span>
                            <span className="font-bold text-gray-900 dark:text-white text-sm">
                              {Number(amount).toLocaleString()} so'm
                            </span>
                          </div>
                        </div>
                        <div className="w-full bg-gray-100 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                          <div
                            className="h-2 rounded-full bg-gradient-to-r from-brand-500 to-brand-600 transition-all duration-700"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Daily Activity */}
          {dailyData && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-500" />
                Bugungi Faollik
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Kirgan mehmonlar', value: dailyData.checkIns, color: 'text-green-600 bg-green-50 dark:bg-green-900/20' },
                  { label: 'Chiqqan mehmonlar', value: dailyData.checkOuts, color: 'text-red-500 bg-red-50 dark:bg-red-900/20' },
                  { label: 'Yangi bronlar', value: dailyData.newBookings, color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' },
                  { label: 'Bugungi daromad', value: `${Number(dailyData.revenue).toLocaleString()} so'm`, color: 'text-brand-600 bg-brand-50 dark:bg-brand-900/20' },
                ].map(({ label, value, color }) => (
                  <div key={label} className={`p-4 rounded-xl ${color}`}>
                    <p className="text-xs font-medium opacity-70 mb-1">{label}</p>
                    <p className="text-xl font-bold">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Info note about expenses */}
          {Object.keys(byMethod).length === 0 && !loading && (
            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-6 text-center">
              <p className="text-gray-500 dark:text-slate-400">
                Tanlangan davr uchun to'lov ma'lumotlari topilmadi.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
