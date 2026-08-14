import { Bell, Search, User, Globe, Moon, Sun, Menu } from 'lucide-react';
import useStore from '../store/useStore';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';

export default function Header({ isResponsive, onMenuClick }) {
  const { user, themeMode, toggleTheme } = useStore();
  const { i18n } = useTranslation();
  const [langOpen, setLangOpen] = useState(false);

  const currentLang = i18n.language || 'en';
  
  const languages = [
    { code: 'en', label: 'English' },
    { code: 'uz', label: 'O\'zbek' },
    { code: 'ru', label: 'Русский' }
  ];

  const changeLanguage = (code) => {
    i18n.changeLanguage(code);
    setLangOpen(false);
  };

  return (
    <header className="h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-200 dark:border-slate-800 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-10 shadow-sm transition-colors">
      
      <div className="flex items-center gap-3 flex-1 max-w-md">
        {isResponsive && (
          <button 
            onClick={onMenuClick}
            className="p-2 -ml-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg lg:hidden transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        {/* Search Bar */}
        <div className="relative group flex-1 hidden sm:block">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 group-focus-within:text-brand-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Search booking (BKG-2026-...)" 
            className="w-full pl-10 pr-4 py-2 bg-gray-100/50 dark:bg-slate-800/50 dark:text-white border-none rounded-full focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-brand-500/20 text-sm transition-all outline-none"
          />
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2 sm:gap-4 ml-auto">
        
        {/* Dark Mode Toggle */}
        <button 
          onClick={toggleTheme}
          className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors"
        >
          {themeMode === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* Language */}
        <div className="relative">
          <button 
            onClick={() => setLangOpen(!langOpen)}
            className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors text-sm font-medium px-2 py-1 rounded-md hover:bg-gray-100 dark:hover:bg-slate-800"
          >
            <Globe className="w-4 h-4" />
            {currentLang.toUpperCase()}
          </button>
          
          {langOpen && (
            <div className="absolute right-0 mt-2 w-32 bg-white dark:bg-slate-800 rounded-md shadow-lg border border-gray-100 dark:border-slate-700 py-1 z-50">
              {languages.map((l) => (
                <button
                  key={l.code}
                  onClick={() => changeLanguage(l.code)}
                  className={`w-full text-left px-4 py-2 text-sm ${currentLang === l.code ? 'bg-brand-50 text-brand-600 dark:bg-brand-900/20 dark:text-brand-400 font-semibold' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700/50'}`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notifications */}
        <button className="relative p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
        </button>

        <div className="w-px h-6 bg-gray-200 dark:bg-slate-700 mx-2"></div>

        {/* Profile */}
        <div className="flex items-center gap-2 sm:gap-3 cursor-pointer group">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">{user?.name || 'Receptionist'}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{user?.role || 'Reception'}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-brand-500 to-brand-400 flex items-center justify-center text-white shadow-md">
            <User className="w-5 h-5" />
          </div>
        </div>

      </div>
    </header>
  );
}
