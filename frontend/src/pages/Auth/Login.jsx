import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeyRound, Mail, Loader2 } from 'lucide-react';
import useStore from '../../store/useStore';
import useSettingsStore from '../../store/useSettingsStore';
import api, { API_ORIGIN } from '../../lib/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { setToken, setUser } = useStore();
  const navigate = useNavigate();
  const { settings } = useSettingsStore();
  const hotelName = settings?.name || 'Hotel ERP';
  const logoSrc = settings?.logo_url ? `${API_ORIGIN}${settings.logo_url}` : null;

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data } = await api.post('/staff/login', { email, password });
      setToken(data.token);
      setUser({ id: data.user.id, name: data.user.name, role: data.user.role });
      navigate(`/${data.user.role.toLowerCase()}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 relative overflow-hidden">
      {/* Decorative Blobs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-brand-400/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-400/20 rounded-full blur-3xl translate-x-1/3 translate-y-1/3"></div>

      <div className="relative w-full max-w-md p-8 bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/50 z-10">
        <div className="text-center mb-8">
          {logoSrc ? (
            <img src={logoSrc} alt={hotelName} className="w-16 h-16 rounded-2xl mx-auto object-cover shadow-lg shadow-brand-500/30 mb-4" />
          ) : (
            <div className="w-16 h-16 bg-brand-500 rounded-2xl mx-auto flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-brand-500/30 mb-4 rotate-3">
              {hotelName.charAt(0).toUpperCase()}
            </div>
          )}
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Welcome Back</h1>
          <p className="text-gray-500 mt-2">Sign in to {hotelName}</p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100 flex items-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700 ml-1">Email Address</label>
            <div className="relative">
              <Mail className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
                placeholder="reception@hotel.com"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700 ml-1">Password</label>
            <div className="relative">
              <KeyRound className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-sm mt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 text-brand-600 border-gray-300 rounded focus:ring-brand-500" />
              <span className="text-gray-600">Remember me</span>
            </label>
            <a href="#" className="text-brand-600 font-medium hover:text-brand-700 transition-colors">Forgot Password?</a>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-2.5 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors shadow-lg shadow-brand-500/30 font-medium mt-6 flex justify-center items-center h-11"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In'}
          </button>
        </form>
        
        <p className="mt-8 text-center text-sm text-gray-400">
          {hotelName} &copy; 2026
        </p>
      </div>
    </div>
  );
}
