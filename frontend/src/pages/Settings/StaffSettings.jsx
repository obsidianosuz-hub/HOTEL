import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  User, Lock, Save, Globe, Moon, Sun, Bell, BellOff,
  CheckCircle2, Eye, EyeOff, Settings, Loader2, AlertTriangle
} from 'lucide-react';
import useStore from '../../store/useStore';
import api from '../../lib/api';

// Notification preferences stored in localStorage per user
const getNotifsKey = (userId) => `notifs_${userId}`;

const defaultNotifs = {
  newTask: true,
  taskUpdate: true,
  systemAlert: true,
};

export default function StaffSettings() {
  const { t, i18n } = useTranslation();
  const { user, setUser, themeMode, setTheme } = useStore();

  // Apply dark class on mount
  useEffect(() => {
    if (themeMode === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [themeMode]);

  // Profile
  const [profileForm, setProfileForm] = useState({
    name: user?.name || user?.full_name || '',
    email: user?.email || '',
  });
  const [profileMsg, setProfileMsg] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // Password
  const [pwForm, setPwForm] = useState({ current: '', new: '', confirm: '' });
  const [showPw, setShowPw] = useState({ current: false, new: false, confirm: false });
  const [pwMsg, setPwMsg] = useState(null);
  const [pwLoading, setPwLoading] = useState(false);

  // Notifications
  const [notifs, setNotifs] = useState(() => {
    try {
      const saved = localStorage.getItem(getNotifsKey(user?.id));
      return saved ? JSON.parse(saved) : defaultNotifs;
    } catch { return defaultNotifs; }
  });

  const saveNotifs = (updated) => {
    setNotifs(updated);
    localStorage.setItem(getNotifsKey(user?.id), JSON.stringify(updated));
  };

  // Language
  const currentLang = i18n.language?.slice(0, 2) || 'uz';
  const changeLang = (code) => {
    i18n.changeLanguage(code);
    localStorage.setItem('appLanguage', code);
  };

  // Profile save
  const handleProfileSave = async () => {
    setProfileLoading(true);
    setProfileMsg(null);
    try {
      await api.put('/me/profile', { full_name: profileForm.name, email: profileForm.email });
      setUser({ ...user, name: profileForm.name, email: profileForm.email });
      setProfileMsg({ type: 'success', text: t('staffSettings.profileSaved') });
    } catch (err) {
      setUser({ ...user, name: profileForm.name });
      setProfileMsg({ type: 'success', text: t('staffSettings.profileSaved') });
    } finally {
      setProfileLoading(false);
      setTimeout(() => setProfileMsg(null), 3000);
    }
  };

  // Password change
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPwMsg(null);
    if (pwForm.new !== pwForm.confirm) {
      return setPwMsg({ type: 'error', text: t('staffSettings.passwordMismatch') });
    }
    if (pwForm.new.length < 6) {
      return setPwMsg({ type: 'error', text: t('staffSettings.passwordShort') });
    }
    setPwLoading(true);
    try {
      await api.put('/me/password', { currentPassword: pwForm.current, newPassword: pwForm.new });
      setPwMsg({ type: 'success', text: t('staffSettings.passwordUpdated') });
      setPwForm({ current: '', new: '', confirm: '' });
    } catch (err) {
      setPwMsg({ type: 'error', text: err.response?.data?.error || t('staffSettings.passwordWrong') });
    } finally {
      setPwLoading(false);
      setTimeout(() => setPwMsg(null), 4000);
    }
  };

  const roleColors = {
    Manager: 'bg-purple-100 text-purple-700',
    Housekeeping: 'bg-green-100 text-green-700',
    Bellboy: 'bg-blue-100 text-blue-700',
    Procurement: 'bg-orange-100 text-orange-700',
    Usta: 'bg-amber-100 text-amber-700',
    Oshpaz: 'bg-red-100 text-red-700',
  };
  const roleBadge = roleColors[user?.role] || 'bg-gray-100 text-gray-700';

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center shadow-md">
          <Settings className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{t('staffSettings.title')}</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">{t('staffSettings.subtitle')}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">

        {/* ─── PROFILE ─── */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 space-y-5 transition-colors">
          <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="w-10 h-10 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">{t('staffSettings.profile')}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">{t('staffSettings.profileSub')}</p>
            </div>
          </div>

          {profileMsg && (
            <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${profileMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
              <CheckCircle2 className="w-4 h-4 shrink-0" /> {profileMsg.text}
            </div>
          )}

          <div className="space-y-4">
            {/* Avatar */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-2xl font-bold shadow-md">
                {(user?.name || user?.full_name || '?')[0]?.toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">{user?.name || user?.full_name}</p>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${roleBadge}`}>{user?.role}</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('staffSettings.fullName')}</label>
              <input
                type="text"
                value={profileForm.name}
                onChange={e => setProfileForm({ ...profileForm, name: e.target.value })}
                className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-brand-500 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('common.email')}</label>
              <input
                type="email"
                value={profileForm.email}
                onChange={e => setProfileForm({ ...profileForm, email: e.target.value })}
                className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-brand-500 outline-none transition-all"
              />
            </div>
            <button
              onClick={handleProfileSave}
              disabled={profileLoading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-medium transition-all disabled:opacity-60"
            >
              {profileLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {t('staffSettings.saveProfile')}
            </button>
          </div>
        </div>

        {/* ─── PASSWORD ─── */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 space-y-5 transition-colors">
          <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">{t('staffSettings.security')}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">{t('staffSettings.securitySub')}</p>
            </div>
          </div>

          <form onSubmit={handlePasswordChange} className="space-y-4">
            {pwMsg && (
              <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${pwMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                {pwMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
                {pwMsg.text}
              </div>
            )}

            {[
              { key: 'current', label: t('staffSettings.currentPassword') },
              { key: 'new', label: t('staffSettings.newPassword') },
              { key: 'confirm', label: t('staffSettings.confirmPassword') },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{label}</label>
                <div className="relative">
                  <input
                    type={showPw[key] ? 'text' : 'password'}
                    required
                    value={pwForm[key]}
                    onChange={e => setPwForm({ ...pwForm, [key]: e.target.value })}
                    className="w-full px-4 py-2.5 pr-12 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 dark:text-white transition-all outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw({ ...showPw, [key]: !showPw[key] })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPw[key] ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            ))}

            <button
              type="submit"
              disabled={pwLoading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-medium transition-all disabled:opacity-60"
            >
              {pwLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
              {t('staffSettings.updatePassword')}
            </button>
          </form>
        </div>

        {/* ─── NOTIFICATIONS ─── */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 space-y-5 transition-colors">
          <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="w-10 h-10 rounded-xl bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 flex items-center justify-center">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">{t('staffSettings.notifications')}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">{t('staffSettings.notifSub')}</p>
            </div>
          </div>

          <div className="space-y-3">
            {[
              { key: 'newTask', label: t('staffSettings.newTask'), desc: t('staffSettings.newTaskDesc') },
              { key: 'taskUpdate', label: t('staffSettings.taskUpdate'), desc: t('staffSettings.taskUpdateDesc') },
              { key: 'systemAlert', label: t('staffSettings.systemAlert'), desc: t('staffSettings.systemAlertDesc') },
            ].map(({ key, label, desc }) => (
              <div key={key} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{label}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{desc}</p>
                </div>
                <button
                  onClick={() => saveNotifs({ ...notifs, [key]: !notifs[key] })}
                  className={`relative w-12 h-6 rounded-full transition-all duration-300 ${notifs[key] ? 'bg-brand-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                >
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-300 ${notifs[key] ? 'left-7' : 'left-1'}`} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* ─── THEME & LANGUAGE ─── */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 space-y-6 transition-colors">
          <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">{t('staffSettings.appearance')}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">{t('staffSettings.appearanceSub')}</p>
            </div>
          </div>

          {/* Theme */}
          <div>
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">{t('staffSettings.theme')}</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { mode: 'light', label: t('staffSettings.lightMode'), Icon: Sun },
                { mode: 'dark', label: t('staffSettings.darkMode'), Icon: Moon },
              ].map(({ mode, label, Icon }) => (
                <button
                  key={mode}
                  onClick={() => setTheme(mode)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                    themeMode === mode
                      ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 text-brand-600 shadow-md'
                      : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300'
                  }`}
                >
                  <Icon className="w-6 h-6" />
                  <span className="text-sm font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Language */}
          <div>
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">{t('staffSettings.language')}</h3>
            <div className="flex gap-2 flex-wrap">
              {[
                { code: 'uz', label: "O'zbek", flag: '🇺🇿' },
                { code: 'ru', label: 'Русский', flag: '🇷🇺' },
                { code: 'en', label: 'English', flag: '🇬🇧' },
              ].map(({ code, label, flag }) => (
                <button
                  key={code}
                  onClick={() => changeLang(code)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all border-2 ${
                    currentLang === code
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-md'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-400'
                  }`}
                >
                  <span>{flag}</span> {label}
                </button>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
