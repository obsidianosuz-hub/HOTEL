import React, { useState, useEffect } from 'react';
import { Loader2, Plus, Edit, Trash2, Search, User, Mail, Shield, ShieldOff, AlertCircle, CheckCircle2 } from 'lucide-react';
import api from '../../lib/api';
import ConfirmDialog from '../../components/ConfirmDialog';
import useConfirm from '../../hooks/useConfirm';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const { confirm, dialogProps } = useConfirm();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({ full_name: '', email: '', password: '', role_id: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/users');
      // Faqat Inactive (o'chirilgan) bo'lmagan xodimlarni ko'rsatish
      setUsers((res.data || []).filter(user => user.status !== 'Inactive'));
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const res = await api.get('/admin/roles');
      setRoles(res.data || []);
    } catch (err) {
      // Role dropdown just stays empty if this fails; user list still works.
    }
  };

  const handleOpenModal = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({ full_name: user.full_name, email: user.email, password: '', role_id: user.role_id || user.role?.id || '' });
    } else {
      setEditingUser(null);
      setFormData({ full_name: '', email: '', password: '', role_id: '' });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      if (editingUser) {
        await api.put(`/admin/users/${editingUser.id}`, formData);
        setMessage('User updated successfully.');
      } else {
        await api.post('/admin/users', formData);
        setMessage('User created successfully.');
      }
      handleCloseModal();
      fetchUsers();
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Action failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = async (id, name) => {
    const ok = await confirm({
      title: 'Deactivate user?',
      message: `${name} will lose access immediately. Their account and history are kept, and can be re-activated later by editing the user.`,
      confirmLabel: 'Deactivate',
      danger: true
    });
    if (!ok) return;
    try {
      await api.delete(`/admin/users/${id}`);
      setMessage('User deactivated.');
      fetchUsers();
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to deactivate user');
    }
  };

  const selectedRoleDescription = roles.find(r => String(r.id) === String(formData.role_id))?.description;

  if (loading) return <div className="flex h-96 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-brand-600" /></div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-500 text-sm mt-1">Manage system users and their roles.</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" />
          Add User
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-3">
          <AlertCircle className="h-5 w-5" />
          <p>{error}</p>
        </div>
      )}
      {message && (
        <div className="bg-green-50 text-green-700 p-4 rounded-xl flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5" />
          <p>{message}</p>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-sm font-medium text-gray-500">
                <th className="p-4">Name</th>
                <th className="p-4">Email</th>
                <th className="p-4">Role</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
              {users.map(user => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4 font-medium text-gray-900 flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center font-bold">
                      {user.full_name.charAt(0).toUpperCase()}
                    </div>
                    {user.full_name}
                  </td>
                  <td className="p-4">{user.email}</td>
                  <td className="p-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {user.role?.name || 'User'}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {user.status || 'Unknown'}
                    </span>
                  </td>
                  <td className="p-4 text-right space-x-2">
                    <button onClick={() => handleOpenModal(user)} className="p-1.5 text-gray-400 hover:text-brand-600 transition-colors rounded-lg hover:bg-brand-50">
                      <Edit className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDeactivate(user.id, user.full_name)} title="Deactivate user" className="p-1.5 text-gray-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gray-500">No users found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900">{editingUser ? 'Edit User' : 'Add New User'}</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  <input required type="text" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} className="pl-10 w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all" placeholder="John Doe" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email (Login)</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="pl-10 w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all" placeholder="sardor@hotel.com" />
                </div>
                <p className="text-xs text-gray-400 mt-1">This email is what the employee signs in with.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <div className="relative">
                  <ShieldOff className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  <select required value={formData.role_id} onChange={e => setFormData({...formData, role_id: e.target.value})} className="pl-10 w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all bg-white">
                    <option value="" disabled>Select a role</option>
                    {roles.map(r => <option key={r.id} value={r.id}>{r.name}{r.description ? ` — ${r.description}` : ''}</option>)}
                  </select>
                </div>
                {selectedRoleDescription && (
                  <p className="text-xs text-gray-400 mt-1">{selectedRoleDescription}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{editingUser ? 'Password (leave blank to keep current)' : 'Password'}</label>
                <div className="relative">
                  <Shield className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  <input required={!editingUser} minLength={6} type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="pl-10 w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all" placeholder="At least 6 characters" />
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={handleCloseModal} className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors font-medium">Cancel</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors font-medium flex items-center gap-2">
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {editingUser ? 'Save Changes' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <ConfirmDialog {...dialogProps} />
    </div>
  );
}
