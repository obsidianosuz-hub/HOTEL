import React, { useState, useEffect } from 'react';
import { Loader2, TrendingUp, Users, Calendar, BarChart3, ArrowDownToLine, CheckCircle2, XCircle, LogIn, LogOut } from 'lucide-react';
import api from '../../lib/api';

export default function Reports() {
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().setDate(1)).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });

  const [revenueData, setRevenueData] = useState(null);
  const [occupancyData, setOccupancyData] = useState(null);
  const [dailyData, setDailyData] = useState(null);
  const [monthlyData, setMonthlyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [revRes, occRes, dailyRes, monthlyRes] = await Promise.all([
        api.get(`/manager/analytics/revenue?from=${dateRange.from}&to=${dateRange.to}`),
        api.get('/manager/analytics/occupancy'),
        api.get('/manager/reports/daily'),
        api.get(`/manager/reports/monthly?year=${currentYear}&month=${currentMonth}`)
      ]);
      setRevenueData(revRes.data);
      setOccupancyData(occRes.data); // { "Standard": { total, occupied, rate }, ... }
      setDailyData(dailyRes.data);
      setMonthlyData(monthlyRes.data);
      setError(null);
    } catch (err) {
      setError('Tahlil ma\'lumotlarini yuklashda xatolik.');
    } finally {
      setLoading(false);
    }
  };

  // Occupancy: object by room type → compute overall rate
  const overallOccupancy = occupancyData
    ? (() => {
        const types = Object.values(occupancyData);
        const totalRooms = types.reduce((s, t) => s + t.total, 0);
        const occupiedRooms = types.reduce((s, t) => s + t.occupied, 0);
        return totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;
      })()
    : 0;

  const exportToCSV = async () => {
    let rawCsv = "Turi,Ko'rsatkich,Qiymat\n";
    
    // Revenue
    if (revenueData) {
      rawCsv += `Daromad,Jami Daromad,${revenueData.totalRevenue}\n`;
      rawCsv += `Daromad,Tranzaksiyalar soni,${revenueData.transactionCount}\n`;
    }
    
    // Occupancy
    if (occupancyData) {
      rawCsv += `Bandlik,Umumiy Bandlik,${overallOccupancy}%\n`;
      Object.entries(occupancyData).forEach(([type, data]) => {
        rawCsv += `Bandlik - ${type},Xonalar,${data.occupied}/${data.total} (${data.rate}%)\n`;
      });
    }

    // Daily
    if (dailyData) {
      rawCsv += `Kunlik (${dailyData.date}),Kirishlar,${dailyData.checkIns}\n`;
      rawCsv += `Kunlik (${dailyData.date}),Chiqishlar,${dailyData.checkOuts}\n`;
      rawCsv += `Kunlik (${dailyData.date}),Yangi Bronlar,${dailyData.newBookings}\n`;
    }

    // Monthly
    if (monthlyData) {
      rawCsv += `Oylik (${monthlyData.year}-${monthlyData.month}),Jami Bronlar,${monthlyData.totalBookings}\n`;
      rawCsv += `Oylik (${monthlyData.year}-${monthlyData.month}),Daromad,${monthlyData.revenue}\n`;
    }

    const fileName = `hisobot_${dateRange.from}_${dateRange.to}.csv`;

    try {
      const JSZip = window.JSZip;
      if (!JSZip) throw new Error('JSZip not loaded');
      const zip = new JSZip();
      zip.file(fileName, rawCsv);
      const content = await zip.generateAsync({ type: 'blob' });
      
      const url = URL.createObjectURL(content);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `hisobot_${dateRange.from}_${dateRange.to}.zip`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('ZIP export failed, falling back to CSV', err);
      const blob = new Blob([rawCsv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Hisobotlar va Tahlil</h1>
          <p className="text-gray-500 dark:text-slate-400 mt-1">Mehmonxona samaradorligi umumiy ko'rinishi.</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <button 
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-xl shadow-sm hover:bg-brand-700 transition-colors"
          >
            <ArrowDownToLine className="w-5 h-5" />
            Hisobotni Yuklab olish
          </button>
          
          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-2 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
            <Calendar className="w-5 h-5 text-gray-400 ml-2" />
            <input
              type="date"
              value={dateRange.from}
              onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
              className="p-2 outline-none text-sm font-medium bg-transparent dark:text-white"
            />
            <span className="text-gray-400">-</span>
            <input
              type="date"
              value={dateRange.to}
              onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
              className="p-2 outline-none text-sm font-medium bg-transparent dark:text-white"
            />
          </div>
        </div>
      </div>

      {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl">{error}</div>}

      {loading ? (
        <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-brand-600" /></div>
      ) : (
        <div className="space-y-8">

          {/* ── KPI Cards ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Revenue */}
            <div className="bg-gradient-to-br from-brand-600 to-brand-800 p-6 rounded-2xl shadow-lg text-white">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-brand-100 font-medium">Jami Daromad</p>
                  <h3 className="text-4xl font-bold mt-2">
                    {Number(revenueData?.totalRevenue || 0).toLocaleString()} so'm
                  </h3>
                </div>
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
              </div>
              <p className="text-sm text-brand-100 mt-4 opacity-80">
                {revenueData?.transactionCount || 0} ta to'lov • tanlangan davr uchun
              </p>
            </div>

            {/* Occupancy */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-500 dark:text-slate-400 font-medium">Joriy Bandlik</p>
                  <h3 className="text-4xl font-bold text-gray-900 dark:text-white mt-2">{overallOccupancy}%</h3>
                </div>
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                  <Users className="w-6 h-6" />
                </div>
              </div>
              <div className="w-full bg-gray-100 dark:bg-slate-700 rounded-full h-2 mt-4 overflow-hidden">
                <div className="bg-blue-600 h-2 rounded-full transition-all duration-700" style={{ width: `${overallOccupancy}%` }} />
              </div>
              {/* By room type */}
              {occupancyData && (
                <div className="mt-3 space-y-1">
                  {Object.entries(occupancyData).map(([type, data]) => (
                    <div key={type} className="flex justify-between text-xs text-gray-500 dark:text-slate-400">
                      <span>{type}</span>
                      <span>{data.occupied}/{data.total} ({data.rate}%)</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Transactions */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-500 dark:text-slate-400 font-medium">Tranzaksiyalar</p>
                  <h3 className="text-4xl font-bold text-gray-900 dark:text-white mt-2">
                    {revenueData?.transactionCount || 0}
                  </h3>
                </div>
                <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                  <BarChart3 className="w-6 h-6" />
                </div>
              </div>
              {/* By payment method */}
              {revenueData?.byMethod && Object.keys(revenueData.byMethod).length > 0 && (
                <div className="mt-4 space-y-1">
                  {Object.entries(revenueData.byMethod).map(([method, amount]) => (
                    <div key={method} className="flex justify-between text-xs text-gray-500 dark:text-slate-400">
                      <span>{method}</span>
                      <span className="font-medium text-gray-700 dark:text-slate-300">{Number(amount).toLocaleString()} so'm</span>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-sm text-gray-400 mt-3">Tanlangan davr uchun</p>
            </div>
          </div>

          {/* ── Bugungi Hisobot ── */}
          {dailyData && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-brand-600" />
                Bugungi Hisobot
                <span className="text-sm font-normal text-gray-400 ml-2">{dailyData.date}</span>
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Kirish', value: dailyData.checkIns, icon: LogIn, color: 'text-green-600 bg-green-50' },
                  { label: 'Chiqish', value: dailyData.checkOuts, icon: LogOut, color: 'text-red-500 bg-red-50' },
                  { label: 'Yangi Bronlar', value: dailyData.newBookings, icon: BarChart3, color: 'text-blue-600 bg-blue-50' },
                  { label: 'Bugungi Daromad', value: `${Number(dailyData.revenue).toLocaleString()} so'm`, icon: TrendingUp, color: 'text-brand-600 bg-brand-50' },
                ].map(({ label, value, icon: Icon, color }) => (
                  <div key={label} className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-slate-800 rounded-xl">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-slate-400">{label}</p>
                      <p className="font-bold text-gray-900 dark:text-white">{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Oylik Hisobot ── */}
          {monthlyData && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-purple-600" />
                Oylik Hisobot
                <span className="text-sm font-normal text-gray-400 ml-2">{monthlyData.year}-{String(monthlyData.month).padStart(2, '0')}</span>
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Jami Bronlar', value: monthlyData.totalBookings, icon: BarChart3, color: 'text-blue-600 bg-blue-50' },
                  { label: 'Bajarilgan', value: monthlyData.completedBookings, icon: CheckCircle2, color: 'text-green-600 bg-green-50' },
                  { label: 'Bekor qilingan', value: monthlyData.cancellations, icon: XCircle, color: 'text-red-500 bg-red-50' },
                  { label: 'Oylik Daromad', value: `${Number(monthlyData.revenue).toLocaleString()} so'm`, icon: TrendingUp, color: 'text-brand-600 bg-brand-50' },
                ].map(({ label, value, icon: Icon, color }) => (
                  <div key={label} className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-slate-800 rounded-xl">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-slate-400">{label}</p>
                      <p className="font-bold text-gray-900 dark:text-white">{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
