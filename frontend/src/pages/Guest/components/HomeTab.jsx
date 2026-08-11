import React, { useEffect, useState } from 'react';
import api from '../../../lib/api';
import { Calendar, Key, User, Moon, CheckCircle2 } from 'lucide-react';

const formatDate = (date) => {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: '2-digit' }).format(date);
};

export default function HomeTab({ guest }) {
  const [billData, setBillData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBill();
  }, []);

  const fetchBill = async () => {
    try {
      const res = await api.get('/guest-portal/my-bill');
      setBillData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center p-8 text-slate-500">Loading your stay...</div>;
  if (!billData) return <div className="text-center p-8 text-red-500">Error loading booking details.</div>;

  const checkIn = new Date(billData.check_in_date);
  const checkOut = new Date(billData.check_out_date);
  const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-brand-500 to-brand-700 rounded-3xl p-6 text-white shadow-lg shadow-brand-500/30 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Moon className="w-32 h-32" />
        </div>
        <div className="relative z-10">
          <p className="text-brand-100 font-medium mb-1">Welcome back,</p>
          <h2 className="text-2xl font-bold mb-6">{guest.name}</h2>
          
          <div className="flex items-end justify-between">
            <div>
              <p className="text-brand-200 text-xs mb-1">Room</p>
              <p className="text-4xl font-black font-mono tracking-tight">{billData.room?.room_number}</p>
              <p className="text-sm font-medium mt-1">{billData.room?.room_type?.name}</p>
            </div>
            <div className="text-right">
              <div className="inline-flex items-center gap-1 bg-white/20 px-3 py-1.5 rounded-xl backdrop-blur-md">
                <Key className="w-4 h-4" />
                <span className="font-mono font-bold">{guest.booking_code}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
        <h3 className="font-bold text-slate-900 dark:text-white mb-4 text-lg">Your Stay</h3>
        
        <div className="flex items-center justify-between mb-6 relative">
          <div className="absolute left-1/2 top-1/2 -translate-y-1/2 -translate-x-1/2 w-16 h-px bg-slate-200 dark:bg-slate-700"></div>
          <div className="absolute left-1/2 top-1/2 -translate-y-1/2 -translate-x-1/2 bg-white dark:bg-slate-900 px-2 text-xs font-bold text-slate-400">
            {nights} {nights === 1 ? 'NIGHT' : 'NIGHTS'}
          </div>
          
          <div className="text-center">
            <p className="text-xs text-slate-500 mb-1">Check-in</p>
            <p className="font-bold text-slate-900 dark:text-white text-lg">{formatDate(checkIn)}</p>
            <p className="text-xs font-medium text-slate-400">14:00</p>
          </div>
          
          <div className="text-center">
            <p className="text-xs text-slate-500 mb-1">Check-out</p>
            <p className="font-bold text-slate-900 dark:text-white text-lg">{formatDate(checkOut)}</p>
            <p className="text-xs font-medium text-slate-400">12:00</p>
          </div>
        </div>

        <div className="p-4 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl flex items-start gap-3">
          <div className="mt-0.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h4 className="font-bold text-emerald-900 dark:text-emerald-400">Room is Fully Paid</h4>
            <p className="text-sm text-emerald-700 dark:text-emerald-500/80 mt-1 leading-snug">
              Your room accommodation ($0.00 due) has been settled. Any additional services will be billed separately.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
