import React, { useState, useEffect } from 'react';
import { Loader2, TrendingUp, Users, Calendar, BarChart3 } from 'lucide-react';
import api from '../../lib/api';

export default function Reports() {
  const [dateRange, setDateRange] = useState({ 
    from: new Date(new Date().setDate(1)).toISOString().split('T')[0], 
    to: new Date().toISOString().split('T')[0] 
  });
  
  const [revenueData, setRevenueData] = useState(null);
  const [occupancyData, setOccupancyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [revRes, occRes] = await Promise.all([
        api.get(`/manager/analytics/revenue?from=${dateRange.from}&to=${dateRange.to}`),
        api.get('/manager/analytics/occupancy')
      ]);
      setRevenueData(revRes.data);
      setOccupancyData(occRes.data);
      setError(null);
    } catch (err) {
      setError('Failed to load analytics data.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics & Reports</h1>
          <p className="text-gray-500 mt-1">High-level overview of hotel performance.</p>
        </div>
        
        <div className="flex items-center gap-2 bg-white p-2 rounded-xl shadow-sm border border-gray-100">
          <Calendar className="w-5 h-5 text-gray-400 ml-2" />
          <input 
            type="date" 
            value={dateRange.from}
            onChange={(e) => setDateRange({...dateRange, from: e.target.value})}
            className="p-2 outline-none text-sm font-medium"
          />
          <span className="text-gray-400">-</span>
          <input 
            type="date" 
            value={dateRange.to}
            onChange={(e) => setDateRange({...dateRange, to: e.target.value})}
            className="p-2 outline-none text-sm font-medium"
          />
        </div>
      </div>

      {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl">{error}</div>}

      {loading ? (
        <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-brand-600" /></div>
      ) : (
        <div className="space-y-6">
          {/* Top Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-brand-600 to-brand-800 p-6 rounded-2xl shadow-lg text-white">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-brand-100 font-medium">Total Revenue</p>
                  <h3 className="text-4xl font-bold mt-2">${revenueData?.total_revenue || 0}</h3>
                </div>
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
              </div>
              <p className="text-sm text-brand-100 mt-4 opacity-80">For selected period</p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-500 font-medium">Current Occupancy</p>
                  <h3 className="text-4xl font-bold text-gray-900 mt-2">{occupancyData?.rate || 0}%</h3>
                </div>
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                  <Users className="w-6 h-6" />
                </div>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2 mt-4 overflow-hidden">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${occupancyData?.rate || 0}%` }}></div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-500 font-medium">Total Bookings</p>
                  <h3 className="text-4xl font-bold text-gray-900 mt-2">{revenueData?.total_bookings || 0}</h3>
                </div>
                <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                  <BarChart3 className="w-6 h-6" />
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-4">Completed within period</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
