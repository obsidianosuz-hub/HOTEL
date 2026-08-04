import React, { useState, useEffect } from 'react';
import { Loader2, CheckCircle, Play, AlertTriangle, User, Home, Clock } from 'lucide-react';
import useTasksStore from '../../store/useTasksStore';

export default function Tasks() {
  const { tasks, updateTaskStatus } = useTasksStore();
  const [filter, setFilter] = useState('All'); // All, Pending, InProgress, Completed
  
  const [actionLoading, setActionLoading] = useState(null);

  const hkTasks = tasks.filter(t => t.department === 'Housekeeping');

  // Map state 'status' to standard filters
  const filteredTasks = hkTasks.filter(t => {
    if (filter === 'All') return true;
    if (filter === 'Pending') return t.status === 'To Do';
    if (filter === 'InProgress') return t.status === 'In Progress';
    if (filter === 'Completed') return t.status === 'Completed';
    return true;
  });

  const handleStart = async (id) => {
    updateTaskStatus(id, 'In Progress', 'Malika S.');
  };

  const handleComplete = async (id) => {
    updateTaskStatus(id, 'Completed', 'Malika S.');
  };

  const getPriorityColor = (priority) => {
    switch(priority?.toLowerCase()) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  const getStatusColor = (status) => {
    switch(status?.toLowerCase()) {
      case 'completed': return 'bg-green-500';
      case 'inprogress': return 'bg-blue-500';
      default: return 'bg-gray-300';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Housekeeping Tasks</h1>
          <p className="text-gray-500 text-sm mt-1">Manage cleaning and maintenance assignments.</p>
        </div>
        
        <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200">
          {['', 'Pending', 'InProgress', 'Completed'].map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${filter === status ? 'bg-white shadow-sm text-brand-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

        {filteredTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <CheckCircle className="w-16 h-16 text-green-200 mb-4" />
            <h3 className="text-lg font-bold text-gray-900">All caught up!</h3>
            <p className="text-gray-500">No tasks match your current filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredTasks.map(task => (
              <div key={task.id} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                <div className={`absolute top-0 left-0 w-1 h-full ${
                  task.status === 'Completed' ? 'bg-green-500' :
                  task.status === 'In Progress' ? 'bg-blue-500' : 'bg-orange-500'
                }`} />
                
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-brand-50 rounded-xl flex items-center justify-center text-brand-600">
                      <Home className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">Room {task.room?.room_number || 'N/A'}</h3>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <span className={`inline-block h-2 w-2 rounded-full ${getStatusColor(task.status)}`} />
                        {task.status || 'Pending'}
                      </p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 text-xs font-bold uppercase tracking-wider rounded-lg border ${getPriorityColor(task.priority)}`}>
                    {task.priority || 'Normal'}
                  </span>
                </div>
                
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{task.description || 'Standard room cleaning.'}</p>
                
                <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 p-2 rounded-lg mb-6">
                  <User className="h-4 w-4" />
                  <span className="truncate">{task.assignee?.full_name || 'Unassigned'}</span>
                </div>

                <div className="flex justify-end">
                      {task.status === 'To Do' && (
                        <button
                          onClick={() => handleStart(task.id)}
                          disabled={actionLoading === task.id}
                          className="flex items-center gap-2 px-4 py-2 bg-brand-50 text-brand-700 hover:bg-brand-100 rounded-xl font-medium transition-colors"
                        >
                          {actionLoading === task.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />} Start Task
                        </button>
                      )}
                      
                      {task.status === 'In Progress' && (
                        <button
                          onClick={() => handleComplete(task.id)}
                          disabled={actionLoading === task.id}
                          className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 hover:bg-green-100 rounded-xl font-medium transition-colors"
                        >
                          {actionLoading === task.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />} Complete
                        </button>
                      )}
                      
                      {task.status === 'Completed' && (
                        <div className="flex items-center gap-2 text-green-600 font-medium px-2 py-1">
                          <CheckCircle className="w-5 h-5" /> Done
                        </div>
                      )}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
