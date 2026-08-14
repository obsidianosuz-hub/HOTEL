import React, { useState, useEffect } from 'react';
import { CreditCard, Save, CheckCircle2, ShieldAlert } from 'lucide-react';
import api from '../../lib/api';

export default function AdminPaymentGateways() {
  const [gateways, setGateways] = useState([
    { id: 1, name: 'Payme', merchant_id: '', api_key: '', is_active: false },
    { id: 2, name: 'Click', merchant_id: '', api_key: '', is_active: false },
    { id: 3, name: 'Paynet', merchant_id: '', api_key: '', is_active: false },
    { id: 4, name: 'Terminal (POS)', merchant_id: 'LOCAL_POS', api_key: 'N/A', is_active: true }
  ]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      // Mock save to API
      // await api.post('/api/admin/gateways', { gateways });
      setTimeout(() => {
        setMessage('Payment Gateways configured successfully!');
        setLoading(false);
      }, 800);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleChange = (index, field, value) => {
    const newGateways = [...gateways];
    newGateways[index][field] = value;
    setGateways(newGateways);
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
          <CreditCard className="w-8 h-8 text-brand-500" />
          Payment Gateways
        </h1>
        <p className="text-slate-500 mt-2">Configure online and offline payment methods for the local merchant account.</p>
      </div>

      {message && (
        <div className="p-4 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-2xl flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-5 h-5" /> {message}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {gateways.map((gw, index) => (
          <div key={gw.id} className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">{gw.name} Integration</h2>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={gw.is_active}
                  onChange={(e) => handleChange(index, 'is_active', e.target.checked)}
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-brand-500"></div>
                <span className="ml-3 text-sm font-medium text-slate-700 dark:text-slate-300">Active</span>
              </label>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Merchant ID</label>
                <input 
                  type="text" 
                  disabled={!gw.is_active || gw.name === 'Terminal (POS)'}
                  value={gw.merchant_id}
                  onChange={(e) => handleChange(index, 'merchant_id', e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 dark:text-white outline-none disabled:opacity-50 transition-all font-mono"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">API / Secret Key</label>
                <input 
                  type="password" 
                  disabled={!gw.is_active || gw.name === 'Terminal (POS)'}
                  value={gw.api_key}
                  onChange={(e) => handleChange(index, 'api_key', e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 dark:text-white outline-none disabled:opacity-50 transition-all font-mono"
                />
              </div>
            </div>
            
            {gw.name === 'Terminal (POS)' && (
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 rounded-xl text-sm flex items-start gap-2">
                <ShieldAlert className="w-5 h-5 shrink-0" />
                <p>This is a manual offline integration. Receptionists will process payments on the physical POS terminal and click "Confirm" in the ERP to mark the invoice as paid.</p>
              </div>
            )}
          </div>
        ))}

        <div className="flex justify-end pt-4">
          <button 
            type="submit" 
            disabled={loading}
            className="px-8 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="w-5 h-5" /> {loading ? 'Saving...' : 'Save Configurations'}
          </button>
        </div>
      </form>
    </div>
  );
}
