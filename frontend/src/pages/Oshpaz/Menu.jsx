import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, CheckCircle2, XCircle, Search } from 'lucide-react';
import api from '../../lib/api';

export default function OshpazMenu() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    category: 'Main',
    image_url: '',
    is_available: true
  });

  const categories = ['Main', 'Dessert', 'Drink', 'Appetizer'];

  useEffect(() => {
    fetchMenu();
  }, []);

  const fetchMenu = async () => {
    try {
      const res = await api.get('/oshpaz/menu');
      setItems(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (item = null) => {
    if (item) {
      setEditItem(item);
      setForm({ ...item, price: item.price.toString() });
    } else {
      setEditItem(null);
      setForm({ name: '', description: '', price: '', category: 'Main', image_url: '', is_available: true });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form, price: parseFloat(form.price) };
      if (editItem) {
        await api.put(`/oshpaz/menu/${editItem.id}`, payload);
      } else {
        await api.post('/oshpaz/menu', payload);
      }
      setIsModalOpen(false);
      fetchMenu();
    } catch (err) {
      console.error(err);
      alert('Error saving item');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this item?')) return;
    try {
      await api.delete(`/oshpaz/menu/${id}`);
      fetchMenu();
    } catch (err) {
      console.error(err);
    }
  };

  const toggleAvailability = async (item) => {
    try {
      await api.put(`/oshpaz/menu/${item.id}`, { ...item, is_available: !item.is_available });
      fetchMenu();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading menu...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Restaurant Menu</h1>
          <p className="text-slate-500 dark:text-slate-400">Manage dishes available for guests to order</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2"
        >
          <Plus className="w-5 h-5" /> Add Dish
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {items.map(item => (
          <div key={item.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <div className="h-48 bg-slate-100 dark:bg-slate-800 relative">
              {item.image_url ? (
                <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400">No Image</div>
              )}
              <div className="absolute top-2 right-2">
                <button 
                  onClick={() => toggleAvailability(item)}
                  className={`px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md ${item.is_available ? 'bg-green-500/80 text-white' : 'bg-red-500/80 text-white'}`}
                >
                  {item.is_available ? 'Available' : 'Unavailable'}
                </button>
              </div>
            </div>
            
            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">{item.name}</h3>
                  <span className="text-xs text-brand-600 dark:text-brand-400 font-medium px-2 py-0.5 bg-brand-50 dark:bg-brand-500/10 rounded-full">
                    {item.category}
                  </span>
                </div>
                <div className="font-bold text-lg text-emerald-600 dark:text-emerald-400">
                  ${item.price.toFixed(2)}
                </div>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 h-10 mb-4">
                {item.description || 'No description'}
              </p>
              
              <div className="flex gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button 
                  onClick={() => handleOpenModal(item)}
                  className="flex-1 flex justify-center items-center gap-1 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <Edit2 className="w-4 h-4" /> Edit
                </button>
                <button 
                  onClick={() => handleDelete(item.id)}
                  className="flex-1 flex justify-center items-center gap-1 py-2 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {editItem ? 'Edit Dish' : 'Add New Dish'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Name</label>
                <input required type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-slate-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
                <textarea rows="2" value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-slate-900 dark:text-white"></textarea>
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Price ($)</label>
                  <input required type="number" step="0.01" value={form.price} onChange={e => setForm({...form, price: e.target.value})} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-slate-900 dark:text-white" />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Category</label>
                  <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-slate-900 dark:text-white">
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Image URL (Optional)</label>
                <input type="text" value={form.image_url} onChange={e => setForm({...form, image_url: e.target.value})} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-slate-900 dark:text-white" />
              </div>
              <div className="flex items-center gap-2 pt-2">
                <input type="checkbox" id="avail" checked={form.is_available} onChange={e => setForm({...form, is_available: e.target.checked})} className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500" />
                <label htmlFor="avail" className="text-sm font-medium text-slate-700 dark:text-slate-300">Available for ordering</label>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-brand-600 text-white rounded-xl font-medium hover:bg-brand-700 transition-colors">Save Dish</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
