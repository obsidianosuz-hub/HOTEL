import { useState, useEffect } from 'react';
import {
  Loader2,
  AlertCircle,
  RefreshCw,
  ShoppingCart,
  Package,
  FileText,
  AlertTriangle,
  Users,
  ClipboardList,
  Search,
  ArrowUpDown,
  CheckCircle2,
  XCircle,
  TrendingDown,
  Boxes,
} from 'lucide-react';
import api from '../../lib/api';

export default function ProcurementDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showLowOnly, setShowLowOnly] = useState(false);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const [dashRes, invRes] = await Promise.allSettled([
        api.get('/procurement/dashboard'),
        api.get('/procurement/inventory'),
      ]);

      if (dashRes.status === 'fulfilled') setDashboard(dashRes.value.data);
      else throw new Error(dashRes.reason?.response?.data?.error || 'Failed to load dashboard');

      if (invRes.status === 'fulfilled') {
        const data = invRes.value.data;
        setInventory(Array.isArray(data) ? data : data.items || data.inventory || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to load procurement dashboard');
    } finally {
      setLoading(false);
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
          <p className="mt-4 text-sm text-gray-500 font-medium">Loading procurement dashboard...</p>
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
    { title: 'Pending POs', value: dashboard?.pendingPOs ?? 0, icon: ShoppingCart, color: 'text-brand-600', bg: 'bg-brand-100', ring: 'ring-brand-500/20' },
    { title: 'Pending Invoices', value: dashboard?.pendingInvoices ?? 0, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-100', ring: 'ring-blue-500/20' },
    { title: 'Low Stock Items', value: dashboard?.lowStockCount ?? 0, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-100', ring: 'ring-red-500/20' },
    { title: 'Active Vendors', value: dashboard?.activeVendors ?? 0, icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-100', ring: 'ring-emerald-500/20' },
    { title: 'Supply Requests', value: dashboard?.pendingSupplyRequests ?? 0, icon: ClipboardList, color: 'text-violet-600', bg: 'bg-violet-100', ring: 'ring-violet-500/20' },
  ];

  const filteredInventory = inventory.filter((item) => {
    const matchesSearch = !searchQuery ||
      (item.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.category || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLow = !showLowOnly || item.isLowStock;
    return matchesSearch && matchesLow;
  });

  const lowStockCount = inventory.filter(i => i.isLowStock).length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-brand-500 to-brand-700 rounded-xl flex items-center justify-center shadow-lg shadow-brand-500/25">
              <Boxes className="w-5 h-5 text-white" />
            </div>
            Procurement Dashboard
          </h1>
          <p className="text-sm text-gray-500 mt-1 ml-[52px]">Manage inventory, purchase orders, and vendors.</p>
        </div>
        <button onClick={fetchDashboard} className="btn-secondary inline-flex items-center gap-2 self-start">
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

      {/* Low Stock Alert */}
      {lowStockCount > 0 && (
        <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
            <TrendingDown className="w-6 h-6 text-red-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-red-900 text-sm">Low Stock Alert</h3>
            <p className="text-xs text-red-600 mt-0.5">
              {lowStockCount} item{lowStockCount !== 1 ? 's are' : ' is'} below minimum stock level and need{lowStockCount === 1 ? 's' : ''} reordering.
            </p>
          </div>
          <button
            onClick={() => setShowLowOnly(true)}
            className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-xl hover:bg-red-700 transition-colors shadow-sm shrink-0"
          >
            View Items
          </button>
        </div>
      )}

      {/* Inventory Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <Package className="w-5 h-5 text-brand-600" />
              <h2 className="text-lg font-semibold text-gray-900">Inventory</h2>
              <span className="text-xs bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full font-medium">
                {filteredInventory.length} items
              </span>
            </div>
            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search inventory..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-shadow w-48"
                />
              </div>
              {/* Low Stock Toggle */}
              <button
                onClick={() => setShowLowOnly(!showLowOnly)}
                className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl border transition-all ${
                  showLowOnly
                    ? 'bg-red-50 border-red-200 text-red-700'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                Low Stock
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {filteredInventory.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">
                {searchQuery || showLowOnly ? 'No matching items found' : 'No inventory items'}
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50/80 text-gray-500 uppercase text-xs font-semibold">
                <tr>
                  <th className="px-6 py-4">Item Name</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4 text-center">Quantity</th>
                  <th className="px-6 py-4 text-center">Min Level</th>
                  <th className="px-6 py-4 text-center">Max Level</th>
                  <th className="px-6 py-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredInventory.map((item) => (
                  <tr
                    key={item.id}
                    className={`transition-colors ${
                      item.isLowStock
                        ? 'bg-red-50/40 hover:bg-red-50/80'
                        : 'hover:bg-gray-50/50'
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          item.isLowStock ? 'bg-red-100 text-red-600' : 'bg-brand-50 text-brand-600'
                        }`}>
                          <Package className="w-4 h-4" />
                        </div>
                        <span className="font-medium text-gray-900">{item.name || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{item.category || 'N/A'}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`font-bold ${item.isLowStock ? 'text-red-600' : 'text-gray-900'}`}>
                        {item.current_quantity ?? 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center text-gray-500">
                      {item.min_level ?? 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-center text-gray-500">
                      {item.max_level ?? 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {item.isLowStock ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">
                          <AlertTriangle className="w-3 h-3" />
                          Low Stock
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-semibold">
                          <CheckCircle2 className="w-3 h-3" />
                          In Stock
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
