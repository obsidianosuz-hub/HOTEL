import React, { useState, useEffect } from 'react';
import { ChefHat, ClipboardList, Clock, CheckCircle2, AlertTriangle, Loader2, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { io } from 'socket.io-client';
import { API_ORIGIN } from '../../lib/api';
import api from '../../lib/api';
import useStore from '../../store/useStore';

export default function OshpazDashboard() {
  const { user, token } = useStore();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboard();
    
    // Socket listener for real-time order updates
    const socket = io(API_ORIGIN, { auth: { token, type: 'staff' } });
    socket.on('new-guest-request', (request) => {
      if (['FoodOrder', 'RoomService', 'Dining'].includes(request.request_type)) {
        fetchDashboard();
      }
    });

    return () => socket.disconnect();
  }, [token]);

  const fetchDashboard = async () => {
    try {
      setLoading(prev => data ? false : prev); // only show loader on first load
      const res = await api.get('/oshpaz/dashboard');
      setData(res.data);
      setError(null);
    } catch (err) {
      setError('Ma\'lumotlarni yuklashda xatolik.');
    } finally {
      setLoading(false);
    }
  };

  const stats = data ? [
    { label: 'Bugungi Buyurtmalar', value: data.totalToday, icon: ClipboardList, bg: 'bg-orange-50', text: 'text-orange-600' },
    { label: 'Kutilayotgan', value: data.pending, icon: Clock, bg: 'bg-amber-50', text: 'text-amber-600' },
    { label: 'Tayyorlandi (bugun)', value: data.completed, icon: CheckCircle2, bg: 'bg-emerald-50', text: 'text-emerald-600' },
  ] : [];

  const statusBadge = (status) => {
    const map = {
      Pending: { cls: 'bg-amber-100 text-amber-700', label: 'Kutilmoqda' },
      Accepted: { cls: 'bg-blue-100 text-blue-700', label: 'Tayyorlanmoqda' },
      Completed: { cls: 'bg-emerald-100 text-emerald-700', label: 'Tayyor' }
    };
    return map[status] || { cls: 'bg-gray-100 text-gray-700', label: status };
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-11 h-11 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/25">
              <ChefHat className="w-6 h-6 text-white" />
            </div>
            Oshpaz Paneli
          </h1>
          <p className="text-gray-500 mt-1 ml-14">Xush kelibsiz, <span className="font-semibold text-gray-700">{user?.name || 'Oshpaz'}</span> — Buyurtmalar har 30 soniyada yangilanadi</p>
        </div>
        <Link
          to="/oshpaz/orders"
          className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-semibold transition-all shadow-md shadow-orange-500/30"
        >
          Barcha Buyurtmalar <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" /> {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center p-16">
          <Loader2 className="w-9 h-9 animate-spin text-orange-500" />
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {stats.map(s => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
                    <Icon className={`w-5 h-5 ${s.text}`} />
                  </div>
                  <p className="text-3xl font-bold text-gray-900">{s.value}</p>
                  <p className="text-sm text-gray-500 mt-0.5">{s.label}</p>
                </div>
              );
            })}
          </div>

          {/* Active Orders */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-orange-50 to-amber-50">
              <div className="flex items-center gap-2">
                <ChefHat className="w-5 h-5 text-orange-500" />
                <h2 className="text-lg font-semibold text-gray-900">Faol Buyurtmalar</h2>
              </div>
              {data?.pending > 0 && (
                <span className="px-3 py-1 bg-amber-500 text-white text-sm font-bold rounded-full animate-pulse">
                  {data.pending} ta kutilmoqda
                </span>
              )}
            </div>

            {data?.recentOrders?.length === 0 ? (
              <div className="p-12 text-center text-gray-400">
                <ChefHat className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="font-medium">Hozircha faol buyurtma yo'q</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {data?.recentOrders?.map(order => {
                  const badge = statusBadge(order.status);
                  return (
                    <div key={order.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-xl">
                          🍽️
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">Xona {order.room?.room_number} — {order.guest?.full_name}</p>
                          <p className="text-sm text-gray-500">{order.request_type}</p>
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
