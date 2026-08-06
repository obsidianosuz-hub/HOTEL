import React, { useState, useEffect } from 'react';
import { Loader2, Wrench, AlertTriangle, CheckCircle2, Lock, Unlock, Info } from 'lucide-react';
import api from '../../lib/api';
import ConfirmDialog from '../../components/ConfirmDialog';
import useConfirm from '../../hooks/useConfirm';

export default function Maintenance() {
  const [requests, setRequests] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [ustaUsers, setUstaUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const { confirm, dialogProps } = useConfirm();

  const [assigningRequest, setAssigningRequest] = useState(null);
  const [assigneeId, setAssigneeId] = useState('');
  const [submitting, setSubmitting] = useState(false);



  const [blockingRoomId, setBlockingRoomId] = useState(null);

  useEffect(() => {
    fetchRequests();
    fetchRooms();
    fetchUstaUsers();
  }, []);

  const fetchUstaUsers = async () => {
    try {
      const res = await api.get('/manager/usta-users');
      setUstaUsers(res.data || []);
    } catch (err) {
      // non-fatal, fallback to text input
    }
  };

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await api.get('/manager/maintenance-requests');
      setRequests(res.data || []);
    } catch (err) {
      setError('Failed to load maintenance requests.');
    } finally {
      setLoading(false);
    }
  };

  const fetchRooms = async () => {
    try {
      const res = await api.get('/manager/rooms');
      setRooms(res.data || []);
    } catch (err) {
      // non-fatal
    }
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!assigneeId) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.post(`/manager/maintenance-requests/${assigningRequest.id}/assign`, {
        assigned_to_user_id: parseInt(assigneeId)
      });
      setAssigningRequest(null);
      setAssigneeId('');
      setMessage('Usta muvaffaqiyatli tayinlandi.');
      fetchRequests();
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Tayinlashda xatolik');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResolve = async (id) => {
    setError(null);
    try {
      await api.post(`/manager/maintenance-requests/${id}/resolve`);
      setMessage('Request resolved.');
      fetchRequests();
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to resolve request');
    }
  };



  const handleToggleBlock = async (room) => {
    const blocking = room.reception_status !== 'Maintenance';
    const ok = await confirm({
      title: blocking ? `Block Room ${room.room_number} (Out of Order)?` : `Unblock Room ${room.room_number}?`,
      message: blocking 
        ? 'This takes the room out of service due to maintenance. The room will automatically be blocked on Booking.com and the internal system. No one will be able to book it.' 
        : 'This will restore the room to Available status and instantly reopen it on Booking.com and internally.',
      confirmLabel: blocking ? 'Block & Sync' : 'Unblock',
      danger: blocking
    });
    if (!ok) return;
    setBlockingRoomId(room.id);
    setError(null);
    try {
      await api.put(`/manager/rooms/${room.id}/status`, { reception_status: blocking ? 'Maintenance' : 'Available' });
      setMessage(blocking ? 'Room blocked.' : 'Room unblocked.');
      fetchRooms();
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update room status');
    } finally {
      setBlockingRoomId(null);
    }
  };

  const blockableRooms = rooms.filter(r => r.reception_status === 'Available' || r.reception_status === 'Maintenance');

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Maintenance</h1>
          <p className="text-gray-500 mt-1">Assign technicians, track requests, and block rooms out of service.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 border border-blue-100 text-blue-700 rounded-xl text-sm">
          <Info className="w-4 h-4 shrink-0" />
          Nosozliklar farroshlar tomonidan aniqlanadi va Housekeeping panelidan yuboriladi
        </div>
      </div>

      {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-2"><AlertTriangle className="w-5 h-5" /> {error}</div>}
      {message && <div className="bg-green-50 text-green-700 p-4 rounded-xl flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> {message}</div>}

      {loading ? (
        <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-brand-600" /></div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {requests.length === 0 ? (
            <div className="col-span-full p-8 text-center text-gray-500 bg-white rounded-2xl border border-gray-100">No active maintenance requests.</div>
          ) : (
            requests.map(req => (
              <div key={req.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <Wrench className="w-5 h-5 text-gray-400" />
                    <span className="font-bold text-lg text-gray-900">Room {req.room?.room_number || 'N/A'}</span>
                  </div>
                </div>

                <p className="text-gray-700 text-sm flex-1">{req.description}</p>

                {req.assigned_to && (
                  <p className="text-xs text-gray-500">Assigned to: <span className="font-medium text-gray-700">{req.assigned_to}</span></p>
                )}

                <div className="mt-2 pt-3 border-t border-gray-100 space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Status:</span>
                    <span className={`px-2 py-1 rounded-md font-medium text-xs ${req.status === 'Resolved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {req.status}
                    </span>
                  </div>

                  {req.status !== 'Resolved' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setAssigningRequest(req); setAssigneeName(req.assigned_to || ''); }}
                        className="flex-1 py-1.5 bg-brand-50 text-brand-700 hover:bg-brand-100 rounded-lg text-sm font-medium transition-colors"
                      >
                        Assign
                      </button>
                      <button
                        onClick={() => handleResolve(req.id)}
                        className="flex-1 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
                      >
                        Resolve
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Quick room block/unblock */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-3">Block / Unblock Rooms</h2>
        <p className="text-sm text-gray-500 -mt-2">Take a room out of service (e.g. broken AC) without going through Admin.</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {blockableRooms.map(room => {
            const blocked = room.reception_status === 'Maintenance';
            return (
              <button
                key={room.id}
                onClick={() => handleToggleBlock(room)}
                disabled={blockingRoomId === room.id}
                className={`p-3 rounded-xl border text-left transition-colors ${blocked ? 'bg-red-50 border-red-200 hover:bg-red-100' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-900">{room.room_number}</span>
                  {blockingRoomId === room.id ? <Loader2 className="w-4 h-4 animate-spin text-gray-400" /> : blocked ? <Unlock className="w-4 h-4 text-red-500" /> : <Lock className="w-4 h-4 text-gray-400" />}
                </div>
                <p className={`text-xs mt-1 ${blocked ? 'text-red-600' : 'text-gray-500'}`}>{blocked ? 'Blocked' : 'Available'}</p>
              </button>
            );
          })}
          {blockableRooms.length === 0 && (
            <div className="col-span-full text-center text-gray-400 py-4">No rooms available to toggle right now.</div>
          )}
        </div>
      </div>

      {assigningRequest && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Assign Technician</h2>
              <p className="text-sm text-gray-500 mt-1">Room {assigningRequest.room?.room_number || 'N/A'} — {assigningRequest.description}</p>
            </div>
            <form onSubmit={handleAssignSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Usta tanlang</label>
                {ustaUsers.length > 0 ? (
                  <select
                    required
                    value={assigneeId}
                    onChange={e => setAssigneeId(e.target.value)}
                    className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none bg-white"
                  >
                    <option value="" disabled>Usta tanlang...</option>
                    {ustaUsers.map(u => (
                      <option key={u.id} value={u.id}>{u.full_name}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    required autoFocus type="text"
                    value={assigneeId}
                    onChange={e => setAssigneeId(e.target.value)}
                    className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                    placeholder="Usta ismini kiriting..."
                  />
                )}
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setAssigningRequest(null)} className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors font-medium">Cancel</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors font-medium flex items-center gap-2">
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Assign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}



      <ConfirmDialog {...dialogProps} />
    </div>
  );
}
