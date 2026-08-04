import React, { useState, useEffect } from 'react';
import { Loader2, Save, ShieldAlert, CheckCircle2, Lock } from 'lucide-react';
import api from '../../lib/api';

// Every (module, description) pair actually checked by checkPermission() across the backend routes.
// One checkbox here = full view/create/edit/delete access to that module, matching how the app
// actually enforces access — the previous 4-column view/create/edit/delete grid used module names
// ('Users', 'FrontDesk', 'Reports', ...) that didn't match any real checkPermission() call, so nothing
// saved from that screen ever actually changed what a role could do.
const CAPABILITIES = [
  { module: 'users', label: 'Manage staff accounts' },
  { module: 'roles', label: 'Manage roles & permissions' },
  { module: 'settings', label: 'Hotel settings & room management' },
  { module: 'integrations', label: 'Booking.com integration' },
  { module: 'audit-logs', label: 'View audit logs' },
  { module: 'system', label: 'System health & backups' },
  { module: 'bookings', label: 'Manage bookings & check-in/out' },
  { module: 'rooms', label: 'Manage room status' },
  { module: 'payments', label: 'Collect payments & refunds' },
  { module: 'analytics', label: 'Channel performance & reports' },
  { module: 'staff', label: 'View staff performance' },
  { module: 'maintenance', label: 'Maintenance requests' },
  { module: 'rates', label: 'Room rates & pricing' },
  { module: 'tasks', label: 'Housekeeping / Bellboy tasks' },
  { module: 'lost-items', label: 'Lost & found' },
  { module: 'guest-requests', label: 'Guest requests' },
  { module: 'luggage', label: 'Luggage tracking' },
  { module: 'vendors', label: 'Manage vendors' },
  { module: 'purchase-orders', label: 'Purchase orders' },
  { module: 'inventory', label: 'Inventory & stock' },
  { module: 'invoices', label: 'Invoice approvals' },
  { module: 'reports', label: 'Procurement reports' },
  { module: 'dashboard', label: 'View dashboards' }
];

export default function Roles() {
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [roleName, setRoleName] = useState('');
  const [roleDescription, setRoleDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async (keepSelectedId) => {
    try {
      setLoading(true);
      const res = await api.get('/admin/roles');
      setRoles(res.data || []);
      const toSelect = keepSelectedId ? res.data.find(r => r.id === keepSelectedId) : res.data?.[0];
      if (toSelect) selectRole(toSelect);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch roles');
    } finally {
      setLoading(false);
    }
  };

  const selectRole = (role) => {
    setSelectedRole(role);
    setPermissions(role.permissions || []);
    setRoleName(role.name);
    setRoleDescription(role.description || '');
  };

  // A capability shows as "on" if the role can at least view that module — toggling it
  // grants/revokes full view+create+edit+delete access as a single unit (no partial states
  // in this simplified UI, matching how it's actually granted).
  const isEnabled = (module) => {
    const p = permissions.find(p => p.module === module);
    return !!(p && p.can_view);
  };

  const toggleCapability = (module, enabled) => {
    setPermissions(prev => {
      const existing = prev.find(p => p.module === module);
      const next = { module, can_view: enabled, can_create: enabled, can_edit: enabled, can_delete: enabled };
      if (existing) return prev.map(p => (p.module === module ? next : p));
      return [...prev, next];
    });
  };

  const handleSave = async () => {
    if (!selectedRole) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      await api.put(`/admin/roles/${selectedRole.id}`, { name: roleName, description: roleDescription });
      await api.put(`/admin/roles/${selectedRole.id}/permissions`, { permissions });
      setMessage('Role saved successfully.');
      setTimeout(() => setMessage(null), 3000);
      fetchRoles(selectedRole.id);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save role');
    } finally {
      setSaving(false);
    }
  };

  const isAdminRole = selectedRole?.name === 'Admin';

  if (loading) return <div className="flex h-96 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-brand-600" /></div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Roles & Permissions</h1>
          <p className="text-gray-500 text-sm mt-1">Configure what each role can access across the app.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || !selectedRole}
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors shadow-sm disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-3">
          <ShieldAlert className="h-5 w-5" />
          <p>{error}</p>
        </div>
      )}
      {message && (
        <div className="bg-green-50 text-green-700 p-4 rounded-xl flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5" />
          <p>{message}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden md:col-span-1">
          <div className="p-4 border-b border-gray-100 bg-gray-50/50">
            <h3 className="font-semibold text-gray-900">Available Roles</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {roles.map(role => (
              <button
                key={role.id}
                onClick={() => selectRole(role)}
                className={`w-full text-left p-4 transition-colors hover:bg-gray-50 ${selectedRole?.id === role.id ? 'bg-brand-50 border-l-4 border-brand-600' : 'border-l-4 border-transparent'}`}
              >
                <p className={`font-medium ${selectedRole?.id === role.id ? 'text-brand-700' : 'text-gray-700'}`}>{role.name}</p>
                <p className="text-xs text-gray-500 mt-1 line-clamp-1">{role.description || 'System Role'}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden md:col-span-3">
          {selectedRole ? (
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role Name</label>
                  <div className="relative">
                    <input
                      type="text" value={roleName} disabled={isAdminRole}
                      onChange={e => setRoleName(e.target.value)}
                      className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none disabled:bg-gray-50 disabled:text-gray-400"
                    />
                    {isAdminRole && <Lock className="absolute right-3 top-2.5 h-4 w-4 text-gray-300" />}
                  </div>
                  {isAdminRole && <p className="text-xs text-gray-400 mt-1">The Admin role's name is locked — it's relied on internally for full-access checks.</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <input
                    type="text" value={roleDescription}
                    onChange={e => setRoleDescription(e.target.value)}
                    placeholder="e.g. Guest check-in and payments"
                    className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Assigned Permissions</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 max-h-96 overflow-y-auto pr-2">
                  {CAPABILITIES.map(cap => (
                    <label key={cap.module} className="flex items-center gap-2.5 py-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                        checked={isEnabled(cap.module)}
                        onChange={(e) => toggleCapability(cap.module, e.target.checked)}
                      />
                      <span className="text-sm text-gray-700">{cap.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-gray-500">Select a role to view its permissions.</div>
          )}
        </div>
      </div>
    </div>
  );
}
