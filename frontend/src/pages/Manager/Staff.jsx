import React, { useState, useEffect } from 'react';
import { Loader2, AlertCircle, Star, Award, Calendar, Users, DollarSign, Clock, CheckCircle2, Plus, X, Briefcase } from 'lucide-react';
import api from '../../lib/api';

export default function Staff() {
  const [activeTab, setActiveTab] = useState('employees'); // employees, schedule, payroll
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newStaff, setNewStaff] = useState({ full_name: '', role: 'Reception', username: '', password: '', passport_id: '' });
  
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [addingSchedule, setAddingSchedule] = useState(false);
  const [newSchedule, setNewSchedule] = useState({ employee_id: '', shift: 'Morning (08:00 - 16:00)', days: '', location: '' });
  
  const [schedules, setSchedules] = useState([
    { id: 1, name: 'Feruza', role: 'Reception', shift: 'Morning (08:00 - 16:00)', days: 'Mon, Tue, Wed, Thu, Fri', location: 'Lobby' },
    { id: 2, name: 'Malika', role: 'Housekeeping', shift: 'Evening (16:00 - 00:00)', days: 'Tue, Wed, Thu, Fri, Sat', location: 'Floor 1-2' },
    { id: 3, name: 'Aziz', role: 'Bellboy', shift: 'Night (00:00 - 08:00)', days: 'Mon, Wed, Fri', location: 'Entrance' }
  ]);

  const [payroll, setPayroll] = useState([
    { id: 1, name: 'Feruza', role: 'Reception', daysWorked: 22, shiftMultiplier: 1.0, baseSalary: 800, totalPay: 800, status: 'Paid' },
    { id: 2, name: 'Malika', role: 'Housekeeping', daysWorked: 20, shiftMultiplier: 1.2, baseSalary: 600, totalPay: 720, status: 'Pending' },
    { id: 3, name: 'Aziz', role: 'Bellboy', daysWorked: 15, shiftMultiplier: 1.5, baseSalary: 500, totalPay: 750, status: 'Pending' }
  ]);

  const [isPayrollModalOpen, setIsPayrollModalOpen] = useState(false);
  const [processingPayroll, setProcessingPayroll] = useState(false);
  const [newPayroll, setNewPayroll] = useState({ employee_id: '', daysWorked: 20, shiftMultiplier: 1.0, baseSalary: 500 });

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const res = await api.get('/manager/staff-performance');
      const sorted = (res.data || []).sort((a, b) => (b.tasks_completed || 0) - (a.tasks_completed || 0));
      setStaff(sorted);
    } catch (err) {
      setError('Xodimlar ma\'lumotlarini yuklashda xatolik.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setAdding(true);
    setError(null);
    try {
      const res = await api.post('/manager/staff', {
        full_name: newStaff.full_name,
        email: newStaff.username,
        password: newStaff.password,
        role: newStaff.role,
      });
      await fetchStaff();
      setIsAddModalOpen(false);
      setNewStaff({ full_name: '', role: 'Reception', username: '', password: '', passport_id: '' });
      setMessage('Xodim muvaffaqiyatli qo\'shildi!');
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Xodim qo\'shishda xatolik');
    } finally {
      setAdding(false);
    }
  };

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    setAddingSchedule(true);
    // Simulate API call
    await new Promise(r => setTimeout(r, 800));
    
    // Create new schedule object
    const empNameMap = { '1': 'Feruza', '2': 'Malika', '3': 'Aziz', '4': 'Otabek', '5': 'Sitora' };
    const roleMap = { '1': 'Reception', '2': 'Housekeeping', '3': 'Bellboy', '4': 'Manager', '5': 'Cook' };
    
    const addedSchedule = {
      id: Date.now(),
      name: empNameMap[newSchedule.employee_id] || 'Unknown',
      role: roleMap[newSchedule.employee_id] || 'Staff',
      shift: newSchedule.shift,
      days: newSchedule.days,
      location: newSchedule.location
    };
    
    setSchedules([addedSchedule, ...schedules]);
    setIsScheduleModalOpen(false);
    setNewSchedule({ employee_id: '', shift: 'Morning (08:00 - 16:00)', days: '', location: '' });
    setAddingSchedule(false);
  };

  const handlePayrollSubmit = async (e) => {
    e.preventDefault();
    setProcessingPayroll(true);
    await new Promise(r => setTimeout(r, 800));
    
    const empNameMap = { '1': 'Feruza', '2': 'Malika', '3': 'Aziz', '4': 'Otabek', '5': 'Sitora' };
    const roleMap = { '1': 'Reception', '2': 'Housekeeping', '3': 'Bellboy', '4': 'Manager', '5': 'Cook' };
    
    const totalPay = (newPayroll.daysWorked / 22) * newPayroll.baseSalary * newPayroll.shiftMultiplier;
    
    const addedPayroll = {
      id: Date.now(),
      name: empNameMap[newPayroll.employee_id] || 'Unknown',
      role: roleMap[newPayroll.employee_id] || 'Staff',
      daysWorked: newPayroll.daysWorked,
      shiftMultiplier: newPayroll.shiftMultiplier,
      baseSalary: newPayroll.baseSalary,
      totalPay: Math.round(totalPay),
      status: 'Paid'
    };
    
    setPayroll([addedPayroll, ...payroll]);
    setIsPayrollModalOpen(false);
    setNewPayroll({ employee_id: '', daysWorked: 20, shiftMultiplier: 1.0, baseSalary: 500 });
    setProcessingPayroll(false);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Staff & Operations</h1>
          <p className="text-gray-500 mt-1">Manage employees, schedules, and payroll.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-white border border-gray-200 rounded-xl w-fit shadow-sm">
        <button
          onClick={() => setActiveTab('employees')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'employees' ? 'bg-brand-50 text-brand-700 shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Users className="w-4 h-4" /> Employees
        </button>
        <button
          onClick={() => setActiveTab('schedule')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'schedule' ? 'bg-brand-50 text-brand-700 shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Calendar className="w-4 h-4" /> Schedules & Shifts
        </button>
        <button
          onClick={() => setActiveTab('payroll')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'payroll' ? 'bg-brand-50 text-brand-700 shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          <DollarSign className="w-4 h-4" /> Payroll
        </button>
      </div>

      {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-2"><AlertCircle className="w-5 h-5"/> {error}</div>}

      {loading ? (
        <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-brand-600" /></div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-[400px]">
          
          {/* TAB 1: EMPLOYEES */}
          {activeTab === 'employees' && (
            <div className="animate-in fade-in duration-300">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h2 className="text-lg font-semibold text-gray-900">Performance Overview</h2>
                <button onClick={() => setIsAddModalOpen(true)} className="btn-primary text-sm py-2 flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Add Employee
                </button>
              </div>
              <table className="w-full text-left border-collapse">
                <thead className="bg-white border-b border-gray-100">
                  <tr>
                    <th className="p-4 font-semibold text-gray-600">Employee</th>
                    <th className="p-4 font-semibold text-gray-600">Role</th>
                    <th className="p-4 font-semibold text-gray-600 text-center">Tasks Completed</th>
                    <th className="p-4 font-semibold text-gray-600 text-center">Avg Rating</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {staff.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="p-8 text-center text-gray-500">No staff records found.</td>
                    </tr>
                  ) : (
                    staff.map((employee, idx) => (
                      <tr key={employee.id || idx} className="hover:bg-gray-50 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-brand-100 to-brand-50 flex items-center justify-center font-bold text-brand-700 shadow-sm border border-brand-200">
                              {(employee.name || employee.full_name)?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                            <span className="font-medium text-gray-900">{employee.name || employee.full_name}</span>
                          </div>
                        </td>
                        <td className="p-4 text-gray-600">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {employee.role}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <div className="inline-flex items-center justify-center bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full font-medium text-sm">
                            <CheckCircle2 className="w-4 h-4 mr-1.5" />
                            {employee.tasks_completed || 0}
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                            <span className="font-bold text-gray-700">
                              {(employee.avg_rating ?? employee.rating)
                                ? Number(employee.avg_rating ?? employee.rating).toFixed(1)
                                : 'N/A'}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 2: SCHEDULE */}
          {activeTab === 'schedule' && (
            <div className="animate-in fade-in duration-300">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h2 className="text-lg font-semibold text-gray-900">Weekly Schedule</h2>
                <button onClick={() => setIsScheduleModalOpen(true)} className="btn-primary text-sm py-2 flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Assign Schedule
                </button>
              </div>
              <table className="w-full text-left border-collapse">
                <thead className="bg-white border-b border-gray-100">
                  <tr>
                    <th className="p-4 font-semibold text-gray-600">Employee</th>
                    <th className="p-4 font-semibold text-gray-600">Shift</th>
                    <th className="p-4 font-semibold text-gray-600">Days</th>
                    <th className="p-4 font-semibold text-gray-600">Location</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {schedules.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="p-8 text-center text-gray-500">No schedules found.</td>
                    </tr>
                  ) : (
                    schedules.map((sched, idx) => (
                      <tr key={sched.id || idx} className="hover:bg-gray-50 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <span className="font-medium text-gray-900">{sched.name}</span>
                            <span className="text-xs text-gray-500">({sched.role})</span>
                          </div>
                        </td>
                        <td className="p-4 text-gray-700">{sched.shift}</td>
                        <td className="p-4 text-gray-700">{sched.days}</td>
                        <td className="p-4 text-gray-700">{sched.location}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 3: PAYROLL */}
          {activeTab === 'payroll' && (
            <div className="animate-in fade-in duration-300">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h2 className="text-lg font-semibold text-gray-900">Payroll Processing</h2>
                <button onClick={() => setIsPayrollModalOpen(true)} className="btn-primary bg-emerald-600 hover:bg-emerald-700 text-sm py-2 flex items-center gap-2 shadow-emerald-500/20">
                  <Plus className="w-4 h-4" /> Process Payroll
                </button>
              </div>
              <table className="w-full text-left border-collapse">
                <thead className="bg-white border-b border-gray-100">
                  <tr>
                    <th className="p-4 font-semibold text-gray-600">Employee</th>
                    <th className="p-4 font-semibold text-gray-600 text-center">Days Worked</th>
                    <th className="p-4 font-semibold text-gray-600 text-center">Base Salary</th>
                    <th className="p-4 font-semibold text-gray-600 text-center">Total Pay</th>
                    <th className="p-4 font-semibold text-gray-600 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {payroll.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="p-8 text-center text-gray-500">No payroll records found.</td>
                    </tr>
                  ) : (
                    payroll.map((pay, idx) => (
                      <tr key={pay.id || idx} className="hover:bg-gray-50 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <span className="font-medium text-gray-900">{pay.name}</span>
                            <span className="text-xs text-gray-500">({pay.role})</span>
                          </div>
                        </td>
                        <td className="p-4 text-center text-gray-700">{pay.daysWorked}</td>
                        <td className="p-4 text-center text-gray-700">${pay.baseSalary}</td>
                        <td className="p-4 text-center font-bold text-gray-900">${pay.totalPay}</td>
                        <td className="p-4 text-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${pay.status === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                            {pay.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

        </div>
      )}

      {/* Add Employee Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-brand-600" /> New Employee
              </h2>
              <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input required type="text" value={newStaff.full_name} onChange={e => setNewStaff({...newStaff, full_name: e.target.value})} className="w-full p-2.5 border border-gray-200 rounded-lg outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20" placeholder="e.g. Alisher Navoiy" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <div className="relative">
                  <Briefcase className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <select value={newStaff.role} onChange={e => setNewStaff({...newStaff, role: e.target.value})} className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 appearance-none">
                    <option value="Reception">Reception</option>
                    <option value="Bellboy">Bellboy</option>
                    <option value="Housekeeping">Housekeeping</option>
                    <option value="HousekeepingSupervisor">Housekeeping Supervisor</option>
                    <option value="Cook">Cook</option>
                    <option value="Manager">Manager</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                  <input required type="text" value={newStaff.username} onChange={e => setNewStaff({...newStaff, username: e.target.value})} className="w-full p-2.5 border border-gray-200 rounded-lg outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20" placeholder="e.g. alisher" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <input required type="password" value={newStaff.password} onChange={e => setNewStaff({...newStaff, password: e.target.value})} className="w-full p-2.5 border border-gray-200 rounded-lg outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20" placeholder="••••••••" />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Passport ID</label>
                <input required type="text" value={newStaff.passport_id} onChange={e => setNewStaff({...newStaff, passport_id: e.target.value.toUpperCase()})} className="w-full p-2.5 border border-gray-200 rounded-lg outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 uppercase" placeholder="e.g. AB1234567" />
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="flex-1 px-4 py-2.5 text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg font-medium transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={adding} className="flex-1 px-4 py-2.5 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 transition-colors flex justify-center items-center gap-2">
                  {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Hire Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Schedule Modal */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-brand-600" /> Assign Schedule
              </h2>
              <button onClick={() => setIsScheduleModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleScheduleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Employee</label>
                <select required value={newSchedule.employee_id} onChange={e => setNewSchedule({...newSchedule, employee_id: e.target.value})} className="w-full p-2.5 border border-gray-200 rounded-lg outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20">
                  <option value="" disabled>Select an employee</option>
                  <option value="1">Feruza (Reception)</option>
                  <option value="2">Malika (Housekeeping)</option>
                  <option value="3">Aziz (Bellboy)</option>
                  <option value="4">Otabek (Manager)</option>
                  <option value="5">Sitora (Cook)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Shift Type</label>
                <div className="relative">
                  <Clock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <select value={newSchedule.shift} onChange={e => setNewSchedule({...newSchedule, shift: e.target.value})} className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 appearance-none">
                    <option value="Morning (08:00 - 16:00)">Morning (08:00 - 16:00)</option>
                    <option value="Evening (16:00 - 00:00)">Evening (16:00 - 00:00)</option>
                    <option value="Night (00:00 - 08:00)">Night (00:00 - 08:00)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Working Days</label>
                <input required type="text" value={newSchedule.days} onChange={e => setNewSchedule({...newSchedule, days: e.target.value})} className="w-full p-2.5 border border-gray-200 rounded-lg outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20" placeholder="e.g. Mon, Tue, Wed, Thu, Fri" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Area / Location</label>
                <input required type="text" value={newSchedule.location} onChange={e => setNewSchedule({...newSchedule, location: e.target.value})} className="w-full p-2.5 border border-gray-200 rounded-lg outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20" placeholder="e.g. Lobby, Floor 1-2, Kitchen" />
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsScheduleModalOpen(false)} className="flex-1 px-4 py-2.5 text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg font-medium transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={addingSchedule} className="flex-1 px-4 py-2.5 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 transition-colors flex justify-center items-center gap-2">
                  {addingSchedule ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Assign Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payroll Modal */}
      {isPayrollModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-600" /> Process Payroll
              </h2>
              <button onClick={() => setIsPayrollModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handlePayrollSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Employee</label>
                <select required value={newPayroll.employee_id} onChange={e => setNewPayroll({...newPayroll, employee_id: e.target.value})} className="w-full p-2.5 border border-gray-200 rounded-lg outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20">
                  <option value="" disabled>Select an employee</option>
                  <option value="1">Feruza (Reception)</option>
                  <option value="2">Malika (Housekeeping)</option>
                  <option value="3">Aziz (Bellboy)</option>
                  <option value="4">Otabek (Manager)</option>
                  <option value="5">Sitora (Cook)</option>
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Days Worked</label>
                  <input required type="number" value={newPayroll.daysWorked} onChange={e => setNewPayroll({...newPayroll, daysWorked: Number(e.target.value)})} className="w-full p-2.5 border border-gray-200 rounded-lg outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Shift Multiplier</label>
                  <input required type="number" step="0.1" value={newPayroll.shiftMultiplier} onChange={e => setNewPayroll({...newPayroll, shiftMultiplier: Number(e.target.value)})} className="w-full p-2.5 border border-gray-200 rounded-lg outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Base Salary ($)</label>
                <input required type="number" value={newPayroll.baseSalary} onChange={e => setNewPayroll({...newPayroll, baseSalary: Number(e.target.value)})} className="w-full p-2.5 border border-gray-200 rounded-lg outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20" />
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsPayrollModalOpen(false)} className="flex-1 px-4 py-2.5 text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg font-medium transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={processingPayroll} className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors flex justify-center items-center gap-2">
                  {processingPayroll ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Process & Pay'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
