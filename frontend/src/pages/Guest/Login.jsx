import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { KeyRound, User, LogIn, ArrowLeft } from 'lucide-react';
import useStore from '../../store/useStore';
import api from '../../lib/api';

export default function GuestLogin() {
  const [form, setForm] = useState({ booking_code: '', full_name: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setGuest, setToken } = useStore();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/guest/login', { 
        booking_code: form.booking_code, 
        full_name: form.full_name 
      });
      setToken(res.data.token);
      setGuest(res.data.guest);
      navigate('/guest/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Noto\'g\'ri Booking Code yoki Familiya. Iltimos tekshiring.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 relative">
      {/* Back to Home Button */}
      <Link 
        to="/" 
        className="absolute top-6 left-6 z-20 flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 bg-white/50 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-900 backdrop-blur-md px-4 py-2 rounded-xl transition-all shadow-sm border border-slate-200 dark:border-slate-800 font-medium text-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        Bosh sahifaga qaytish
      </Link>

      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-xl overflow-hidden border border-slate-100 dark:border-slate-800 animate-in fade-in slide-in-from-bottom-4 duration-500 mt-12 sm:mt-0">
        
        <div className="p-8 text-center bg-brand-500 text-white relative">
          <div className="w-16 h-16 bg-white/20 rounded-2xl mx-auto flex items-center justify-center backdrop-blur-sm mb-4">
            <KeyRound className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold">Guest Portal</h1>
          <p className="text-brand-100 text-sm mt-2">
            Manage your stay and room services.
          </p>
        </div>

        <div className="p-8">
          {error && (
            <div className="p-3 mb-6 bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 rounded-xl text-sm font-medium border border-red-100 dark:border-red-500/20 text-center animate-in zoom-in duration-200">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Booking Code (Bron kodi)</label>
              <input 
                type="text" 
                required
                placeholder="e.g. BKG-2026-..."
                value={form.booking_code}
                onChange={e => setForm({...form, booking_code: e.target.value.toUpperCase()})}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 dark:text-white outline-none transition-all font-mono"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Surname (Familiya)</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  type="text" 
                  required
                  placeholder="Familiyangiz"
                  value={form.full_name}
                  onChange={e => setForm({...form, full_name: e.target.value})}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 dark:text-white outline-none transition-all"
                />
              </div>
            </div>
            
            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-3.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold shadow-md shadow-brand-500/20 transition-all flex justify-center items-center gap-2 mt-4"
            >
              {loading ? 'Kutilmoqda...' : 'Tizimga kirish'} <LogIn className="w-5 h-5" />
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}
