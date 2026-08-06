import React, { useState, useEffect } from 'react';
import { Wrench, CheckCircle2, Clock, AlertTriangle, Loader2, Play, Filter } from 'lucide-react';
import api from '../../lib/api';
import ConfirmDialog from '../../components/ConfirmDialog';
import useConfirm from '../../hooks/useConfirm';

const STATUS_LABELS = { New: 'Yangi', InProgress: 'Jarayonda', Resolved: 'Bajarildi' };
const STATUS_COLORS = {
  New: 'bg-amber-100 text-amber-700 border-amber-200',
  InProgress: 'bg-blue-100 text-blue-700 border-blue-200',
  Resolved: 'bg-emerald-100 text-emerald-700 border-emerald-200'
};

export default function UstaTasks() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [updating, setUpdating] = useState(null);
  const { confirm, dialogProps } = useConfirm();

  useEffect(() => {
    fetchRequests();
  }, [filter]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/usta/requests?status=${filter === 'All' ? '' : filter}`);
      setRequests(res.data || []);
      setError(null);
    } catch (err) {
      setError('Vazifalarni yuklashda xatolik.');
    } finally {
      setLoading(false);
    }
  };

  const showMsg = (msg, type = 'success') => {
    setMessage({ text: msg, type });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleUpdateStatus = async (req, newStatus) => {
    const actionLabel = newStatus === 'InProgress' ? 'Jarayonni boshlash' : 'Bajarildi deb belgilash';
    const roomMsg = newStatus === 'Resolved'
      ? `Xona ${req.room?.room_number} ta'mirlangan deb belgilanadi va tozalash holatiga o'tkaziladi.`
      : `Xona ${req.room?.room_number} ta'mirlash jarayoni boshlanmoqda.`;

    const ok = await confirm({
      title: actionLabel,
      message: roomMsg,
      confirmLabel: actionLabel,
      danger: false
    });
    if (!ok) return;

    setUpdating(req.id);
    setError(null);
    try {
      await api.patch(`/usta/requests/${req.id}/status`, { status: newStatus });
      showMsg(newStatus === 'Resolved' ? '✅ Vazifa bajarildi!' : '🔧 Jarayon boshlandi!');
      fetchRequests();
    } catch (err) {
      setError(err.response?.data?.error || 'Holatni yangilashda xatolik');
    } finally {
      setUpdating(null);
    }
  };

  const filters = ['All', 'New', 'InProgress', 'Resolved'];

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/25">
            <Wrench className="w-5 h-5 text-white" />
          </div>
          Mening Vazifalarim
        </h1>
        <p className="text-gray-500 mt-1 ml-13">Sizga tayinlangan ta'mirlash so'rovlari</p>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-4 h-4 text-gray-400" />
        {filters.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl font-medium text-sm transition-all ${
              filter === f
                ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {f === 'All' ? 'Barchasi' : STATUS_LABELS[f]}
          </button>
        ))}
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 shrink-0" /> {error}
        </div>
      )}
      {message && (
        <div className={`p-4 rounded-xl flex items-center gap-2 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
          <CheckCircle2 className="w-5 h-5 shrink-0" /> {message.text}
        </div>
      )}

      {/* Task Cards */}
      {loading ? (
        <div className="flex justify-center p-16">
          <Loader2 className="w-9 h-9 animate-spin text-amber-500" />
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-14 text-center">
          <CheckCircle2 className="w-14 h-14 text-emerald-300 mx-auto mb-4" />
          <p className="text-gray-500 font-medium text-lg">Hech qanday vazifa topilmadi</p>
          <p className="text-gray-400 text-sm mt-1">Sizga hozircha vazifa tayinlanmagan</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {requests.map(req => {
            const isUpdating = updating === req.id;
            const badge = STATUS_COLORS[req.status] || 'bg-gray-100 text-gray-700';
            const statusLabel = STATUS_LABELS[req.status] || req.status;
            const daysAgo = Math.floor((Date.now() - new Date(req.created_at)) / (1000 * 60 * 60 * 24));

            return (
              <div
                key={req.id}
                className={`bg-white rounded-2xl border shadow-sm flex flex-col overflow-hidden transition-all hover:shadow-md ${
                  req.status === 'Resolved' ? 'opacity-70 border-gray-100' : 'border-amber-100'
                }`}
              >
                {/* Card Top — Room + Status */}
                <div className={`p-4 flex justify-between items-center ${req.status === 'InProgress' ? 'bg-blue-50' : req.status === 'Resolved' ? 'bg-emerald-50' : 'bg-amber-50'}`}>
                  <div className="flex items-center gap-2">
                    <Wrench className={`w-5 h-5 ${req.status === 'InProgress' ? 'text-blue-500' : req.status === 'Resolved' ? 'text-emerald-500' : 'text-amber-500'}`} />
                    <span className="font-bold text-gray-900 text-lg">Xona {req.room?.room_number}</span>
                    <span className="text-xs text-gray-500">({req.room?.floor}-qavat)</span>
                  </div>
                  <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${badge}`}>
                    {statusLabel}
                  </span>
                </div>

                {/* Card Body */}
                <div className="p-4 flex-1 space-y-3">
                  <p className="text-gray-700 text-sm leading-relaxed">{req.description}</p>

                  <div className="text-xs text-gray-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {daysAgo === 0 ? 'Bugun' : `${daysAgo} kun oldin`} — {req.reporter?.full_name || 'Manager'} tomonidan
                  </div>
                </div>

                {/* Actions */}
                {req.status !== 'Resolved' && (
                  <div className="p-4 pt-0 flex gap-2">
                    {req.status === 'New' && (
                      <button
                        onClick={() => handleUpdateStatus(req, 'InProgress')}
                        disabled={isUpdating}
                        className="flex-1 flex items-center justify-center gap-2 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-semibold transition-all shadow-sm"
                      >
                        {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                        Boshlanmoqda
                      </button>
                    )}
                    {req.status === 'InProgress' && (
                      <button
                        onClick={() => handleUpdateStatus(req, 'Resolved')}
                        disabled={isUpdating}
                        className="flex-1 flex items-center justify-center gap-2 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-semibold transition-all shadow-sm"
                      >
                        {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                        Bajarildi
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
