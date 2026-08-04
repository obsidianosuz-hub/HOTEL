import { create } from 'zustand';

const INITIAL_TASKS = [
  {
    id: 'TSK-1001',
    department: 'Housekeeping',
    type: 'Clean Room',
    room: '201',
    priority: 'High',
    status: 'To Do',
    assignee: 'Unassigned',
    createdAt: '10:30 AM',
    notes: 'Guest requested early cleaning before 12:00 PM.'
  },
  {
    id: 'TSK-1002',
    department: 'Bellboy',
    type: 'Luggage Pickup',
    room: '405',
    priority: 'Normal',
    status: 'In Progress',
    assignee: 'Aziz B.',
    createdAt: '11:15 AM',
    notes: '3 heavy suitcases.'
  },
  {
    id: 'TSK-1003',
    department: 'Housekeeping',
    type: 'Extra Towels',
    room: '310',
    priority: 'Low',
    status: 'Completed',
    assignee: 'Malika S.',
    createdAt: '09:00 AM',
    notes: '2 extra bath towels.'
  }
];

const useTasksStore = create((set) => ({
  tasks: INITIAL_TASKS,
  
  addTask: (newTask) => set((state) => {
    const createdTask = {
      id: `TSK-${1000 + state.tasks.length + 1}`,
      ...newTask,
      status: 'To Do',
      assignee: 'Unassigned',
      createdAt: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
    };
    return { tasks: [createdTask, ...state.tasks] };
  }),

  updateTaskStatus: (id, newStatus, assignee = null) => set((state) => ({
    tasks: state.tasks.map(t => {
      if (t.id === id) {
        return { 
          ...t, 
          status: newStatus,
          assignee: assignee ? assignee : (newStatus === 'To Do' ? 'Unassigned' : t.assignee) 
        };
      }
      return t;
    })
  }))
}));

export default useTasksStore;
