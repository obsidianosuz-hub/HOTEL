import React, { useState, useEffect } from 'react';
import { 
  ClipboardCheck, Plus, Search, Filter, 
  MoreVertical, Clock, CheckCircle2, ShieldAlert,
  User, DoorOpen, Truck, Sparkles, MessageSquare
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { io } from 'socket.io-client';
import { API_ORIGIN } from '../../lib/api';
import useStore from '../../store/useStore';
import useTasksStore from '../../store/useTasksStore';

const TASK_TYPES = {
  Housekeeping: ['Clean Room', 'Extra Towels', 'Turn-down Service', 'Minibar Refill', 'Maintenance Issue'],
  Bellboy: ['Luggage Pickup', 'Luggage Delivery', 'Valet Parking', 'Call Taxi', 'Room Service Delivery']
};

export default function StaffTasks() {
  const { t } = useTranslation();
  const { token } = useStore();
  const { tasks, addTask, updateTaskStatus } = useTasksStore();
  const [filterDept, setFilterDept] = useState('All');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const socket = io(API_ORIGIN, { auth: { token, type: 'staff' } });
    socket.on('new-guest-request', (request) => {
      // Map guest request to a task
      if (!['FoodOrder', 'Dining'].includes(request.request_type)) {
        addTask({
          department: request.request_type === 'Luggage' ? 'Bellboy' : 'Housekeeping',
          type: request.request_type,
          room: request.room ? `Room ${request.room.room_number}` : 'Unknown Room',
          priority: 'High',
          notes: `Requested by ${request.guest?.full_name || 'Guest'}. Details: ${request.details || 'None'}`
        });
      }
    });

    return () => socket.disconnect();
  }, [token, addTask]);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    department: 'Housekeeping',
    type: 'Clean Room',
    room: '',
    priority: 'Normal',
    notes: ''
  });

  const columns = ['To Do', 'In Progress', 'Completed'];

  const filteredTasks = tasks.filter(task => {
    const matchesDept = filterDept === 'All' || task.department === filterDept;
    const matchesSearch = task.room.includes(search) || task.id.toLowerCase().includes(search.toLowerCase());
    return matchesDept && matchesSearch;
  });

  const handleCreateTask = (e) => {
    e.preventDefault();
    addTask(newTask);
    setIsModalOpen(false);
    setNewTask({ department: 'Housekeeping', type: 'Clean Room', room: '', priority: 'Normal', notes: '' });
  };

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'High': return 'text-red-600 bg-red-50 dark:bg-red-500/10 dark:text-red-400 border-red-100 dark:border-red-800';
      case 'Normal': return 'text-blue-600 bg-blue-50 dark:bg-blue-500/10 dark:text-blue-400 border-blue-100 dark:border-blue-800';
      case 'Low': return 'text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
      default: return 'text-slate-600 bg-slate-100';
    }
  };

  const getDeptIcon = (dept) => {
    return dept === 'Housekeeping' ? <Sparkles className="w-4 h-4" /> : <Truck className="w-4 h-4" />;
  };

  // Function to move task status for demo purposes
  const moveTask = (id, newStatus) => {
    updateTaskStatus(id, newStatus);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 h-[calc(100vh-4rem)] flex flex-col">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <ClipboardCheck className="w-8 h-8 text-brand-500" />
            Staff Tasks
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Assign and monitor requests for Housekeeping and Bellboys.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-medium transition-all shadow-sm hover:shadow-md active:scale-95"
        >
          <Plus className="w-5 h-5" /> New Task
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 shrink-0">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Search by Task ID or Room..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-shadow"
          />
        </div>
        <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800/50 rounded-xl">
          {['All', 'Housekeeping', 'Bellboy'].map(dept => (
            <button
              key={dept}
              onClick={() => setFilterDept(dept)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filterDept === dept 
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              {dept}
            </button>
          ))}
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 grid md:grid-cols-3 gap-6 min-h-0 pb-4 overflow-hidden">
        {columns.map(status => (
          <div key={status} className="flex flex-col bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between shrink-0">
              <h3 className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                {status === 'To Do' && <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />}
                {status === 'In Progress' && <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />}
                {status === 'Completed' && <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />}
                {status}
              </h3>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-semibold">
                {filteredTasks.filter(t => t.status === status).length}
              </span>
            </div>
            
            <div className="p-4 overflow-y-auto flex-1 space-y-4">
              {filteredTasks.filter(t => t.status === status).map(task => (
                <div 
                  key={task.id} 
                  className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow cursor-default group"
                >
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-xs font-mono font-semibold text-slate-400 dark:text-slate-500">{task.id}</span>
                    <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                  </div>
                  
                  <h4 className="font-semibold text-slate-900 dark:text-white text-base mb-1">{task.type}</h4>
                  
                  {task.notes && (
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 line-clamp-2 leading-relaxed">
                      {task.notes}
                    </p>
                  )}

                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-1.5 rounded-lg">
                      <DoorOpen className="w-3.5 h-3.5 shrink-0" /> Room {task.room}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-1.5 rounded-lg">
                      {getDeptIcon(task.department)} {task.department}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800/80 mt-auto">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-brand-100 dark:bg-brand-900/50 flex items-center justify-center text-brand-600 dark:text-brand-400 text-xs font-bold">
                        {task.assignee.charAt(0)}
                      </div>
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{task.assignee}</span>
                    </div>
                    
                    {/* Demo Actions to move tasks */}
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {status === 'To Do' && (
                        <button onClick={() => moveTask(task.id, 'In Progress')} className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-md tooltip" title="Start Task">
                          <Clock className="w-4 h-4" />
                        </button>
                      )}
                      {status === 'In Progress' && (
                        <button onClick={() => moveTask(task.id, 'Completed')} className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-md tooltip" title="Complete Task">
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {filteredTasks.filter(t => t.status === status).length === 0 && (
                <div className="h-24 flex items-center justify-center text-sm text-slate-400 dark:text-slate-500 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                  No tasks here
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-brand-500" />
                Assign New Task
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                ✕
              </button>
            </div>
            
            <form onSubmit={handleCreateTask} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Department</label>
                  <select 
                    value={newTask.department}
                    onChange={(e) => setNewTask({...newTask, department: e.target.value, type: TASK_TYPES[e.target.value][0]})}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-brand-500 dark:text-white"
                  >
                    <option value="Housekeeping">Housekeeping</option>
                    <option value="Bellboy">Bellboy</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Priority</label>
                  <select 
                    value={newTask.priority}
                    onChange={(e) => setNewTask({...newTask, priority: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-brand-500 dark:text-white"
                  >
                    <option value="Low">Low</option>
                    <option value="Normal">Normal</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Task Type</label>
                <select 
                  value={newTask.type}
                  onChange={(e) => setNewTask({...newTask, type: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-brand-500 dark:text-white"
                >
                  {TASK_TYPES[newTask.department].map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Room Number</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. 201"
                  value={newTask.room}
                  onChange={(e) => setNewTask({...newTask, room: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-brand-500 dark:text-white placeholder-slate-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Additional Notes</label>
                <textarea 
                  rows="3"
                  placeholder="Any special instructions..."
                  value={newTask.notes}
                  onChange={(e) => setNewTask({...newTask, notes: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-brand-500 dark:text-white placeholder-slate-400 resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 font-medium bg-brand-600 hover:bg-brand-700 text-white rounded-lg transition-colors shadow-sm">
                  Assign Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
