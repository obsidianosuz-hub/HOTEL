import React, { useState, useEffect } from 'react';
import { Loader2, DatabaseBackup, RotateCcw, CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import api from '../../lib/api';
import ConfirmDialog from '../../components/ConfirmDialog';
import useConfirm from '../../hooks/useConfirm';

function formatSize(bytes) {
  if (!bytes) return '0 KB';
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(2)} MB`;
}

export default function Backups() {
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [restoringId, setRestoringId] = useState(null);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const { confirm, dialogProps } = useConfirm();

  useEffect(() => {
    fetchBackups();
  }, []);

  const fetchBackups = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/backup');
      setBackups(res.data || []);
    } catch (err) {
      setError('Failed to load backup history.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    setCreating(true);
    setError(null);
    setMessage(null);
    try {
      await api.post('/admin/backup/create');
      setMessage('Backup created.');
      setTimeout(() => setMessage(null), 3000);
      fetchBackups();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create backup');
    } finally {
      setCreating(false);
    }
  };

  const handleRestore = async (backup) => {
    const ok = await confirm({
      title: 'Restore this backup?',
      message: `This overwrites the current live database with the snapshot from ${new Date(backup.created_at).toLocaleString()}. All changes made after that point will be lost. The server must be restarted afterwards for the change to fully take effect.`,
      confirmLabel: 'Restore',
      danger: true,
      requireText: 'RESTORE'
    });
    if (!ok) return;
    setRestoringId(backup.id);
    setError(null);
    setMessage(null);
    try {
      const res = await api.post(`/admin/backup/${backup.id}/restore`);
      setMessage(res.data?.message || 'Backup restored.');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to restore backup');
    } finally {
      setRestoringId(null);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Backup & Restore</h1>
        <p className="text-gray-500 text-sm mt-1">Snapshot and restore the hotel database.</p>
      </div>

      <div className="bg-blue-50 text-blue-800 p-4 rounded-xl flex items-start gap-3 text-sm">
        <Info className="h-5 w-5 shrink-0 mt-0.5" />
        <span>
          This app runs on a single-file SQLite database. "Create Backup" copies that file into <code className="font-mono bg-blue-100 px-1 rounded">backend/backups/</code> on this server —
          a real, working local backup, not a placeholder. It is not an off-site or automated cloud backup; for production use, also copy these files somewhere external on a schedule.
        </span>
      </div>

      {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-3"><AlertTriangle className="h-5 w-5" /> {error}</div>}
      {message && <div className="bg-green-50 text-green-700 p-4 rounded-xl flex items-center gap-3"><CheckCircle2 className="h-5 w-5" /> {message}</div>}

      <div className="flex justify-end">
        <button onClick={handleCreate} disabled={creating} className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors shadow-sm font-medium">
          {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <DatabaseBackup className="h-4 w-4" />}
          Create Backup Now
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Backup History</h2>
        </div>
        {loading ? (
          <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-brand-600" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="p-4 font-semibold text-gray-600">Created</th>
                  <th className="p-4 font-semibold text-gray-600">Type</th>
                  <th className="p-4 font-semibold text-gray-600">Size</th>
                  <th className="p-4 font-semibold text-gray-600">File</th>
                  <th className="p-4 font-semibold text-gray-600 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {backups.map(b => (
                  <tr key={b.id} className="hover:bg-gray-50">
                    <td className="p-4 text-gray-900 font-medium">{new Date(b.created_at).toLocaleString()}</td>
                    <td className="p-4 text-gray-600">{b.type}</td>
                    <td className="p-4 text-gray-600">{formatSize(b.size)}</td>
                    <td className="p-4 text-gray-500 font-mono text-xs">{b.file_url}</td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleRestore(b)}
                        disabled={restoringId === b.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40"
                      >
                        {restoringId === b.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                        Restore
                      </button>
                    </td>
                  </tr>
                ))}
                {backups.length === 0 && (
                  <tr><td colSpan="5" className="p-8 text-center text-gray-500">No backups yet. Create one above.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog {...dialogProps} />
    </div>
  );
}
