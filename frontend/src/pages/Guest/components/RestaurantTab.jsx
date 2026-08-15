import React, { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Minus, ChefHat, Loader2 } from 'lucide-react';
import api from '../../../lib/api';

export default function RestaurantTab({ guest }) {
  const [MENU_ITEMS, setMenuItems] = useState([]);
  const [isLoadingMenu, setIsLoadingMenu] = useState(true);
  const [cart, setCart] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const res = await api.get('/guest-portal/menu');
        setMenuItems(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoadingMenu(false);
      }
    };
    fetchMenu();
  }, []);

  const categories = ['All', ...new Set(MENU_ITEMS.map(i => i.category))];
  const filteredItems = activeCategory === 'All' ? MENU_ITEMS : MENU_ITEMS.filter(i => i.category === activeCategory);

  const updateCart = (id, delta) => {
    setCart(prev => {
      const current = prev[id] || 0;
      const next = current + delta;
      if (next <= 0) {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      }
      return { ...prev, [id]: next };
    });
  };

  const totalAmount = Object.entries(cart).reduce((sum, [id, qty]) => {
    const item = MENU_ITEMS.find(i => i.id === parseInt(id));
    return sum + (item.price * qty);
  }, 0);

  const handleOrder = async () => {
    if (Object.keys(cart).length === 0) return;
    setLoading(true);
    try {
      const orderItems = Object.entries(cart).map(([id, qty]) => {
        const item = MENU_ITEMS.find(i => i.id === parseInt(id));
        return { name: item.name, price: item.price, quantity: qty };
      });
      
      await api.post('/guest-portal/orders', {
        items: orderItems,
        total_price: totalAmount
      });
      
      setCart({});
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.error || 'Order failed. Please try again or call reception.';
      alert(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
          <ChefHat className="text-brand-500 w-7 h-7" /> In-Room Dining
        </h2>
      </div>

      {isLoadingMenu ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
        </div>
      ) : (
        <>
          <div className="flex overflow-x-auto hide-scrollbar gap-2 pb-2">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-5 py-2 rounded-full whitespace-nowrap font-bold transition-all ${
              activeCategory === cat 
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md' 
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {filteredItems.map(item => (
          <div key={item.id} className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col">
            <div className="h-32 bg-slate-200 dark:bg-slate-800 relative">
              <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
              <div className="absolute top-2 right-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur px-2 py-1 rounded-lg text-xs font-black text-slate-900 dark:text-white shadow-sm">
                ${item.price.toFixed(2)}
              </div>
            </div>
            <div className="p-3 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-tight mb-1">{item.name}</h3>
                <p className="text-[10px] text-slate-500 line-clamp-2 leading-snug">{item.description}</p>
              </div>
              
              <div className="mt-3">
                {!cart[item.id] ? (
                  <button 
                    onClick={() => updateCart(item.id, 1)}
                    className="w-full py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1"
                  >
                    <Plus className="w-4 h-4" /> Add
                  </button>
                ) : (
                  <div className="flex items-center justify-between bg-brand-50 dark:bg-brand-500/10 rounded-xl p-1">
                    <button onClick={() => updateCart(item.id, -1)} className="w-8 h-8 flex items-center justify-center bg-white dark:bg-brand-500/20 rounded-lg text-brand-600 dark:text-brand-400 shadow-sm"><Minus className="w-4 h-4" /></button>
                    <span className="font-bold text-brand-700 dark:text-brand-400 text-sm">{cart[item.id]}</span>
                    <button onClick={() => updateCart(item.id, 1)} className="w-8 h-8 flex items-center justify-center bg-white dark:bg-brand-500/20 rounded-lg text-brand-600 dark:text-brand-400 shadow-sm"><Plus className="w-4 h-4" /></button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {Object.keys(cart).length > 0 && (
        <div className="fixed bottom-20 left-4 right-4 max-w-md mx-auto z-40">
          <div className="bg-slate-900 dark:bg-brand-600 text-white rounded-2xl p-4 shadow-xl shadow-slate-900/20 flex items-center justify-between animate-in slide-in-from-bottom-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <ShoppingCart className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-white/70 font-medium">{Object.values(cart).reduce((a,b)=>a+b,0)} items</p>
                <p className="font-bold text-lg leading-tight">${totalAmount.toFixed(2)}</p>
              </div>
            </div>
            <button 
              onClick={handleOrder}
              disabled={loading}
              className="px-6 py-3 bg-brand-500 dark:bg-white text-white dark:text-brand-600 font-bold rounded-xl shadow-md transition-transform active:scale-95"
            >
              {loading ? 'Sending...' : 'Place Order'}
            </button>
          </div>
        </div>
      )}

      {success && (
        <div className="fixed top-20 left-4 right-4 max-w-md mx-auto z-50 animate-in fade-in slide-in-from-top-4">
          <div className="bg-emerald-500 text-white p-4 rounded-2xl shadow-xl flex items-center justify-center gap-2 font-bold">
            <CheckCircle2 className="w-6 h-6" /> Order sent to Kitchen!
          </div>
        </div>
      )}
      </>
      )}
    </div>
  );
}
