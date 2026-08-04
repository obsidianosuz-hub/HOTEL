import React, { useState, useEffect } from 'react';
import { Loader2, Save, Plug, Key, Percent, RefreshCw, CheckCircle2, XCircle, Webhook, Upload, FileText, Map, Zap, CreditCard, ShieldAlert, BarChart3, Wallet, Code2, Lock } from 'lucide-react';
import api, { API_ORIGIN } from '../../lib/api';

const MASK = '****';

export default function Integrations() {
  const [config, setConfig] = useState({
    hotel_id: '', api_key: '', api_secret: '', webhook_shared_secret: '',
    default_payment_model: 'booking_com_collect', commission_rate: '', status: 'Inactive'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  const [testResult, setTestResult] = useState(null);
  const [testing, setTesting] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const [logs, setLogs] = useState([]);
  const [logsTotal, setLogsTotal] = useState(0);
  const [logsPage, setLogsPage] = useState(1);
  const [logsLoading, setLogsLoading] = useState(true);
  const [retryingId, setRetryingId] = useState(null);

  const [csvFile, setCsvFile] = useState(null);
  const [reconciling, setReconciling] = useState(false);
  const [reconciliation, setReconciliation] = useState(null);
  const [reconcileError, setReconcileError] = useState(null);

  // Room Mapping Matrix
  const [roomTypes, setRoomTypes] = useState([]);
  const [mappingDrafts, setMappingDrafts] = useState({});
  const [mappingSavingId, setMappingSavingId] = useState(null);

  // Connectivity API (Production-Ready) scaffolding
  const [lastAriPush, setLastAriPush] = useState(null);
  const [ariPushing, setAriPushing] = useState(false);

  const webhookUrl = `${API_ORIGIN}/api/webhooks/booking-com`;

  useEffect(() => {
    fetchIntegration();
    fetchLogs(1);
    fetchRoomTypes();
  }, []);

  const fetchIntegration = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/integrations');
      const bookingCom = (res.data || []).find(i => i.type === 'BookingCom');
      const cfg = bookingCom?.config || {};
      setConfig({
        hotel_id: cfg.hotel_id || '',
        api_key: cfg.api_key_encrypted ? MASK : '',
        api_secret: cfg.api_secret_encrypted ? MASK : '',
        webhook_shared_secret: cfg.webhook_shared_secret_encrypted ? MASK : '',
        default_payment_model: cfg.default_payment_model || 'booking_com_collect',
        commission_rate: cfg.commission_rate ?? '',
        status: bookingCom?.status || 'Inactive'
      });
      setLastAriPush(cfg.last_ari_push_at || null);
    } catch (err) {
      setError('Failed to load integration settings.');
    } finally {
      setLoading(false);
    }
  };

  const fetchRoomTypes = async () => {
    try {
      const res = await api.get('/admin/room-types');
      setRoomTypes(res.data || []);
      const drafts = {};
      (res.data || []).forEach(rt => { drafts[rt.id] = rt.booking_com_room_id || ''; });
      setMappingDrafts(drafts);
    } catch (err) {
      // non-fatal
    }
  };

  const handleMappingSave = async (roomTypeId) => {
    setMappingSavingId(roomTypeId);
    setError(null);
    try {
      await api.put(`/admin/room-types/${roomTypeId}/booking-com-mapping`, { booking_com_room_id: mappingDrafts[roomTypeId] || null });
      setMessage('Room mapping saved.');
      setTimeout(() => setMessage(null), 3000);
      fetchRoomTypes();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save room mapping');
    } finally {
      setMappingSavingId(null);
    }
  };

  const handleAriPush = async () => {
    setAriPushing(true);
    setError(null);
    try {
      const res = await api.post('/admin/integrations/booking-com/ari-push');
      setLastAriPush(res.data.last_ari_push_at);
      setMessage(res.data.message);
      setTimeout(() => setMessage(null), 5000);
    } catch (err) {
      setError(err.response?.data?.error || 'ARI push failed');
    } finally {
      setAriPushing(false);
    }
  };

  const fetchLogs = async (page) => {
    try {
      setLogsLoading(true);
      const res = await api.get(`/admin/integrations/booking-com/webhook-logs?page=${page}&limit=10`);
      setLogs(res.data.logs || []);
      setLogsTotal(res.data.total || 0);
      setLogsPage(page);
    } catch (err) {
      // non-fatal, leave prior list
    } finally {
      setLogsLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      await api.put('/admin/integrations/booking-com', config);
      setMessage('Booking.com integration settings saved.');
      fetchIntegration();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save integration settings');
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await api.post('/admin/integrations/booking-com/test-connection');
      setTestResult(res.data);
    } catch (err) {
      setTestResult({ ok: false, message: err.response?.data?.error || 'Test failed' });
    } finally {
      setTesting(false);
    }
  };

  const handleSyncNow = async () => {
    setSyncing(true);
    setMessage(null);
    setError(null);
    try {
      await api.post('/admin/integrations/booking-com/sync');
      setMessage('Sync initiated.');
      fetchIntegration();
    } catch (err) {
      setError(err.response?.data?.error || 'Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  const handleRetry = async (id) => {
    setRetryingId(id);
    try {
      await api.post(`/admin/integrations/booking-com/webhook-logs/${id}/retry`);
      fetchLogs(logsPage);
    } catch (err) {
      setError(err.response?.data?.error || 'Retry failed');
    } finally {
      setRetryingId(null);
    }
  };

  const handleReconcile = async (e) => {
    e.preventDefault();
    if (!csvFile) return;
    setReconciling(true);
    setReconcileError(null);
    setReconciliation(null);
    try {
      const form = new FormData();
      form.append('statement', csvFile);
      const res = await api.post('/admin/integrations/booking-com/commission-reconciliation', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setReconciliation(res.data);
    } catch (err) {
      setReconcileError(err.response?.data?.error || 'Failed to reconcile statement');
    } finally {
      setReconciling(false);
    }
  };

  const logsPageCount = Math.ceil(logsTotal / 10) || 1;

  if (loading) return <div className="flex h-96 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-brand-600" /></div>;

  return (
    <div className="p-6 space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Booking.com Integration</h1>
        <p className="text-gray-500 text-sm mt-1">Manage the connection, webhook, and commission reconciliation with Booking.com.</p>
      </div>

      {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl">{error}</div>}
      {message && <div className="bg-green-50 text-green-700 p-4 rounded-xl">{message}</div>}

      {/* Connection settings */}
      <form onSubmit={handleSave} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2"><Plug className="h-5 w-5 text-brand-600" /> Connection Settings</h2>
          <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${config.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
            {config.status}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Hotel ID</label>
            <input type="text" value={config.hotel_id} onChange={e => setConfig({ ...config, hotel_id: e.target.value })} className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none" placeholder="Booking.com Partner Hotel ID" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Status</label>
            <select value={config.status} onChange={e => setConfig({ ...config, status: e.target.value })} className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none">
              <option value="Inactive">Inactive</option>
              <option value="Active">Active</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-1"><Key className="h-4 w-4" /> API Key</label>
            <input type="text" value={config.api_key} onChange={e => setConfig({ ...config, api_key: e.target.value })} className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none font-mono" placeholder="Enter to change" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-1"><Key className="h-4 w-4" /> API Secret</label>
            <input type="text" value={config.api_secret} onChange={e => setConfig({ ...config, api_secret: e.target.value })} className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none font-mono" placeholder="Enter to change" />
          </div>

          <div className="md:col-span-2 space-y-1">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-1"><Key className="h-4 w-4" /> Webhook Shared Secret</label>
            <input type="text" value={config.webhook_shared_secret} onChange={e => setConfig({ ...config, webhook_shared_secret: e.target.value })} className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none font-mono" placeholder="Enter to change" />
            <p className="text-xs text-gray-500">Used to verify the HMAC-SHA256 signature on incoming webhook calls (header <code>X-BookingCom-Signature</code>).</p>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Default Payment Model</label>
            <select value={config.default_payment_model} onChange={e => setConfig({ ...config, default_payment_model: e.target.value })} className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none">
              <option value="booking_com_collect">Booking.com Collect (guest pays Booking.com)</option>
              <option value="hotel_collect">Hotel Collect (guest pays at check-in)</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-1"><Percent className="h-4 w-4" /> Commission Rate (%)</label>
            <input type="number" step="0.01" min="0" max="100" value={config.commission_rate} onChange={e => setConfig({ ...config, commission_rate: e.target.value })} className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none" placeholder="e.g. 15" />
          </div>

          <div className="md:col-span-2 space-y-1">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-1"><Webhook className="h-4 w-4" /> Webhook URL</label>
            <input type="text" readOnly value={webhookUrl} onClick={e => e.target.select()} className="w-full p-2 border border-gray-200 rounded-lg bg-gray-50 font-mono text-sm text-gray-600" />
            <p className="text-xs text-gray-500">Register this URL in Booking.com Partner Hub for reservation.created / modified / cancelled events.</p>
          </div>
        </div>

        <div className="pt-2 flex flex-wrap items-center justify-end gap-3">
          <button type="button" onClick={handleTestConnection} disabled={testing} className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium">
            {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plug className="h-4 w-4" />}
            Test Connection
          </button>
          <button type="button" onClick={handleSyncNow} disabled={syncing} className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium">
            {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Sync Now
          </button>
          <button type="submit" disabled={saving} className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors shadow-sm font-medium">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Settings
          </button>
        </div>

        {testResult && (
          <div className={`p-4 rounded-xl text-sm ${testResult.ok ? 'bg-green-50 text-green-800' : 'bg-amber-50 text-amber-800'}`}>
            <p className="font-medium mb-1">{testResult.message}</p>
            {testResult.checks && (
              <ul className="space-y-1 mt-2">
                {Object.entries(testResult.checks).map(([key, ok]) => (
                  <li key={key} className="flex items-center gap-2">
                    {ok ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-red-500" />}
                    <span className="capitalize">{key.replace(/_/g, ' ')}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </form>

      {/* Room Mapping Matrix */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2"><Map className="h-5 w-5 text-brand-600" /> Room Mapping Matrix</h2>
        <p className="text-sm text-gray-500">Map each of your room types to Booking.com's own room ID (found in Booking.com Partner Hub &gt; Property &gt; Room details). Required before ARI (availability/rates) or reservations can sync correctly.</p>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="p-3 font-semibold text-gray-600">Our Room Type</th>
                <th className="p-3 font-semibold text-gray-600">Booking.com Room ID</th>
                <th className="p-3 font-semibold text-gray-600 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {roomTypes.map(rt => (
                <tr key={rt.id}>
                  <td className="p-3 font-medium text-gray-900">{rt.name}</td>
                  <td className="p-3">
                    <input
                      type="text"
                      value={mappingDrafts[rt.id] ?? ''}
                      onChange={e => setMappingDrafts({ ...mappingDrafts, [rt.id]: e.target.value })}
                      placeholder="e.g. 12345678"
                      className="w-48 p-1.5 border border-gray-200 rounded-lg font-mono text-xs focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                    />
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => handleMappingSave(rt.id)}
                      disabled={mappingSavingId === rt.id}
                      className="flex items-center gap-1 px-3 py-1.5 text-brand-700 hover:bg-brand-50 rounded-lg text-xs font-medium border border-brand-200 ml-auto"
                    >
                      {mappingSavingId === rt.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                      Save
                    </button>
                  </td>
                </tr>
              ))}
              {roomTypes.length === 0 && (
                <tr><td colSpan="3" className="p-4 text-center text-gray-400">No room types yet — add some under Rooms &gt; Room Types Catalog.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Connectivity API — Production-Ready scaffolding */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
        <div className="border-b border-gray-100 pb-3">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2"><Code2 className="h-5 w-5 text-brand-600" /> Booking.com Connectivity API (Production-Ready)</h2>
          <p className="text-sm text-gray-500 mt-1">JWT Bearer OAuth token auth, ARI/Reservations sync, Charges API, Credit Card Status API. These panels are wired up and ready to go live the moment real Booking.com Partner Hub credentials are entered above — until then they're scaffolding, not a live connection.</p>
        </div>

        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
          <div>
            <p className="text-sm font-medium text-gray-900 flex items-center gap-2"><Lock className="h-4 w-4 text-gray-400" /> OAuth Token-Based (JWT) Status</p>
            <p className="text-xs text-gray-500 mt-1">
              {config.api_key && config.api_secret
                ? 'Credentials are configured. A live token will be requested automatically once real API access is confirmed via Test Connection.'
                : 'No credentials configured yet — enter API Key/Secret above and run Test Connection.'}
            </p>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 ml-4 ${config.api_key && config.api_secret ? 'bg-amber-100 text-amber-800' : 'bg-gray-200 text-gray-600'}`}>
            {config.api_key && config.api_secret ? 'Configured, not live' : 'Not configured'}
          </span>
        </div>

        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
          <div>
            <p className="text-sm font-medium text-gray-900 flex items-center gap-2"><Zap className="h-4 w-4 text-gray-400" /> ARI Push (Availability, Rates, Inventory)</p>
            <p className="text-xs text-gray-500 mt-1">Last push: {lastAriPush ? new Date(lastAriPush).toLocaleString() : 'Never'}</p>
          </div>
          <button onClick={handleAriPush} disabled={ariPushing} className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium shrink-0 ml-4">
            {ariPushing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Push Now
          </button>
        </div>

        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Requires live Booking.com API credentials</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { icon: CreditCard, label: 'Charges API', desc: 'Collect payments & taxes' },
              { icon: ShieldAlert, label: 'CC Status API', desc: 'Problem card alerts' },
              { icon: BarChart3, label: 'Reporting API', desc: 'Performance exports' },
              { icon: Wallet, label: 'Payments Clarity (VCC)', desc: 'Virtual card details' },
              { icon: Code2, label: 'BXML / OTA Logs', desc: 'Raw message inspector' }
            ].map(item => (
              <div key={item.label} title="Requires real Booking.com API credentials" className="p-3 rounded-xl border border-dashed border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed">
                <item.icon className="h-4 w-4 mb-2" />
                <p className="text-xs font-semibold">{item.label}</p>
                <p className="text-[11px] mt-0.5">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Webhook logs */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-3">Webhook Logs</h2>

        {logsLoading ? (
          <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-brand-600" /></div>
        ) : logs.length === 0 ? (
          <p className="text-sm text-gray-500 py-4 text-center">No webhook events received yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="p-3 font-semibold text-gray-600">Received</th>
                  <th className="p-3 font-semibold text-gray-600">Event</th>
                  <th className="p-3 font-semibold text-gray-600">Reservation ID</th>
                  <th className="p-3 font-semibold text-gray-600">Status</th>
                  <th className="p-3 font-semibold text-gray-600">Error</th>
                  <th className="p-3 font-semibold text-gray-600">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.map(log => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="p-3 text-gray-600 whitespace-nowrap">{new Date(log.received_at).toLocaleString()}</td>
                    <td className="p-3 text-gray-800 font-mono text-xs">{log.event_type}</td>
                    <td className="p-3 text-gray-600 font-mono text-xs">{log.external_reservation_id || '—'}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        log.processing_status === 'success' ? 'bg-green-100 text-green-800' :
                        log.processing_status === 'failed' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {log.processing_status}
                      </span>
                    </td>
                    <td className="p-3 text-gray-500 text-xs max-w-xs truncate" title={log.error_message || ''}>{log.error_message || '—'}</td>
                    <td className="p-3">
                      {log.processing_status === 'failed' && (
                        <button onClick={() => handleRetry(log.id)} disabled={retryingId === log.id} className="flex items-center gap-1 px-3 py-1.5 text-brand-700 hover:bg-brand-50 rounded-lg text-xs font-medium border border-brand-200">
                          {retryingId === log.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                          Retry
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {logsTotal > 10 && (
          <div className="flex justify-center gap-2 pt-2">
            <button disabled={logsPage <= 1} onClick={() => fetchLogs(logsPage - 1)} className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 disabled:opacity-40">Prev</button>
            <span className="px-3 py-1.5 text-sm text-gray-500">Page {logsPage} of {logsPageCount}</span>
            <button disabled={logsPage >= logsPageCount} onClick={() => fetchLogs(logsPage + 1)} className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 disabled:opacity-40">Next</button>
          </div>
        )}
      </div>

      {/* Commission reconciliation */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-3">Commission Reconciliation</h2>
        <p className="text-sm text-gray-500">Upload Booking.com's monthly statement (CSV) to compare against stored reservations. Expected columns: <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">external_reservation_id, check_in_date, check_out_date, room_type, gross_amount, commission_amount, currency, statement_date</code></p>

        <form onSubmit={handleReconcile} className="flex items-center gap-3">
          <label className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium cursor-pointer">
            <Upload className="h-4 w-4" />
            {csvFile ? csvFile.name : 'Choose CSV'}
            <input type="file" accept=".csv,text/csv" className="hidden" onChange={e => setCsvFile(e.target.files?.[0] || null)} />
          </label>
          <button type="submit" disabled={!csvFile || reconciling} className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors shadow-sm font-medium disabled:opacity-50">
            {reconciling ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
            Reconcile
          </button>
        </form>

        {reconcileError && <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm">{reconcileError}</div>}

        {reconciliation && (
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="bg-green-50 p-3 rounded-xl text-center"><p className="text-2xl font-bold text-green-700">{reconciliation.matched.length}</p><p className="text-green-700">Matched</p></div>
              <div className="bg-amber-50 p-3 rounded-xl text-center"><p className="text-2xl font-bold text-amber-700">{reconciliation.mismatched.length}</p><p className="text-amber-700">Mismatched</p></div>
              <div className="bg-red-50 p-3 rounded-xl text-center"><p className="text-2xl font-bold text-red-700">{reconciliation.notFound.length}</p><p className="text-red-700">Not Found</p></div>
            </div>

            {reconciliation.mismatched.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Mismatched</h3>
                <table className="w-full text-left text-sm border-collapse">
                  <thead className="bg-gray-50"><tr><th className="p-2 font-medium text-gray-600">Reservation ID</th><th className="p-2 font-medium text-gray-600">Stored Commission</th><th className="p-2 font-medium text-gray-600">Statement Commission</th></tr></thead>
                  <tbody className="divide-y divide-gray-100">
                    {reconciliation.mismatched.map(m => (
                      <tr key={m.external_reservation_id}>
                        <td className="p-2 font-mono text-xs">{m.external_reservation_id}</td>
                        <td className="p-2">{m.stored_commission_amount ?? '—'}</td>
                        <td className="p-2">{m.statement_commission_amount ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {reconciliation.notFound.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Not Found</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  {reconciliation.notFound.map(n => (
                    <li key={n.external_reservation_id} className="font-mono text-xs">{n.external_reservation_id}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
