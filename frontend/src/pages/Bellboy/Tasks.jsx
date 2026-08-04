import React, { useState, useEffect } from 'react';
import { Loader2, Briefcase, MapPin, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import useTasksStore from '../../store/useTasksStore';

export default function Tasks() {
  const { tasks, updateTaskStatus } = useTasksStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('All'); // All, Pending, InProgress, Completed

  const bbTasks = tasks.filter(t => t.department === 'Bellboy');

  const handleStart = async (id) => {
    updateTaskStatus(id, 'In Progress', 'Aziz B.');
  };

  const handleComplete = async (id) => {
    updateTaskStatus(id, 'Completed', 'Aziz B.');
  };

  const filteredTasks = bbTasks.filter(t => {
    if (filter === 'All') return true;
    if (filter === 'Pending') return t.status === 'To Do';
    if (filter === 'InProgress') return t.status === 'In Progress';
    if (filter === 'Completed') return t.status === 'Completed';
    return true;
  });

  if (loading) return (
    <div className="flex h-64 items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
    </div>
  );

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Tasks</h1>
          <p className="text-sm text-gray-500 mt-1">Manage bellboy assignments and daily chores.</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Filters */}
      <div className="flex space-x-2 border-b border-gray-200 pb-2">
        {['All', 'Assigned', 'InProgress', 'Completed'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === status
                ? 'bg-brand-100 text-brand-800'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTasks.length === 0 ? (
          <div className="col-span-full py-12 text-center text-gray-500 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
            No tasks found.
          </div>
        ) : (
          filteredTasks.map((task) => (
            <div key={task.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-brand-50 rounded-lg text-brand-600">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{task.type}</h3>
                    <p className="text-xs text-gray-500 font-medium">Priority: {task.priority}</p>
                  </div>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                  task.status === 'Completed' ? 'bg-green-100 text-green-700' :
                  task.status === 'InProgress' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {task.status}
                </span>
              </div>

              <div className="space-y-2 mb-6">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span>Room {task.room}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-500">P</span>
                  <span>Priority: {task.priority}</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t pt-4">
                {task.status === 'To Do' && (
                  <button
                    onClick={() => handleStart(task.id)}
                    className="flex items-center gap-1.5 bg-brand-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-brand-700 transition-colors"
                  >
                    <Clock className="w-4 h-4" /> Start Task
                  </button>
                )}
                {task.status === 'In Progress' && (
                  <button
                    onClick={() => handleComplete(task.id)}
                    className="flex items-center gap-1.5 bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-green-700 transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" /> Complete
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
