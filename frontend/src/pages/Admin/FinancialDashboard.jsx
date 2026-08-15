import React, { useState, useEffect } from 'react';
import { Loader2, DollarSign, TrendingUp, AlertCircle, Calendar, CreditCard, PieChart } from 'lucide-react';
import api from '../../lib/api';

export default function FinancialDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/financial/dashboard');
      setData(res.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || "Moliyaviy ma'lumotlarni yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex justify-center p-20"><Loader2 className="w-10 h-10 animate-spin text-brand-600" /></div>;
  if (error) return <div className="p-6"><div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-2"><AlertCircle className="w-5 h-5"/> {error}</div></div>;

  const formatMoney = (val) => {
    return new Intl.NumberFormat('uz-UZ', { style: 'currency', currency: 'UZS', maximumFractionDigits: 0 }).format(val || 0);
  };

  const stats = [
    { label: 'Bugungi daromad', value: data?.todayRevenue, icon: Calendar, bg: 'bg-emerald-50', text: 'text-emerald-600' },
    { label: 'Shu oydagi daromad', value: data?.monthRevenue, icon: TrendingUp, bg: 'bg-blue-50', text: 'text-blue-600' },
    { label: 'Kutilayotgan to\'lovlar', value: data?.pendingPayments, icon: AlertCircle, bg: 'bg-amber-50', text: 'text-amber-600' },
    { label: 'Umumiy xarajatlar', value: data?.totalVendorExpenses, icon: CreditCard, bg: 'bg-red-50', text: 'text-red-600' },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><PieChart className="w-6 h-6 text-brand-600"/> Moliyaviy Dashboard</h1>
          <p className="text-gray-500 mt-1">Daromadlar, xarajatlar va kutilayotgan to'lovlar hisoboti</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, idx) => (
          <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${s.bg}`}>
              <s.icon className={`w-6 h-6 ${s.text}`} />
            </div>
            <p className="text-sm font-medium text-gray-500 mb-1">{s.label}</p>
            <p className="text-2xl font-bold text-gray-900">{formatMoney(s.value)}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center items-center text-center">
          <div className="w-16 h-16 bg-brand-50 rounded-full flex items-center justify-center mb-4">
            <DollarSign className="w-8 h-8 text-brand-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-500 mb-2">Umumiy Daromad</h3>
          <p className="text-4xl font-bold text-gray-900">{formatMoney(data?.totalRevenue)}</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center items-center text-center">
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-4">
            <TrendingUp className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-500 mb-2">Sof Foyda (Net Profit)</h3>
          <p className={`text-4xl font-bold ${data?.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatMoney(data?.netProfit)}
          </p>
        </div>
      </div>
    </div>
  );
}
