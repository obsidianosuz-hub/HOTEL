import React, { useState } from 'react';
import { BellRing, CheckCircle2, BaggageClaim, Sparkles, Car } from 'lucide-react';
import api from '../../../lib/api';

export default function RequestsTab({ guest }) {
  const [loading, setLoading] = useState(null);
  const [success, setSuccess] = useState('');

  const services = [
    { id: 'Luggage', icon: BaggageClaim, title: 'Luggage Assistance', desc: 'Request a bellboy for luggage' },
    { id: 'Cleaning', icon: Sparkles, title: 'Room Cleaning', desc: 'Request housekeeping service' },
    { id: 'Towels', icon: Sparkles, title: 'Fresh Towels', desc: 'Request extra towels' },
    { id: 'Taxi', icon: Car, title: 'Call a Taxi', desc: 'Request a taxi to the entrance' }
  ];

  const handleRequest = async (type) => {
    setLoading(type);
    try {
      await api.post('/guest-portal/requests', { request_type: type });
      setSuccess(`Your request for ${type} has been sent!`);
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      console.error(err);
      alert('Failed to send request.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
          <BellRing className="text-brand-500 w-7 h-7" /> Services
        </h2>
      </div>

      {success && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded-2xl flex items-start gap-3 animate-in zoom-in duration-300">
          <CheckCircle2 className="w-5 h-5 mt-0.5" />
          <div className="font-bold">{success}</div>
        </div>
      )}

      <div className="grid gap-4">
        {services.map(s => (
          <button
            key={s.id}
            onClick={() => handleRequest(s.id)}
            disabled={loading !== null}
            className="flex items-center gap-4 bg-white dark:bg-slate-900 p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 hover:border-brand-500 active:scale-95 transition-all text-left disabled:opacity-50"
          >
            <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500">
              <s.icon className="w-7 h-7" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-slate-900 dark:text-white text-lg">{s.title}</h3>
              <p className="text-sm text-slate-500 leading-tight mt-1">{s.desc}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center text-brand-600 dark:text-brand-400 font-black">
              {loading === s.id ? <span className="animate-pulse">...</span> : '+'}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
