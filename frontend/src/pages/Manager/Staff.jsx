import React, { useState, useEffect } from 'react';
import { Loader2, AlertCircle, Star, Award } from 'lucide-react';
import api from '../../lib/api';

export default function Staff() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const res = await api.get('/manager/staff-performance');
      // Sort by tasks completed (descending) by default
      const sorted = (res.data || []).sort((a, b) => (b.tasks_completed || 0) - (a.tasks_completed || 0));
      setStaff(sorted);
    } catch (err) {
      setError('Failed to load staff performance.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Staff Performance</h1>
          <p className="text-gray-500 mt-1">Overview of staff activities and ratings.</p>
        </div>
      </div>

      {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-2"><AlertCircle className="w-5 h-5"/> {error}</div>}

      {loading ? (
        <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-brand-600" /></div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-100">
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
                        <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center font-bold text-lg">
                          {employee.name?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{employee.name}</p>
                          {idx === 0 && <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full mt-1"><Award className="w-3 h-3"/> Top Performer</span>}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-gray-700 capitalize">{employee.role}</td>
                    <td className="p-4 text-center">
                      <span className="inline-block px-3 py-1 bg-gray-100 text-gray-800 rounded-full font-medium">
                        {employee.tasks_completed || 0}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-1 text-amber-500 font-medium">
                        <Star className="w-4 h-4 fill-current" />
                        <span>{employee.avg_rating ? Number(employee.avg_rating).toFixed(1) : 'N/A'}</span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
