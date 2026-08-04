import { useState, useEffect } from 'react';
import {
  Loader2,
  AlertCircle,
  RefreshCw,
  Shield,
  Users,
  UserCheck,
  Hotel,
  CalendarRange,
  DollarSign,
  BedDouble,
  Activity,
  Database,
  Clock,
  HardDrive,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  FileText,
  TrendingUp,
  Wallet,
  TrendingDown,
  CalendarClock,
} from 'lucide-react';
import api from '../../lib/api';

const fmtSom = (n) => `${Number(n || 0).toLocaleString()} so'm`;

export default function AdminDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [health, setHealth] = useState(null);
  const [financial, setFinancial] = useState(null);
  const [auditLogs, setAuditLogs] = useState({ logs: [], total: 0, page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [logsLoading, setLogsLoading] = useState(false);

  const fetchAll = async () => {
    try {
      setLoading(true);
      setError(null);
      const [dashRes, healthRes, logsRes, financialRes] = await Promise.allSettled([
        api.get('/admin/dashboard'),
        api.get('/admin/system/health'),
        api.get('/admin/audit-logs?page=1&limit=10'),
        api.get('/admin/financial/dashboard'),
      ]);

      if (dashRes.status === 'fulfilled') setDashboard(dashRes.value.data);
      else throw new Error(dashRes.reason?.response?.data?.error || 'Failed to load dashboard');

      if (healthRes.status === 'fulfilled') setHealth(healthRes.value.data);
      if (logsRes.status === 'fulfilled') setAuditLogs(logsRes.value.data);
      if (financialRes.status === 'fulfilled') setFinancial(financialRes.value.data);
    } catch (err) {
      setError(err.message || 'Failed to load admin dashboard');
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async (page) => {
    try {
      setLogsLoading(true);
      const { data } = await api.get(`/admin/audit-logs?page=${page}&limit=10`);
      setAuditLogs(data);
      setCurrentPage(page);
    } catch (err) {
      console.error('Failed to fetch logs:', err);
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-brand-600 mx-auto" />
          <p className="mt-4 text-sm text-gray-500 font-medium">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to load dashboard</h3>
          <p className="text-sm text-gray-500 mb-4">{error}</p>
          <button onClick={fetchAll} className="btn-primary inline-flex items-center gap-2">
            <RefreshCw className="w-4 h-4" /> Retry
          </button>
        </div>
      </div>
    );
  }

  const stats = [
    { title: 'Total Users', value: dashboard?.totalUsers ?? 0, icon: Users, color: 'text-brand-600', bg: 'bg-brand-100', ring: 'ring-brand-500/20' },
    { title: 'Active Users', value: dashboard?.activeUsers ?? 0, icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-100', ring: 'ring-emerald-500/20' },
    { title: 'Total Guests', value: dashboard?.totalGuests ?? 0, icon: Hotel, color: 'text-violet-600', bg: 'bg-violet-100', ring: 'ring-violet-500/20' },
    { title: 'Total Bookings', value: dashboard?.totalBookings ?? 0, icon: CalendarRange, color: 'text-blue-600', bg: 'bg-blue-100', ring: 'ring-blue-500/20' },
    { title: 'Total Revenue', value: fmtSom(dashboard?.totalRevenue), icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-100', ring: 'ring-emerald-500/20' },
    { title: 'Total Rooms', value: dashboard?.totalRooms ?? 0, icon: BedDouble, color: 'text-amber-600', bg: 'bg-amber-100', ring: 'ring-amber-500/20' },
  ];

  const formatUptime = (seconds) => {
    if (!seconds) return 'N/A';
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${d}d ${h}h ${m}m`;
  };

  const formatMemory = (bytes) => {
    if (!bytes) return 'N/A';
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const isHealthy = health?.status === 'ok' || health?.status === 'healthy';

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-brand-500 to-brand-700 rounded-xl flex items-center justify-center shadow-lg shadow-brand-500/25">
              <Shield className="w-5 h-5 text-white" />
            </div>
            Admin Dashboard
          </h1>
          <p className="text-sm text-gray-500 mt-1 ml-[52px]">System overview and administration.</p>
        </div>
        <button onClick={fetchAll} className="btn-secondary inline-flex items-center gap-2 self-start">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div
              key={i}
              className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 group"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.bg} ${stat.color} ring-4 ${stat.ring} group-hover:scale-110 transition-transform duration-300 mb-3`}>
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
              <p className="text-xs font-medium text-gray-500 mt-1">{stat.title}</p>
            </div>
          );
        })}
      </div>

      {/* Financial Overview */}
      {financial && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <Wallet className="w-5 h-5 text-brand-600" />
            <h2 className="text-lg font-semibold text-gray-900">Financial Overview</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <div className="flex items-center gap-2 text-gray-500 mb-2">
                <CalendarClock className="w-4 h-4" />
                <span className="text-xs font-medium uppercase">Today's Revenue</span>
              </div>
              <span className="text-lg font-bold text-gray-900">{fmtSom(financial.todayRevenue)}</span>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <div className="flex items-center gap-2 text-gray-500 mb-2">
                <TrendingUp className="w-4 h-4" />
                <span className="text-xs font-medium uppercase">This Month's Revenue</span>
              </div>
              <span className="text-lg font-bold text-gray-900">{fmtSom(financial.monthRevenue)}</span>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <div className="flex items-center gap-2 text-gray-500 mb-2">
                <Clock className="w-4 h-4" />
                <span className="text-xs font-medium uppercase">Pending Payments</span>
              </div>
              <span className="text-lg font-bold text-amber-600">{fmtSom(financial.pendingPayments)}</span>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <div className="flex items-center gap-2 text-gray-500 mb-2">
                <TrendingDown className="w-4 h-4" />
                <span className="text-xs font-medium uppercase">Vendor Expenses</span>
              </div>
              <span className="text-lg font-bold text-red-600">{fmtSom(financial.totalVendorExpenses)}</span>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 sm:col-span-2 lg:col-span-2">
              <div className="flex items-center gap-2 text-gray-500 mb-2">
                <DollarSign className="w-4 h-4" />
                <span className="text-xs font-medium uppercase">Net Profit (all-time revenue − vendor expenses)</span>
              </div>
              <span className={`text-lg font-bold ${financial.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{fmtSom(financial.netProfit)}</span>
            </div>
          </div>
        </div>
      )}

      {/* System Health */}
      {health && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <Activity className="w-5 h-5 text-brand-600" />
            <h2 className="text-lg font-semibold text-gray-900">System Health</h2>
            <span className={`ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
              isHealthy ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
            }`}>
              {isHealthy ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
              {isHealthy ? 'All Systems Operational' : 'Issues Detected'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <div className="flex items-center gap-2 text-gray-500 mb-2">
                <Database className="w-4 h-4" />
                <span className="text-xs font-medium uppercase">Database</span>
              </div>
              <div className="flex items-center gap-2">
                {health.database === 'connected' || health.database === 'ok' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500" />
                )}
                <span className="text-sm font-semibold text-gray-900 capitalize">{health.database || 'N/A'}</span>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <div className="flex items-center gap-2 text-gray-500 mb-2">
                <Clock className="w-4 h-4" />
                <span className="text-xs font-medium uppercase">Uptime</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">{formatUptime(health.uptime)}</span>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <div className="flex items-center gap-2 text-gray-500 mb-2">
                <HardDrive className="w-4 h-4" />
                <span className="text-xs font-medium uppercase">Memory</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">
                {typeof health.memory === 'object'
                  ? formatMemory(health.memory?.rss || health.memory?.heapUsed)
                  : health.memory || 'N/A'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Audit Logs */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center gap-3">
          <FileText className="w-5 h-5 text-brand-600" />
          <h2 className="text-lg font-semibold text-gray-900">Recent Audit Logs</h2>
          <span className="ml-auto text-xs text-gray-400 font-medium">
            {auditLogs.total || 0} total entries
          </span>
        </div>

        <div className="overflow-x-auto">
          {logsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-brand-600" />
            </div>
          ) : !auditLogs.logs?.length ? (
            <div className="text-center py-12">
              <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">No audit logs found</p>
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50/80 text-gray-500 uppercase text-xs font-semibold">
                <tr>
                  <th className="px-6 py-4">Timestamp</th>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Action</th>
                  <th className="px-6 py-4">Entity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {auditLogs.logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 text-gray-600">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        {log.created_at ? new Date(log.created_at).toLocaleString() : 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-xs font-bold">
                          {(log.user?.full_name || 'S').charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-gray-900">
                          {log.user?.full_name || 'System'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-brand-50 text-brand-700 rounded-lg text-xs font-semibold">
                        {log.action || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{log.entity_type || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {auditLogs.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-xs text-gray-500">
              Page {currentPage} of {auditLogs.totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchLogs(currentPage - 1)}
                disabled={currentPage <= 1}
                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => fetchLogs(currentPage + 1)}
                disabled={currentPage >= auditLogs.totalPages}
                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
