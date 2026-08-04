import React, { useState } from 'react';
import { LogOut, Receipt, Coffee, BellRing, ChevronRight, CheckCircle2 } from 'lucide-react';
import useStore from '../../store/useStore';
import { useNavigate } from 'react-router-dom';

export default function GuestDashboard() {
  const { guest, logout } = useStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('folio'); // 'folio', 'service'
  const [requestSent, setRequestSent] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/guest/login');
  };

  const handleServiceRequest = (service) => {
    // Fake API call to submit request
    setRequestSent(true);
    setTimeout(() => setRequestSent(false), 3000);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center text-white font-bold text-xl">H</div>
            <span className="font-bold text-slate-900 dark:text-white hidden sm:block">Hotel ERP</span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-bold text-slate-900 dark:text-white">{guest?.full_name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">{guest?.booking_code}</p>
            </div>
            <button 
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-full transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-500">
        
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Welcome back, {guest?.full_name?.split(' ')[0]}!</h1>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-slate-200 dark:border-slate-800 pb-px">
          <button 
            onClick={() => setActiveTab('folio')}
            className={`pb-4 px-2 text-sm font-bold border-b-2 transition-all ${activeTab === 'folio' ? 'border-brand-500 text-brand-600 dark:text-brand-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            My Folio
          </button>
          <button 
            onClick={() => setActiveTab('service')}
            className={`pb-4 px-2 text-sm font-bold border-b-2 transition-all ${activeTab === 'service' ? 'border-brand-500 text-brand-600 dark:text-brand-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            Room Service
          </button>
        </div>

        {activeTab === 'folio' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
              <div className="flex items-center gap-3 mb-6">
                <Receipt className="w-6 h-6 text-brand-500" />
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Current Charges</h2>
              </div>
              
              <div className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                {/* Room Rate */}
                <div className="py-4 flex justify-between items-center group">
                  <div>
                    <span className="font-medium text-slate-900 dark:text-white block">Accommodation</span>
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Pre-paid via Booking.com</span>
                  </div>
                  <span className="font-mono text-slate-400 line-through">$300.00</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 ml-4">$0.00</span>
                </div>

                {/* Extra Charges Mock */}
                <div className="py-4 flex justify-between items-center">
                  <span className="font-medium text-slate-900 dark:text-white">Minibar - Coca Cola</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">$4.50</span>
                </div>
                <div className="py-4 flex justify-between items-center">
                  <span className="font-medium text-slate-900 dark:text-white">Room Service - Breakfast</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">$15.00</span>
                </div>
              </div>

              <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl flex justify-between items-center border border-slate-100 dark:border-slate-700/50">
                <span className="font-bold text-slate-700 dark:text-slate-300">Total Due at Check-out</span>
                <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">$19.50</span>
              </div>
            </div>
            <p className="text-sm text-slate-500 text-center">Please pay your extra charges at the reception during check-out.</p>
          </div>
        )}

        {activeTab === 'service' && (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
            
            {requestSent && (
              <div className="sm:col-span-2 md:col-span-3 p-4 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded-2xl border border-emerald-100 dark:border-emerald-500/20 flex items-center justify-center gap-2 font-bold animate-in zoom-in duration-300">
                <CheckCircle2 className="w-5 h-5" /> Request sent successfully! Our team is on it.
              </div>
            )}

            <button onClick={() => handleServiceRequest('Towels')} className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 hover:border-brand-500 dark:hover:border-brand-500 hover:shadow-md transition-all text-left group">
              <div className="w-12 h-12 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <BellRing className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-lg">Extra Towels</h3>
              <p className="text-sm text-slate-500 mt-1">Request fresh towels to your room.</p>
            </button>

            <button onClick={() => handleServiceRequest('Cleaning')} className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 hover:border-brand-500 dark:hover:border-brand-500 hover:shadow-md transition-all text-left group">
              <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <BellRing className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-lg">Room Cleaning</h3>
              <p className="text-sm text-slate-500 mt-1">Request housekeeping to clean your room.</p>
            </button>

            <button onClick={() => handleServiceRequest('Dining')} className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 hover:border-brand-500 dark:hover:border-brand-500 hover:shadow-md transition-all text-left group">
              <div className="w-12 h-12 bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Coffee className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-lg">In-Room Dining</h3>
              <p className="text-sm text-slate-500 mt-1">Order food and beverages to your room.</p>
            </button>

          </div>
        )}

      </main>
    </div>
  );
}
