import React, { useEffect, useState } from 'react';
import api from '../../../lib/api';
import { Receipt, CreditCard, ChevronRight, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function BillTab({ guest }) {
  const [billData, setBillData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [payLoading, setPayLoading] = useState(false);

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

  const handlePayment = async () => {
    if (totalExtra <= 0) return;
    setPayLoading(true);
    try {
      // Create payment link via Click (or any other gateway available)
      const res = await api.post('/payments/click/create-url', {
        bookingId: billData.id,
        amount: totalExtra,
        returnUrl: window.location.href
      });
      if (res.data.url) {
        window.location.href = res.data.url;
      }
    } catch (err) {
      console.error(err);
      alert('To\'lov havolasini yaratishda xatolik yuz berdi');
    } finally {
      setPayLoading(false);
    }
  };

  const totalExtra = billData?.extra_charges?.reduce((sum, charge) => sum + charge.amount, 0) || 0;

  if (loading) return <div className="text-center p-8 text-slate-500">Loading your bill...</div>;
  if (!billData) return <div className="text-center p-8 text-red-500">Error loading bill.</div>;

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
          <Receipt className="text-brand-500 w-7 h-7" /> Hotel Bill
        </h2>
      </div>

      <div className="bg-slate-900 dark:bg-slate-800 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Receipt className="w-32 h-32" />
        </div>
        <div className="relative z-10">
          <p className="text-slate-400 font-medium mb-1">Total Due</p>
          <h2 className="text-4xl font-black font-mono tracking-tight mb-6">
            ${totalExtra.toFixed(2)}
          </h2>
          
          <div className="flex items-center gap-2 text-sm text-emerald-400 font-bold bg-emerald-500/10 w-fit px-3 py-1.5 rounded-lg">
            <CheckCircle2 className="w-4 h-4" /> Accommodation Paid ($0.00)
          </div>
        </div>
      </div>

      {paymentSuccess && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded-2xl flex items-center gap-3 animate-in zoom-in">
          <CheckCircle2 className="w-6 h-6" />
          <div>
            <div className="font-bold">Payment Successful</div>
            <div className="text-sm opacity-80">Thank you for your payment!</div>
          </div>
        </div>
      )}

      <div>
        <h3 className="font-bold text-slate-900 dark:text-white mb-4">Extra Charges</h3>
        
        {(!billData.extra_charges || billData.extra_charges.length === 0) ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-8 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-3">
              <CheckCircle2 className="w-8 h-8 text-slate-300 dark:text-slate-600" />
            </div>
            <p className="text-slate-500 font-medium">You have no pending extra charges.</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl overflow-hidden">
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {billData.extra_charges.map(charge => (
                <div key={charge.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white text-sm">{charge.description}</p>
                    <p className="text-xs text-slate-500 mt-0.5">Order ID #{charge.id}</p>
                  </div>
                  <div className="font-mono font-bold text-slate-900 dark:text-white">
                    ${charge.amount.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800">
              <div className="pt-6">
                <button 
                  onClick={handlePayment}
                  disabled={payLoading || totalExtra <= 0}
                  className="w-full py-4 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:bg-slate-400 text-white rounded-2xl font-black text-lg shadow-lg shadow-brand-500/30 transition-all flex justify-center items-center gap-2"
                >
                  {payLoading ? 'Yuklanmoqda...' : 'Pay Now'} <ChevronRight className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
