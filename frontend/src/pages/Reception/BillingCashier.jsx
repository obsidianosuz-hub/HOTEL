import React, { useState, useEffect } from 'react';
import { Search, Wallet, CreditCard, Banknote, RefreshCcw, Coffee, ShieldCheck, AlertCircle, X, ChevronRight, Lock, BedDouble, CheckCircle2 } from 'lucide-react';
import api from '../../lib/api';
import useStore from '../../store/useStore';
import useHotelStore from '../../store/useHotelStore';

export default function ReceptionBillingCashier() {
  const { user } = useStore();
  const { bookings } = useHotelStore();
  const [activeTab, setActiveTab] = useState('folio'); // 'folio', 'cash-register'
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  
  // Shift state
  const [shiftSession, setShiftSession] = useState(null); // null if closed, object if open
  const [shiftAmount, setShiftAmount] = useState('');
  const [shiftModal, setShiftModal] = useState({ open: false, type: 'open' }); // open or close
  
  // Payment state
  const [paymentModal, setPaymentModal] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [cashReceiptModal, setCashReceiptModal] = useState(false);
  const gateways = [
    { id: 1, name: 'Terminal (POS)', type: 'offline' },
    { id: 2, name: 'Payme', type: 'online' },
    { id: 3, name: 'Click', type: 'online' }
  ];
  
  useEffect(() => {
    fetchActiveShift();
    setSearchResults(bookings);
  }, [bookings]);

  const fetchActiveShift = async () => {
    // Mock fetch shift logic
    // const res = await api.get('/api/cash-register/active');
    // setShiftSession(res.data);
    setShiftSession(null); // Assuming closed by default for demo
  };

  const handleSearch = async (e) => {
    const val = e?.target?.value || '';
    setSearchQuery(val);
    
    if (val.trim() === '') {
      setSearchResults(bookings);
    } else {
      const lowerVal = val.toLowerCase();
      const filtered = bookings.filter(b => 
        b.guest?.full_name?.toLowerCase().includes(lowerVal) ||
        b.booking_code?.toLowerCase().includes(lowerVal) ||
        b.room?.room_number?.toString().includes(lowerVal)
      );
      setSearchResults(filtered);
    }
  };

  // Run empty search on mount to load default suggestions
  useEffect(() => {
    handleSearch({ target: { value: '' } });
  }, []);

  const selectFolio = (booking) => {
    setSelectedBooking(booking);
    setSearchResults([]);
    setSearchQuery('');
  };

  const handleShiftAction = async (e) => {
    e.preventDefault();
    if (shiftModal.type === 'open') {
      // await api.post('/api/cash-register/open', { opening_balance: parseFloat(shiftAmount) });
      setShiftSession({ opened_at: new Date(), opening_balance: parseFloat(shiftAmount) });
    } else {
      // await api.post('/api/cash-register/close', { closing_balance: parseFloat(shiftAmount) });
      setShiftSession(null);
    }
    setShiftModal({ open: false, type: 'open' });
    setShiftAmount('');
  };

  const isAlreadyPaid = selectedBooking?.source === 'BookingCom' && selectedBooking?.payment_model === 'booking_com_collect';
  
  const totalExtra = selectedBooking?.extra_charges?.reduce((sum, c) => sum + c.amount, 0) || 0;
  const grandTotal = isAlreadyPaid ? totalExtra : (selectedBooking?.total_price || 0) + totalExtra;

  const handleProcessPayment = (gatewayName) => {
    setPaymentSuccess(true);
    setTimeout(() => {
      setPaymentSuccess(false);
      setPaymentModal(false);
      setSelectedBooking(null);
    }, 2000);
  };

  const handleCollectCash = () => {
    setCashReceiptModal(true);
    // Auto-trigger print after receipt renders
    setTimeout(() => {
      window.print();
    }, 500);
  };

  const receiptDate = new Date().toLocaleString('uz-UZ', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit'
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <Wallet className="w-8 h-8 text-brand-500" />
            Billing & Cashier
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">Manage guest folios, payments, and shift register.</p>
        </div>
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <button 
            onClick={() => setActiveTab('folio')}
            className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'folio' ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
          >
            Guest Folio
          </button>
          <button 
            onClick={() => setActiveTab('cash-register')}
            className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'cash-register' ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
          >
            Cash Register
          </button>
        </div>
      </div>

      {activeTab === 'folio' && (
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left: Search & Select */}
          <div className="lg:col-span-1 space-y-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search guest or booking code..." 
                value={searchQuery}
                onChange={handleSearch}
                className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm focus:ring-2 focus:ring-brand-500 dark:text-white outline-none transition-all"
              />
            </div>
            
            {searchResults.length > 0 && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-lg overflow-hidden flex flex-col gap-1 p-2">
                {searchResults.map(b => (
                  <button 
                    key={b.id} 
                    onClick={() => selectFolio(b)}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-left transition-colors"
                  >
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">{b.guest?.full_name}</p>
                      <p className="text-xs text-slate-500 font-mono mt-1">{b.booking_code} • Room {b.room?.room_number}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-300 dark:text-slate-600" />
                  </button>
                ))}
              </div>
            )}
            
            {!selectedBooking && (
              searchResults.length === 0 ? (
                <div className="p-8 text-center text-slate-500 flex flex-col items-center justify-center">
                  <Search className="w-8 h-8 mb-2 text-slate-300" />
                  <p>No folios found</p>
                </div>
              ) : null
            )}
          </div>

          {/* Right: Active Folio */}
          {selectedBooking && (
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
              <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{selectedBooking.guest?.full_name}</h2>
                  <p className="text-slate-500 mt-1 font-mono">{selectedBooking.booking_code} • Room {selectedBooking.room?.room_number}</p>
                </div>
                <button onClick={() => setSelectedBooking(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 flex-1 bg-slate-50/50 dark:bg-slate-900/50 space-y-6">
                
                {/* Payment Status Banner */}
                {isAlreadyPaid ? (
                  <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 p-4 rounded-2xl flex items-center gap-4">
                    <div className="p-3 bg-emerald-100 dark:bg-emerald-500/20 rounded-xl text-emerald-600 dark:text-emerald-400">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-emerald-800 dark:text-emerald-300">Room Already Paid</h4>
                      <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-0.5">Payment collected via Booking.com. Do not charge for room rate.</p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 p-4 rounded-2xl flex items-center gap-4">
                    <div className="p-3 bg-amber-100 dark:bg-amber-500/20 rounded-xl text-amber-600 dark:text-amber-400">
                      <AlertCircle className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-amber-800 dark:text-amber-300">Payment Due</h4>
                      <p className="text-sm text-amber-600 dark:text-amber-400 mt-0.5">Collect room payment directly from guest.</p>
                    </div>
                  </div>
                )}

                {/* Folio Items */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 font-semibold text-slate-700 dark:text-slate-300 text-sm border-b border-slate-200 dark:border-slate-800">
                    Charges
                  </div>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                    {/* Room Rate */}
                    <div className="p-4 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-brand-50 dark:bg-brand-500/10 text-brand-600 rounded-lg"><BedDouble className="w-4 h-4" /></div>
                        <span className="font-medium text-slate-700 dark:text-slate-300">Accommodation (Room Rate)</span>
                      </div>
                      <span className={`font-mono font-bold ${isAlreadyPaid ? 'line-through text-slate-400' : 'text-slate-900 dark:text-white'}`}>
                        ${selectedBooking.total_price.toFixed(2)}
                      </span>
                    </div>

                    {/* Extra Charges */}
                    {selectedBooking.extra_charges?.map(charge => (
                      <div key={charge.id} className="p-4 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-orange-50 dark:bg-orange-500/10 text-orange-600 rounded-lg"><Coffee className="w-4 h-4" /></div>
                          <span className="font-medium text-slate-700 dark:text-slate-300">{charge.description}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-mono font-bold text-slate-900 dark:text-white">${charge.amount.toFixed(2)}</span>
                          <button className="text-xs text-red-500 hover:underline">Refund</button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-5 bg-slate-900 dark:bg-black text-white flex justify-between items-center">
                    <span className="font-medium text-slate-300">Total Due</span>
                    <span className="text-2xl font-bold font-mono">${grandTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex gap-4">
                <button 
                  onClick={() => setPaymentModal(true)}
                  disabled={grandTotal === 0}
                  className="flex-1 py-3 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white rounded-xl font-bold shadow-md shadow-brand-500/20 transition-all flex justify-center items-center gap-2"
                >
                  <CreditCard className="w-5 h-5" /> Collect Card
                </button>
                <button 
                  onClick={handleCollectCash}
                  disabled={grandTotal === 0}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-bold shadow-md shadow-emerald-500/20 transition-all flex justify-center items-center gap-2"
                >
                  <Banknote className="w-5 h-5" /> Collect Cash
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'cash-register' && (
        <div className="max-w-2xl mx-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden p-8 text-center space-y-8">
            <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center ${shiftSession ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-slate-100 text-slate-400 dark:bg-slate-800'}`}>
              <Lock className="w-10 h-10" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                {shiftSession ? 'Shift is Open' : 'Shift is Closed'}
              </h2>
              <p className="text-slate-500 dark:text-slate-400 mt-2">
                {shiftSession 
                  ? `You opened this shift at ${new Date(shiftSession.opened_at).toLocaleTimeString()}`
                  : 'Open a new shift to start accepting cash payments.'}
              </p>
            </div>
            
            {shiftSession ? (
              <div className="space-y-6">
                <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl flex justify-between items-center text-left">
                  <div>
                    <p className="text-sm font-medium text-slate-500">Opening Balance</p>
                    <p className="text-2xl font-bold font-mono text-slate-900 dark:text-white">${shiftSession.opening_balance.toFixed(2)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-slate-500">Current Cash (Est)</p>
                    <p className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">${(shiftSession.opening_balance + 150).toFixed(2)}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShiftModal({ open: true, type: 'close' })}
                  className="w-full py-4 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-bold transition-all shadow-md shadow-red-500/20"
                >
                  Close Shift
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setShiftModal({ open: true, type: 'open' })}
                className="w-full py-4 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl font-bold transition-all shadow-md shadow-brand-500/20"
              >
                Open New Shift
              </button>
            )}
          </div>
        </div>
      )}

      {/* Shift Modal */}
      {shiftModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800">
            <div className={`p-6 border-b border-slate-100 dark:border-slate-800 ${shiftModal.type === 'open' ? 'bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-400' : 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400'} flex justify-between items-center`}>
              <h3 className="text-xl font-bold">{shiftModal.type === 'open' ? 'Open Shift' : 'Close Shift'}</h3>
              <button onClick={() => setShiftModal({ open: false, type: 'open' })} className="p-2 hover:bg-white/50 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleShiftAction} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  {shiftModal.type === 'open' ? 'Enter Opening Cash Balance' : 'Enter Closing Cash Balance'}
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                  <input 
                    type="number"
                    step="0.01"
                    required
                    autoFocus
                    value={shiftAmount}
                    onChange={e => setShiftAmount(e.target.value)}
                    className="w-full pl-8 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 dark:text-white outline-none transition-all font-mono text-lg"
                  />
                </div>
              </div>
              
              {shiftModal.type === 'close' && (
                <div>
                   <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Confirm with Password</label>
                   <input type="password" required className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 dark:text-white outline-none transition-all" />
                </div>
              )}

              <button type="submit" className={`w-full py-3 text-white rounded-xl font-bold shadow-md transition-all ${shiftModal.type === 'open' ? 'bg-brand-600 hover:bg-brand-700 shadow-brand-500/20' : 'bg-red-600 hover:bg-red-700 shadow-red-500/20'}`}>
                Confirm
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {paymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800">
            {paymentSuccess ? (
              <div className="p-12 text-center space-y-4 animate-in zoom-in duration-300">
                <div className="w-20 h-20 bg-emerald-100 text-emerald-500 dark:bg-emerald-500/20 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Payment Successful</h3>
                <p className="text-slate-500 dark:text-slate-400">The transaction was processed correctly.</p>
              </div>
            ) : (
              <>
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Card Payment</h3>
                  <button onClick={() => setPaymentModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-6 space-y-6">
                  <div className="text-center p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                    <p className="text-sm font-medium text-slate-500 mb-1">Total to charge</p>
                    <p className="text-4xl font-bold font-mono text-slate-900 dark:text-white">${grandTotal.toFixed(2)}</p>
                  </div>
                  
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Select Payment Method</p>
                    {gateways.map(gw => (
                      <button 
                        key={gw.id}
                        onClick={() => handleProcessPayment(gw.name)}
                        className="w-full p-4 flex items-center gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-brand-500 hover:shadow-md transition-all text-left"
                      >
                        <div className="w-10 h-10 rounded-full bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400 flex items-center justify-center">
                          <CreditCard className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">{gw.name}</p>
                          <p className="text-xs text-slate-500">{gw.type === 'offline' ? 'Process on physical POS and confirm here' : 'Send payment link / Online Processing'}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Cash Receipt Modal */}
      {cashReceiptModal && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 print:bg-white print:items-start print:p-0">
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden w-[400px] print:w-[57mm] print:shadow-none print:rounded-none">
            
            {/* Screen-only header */}
            <div className="flex justify-between items-center p-5 border-b border-slate-100 print:hidden">
              <h3 className="text-lg font-bold text-slate-900">Naqd Pul Cheki</h3>
              <div className="flex gap-2">
                <button 
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-bold flex items-center gap-2 transition-all"
                >
                  🖨️ Chop Etish
                </button>
                <button 
                  onClick={() => { setCashReceiptModal(false); setSelectedBooking(null); }}
                  className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Receipt Content - prints this part */}
            <div className="p-4 mx-auto w-full max-w-[57mm] font-mono text-[11px] leading-tight space-y-3 print:p-0">
              {/* Hotel Info */}
              <div className="text-center space-y-1 pb-3 border-b-2 border-dashed border-slate-300">
                <p className="text-base font-bold text-slate-900">🏨 GRAND HOTEL</p>
                <p className="text-xs text-slate-500">Tel: +998 71 123-45-67</p>
                <p className="text-xs text-slate-500">Toshkent, Amir Temur ko'chasi 1</p>
              </div>

              {/* Guest & Booking Info */}
              <div className="space-y-1 py-2 border-b border-dashed border-slate-200 text-xs text-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-500">Mehmon:</span>
                  <span className="font-bold">{selectedBooking.guest?.full_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Xona:</span>
                  <span className="font-bold">№ {selectedBooking.room?.room_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Bron raqami:</span>
                  <span className="font-bold">{selectedBooking.booking_code}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Sana/Vaqt:</span>
                  <span className="font-bold">{receiptDate}</span>
                </div>
              </div>

              {/* Charges */}
              <div className="space-y-1.5 py-2 border-b border-dashed border-slate-200 text-xs">
                <p className="font-bold text-slate-700 mb-2">XARAJATLAR:</p>
                
                {/* Room Rate */}
                <div className="flex justify-between text-slate-600">
                  <span>Xona narxi ({selectedBooking.room?.room_number})</span>
                  <span className={isAlreadyPaid ? 'line-through text-slate-400' : 'font-bold'}>
                    ${selectedBooking.total_price?.toFixed(2)}
                  </span>
                </div>
                {isAlreadyPaid && (
                  <div className="flex justify-between text-emerald-600 text-[10px]">
                    <span>↳ Booking.com orqali to'langan</span>
                    <span>$0.00</span>
                  </div>
                )}

                {/* Extra Charges */}
                {selectedBooking.extra_charges?.map(c => (
                  <div key={c.id} className="flex justify-between text-slate-600">
                    <span>{c.description}</span>
                    <span className="font-bold">${c.amount.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {/* Total */}
              <div className="py-2 space-y-1">
                <div className="flex justify-between items-center text-base font-bold text-slate-900">
                  <span>JAMI TO'LOV:</span>
                  <span className="text-lg">${grandTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-600">
                  <span>To'lov usuli:</span>
                  <span className="font-bold">💵 NAQD PUL</span>
                </div>
              </div>

              {/* Footer */}
              <div className="text-center pt-3 border-t-2 border-dashed border-slate-300 space-y-1">
                <p className="text-[10px] text-slate-500">Kassir: {user?.full_name || 'Reception'}</p>
                <div className="flex items-center justify-center gap-2 text-emerald-600 font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4" />
                  TO'LOV QABUL QILINDI
                </div>
                <p className="text-[10px] text-slate-400 mt-2">Xizmatimizdan foydalanganingiz uchun rahmat!</p>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
