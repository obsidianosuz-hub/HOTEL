import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeyRound, User, LogIn, CheckCircle2 } from 'lucide-react';
import useStore from '../../store/useStore';
import api from '../../lib/api';

export default function GuestLogin() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ booking_code: '', surname: '', otp: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setGuest } = useStore();

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // Fake API call to request OTP
      // await api.post('/api/guest/auth/otp-request', { booking_code: form.booking_code, surname: form.surname });
      setTimeout(() => {
        setStep(2);
        setLoading(false);
      }, 800);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid Booking Code or Surname');
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    // Using mock OTP '123456' for demonstration
    if (form.otp !== '123456') {
      setError('Invalid OTP code. Please use 123456 for demo.');
      setLoading(false);
      return;
    }

    try {
      // Fake API call to verify OTP and login
      // const res = await api.post('/api/guest/auth/otp-verify', form);
      // setGuest(res.data.guest);
      
      const mockGuest = {
        id: 1,
        full_name: 'John ' + form.surname,
        phone: '+998901234567',
        booking_code: form.booking_code
      };
      setGuest(mockGuest);
      navigate('/guest/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to verify OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-xl overflow-hidden border border-slate-100 dark:border-slate-800 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        <div className="p-8 text-center bg-brand-500 text-white">
          <div className="w-16 h-16 bg-white/20 rounded-2xl mx-auto flex items-center justify-center backdrop-blur-sm mb-4">
            <KeyRound className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold">Guest Portal</h1>
          <p className="text-brand-100 text-sm mt-2">Manage your stay and room services.</p>
        </div>

        <div className="p-8">
          {error && (
            <div className="p-3 mb-6 bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 rounded-xl text-sm font-medium border border-red-100 dark:border-red-500/20 text-center">
              {error}
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleRequestOTP} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Booking Code</label>
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
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Surname (Last Name)</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Smith"
                    value={form.surname}
                    onChange={e => setForm({...form, surname: e.target.value})}
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 dark:text-white outline-none transition-all"
                  />
                </div>
              </div>
              
              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-3.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold shadow-md shadow-brand-500/20 transition-all flex justify-center items-center gap-2 mt-4"
              >
                {loading ? 'Verifying...' : 'Request OTP'} <LogIn className="w-5 h-5" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOTP} className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div className="text-center space-y-2">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mb-2">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white">OTP Sent</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Please enter the 6-digit code sent via SMS to your registered number.</p>
                <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">(Hint: Use 123456 for this demo)</p>
              </div>

              <div>
                <input 
                  type="text" 
                  required
                  maxLength="6"
                  placeholder="------"
                  value={form.otp}
                  onChange={e => setForm({...form, otp: e.target.value})}
                  className="w-full px-4 py-4 text-center text-3xl tracking-[1em] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 dark:text-white outline-none transition-all font-mono"
                />
              </div>

              <button 
                type="submit" 
                disabled={loading || form.otp.length < 6}
                className="w-full py-3.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white rounded-xl font-bold shadow-md shadow-brand-500/20 transition-all"
              >
                {loading ? 'Verifying...' : 'Verify & Login'}
              </button>
              
              <button 
                type="button"
                onClick={() => setStep(1)}
                className="w-full py-2 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              >
                Back to Booking details
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
