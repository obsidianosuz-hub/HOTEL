import React, { useState, useEffect } from 'react';
import { Globe, RefreshCw, AlertCircle, FileJson, CheckCircle2, XCircle } from 'lucide-react';
import api from '../../lib/api';

export default function AdminBookingComLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      // const res = await api.get('/api/admin/bookingcom/logs');
      // setLogs(res.data);
      
      // Mock data since backend endpoint might not exist yet
      setLogs([
        { id: 1, event_type: 'reservation.created', external_reservation_id: '123456789', processing_status: 'success', received_at: new Date().toISOString(), payload: '{"status": "confirmed", "commission": 15}' },
        { id: 2, event_type: 'reservation.modified', external_reservation_id: '987654321', processing_status: 'failed', error_message: 'Room not found', received_at: new Date(Date.now() - 3600000).toISOString(), payload: '{"status": "modified"}' },
      ]);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch Booking.com logs');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success': return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      case 'failed': return <XCircle className="w-5 h-5 text-red-500" />;
      default: return <RefreshCw className="w-5 h-5 text-amber-500 animate-spin" />;
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <Globe className="w-8 h-8 text-brand-500" />
            Booking.com Webhook Logs
          </h1>
          <p className="text-slate-500 mt-2">Monitor incoming webhook events, commissions, and sync status from Booking.com</p>
        </div>
        <button onClick={fetchLogs} className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg font-medium shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-2">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 border border-red-200 rounded-2xl flex items-center gap-2 font-medium">
          <AlertCircle className="w-5 h-5" /> {error}
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-sm font-semibold text-slate-500 dark:text-slate-400">
                <th className="p-4 pl-6">ID / Received At</th>
                <th className="p-4">Event Type</th>
                <th className="p-4">Reservation ID</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right pr-6">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="p-4 pl-6">
                    <span className="font-mono text-slate-900 dark:text-white">#{log.id}</span>
                    <br />
                    <span className="text-xs text-slate-500">{new Date(log.received_at).toLocaleString()}</span>
                  </td>
                  <td className="p-4">
                    <span className="px-2.5 py-1 bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400 rounded-full font-medium text-xs">
                      {log.event_type}
                    </span>
                  </td>
                  <td className="p-4 font-mono font-medium text-slate-700 dark:text-slate-300">
                    {log.external_reservation_id || 'N/A'}
                  </td>
                  <td className="p-4 flex items-center gap-2">
                    {getStatusIcon(log.processing_status)}
                    <span className="capitalize font-medium text-slate-700 dark:text-slate-300">{log.processing_status}</span>
                    {log.error_message && (
                      <span className="text-xs text-red-500 block truncate max-w-xs ml-2" title={log.error_message}>
                        - {log.error_message}
                      </span>
                    )}
                  </td>
                  <td className="p-4 pr-6 text-right">
                    <button className="p-2 text-slate-400 hover:text-brand-600 bg-slate-50 dark:bg-slate-800 hover:bg-brand-50 dark:hover:bg-brand-500/10 rounded-xl transition-all" title="View Payload">
                      <FileJson className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
              {logs.length === 0 && !loading && (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-slate-500">No logs found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
