import React, { useState, useEffect } from 'react';
import { Wrench, CheckCircle2, Clock, AlertTriangle, Loader2, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import useStore from '../../store/useStore';

export default function UstaDashboard() {
  const { user } = useStore();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.get('/usta/dashboard');
      setData(res.data);
      setError(null);
    } catch (err) {
      setError('Ma\'lumotlarni yuklashda xatolik.');
    } finally {
      setLoading(false);
    }
  };

  const stats = data ? [
    { label: 'Yangi Vazifalar', value: data.newRequests, icon: AlertTriangle, color: 'from-amber-500 to-orange-600', bg: 'bg-amber-50', text: 'text-amber-700' },
    { label: 'Jarayondagi', value: data.inProgress, icon: Clock, color: 'from-blue-500 to-blue-700', bg: 'bg-blue-50', text: 'text-blue-700' },
    { label: 'Bajarilgan', value: data.resolved, icon: CheckCircle2, color: 'from-emerald-500 to-emerald-700', bg: 'bg-emerald-50', text: 'text-emerald-700' },
    { label: 'Jami Tayinlangan', value: data.total, icon: Wrench, color: 'from-slate-500 to-slate-700', bg: 'bg-slate-50', text: 'text-slate-700' },
  ] : [];

  const statusBadge = (status) => {
    const map = {
      New: 'bg-amber-100 text-amber-700',
      InProgress: 'bg-blue-100 text-blue-700',
      Resolved: 'bg-emerald-100 text-emerald-700'
    };
    const labels = { New: 'Yangi', InProgress: 'Jarayonda', Resolved: 'Bajarildi' };
    return { cls: map[status] || 'bg-gray-100 text-gray-700', label: labels[status] || status };
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-11 h-11 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/25">
              <Wrench className="w-6 h-6 text-white" />
            </div>
            Usta Paneli
          </h1>
          <p className="text-gray-500 mt-1 ml-14">Xush kelibsiz, <span className="font-semibold text-gray-700">{user?.name || 'Usta'}</span></p>
        </div>
        <Link
          to="/usta/tasks"
          className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-semibold transition-all shadow-md shadow-amber-500/30"
        >
          Barcha Vazifalar <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" /> {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center p-16">
          <Loader2 className="w-9 h-9 animate-spin text-amber-500" />
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
                    <Icon className={`w-5 h-5 ${s.text}`} />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                  <p className="text-sm text-gray-500 mt-0.5">{s.label}</p>
                </div>
              );
            })}
          </div>

          {/* Recent Active Requests */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">Faol Vazifalar</h2>
              <Link to="/usta/tasks" className="text-sm text-amber-600 hover:text-amber-700 font-medium flex items-center gap-1">
                Barchasi <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            {data?.recentRequests?.length === 0 ? (
              <div className="p-10 text-center text-gray-400">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-emerald-300" />
                <p className="font-medium">Ajoyib! Barcha vazifalar bajarilgan.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {data?.recentRequests?.map(req => {
                  const badge = statusBadge(req.status);
                  return (
                    <div key={req.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center">
                          <Wrench className="w-5 h-5 text-amber-500" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">Xona {req.room?.room_number}</p>
                          <p className="text-sm text-gray-500 line-clamp-1">{req.description}</p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${badge.cls}`}>{badge.label}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
