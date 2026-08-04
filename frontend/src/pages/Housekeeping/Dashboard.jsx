import { useState, useEffect } from 'react';
import {
  Loader2,
  AlertCircle,
  RefreshCw,
  Sparkles,
  ClipboardList,
  Clock,
  CheckCircle2,
  AlertTriangle,
  BedDouble,
  WrenchIcon,
  Filter,
  Play,
  Check,
  User,
} from 'lucide-react';
import api from '../../lib/api';

export default function HousekeepingDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [tasksLoading, setTasksLoading] = useState(false);
  const [completingId, setCompletingId] = useState(null);
  const [actionError, setActionError] = useState(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await api.get('/housekeeping/dashboard');
      setDashboard(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load housekeeping dashboard');
    } finally {
      setLoading(false);
    }
  };

  const fetchTasks = async (status = '') => {
    try {
      setTasksLoading(true);
      const { data } = await api.get(`/housekeeping/tasks?status=${status}`);
      setTasks(Array.isArray(data) ? data : data.tasks || []);
    } catch (err) {
      console.error('Failed to load tasks:', err);
    } finally {
      setTasksLoading(false);
    }
  };

  const completeTask = async (taskId) => {
    try {
      setCompletingId(taskId);
      setActionError(null);
      await api.post(`/housekeeping/tasks/${taskId}/complete`, { force: true });
      await Promise.all([fetchDashboard(), fetchTasks(statusFilter)]);
    } catch (err) {
      setActionError(err.response?.data?.error || 'Failed to complete task');
    } finally {
      setCompletingId(null);
    }
  };

  useEffect(() => {
    fetchDashboard();
    fetchTasks();
  }, []);

  useEffect(() => {
    fetchTasks(statusFilter);
  }, [statusFilter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-brand-600 mx-auto" />
          <p className="mt-4 text-sm text-gray-500 font-medium">Loading housekeeping dashboard...</p>
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
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Something went wrong</h3>
          <p className="text-sm text-gray-500 mb-4">{error}</p>
          <button onClick={() => { fetchDashboard(); fetchTasks(statusFilter); }} className="btn-primary inline-flex items-center gap-2">
            <RefreshCw className="w-4 h-4" /> Retry
          </button>
        </div>
      </div>
    );
  }

  const stats = [
    { title: 'Pending Tasks', value: dashboard?.pendingTasks ?? 0, icon: ClipboardList, color: 'text-amber-600', bg: 'bg-amber-100', ring: 'ring-amber-500/20' },
    { title: 'In Progress', value: dashboard?.inProgressTasks ?? 0, icon: Clock, color: 'text-blue-600', bg: 'bg-blue-100', ring: 'ring-blue-500/20' },
    { title: 'Completed Today', value: dashboard?.completedToday ?? 0, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-100', ring: 'ring-emerald-500/20' },
    { title: 'Dirty Rooms', value: dashboard?.dirtyRooms ?? 0, icon: BedDouble, color: 'text-red-600', bg: 'bg-red-100', ring: 'ring-red-500/20' },
    { title: 'Out of Service', value: dashboard?.outOfService ?? 0, icon: WrenchIcon, color: 'text-gray-600', bg: 'bg-gray-100', ring: 'ring-gray-500/20' },
  ];

  const priorityColors = {
    Urgent: 'bg-red-100 text-red-700 ring-1 ring-red-200',
    High: 'bg-orange-100 text-orange-700 ring-1 ring-orange-200',
    Normal: 'bg-blue-100 text-blue-700 ring-1 ring-blue-200',
  };

  const statusColors = {
    Pending: 'bg-amber-100 text-amber-700',
    InProgress: 'bg-blue-100 text-blue-700',
    Completed: 'bg-emerald-100 text-emerald-700',
  };

  const filterOptions = [
    { label: 'All', value: '' },
    { label: 'Pending', value: 'Pending' },
    { label: 'In Progress', value: 'InProgress' },
    { label: 'Completed', value: 'Completed' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-brand-500 to-brand-700 rounded-xl flex items-center justify-center shadow-lg shadow-brand-500/25">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            Housekeeping Dashboard
          </h1>
          <p className="text-sm text-gray-500 mt-1 ml-[52px]">Manage room cleaning and maintenance tasks.</p>
        </div>
        <button
          onClick={() => { fetchDashboard(); fetchTasks(statusFilter); }}
          className="btn-secondary inline-flex items-center gap-2 self-start"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
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

      {actionError && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5" /> {actionError}
        </div>
      )}

      {/* Task List */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <ClipboardList className="w-5 h-5 text-brand-600" />
              <h2 className="text-lg font-semibold text-gray-900">Task List</h2>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
                {filterOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setStatusFilter(opt.value)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${
                      statusFilter === opt.value
                        ? 'bg-white text-brand-700 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {tasksLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-brand-600" />
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle2 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">No tasks found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="p-5 hover:bg-gray-50/50 transition-colors flex flex-col sm:flex-row sm:items-center gap-4"
              >
                {/* Task Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {task.room?.room_number ? `Room ${task.room.room_number} Cleaning` : 'Cleaning Task'}
                    </h3>
                    {task.priority && (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${priorityColors[task.priority] || priorityColors.Normal}`}>
                        {task.priority}
                      </span>
                    )}
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusColors[task.status] || 'bg-gray-100 text-gray-600'}`}>
                      {task.status || 'N/A'}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                    {task.room?.room_number && (
                      <div className="flex items-center gap-1">
                        <BedDouble className="w-3.5 h-3.5" />
                        Room {task.room.room_number}
                      </div>
                    )}
                    {task.assignee?.full_name && (
                      <div className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5" />
                        {task.assignee.full_name}
                      </div>
                    )}
                    {task.created_at && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(task.created_at).toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                {task.status !== 'Completed' && (
                  <button
                    onClick={() => completeTask(task.id)}
                    disabled={completingId === task.id}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md shrink-0"
                  >
                    {completingId === task.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    Complete
                  </button>
                )}
                {task.status === 'Completed' && (
                  <div className="inline-flex items-center gap-1.5 text-emerald-600 text-sm font-medium shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                    Done
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
