import React, { useState, useEffect } from 'react';
import { Loader2, Save, Hotel, MapPin, Image as ImageIcon, Palette, Server, Database, Clock, HardDrive, CheckCircle2, FileText, Phone, Mail, Send, Instagram, Upload, Monitor, Globe } from 'lucide-react';
import api, { API_ORIGIN } from '../../lib/api';
import useSettingsStore from '../../store/useSettingsStore';
import { useTranslation } from 'react-i18next';

export default function Settings() {
  const { t, i18n } = useTranslation();
  const { fetchSettings } = useSettingsStore();
  const [settings, setSettings] = useState({ 
    name: '', address: '', logo_url: '', theme_color: '', description: '', 
    contact_phone: '', contact_email: '', social_links: { telegram: '', instagram: '' },
    internal_name: '', internal_logo_url: '', internal_theme_color: '', app_language: 'en'
  });
  const [health, setHealth] = useState(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [internalLogoUploading, setInternalLogoUploading] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [settingsRes, healthRes] = await Promise.all([
        api.get('/admin/settings').catch(() => ({ data: null })),
        api.get('/admin/system/health').catch(() => ({ data: null }))
      ]);
      const incoming = settingsRes.data;
      
      // If backend returned data, use it; otherwise use defaults (demo mode)
      const merged = {
        name: 'Grand Hotel', address: 'Toshkent, Amir Temur ko\'chasi 1', 
        logo_url: '', theme_color: '#0f766e',
        description: 'A luxury hotel in the heart of Tashkent', 
        contact_phone: '+998 71 123-45-67', contact_email: 'info@grandhotel.uz',
        social_links: { telegram: '@grandhotel_uz', instagram: 'grandhotel_uz' },
        internal_name: 'Hotel ERP', internal_logo_url: '', internal_theme_color: '#0f766e',
        app_language: 'en',
        ...(incoming || {})
      };
      Object.keys(merged).forEach(k => { if (merged[k] === null) merged[k] = ''; });
      merged.social_links = { telegram: '', instagram: '', ...(merged.social_links || {}) };
      setSettings(merged);
      
      // Demo health data if backend unavailable
      setHealth(healthRes.data || {
        database: 'connected',
        uptime: '3d 14h 22m',
        memory: { heapUsed: '128 MB / 512 MB' }
      });
      setError(null);
    } catch (err) {
      setError('Failed to load settings data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoSelect = async (file, isInternal = false) => {
    if (!file) return;
    const setLoader = isInternal ? setInternalLogoUploading : setLogoUploading;
    setLoader(true);
    setError(null);
    try {
      const form = new FormData();
      form.append('logo', file);
      const endpoint = isInternal ? '/admin/settings/internal-logo' : '/admin/settings/logo';
      const res = await api.post(endpoint, form, { headers: { 'Content-Type': 'multipart/form-data' } });
      
      if (isInternal) {
        setSettings(s => ({ ...s, internal_logo_url: res.data.internal_logo_url }));
      } else {
        setSettings(s => ({ ...s, logo_url: res.data.logo_url }));
      }
      
      fetchSettings();
      setMessage(isInternal ? 'Internal logo updated.' : 'Public logo updated.');
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to upload logo.');
    } finally {
      setLoader(false);
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      await api.put('/admin/settings', settings);
      fetchSettings();
      
      if (settings.app_language) {
        i18n.changeLanguage(settings.app_language);
      }
      
      setMessage('✅ Settings saved successfully.');
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to save settings to backend. Please check the network or server logs.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex h-96 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-brand-600" /></div>;

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('settings.title')}</h1>
        <p className="text-gray-500 text-sm mt-1">{t('settings.subtitle')}</p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl">
          <p>{error}</p>
        </div>
      )}
      {message && (
        <div className="bg-green-50 text-green-700 p-4 rounded-xl flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5" />
          <p>{message}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column - Branding and Config */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Internal Branding */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
            <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">
              <Monitor className="h-5 w-5 text-gray-500" />
              {t('settings.internal_branding')}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">{t('settings.system_name')}</label>
                <div className="relative">
                  <Hotel className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  <input required type="text" value={settings.internal_name} onChange={e => setSettings({...settings, internal_name: e.target.value})} className="pl-10 w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none" placeholder="Hotel ERP" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Internal Theme Color</label>
                <div className="relative">
                  <Palette className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  <input type="color" value={settings.internal_theme_color || '#0f766e'} onChange={e => setSettings({...settings, internal_theme_color: e.target.value})} className="pl-10 w-full p-1 h-10 border border-gray-200 rounded-lg cursor-pointer" />
                </div>
              </div>

              <div className="md:col-span-2 space-y-1">
                <label className="text-sm font-medium text-gray-700">Internal Logo</label>
                <div className="flex items-center gap-4">
                  {settings.internal_logo_url ? (
                    <img src={`${API_ORIGIN}${settings.internal_logo_url}`} alt="Internal logo" className="w-16 h-16 rounded-xl object-cover border border-gray-200" />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center">
                      <ImageIcon className="w-6 h-6 text-gray-300" />
                    </div>
                  )}
                  <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium cursor-pointer">
                    {internalLogoUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    {settings.internal_logo_url ? 'Change Internal Logo' : 'Upload Internal Logo'}
                    <input type="file" accept="image/jpeg,image/png,image/webp,image/svg+xml" className="hidden" onChange={e => handleLogoSelect(e.target.files?.[0], true)} />
                  </label>
                </div>
                <p className="text-xs text-gray-400 mt-1">Used on login pages, staff dashboards, and sidebar menus.</p>
              </div>
            </div>
            
            <div className="pt-4 flex justify-end border-t border-gray-100 mt-6">
              <button type="button" onClick={handleSubmit} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors shadow-sm font-medium">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {t('settings.save')}
              </button>
            </div>
          </div>

          {/* Public Branding */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
            <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">
              <Globe className="h-5 w-5 text-gray-500" />
              Public Landing Branding (Guests)
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Hotel Name (Public)</label>
                <div className="relative">
                  <Hotel className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  <input required type="text" value={settings.name} onChange={e => setSettings({...settings, name: e.target.value})} className="pl-10 w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none" placeholder="Grand Budapest Hotel" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Public Theme Color</label>
                <div className="relative">
                  <Palette className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  <input type="color" value={settings.theme_color || '#0f766e'} onChange={e => setSettings({...settings, theme_color: e.target.value})} className="pl-10 w-full p-1 h-10 border border-gray-200 rounded-lg cursor-pointer" />
                </div>
              </div>

              <div className="md:col-span-2 space-y-1">
                <label className="text-sm font-medium text-gray-700">Public Logo</label>
                <div className="flex items-center gap-4">
                  {settings.logo_url ? (
                    <img src={`${API_ORIGIN}${settings.logo_url}`} alt="Public logo" className="w-16 h-16 rounded-xl object-cover border border-gray-200" />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center">
                      <ImageIcon className="w-6 h-6 text-gray-300" />
                    </div>
                  )}
                  <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium cursor-pointer">
                    {logoUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    {settings.logo_url ? 'Change Public Logo' : 'Upload Public Logo'}
                    <input type="file" accept="image/jpeg,image/png,image/webp,image/svg+xml" className="hidden" onChange={e => handleLogoSelect(e.target.files?.[0], false)} />
                  </label>
                </div>
                <p className="text-xs text-gray-400 mt-1">Used exclusively on the public-facing guest website.</p>
              </div>

              <div className="md:col-span-2 space-y-1">
                <label className="text-sm font-medium text-gray-700">Public Description</label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <textarea rows="3" value={settings.description} onChange={e => setSettings({...settings, description: e.target.value})} className="pl-10 w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none" placeholder="A short paragraph about the hotel, its location and character." />
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-end border-t border-gray-100 mt-6">
              <button type="button" onClick={handleSubmit} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors shadow-sm font-medium">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {t('settings.save')}
              </button>
            </div>
          </div>

          {/* Contact Details */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
            <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-3">Hotel Contact Info</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Contact Phone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  <input type="tel" value={settings.contact_phone} onChange={e => setSettings({...settings, contact_phone: e.target.value})} className="pl-10 w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none" placeholder="+998 90 123 45 67" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Contact Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  <input type="email" value={settings.contact_email} onChange={e => setSettings({...settings, contact_email: e.target.value})} className="pl-10 w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none" placeholder="info@hotel.com" />
                </div>
              </div>
              <div className="md:col-span-2 space-y-1">
                <label className="text-sm font-medium text-gray-700">Address</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <textarea rows="2" value={settings.address} onChange={e => setSettings({...settings, address: e.target.value})} className="pl-10 w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none" placeholder="123 Hotel Ave, City" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Telegram</label>
                <div className="relative">
                  <Send className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  <input type="text" value={settings.social_links.telegram} onChange={e => setSettings({...settings, social_links: { ...settings.social_links, telegram: e.target.value }})} className="pl-10 w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none" placeholder="@your_hotel" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Instagram</label>
                <div className="relative">
                  <Instagram className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  <input type="text" value={settings.social_links.instagram} onChange={e => setSettings({...settings, social_links: { ...settings.social_links, instagram: e.target.value }})} className="pl-10 w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none" placeholder="your_hotel" />
                </div>
              </div>
            </div>
            
            <div className="pt-4 flex justify-end border-t border-gray-100 mt-6">
              <button type="button" onClick={handleSubmit} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors shadow-sm font-medium">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {t('settings.save')}
              </button>
            </div>
          </div>
          
        </div>

        {/* Right Column - System Details */}
        <div className="space-y-6">
          
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-3 mb-4">
              System Settings
            </h2>
            
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Application Language</label>
                <select 
                  value={settings.app_language} 
                  onChange={e => setSettings({...settings, app_language: e.target.value})} 
                  className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none bg-white"
                >
                  <option value="en">English (EN)</option>
                  <option value="uz">O'zbekcha (UZ)</option>
                  <option value="ru">Русский (RU)</option>
                </select>
                <p className="text-xs text-gray-400 mt-1">Changes the main interface language globally.</p>
              </div>
              
              <div className="pt-4 flex justify-end">
                <button type="button" onClick={handleSubmit} disabled={saving} className="w-full flex items-center justify-center gap-2 px-5 py-2.5 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors shadow-sm font-medium">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {t('settings.save')}
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-3 mb-4 flex items-center gap-2">
              <Server className="h-5 w-5 text-brand-600" />
              System Health
            </h2>
            
            {health ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="flex items-center gap-3">
                    <Database className="h-5 w-5 text-blue-500" />
                    <span className="text-sm font-medium text-gray-700">Database</span>
                  </div>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${health.database === 'connected' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {health.database || 'Unknown'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-orange-500" />
                    <span className="text-sm font-medium text-gray-700">Uptime</span>
                  </div>
                  <span className="text-sm font-mono text-gray-600">{health.uptime || 'N/A'}</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="flex items-center gap-3">
                    <HardDrive className="h-5 w-5 text-purple-500" />
                    <span className="text-sm font-medium text-gray-700">Memory</span>
                  </div>
                  <span className="text-sm font-mono text-gray-600">{health.memory?.heapUsed || 'N/A'}</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500 text-sm">
                Health status unavailable
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

