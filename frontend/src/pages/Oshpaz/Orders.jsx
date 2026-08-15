import React, { useState, useEffect } from 'react';
import { ChefHat, Clock, CheckCircle2, AlertTriangle, Loader2, Filter, RefreshCw } from 'lucide-react';
import api from '../../lib/api';
import ConfirmDialog from '../../components/ConfirmDialog';
import useConfirm from '../../hooks/useConfirm';

const STATUS_LABELS = {
  Pending: 'Kutilmoqda',
  Accepted: 'Tayyorlanmoqda',
  Completed: 'Tayyor / Yetkazildi'
};

const STATUS_CONFIG = {
  Pending: { bg: 'bg-amber-50', border: 'border-amber-200', badge: 'bg-amber-100 text-amber-700', dot: 'bg-amber-400' },
  Accepted: { bg: 'bg-blue-50', border: 'border-blue-200', badge: 'bg-blue-100 text-blue-700', dot: 'bg-blue-400 animate-pulse' },
  Completed: { bg: 'bg-emerald-50', border: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-400' }
};

export default function OshpazOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [updating, setUpdating] = useState(null);
  const { confirm, dialogProps } = useConfirm();

  useEffect(() => {
    fetchOrders();
  }, [filter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/oshpaz/orders?status=${filter === 'All' ? '' : filter}`);
      setOrders(res.data || []);
      setError(null);
    } catch (err) {
      setError('Buyurtmalarni yuklashda xatolik.');
    } finally {
      setLoading(false);
    }
  };

  const showMsg = (text) => {
    setMessage(text);
    setTimeout(() => setMessage(null), 3000);
  };

  const handleUpdate = async (order, newStatus) => {
    const label = newStatus === 'Accepted' ? 'Tayyorlashni boshlash' : 'Tayyorlandi deb belgilash';
    const ok = await confirm({
      title: label,
      message: `Xona ${order.room?.room_number} — ${order.guest?.full_name} buyurtmasi`,
      confirmLabel: label,
      danger: false
    });
    if (!ok) return;

    setUpdating(order.id);
    try {
      await api.patch(`/oshpaz/orders/${order.id}/status`, { status: newStatus });
      showMsg(newStatus === 'Accepted' ? '🍳 Tayyorlash boshlandi!' : '✅ Buyurtma tayyor!');
      fetchOrders();
    } catch (err) {
      setError(err.response?.data?.error || 'Holatni yangilashda xatolik');
    } finally {
      setUpdating(null);
    }
  };

  const filters = ['All', 'Pending', 'Accepted', 'Completed'];

  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/25 shrink-0">
              <ChefHat className="w-5 h-5 text-white" />
            </div>
            Buyurtmalar
          </h1>
          <p className="text-sm sm:text-base text-gray-500 mt-1 sm:ml-13">Xona servis va ovqat buyurtmalari</p>
        </div>
        <button
          onClick={fetchOrders}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-xl font-medium hover:bg-gray-50 transition-all w-full sm:w-auto"
        >
          <RefreshCw className="w-4 h-4" /> Yangilash
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-4 h-4 text-gray-400" />
        {filters.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl font-medium text-sm transition-all ${
              filter === f
                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/30'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {f === 'All' ? 'Barchasi' : STATUS_LABELS[f]}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 shrink-0" /> {error}
        </div>
      )}
      {message && (
        <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 p-4 rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 shrink-0" /> {message}
        </div>
      )}

      {/* Orders */}
      {loading ? (
        <div className="flex justify-center p-16">
          <Loader2 className="w-9 h-9 animate-spin text-orange-500" />
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-14 text-center">
          <ChefHat className="w-14 h-14 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500 font-medium text-lg">Hech qanday buyurtma topilmadi</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {orders.map(order => {
            const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.Pending;
            const isUpdating = updating === order.id;

            return (
              <div
                key={order.id}
                className={`rounded-2xl border-2 shadow-sm flex flex-col overflow-hidden transition-all hover:shadow-md ${cfg.border} ${order.status === 'Completed' ? 'opacity-65' : ''}`}
              >
                {/* Card Header */}
                <div className={`p-4 ${cfg.bg} flex justify-between items-center`}>
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
                    <span className="font-bold text-gray-900">Xona {order.room?.room_number}</span>
                    <span className="text-xs text-gray-500">({order.room?.floor}-qavat)</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Clock className="w-3.5 h-3.5" />
                    {formatTime(order.created_at)}
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4 bg-white flex-1 space-y-3">
                  {/* Guest */}
                  <div className="flex items-center gap-2">
                    <span className="text-lg">👤</span>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{order.guest?.full_name}</p>
                      {order.guest?.phone && <p className="text-xs text-gray-400">{order.guest.phone}</p>}
                    </div>
                  </div>

                  {/* Order Type */}
                  <div className="flex items-center gap-2 p-3 bg-orange-50 rounded-xl">
                    <span className="text-xl">🍽️</span>
                    <div>
                      <p className="text-xs text-gray-500">Buyurtma turi</p>
                      <p className="font-bold text-gray-800">{order.request_type}</p>
                    </div>
                  </div>

                  <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${cfg.badge}`}>
                    {STATUS_LABELS[order.status] || order.status}
                  </span>
                </div>

                {/* Actions */}
                {order.status !== 'Completed' && (
                  <div className="p-4 pt-0 bg-white">
                    {order.status === 'Pending' && (
                      <button
                        onClick={() => handleUpdate(order, 'Accepted')}
                        disabled={isUpdating}
                        className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-semibold transition-all shadow-sm"
                      >
                        {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : '🍳'}
                        Tayyorlashni Boshlash
                      </button>
                    )}
                    {order.status === 'Accepted' && (
                      <button
                        onClick={() => handleUpdate(order, 'Completed')}
                        disabled={isUpdating}
                        className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-semibold transition-all shadow-sm"
                      >
                        {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                        Tayyor / Yetkazildi
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog {...dialogProps} />
    </div>
  );
}
