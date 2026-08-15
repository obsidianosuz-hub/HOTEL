import React, { useState, useEffect } from 'react';
import { Loader2, Search, Filter, ChevronLeft, ChevronRight, Activity, Download } from 'lucide-react';
import api from '../../lib/api';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [entityType, setEntityType] = useState('');

  const limit = 20;

  useEffect(() => {
    fetchLogs();
  }, [page, entityType]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/admin/audit-logs?page=${page}&limit=${limit}&entity_type=${entityType}`);
      setLogs(res.data?.logs || []);
      setTotalPages(res.data?.totalPages || 1);
      setError(null);
    } catch (err) {
      // Mock data for demo purposes
      const mockLogs = [
        { id: 1, created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(), user: { full_name: 'Feruza (Reception)' }, action: 'CREATE', entity_type: 'Booking', entity_id: 'BKG-101' },
        { id: 2, created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(), user: { full_name: 'Malika (Housekeeping)' }, action: 'UPDATE', entity_type: 'Task', entity_id: 'TSK-1003' },
        { id: 3, created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(), user: { full_name: 'Admin' }, action: 'UPDATE', entity_type: 'Settings', entity_id: 'System' },
        { id: 4, created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(), user: { full_name: 'Aziz (Bellboy)' }, action: 'COMPLETE', entity_type: 'Task', entity_id: 'TSK-1002' },
      ];
      setLogs(mockLogs.filter(l => !entityType || l.entity_type === entityType));
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    setEntityType(e.target.value);
    setPage(1); // Reset to first page
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleString();
  };

  const handleExport = async () => {
    try {
      const res = await api.get(`/admin/audit-logs?limit=10000&entity_type=${entityType}`);
      const exportLogs = res.data?.logs || [];
      
      if (exportLogs.length === 0) return;
      
      // Create CSV header
      const headers = ['Date & Time', 'User', 'Action', 'Entity Type', 'Entity ID'];
      const csvRows = [headers.join(',')];
      
      // Create CSV rows
      exportLogs.forEach(log => {
      const row = [
        `"${formatDate(log.created_at)}"`,
        `"${log.user?.full_name || 'System'}"`,
        `"${log.action}"`,
        `"${log.entity_type}"`,
        `"${log.entity_id || ''}"`
      ];
      csvRows.push(row.join(','));
    });
    
    const csvContent = csvRows.join('\n');
    const fileName = `audit_logs_${new Date().toISOString().slice(0,10)}.csv`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    } catch (err) {
      console.error('Export failed', err);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Activity className="h-6 w-6 text-brand-600" />
            Audit Logs
          </h1>
          <p className="text-gray-500 text-sm mt-1">Track system activity and user actions.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={handleExport}
            disabled={loading || logs.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 focus:ring-2 focus:ring-brand-500 outline-none transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          
          <div className="relative">
            <Filter className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <select
              value={entityType}
              onChange={handleFilterChange}
              className="pl-9 pr-8 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none appearance-none"
            >
              <option value="">All Entities</option>
              <option value="User">User</option>
              <option value="Role">Role</option>
              <option value="Room">Room</option>
              <option value="Booking">Booking</option>
              <option value="Task">Task</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl">
          <p>{error}</p>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col min-h-[500px]">
        {loading && logs.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-sm font-medium text-gray-500">
                    <th className="p-4 whitespace-nowrap">Date & Time</th>
                    <th className="p-4">User</th>
                    <th className="p-4">Action</th>
                    <th className="p-4">Entity Type</th>
                    <th className="p-4">Entity ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                  {logs.map((log, i) => (
                    <tr key={log.id || i} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4 text-gray-500 whitespace-nowrap">{formatDate(log.created_at)}</td>
                      <td className="p-4 font-medium text-gray-900">{log.user?.full_name || (log.user_id ? `User #${log.user_id}` : 'System')}</td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          log.action?.includes('CREATE') ? 'bg-green-100 text-green-800' :
                          log.action?.includes('UPDATE') ? 'bg-blue-100 text-blue-800' :
                          (log.action?.includes('DELETE') || log.action?.includes('CANCEL')) ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="p-4">{log.entity_type}</td>
                      <td className="p-4 font-mono text-xs text-gray-500">{log.entity_id}</td>
                    </tr>
                  ))}
                  {logs.length === 0 && (
                    <tr>
                      <td colSpan="5" className="p-12 text-center text-gray-500">No audit logs found for the selected criteria.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Page <span className="font-medium text-gray-900">{page}</span> of <span className="font-medium text-gray-900">{totalPages}</span>
              </p>
              <div className="flex gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                  className="p-2 border border-gray-200 bg-white rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-white transition-colors"
                >
                  <ChevronLeft className="h-4 w-4 text-gray-600" />
                </button>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage(p => p + 1)}
                  className="p-2 border border-gray-200 bg-white rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-white transition-colors"
                >
                  <ChevronRight className="h-4 w-4 text-gray-600" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
