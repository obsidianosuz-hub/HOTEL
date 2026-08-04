import { useState, useEffect } from 'react';
import {
  Loader2,
  AlertCircle,
  RefreshCw,
  BellRing,
  ClipboardList,
  Clock,
  CheckCircle2,
  Play,
  Check,
  User,
  BedDouble,
  MessageSquare,
  Luggage,
  Timer,
} from 'lucide-react';
import api from '../../lib/api';

export default function BellboyDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionId, setActionId] = useState(null);
  const [actionType, setActionType] = useState(null);
  const [actionError, setActionError] = useState(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const [dashRes, tasksRes] = await Promise.allSettled([
        api.get('/bellboy/dashboard'),
        api.get('/bellboy/tasks'),
      ]);

      if (dashRes.status === 'fulfilled') setDashboard(dashRes.value.data);
      else throw new Error(dashRes.reason?.response?.data?.error || 'Failed to load dashboard');

      if (tasksRes.status === 'fulfilled') {
        const data = tasksRes.value.data;
        setTasks(Array.isArray(data) ? data : data.tasks || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to load bellboy dashboard');
    } finally {
      setLoading(false);
    }
  };

  const startTask = async (taskId) => {
    try {
      setActionId(taskId);
      setActionType('start');
      setActionError(null);
      await api.post(`/bellboy/tasks/${taskId}/start`);
      await fetchDashboard();
    } catch (err) {
      setActionError(err.response?.data?.error || 'Failed to start task');
    } finally {
      setActionId(null);
      setActionType(null);
    }
  };

  const completeTask = async (taskId) => {
    try {
      setActionId(taskId);
      setActionType('complete');
      setActionError(null);
      await api.post(`/bellboy/tasks/${taskId}/complete`);
      await fetchDashboard();
    } catch (err) {
      setActionError(err.response?.data?.error || 'Failed to complete task');
    } finally {
      setActionId(null);
      setActionType(null);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-brand-600 mx-auto" />
          <p className="mt-4 text-sm text-gray-500 font-medium">Loading bellboy dashboard...</p>
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
          <button onClick={fetchDashboard} className="btn-primary inline-flex items-center gap-2">
            <RefreshCw className="w-4 h-4" /> Retry
          </button>
        </div>
      </div>
    );
  }

  const stats = [
    { title: 'Assigned Tasks', value: dashboard?.assignedTasks ?? 0, icon: ClipboardList, color: 'text-brand-600', bg: 'bg-brand-100', ring: 'ring-brand-500/20' },
    { title: 'In Progress', value: dashboard?.inProgress ?? 0, icon: Timer, color: 'text-blue-600', bg: 'bg-blue-100', ring: 'ring-blue-500/20' },
    { title: 'Completed Today', value: dashboard?.completedToday ?? 0, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-100', ring: 'ring-emerald-500/20' },
    { title: 'Guest Requests', value: dashboard?.pendingGuestRequests ?? 0, icon: MessageSquare, color: 'text-violet-600', bg: 'bg-violet-100', ring: 'ring-violet-500/20' },
  ];

  const statusConfig = {
    Assigned: { label: 'Assigned', color: 'bg-brand-100 text-brand-700', dot: 'bg-brand-500' },
    Accepted: { label: 'Accepted', color: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
    Declined: { label: 'Declined', color: 'bg-red-100 text-red-700', dot: 'bg-red-500' },
    InProgress: { label: 'In Progress', color: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500' },
    Completed: { label: 'Completed', color: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
  };

  const typeIcons = {
    Luggage: Luggage,
    Escort: User,
    Other: ClipboardList,
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-brand-500 to-brand-700 rounded-xl flex items-center justify-center shadow-lg shadow-brand-500/25">
              <BellRing className="w-5 h-5 text-white" />
            </div>
            Bellboy Dashboard
          </h1>
          <p className="text-sm text-gray-500 mt-1 ml-[52px]">Manage your assigned tasks and guest requests.</p>
        </div>
        <button onClick={fetchDashboard} className="btn-secondary inline-flex items-center gap-2 self-start">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {actionError && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5" /> {actionError}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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

      {/* Task Cards */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <Luggage className="w-5 h-5 text-brand-600" />
          <h2 className="text-lg font-semibold text-gray-900">My Tasks</h2>
          <span className="ml-auto text-xs bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full font-medium">
            {tasks.length} tasks
          </span>
        </div>

        {tasks.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm text-center py-16">
            <CheckCircle2 className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-500 font-medium">No tasks assigned</p>
            <p className="text-xs text-gray-400 mt-1">You're all caught up!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {tasks.map((task) => {
              const config = statusConfig[task.status] || statusConfig.Assigned;
              const TypeIcon = typeIcons[task.task_type] || ClipboardList;
              const isActioning = actionId === task.id;

              return (
                <div
                  key={task.id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group"
                >
                  {/* Card Header */}
                  <div className="p-5 pb-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600">
                          <TypeIcon className="w-4.5 h-4.5" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 text-sm leading-tight">
                            {task.task_type || 'Task'}
                          </h3>
                          {task.room?.room_number && (
                            <p className="text-xs text-gray-400 mt-0.5">Room {task.room.room_number}</p>
                          )}
                        </div>
                      </div>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${config.color}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
                        {config.label}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
                      {task.guest?.full_name && (
                        <div className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5" />
                          {task.guest.full_name}
                        </div>
                      )}
                      {task.started_at && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          Started {new Date(task.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Actions */}
                  {task.status !== 'Completed' && (
                    <div className="px-5 pb-5 pt-2 flex gap-2">
                      {(task.status === 'Assigned' || task.status === 'Accepted') && (
                        <button
                          onClick={() => startTask(task.id)}
                          disabled={isActioning}
                          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                        >
                          {isActioning && actionType === 'start' ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Play className="w-4 h-4" />
                          )}
                          Start
                        </button>
                      )}
                      {task.status === 'InProgress' && (
                        <button
                          onClick={() => completeTask(task.id)}
                          disabled={isActioning}
                          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                        >
                          {isActioning && actionType === 'complete' ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Check className="w-4 h-4" />
                          )}
                          Complete
                        </button>
                      )}
                    </div>
                  )}

                  {task.status === 'Completed' && (
                    <div className="px-5 pb-5 pt-2">
                      <div className="inline-flex items-center gap-1.5 text-emerald-600 text-sm font-medium bg-emerald-50 px-3 py-2 rounded-xl w-full justify-center">
                        <CheckCircle2 className="w-4 h-4" />
                        Completed
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
