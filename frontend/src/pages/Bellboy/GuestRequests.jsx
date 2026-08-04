import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import { Loader2, Bell, AlertCircle, CheckCircle, Home } from 'lucide-react';

export default function GuestRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await api.get('/bellboy/guest-requests');
      setRequests(res.data || []);
      setError(null);
    } catch (err) {
      setError('Failed to load guest requests. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (id) => {
    setError(null);
    try {
      await api.post(`/bellboy/guest-requests/${id}/accept`);
      fetchRequests();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to accept request');
    }
  };

  const handleComplete = async (id) => {
    setError(null);
    try {
      await api.post(`/bellboy/guest-requests/${id}/complete`);
      fetchRequests();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to complete request');
    }
  };

  if (loading) return (
    <div className="flex h-64 items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
    </div>
  );

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Guest Requests</h1>
          <p className="text-sm text-gray-500 mt-1">Direct requests and needs from hotel guests.</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {requests.length === 0 ? (
          <div className="col-span-full py-16 flex flex-col items-center justify-center text-gray-500 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
            <Bell className="w-12 h-12 text-gray-300 mb-3" />
            <p className="text-lg font-medium">No pending requests</p>
            <p className="text-sm text-gray-400">All guests are currently satisfied.</p>
          </div>
        ) : (
          requests.map((req) => (
            <div key={req.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden">
              <div className={`absolute top-0 left-0 w-1 h-full ${
                req.status === 'Accepted' ? 'bg-blue-500' : 'bg-amber-500'
              }`}></div>

              <div className="flex justify-between items-start mb-3">
                <h3 className="font-semibold text-gray-900 text-lg">{req.request_type}</h3>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                  req.status === 'Accepted' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  {req.status}
                </span>
              </div>

              {req.guest?.full_name && (
                <p className="text-sm text-gray-600 mb-2">{req.guest.full_name}</p>
              )}

              <div className="flex items-center gap-2 text-sm text-gray-700 mb-5 bg-gray-50 p-2 rounded-lg">
                <Home className="w-4 h-4 text-gray-400" />
                <span className="font-medium">Room {req.room?.room_number || 'N/A'}</span>
              </div>

              <div className="flex justify-end pt-2">
                {req.status === 'Pending' && (
                  <button
                    onClick={() => handleAccept(req.id)}
                    className="flex items-center gap-1.5 bg-brand-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-brand-700 transition-colors w-full justify-center shadow-sm"
                  >
                    <CheckCircle className="w-4 h-4" /> Accept Request
                  </button>
                )}
                {req.status === 'Accepted' && (
                  <button
                    onClick={() => handleComplete(req.id)}
                    className="flex items-center gap-1.5 bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors w-full justify-center shadow-sm"
                  >
                    <CheckCircle className="w-4 h-4" /> Mark Complete
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
