import React, { useState, useEffect } from 'react';
import { Home, Coffee, BellRing, Receipt, LogOut, Moon, Sun, Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import useStore from '../../store/useStore';
import { useNavigate } from 'react-router-dom';
import HomeTab from './components/HomeTab';
import RestaurantTab from './components/RestaurantTab';
import RequestsTab from './components/RequestsTab';
import BillTab from './components/BillTab';

export default function GuestDashboard() {
  const { t, i18n } = useTranslation();
  const { guest, token, logout } = useStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('home');
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'));
  const [lang, setLang] = useState(i18n.language || 'uz');

  useEffect(() => {
    if (!token || !guest) {
      navigate('/guest/login');
    }
  }, [token, guest, navigate]);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    if (next) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', next ? 'dark' : 'light');
  };

  const toggleLang = () => {
    const next = lang === 'uz' ? 'en' : (lang === 'en' ? 'ru' : 'uz');
    setLang(next);
    i18n.changeLanguage(next);
    localStorage.setItem('appLanguage', next);
  };

  const handleLogout = () => {
    logout();
    navigate('/guest/login');
  };

  if (!guest) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24">
      {/* HEADER */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50">
        <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center text-white font-bold">
              {guest?.full_name?.charAt(0) || 'G'}
            </div>
            <div>
              <h1 className="font-bold text-slate-900 dark:text-white leading-tight truncate max-w-[150px]">{guest?.full_name || 'Guest'}</h1>
              <p className="text-xs text-brand-600 dark:text-brand-400 font-mono">{guest?.booking_code}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button onClick={toggleLang} className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors flex items-center text-xs font-bold uppercase gap-1">
              <Languages className="w-4 h-4" /> {lang}
            </button>
            <button onClick={toggleTheme} className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button onClick={handleLogout} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-full transition-colors ml-1">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* CONTENT AREA */}
      <main className="max-w-md mx-auto p-4 animate-in fade-in duration-300">
        {activeTab === 'home' && <HomeTab guest={guest} />}
        {activeTab === 'restaurant' && <RestaurantTab guest={guest} />}
        {activeTab === 'requests' && <RequestsTab guest={guest} />}
        {activeTab === 'bill' && <BillTab guest={guest} />}
      </main>

      {/* BOTTOM NAVIGATION */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 pb-safe z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        <div className="max-w-md mx-auto flex justify-around p-2">
          <NavItem icon={<Home />} label="Home" active={activeTab === 'home'} onClick={() => setActiveTab('home')} />
          <NavItem icon={<Coffee />} label="Dining" active={activeTab === 'restaurant'} onClick={() => setActiveTab('restaurant')} />
          <NavItem icon={<BellRing />} label="Services" active={activeTab === 'requests'} onClick={() => setActiveTab('requests')} />
          <NavItem icon={<Receipt />} label="My Bill" active={activeTab === 'bill'} onClick={() => setActiveTab('bill')} />
        </div>
      </nav>
    </div>
  );
}

function NavItem({ icon, label, active, onClick }) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center justify-center w-16 h-14 rounded-2xl transition-all duration-300 ${
        active 
          ? 'text-brand-600 dark:text-brand-400 font-bold scale-110' 
          : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
      }`}
    >
      <div className={`mb-1 transition-transform duration-300 ${active ? '-translate-y-1' : ''}`}>
        {React.cloneElement(icon, { className: 'w-5 h-5' })}
      </div>
      <span className="text-[10px]">{label}</span>
      {active && (
        <span className="absolute bottom-1 w-1 h-1 bg-brand-500 rounded-full animate-in zoom-in" />
      )}
    </button>
  );
}
