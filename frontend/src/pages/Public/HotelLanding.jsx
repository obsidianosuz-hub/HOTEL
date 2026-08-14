import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, MapPin, Phone, Mail, BedDouble, Users, ArrowRight, Send, Instagram } from 'lucide-react';
import api from '../../lib/api';

const DEFAULT_COLOR = '#7c3aed';

// Derives a second gradient stop by shifting the hue of the admin-chosen base color,
// so any single color picked in Settings still produces a pleasant two-tone gradient.
function hexToHsl(hex) {
  const clean = hex.replace('#', '');
  const full = clean.length === 3 ? clean.split('').map(c => c + c).join('') : clean;
  const r = parseInt(full.substring(0, 2), 16) / 255;
  const g = parseInt(full.substring(2, 4), 16) / 255;
  const b = parseInt(full.substring(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s;
  const l = (max + min) / 2;
  if (max === min) { h = s = 0; }
  else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      default: h = (r - g) / d + 4;
    }
    h /= 6;
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToHex(h, s, l) {
  s /= 100; l /= 100;
  const k = n => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const toHex = x => Math.round(255 * x).toString(16).padStart(2, '0');
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
}

function isValidHex(hex) {
  return typeof hex === 'string' && /^#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/.test(hex);
}

export default function HotelLanding() {
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [logoError, setLogoError] = useState(false);

  useEffect(() => {
    api.get('/public/hotel-info')
      .then(res => setInfo(res.data))
      .catch(() => setInfo(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: DEFAULT_COLOR }} />
      </div>
    );
  }

  const name = info?.name || 'Hotel ERP';
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const social = info?.social_links || {};

  const baseColor = isValidHex(info?.theme_color) ? info.theme_color : DEFAULT_COLOR;
  const { h, s, l } = hexToHsl(baseColor);
  const accent = baseColor;
  const accent2 = hslToHex((h + 45) % 360, Math.min(s, 90), Math.min(Math.max(l, 55), 70));

  const themeVars = {
    '--accent': accent,
    '--accent-2': accent2
  };

  return (
    <div className="min-h-screen bg-black text-white relative overflow-x-hidden" style={themeVars}>
      <style>{`
        .accent-hover:hover { border-color: var(--accent) !important; }
        .accent-link:hover { color: var(--accent-2) !important; }
        
        @keyframes floatAndRotate {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; border-radius: 0; }
          100% { transform: translateY(-120vh) rotate(720deg); opacity: 0; border-radius: 50%; }
        }

        .animated-shapes {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          overflow: hidden;
          z-index: 0;
          pointer-events: none;
        }

        .animated-shapes li {
          position: absolute;
          display: block;
          list-style: none;
          width: 20px;
          height: 20px;
          background: linear-gradient(135deg, var(--accent) 0%, transparent 100%);
          animation: floatAndRotate 25s linear infinite;
          bottom: -150px;
          backdrop-filter: blur(5px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          opacity: 0.15;
        }

        .animated-shapes li:nth-child(1) { left: 25%; width: 80px; height: 80px; animation-delay: 0s; }
        .animated-shapes li:nth-child(2) { left: 10%; width: 20px; height: 20px; animation-delay: 2s; animation-duration: 12s; }
        .animated-shapes li:nth-child(3) { left: 70%; width: 20px; height: 20px; animation-delay: 4s; }
        .animated-shapes li:nth-child(4) { left: 40%; width: 60px; height: 60px; animation-delay: 0s; animation-duration: 18s; }
        .animated-shapes li:nth-child(5) { left: 65%; width: 20px; height: 20px; animation-delay: 0s; }
        .animated-shapes li:nth-child(6) { left: 75%; width: 110px; height: 110px; animation-delay: 3s; }
        .animated-shapes li:nth-child(7) { left: 35%; width: 150px; height: 150px; animation-delay: 7s; }
        .animated-shapes li:nth-child(8) { left: 50%; width: 25px; height: 25px; animation-delay: 15s; animation-duration: 45s; }
        .animated-shapes li:nth-child(9) { left: 20%; width: 15px; height: 15px; animation-delay: 2s; animation-duration: 35s; }
        .animated-shapes li:nth-child(10) { left: 85%; width: 150px; height: 150px; animation-delay: 0s; animation-duration: 11s; }

        .glass-panel {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
        }
      `}</style>

      {/* Animated Background */}
      <ul className="animated-shapes">
        <li></li><li></li><li></li><li></li><li></li>
        <li></li><li></li><li></li><li></li><li></li>
      </ul>

      {/* Content wrapper with z-index to sit above background */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header */}
        <header className="border-b border-white/10 glass-panel sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {info?.logo_url && !logoError ? (
                <img src={info.logo_url} alt={name} onError={() => setLogoError(true)} className="w-9 h-9 rounded-full object-cover shadow-lg" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-sm font-bold shadow-lg">
                  {initials}
                </div>
              )}
              <span className="text-xl font-bold bg-gradient-to-r from-[var(--accent)] to-[var(--accent-2)] bg-clip-text text-transparent drop-shadow-md">{name}</span>
            </div>
            <Link to="/guest/login" className="px-5 py-2 rounded-full glass-panel hover:bg-white/10 font-medium text-sm transition-colors">
              Kirish
            </Link>
          </div>
        </header>

        {/* Hero */}
        <section className="max-w-4xl mx-auto px-6 pt-24 pb-20 text-center flex-1 flex flex-col justify-center">
          <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase mb-6 glass-panel" style={{ color: accent2, borderColor: `${accent2}66` }}>
            Mehmonxonaga xush kelibsiz
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold leading-tight mb-6 drop-shadow-2xl">
            <span className="bg-gradient-to-r from-[var(--accent)] via-[var(--accent-2)] to-[var(--accent)] bg-clip-text text-transparent">{name}</span>
          </h1>
          {info?.description && (
            <p className="text-slate-300 text-lg md:text-xl max-w-2xl mx-auto mb-12 leading-relaxed drop-shadow-md font-medium">{info.description}</p>
          )}
          <div className="flex flex-wrap items-center justify-center gap-5">
            <Link to="/guest/login" className="px-8 py-3.5 rounded-full font-bold flex items-center gap-2 text-white shadow-lg transition-transform hover:scale-105 hover:shadow-2xl" style={{ background: `linear-gradient(to right, ${accent}, ${accent2})`, boxShadow: `0 10px 25px -10px ${accent}` }}>
              Mijoz sifatida kirish <ArrowRight className="w-5 h-5" />
            </Link>
            <Link to="/staff" className="px-8 py-3.5 rounded-full glass-panel hover:bg-white/10 font-bold transition-all hover:scale-105 flex items-center gap-2 shadow-lg">
              Xodim sifatida kirish <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </section>

        {/* Rooms */}
        {info?.room_types?.length > 0 && (
          <section id="xonalar" className="max-w-6xl mx-auto px-6 py-20">
            <h2 className="text-3xl sm:text-4xl font-bold text-center mb-3 drop-shadow-lg">Bizning Xonalarimiz</h2>
            <p className="text-slate-400 text-center mb-12 text-lg">Har bir mehmon uchun qulay va zamonaviy xonalar</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {info.room_types.map(rt => (
                <div key={rt.id} className="accent-hover rounded-3xl glass-panel p-8 transition-all hover:scale-[1.02] hover:shadow-2xl hover:shadow-[var(--accent)]/10">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-inner" style={{ background: `linear-gradient(to bottom right, ${accent}33, ${accent2}33)` }}>
                    <BedDouble className="w-7 h-7" style={{ color: accent2 }} />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{rt.name}</h3>
                  {rt.description && <p className="text-slate-400 text-sm mb-6 leading-relaxed">{rt.description}</p>}
                  <div className="flex items-center justify-between text-sm pt-4 border-t border-white/10 mt-auto">
                    <span className="flex items-center gap-2 text-slate-300 font-medium"><Users className="w-4 h-4" /> {rt.capacity} kishi</span>
                    <span className="font-bold text-base" style={{ color: accent2 }}>{Number(rt.base_price).toLocaleString()} so'm/kecha</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Contact */}
        <section id="boglanish" className="max-w-5xl mx-auto px-6 py-20 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-12 drop-shadow-lg">Biz Bilan Bog'laning</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {info?.address && (
              <div className="rounded-3xl glass-panel p-8 flex flex-col items-center justify-center">
                <MapPin className="w-8 h-8 mb-4 drop-shadow-md" style={{ color: accent2 }} />
                <p className="text-slate-200 font-medium text-lg">{info.address}</p>
              </div>
            )}
            {info?.contact_phone && (
              <a href={`tel:${info.contact_phone}`} className="accent-hover rounded-3xl glass-panel p-8 flex flex-col items-center justify-center transition-all hover:scale-[1.03]">
                <Phone className="w-8 h-8 mb-4 drop-shadow-md" style={{ color: accent2 }} />
                <p className="text-slate-200 font-medium text-lg">{info.contact_phone}</p>
              </a>
            )}
            {info?.contact_email && (
              <a href={`mailto:${info.contact_email}`} className="accent-hover rounded-3xl glass-panel p-8 flex flex-col items-center justify-center transition-all hover:scale-[1.03]">
                <Mail className="w-8 h-8 mb-4 drop-shadow-md" style={{ color: accent2 }} />
                <p className="text-slate-200 font-medium text-lg">{info.contact_email}</p>
              </a>
            )}
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-auto border-t border-white/10 glass-panel bg-black/40">
          <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-sm font-bold shadow-lg">
                {initials}
              </div>
              <span className="font-bold text-lg bg-gradient-to-r from-[var(--accent)] to-[var(--accent-2)] bg-clip-text text-transparent">{name}</span>
            </div>
            {(social.telegram || social.instagram) && (
              <div className="flex items-center gap-6 text-slate-300 font-medium">
                {social.telegram && (
                  <a href={`https://t.me/${String(social.telegram).replace('@', '')}`} target="_blank" rel="noreferrer" className="accent-link flex items-center gap-2 transition-colors hover:text-white">
                    <Send className="w-5 h-5" /> {social.telegram}
                  </a>
                )}
                {social.instagram && (
                  <a href={`https://instagram.com/${String(social.instagram).replace('@', '')}`} target="_blank" rel="noreferrer" className="accent-link flex items-center gap-2 transition-colors hover:text-white">
                    <Instagram className="w-5 h-5" /> {social.instagram}
                  </a>
                )}
              </div>
            )}
            <p className="text-slate-500 font-medium">&copy; {new Date().getFullYear()} {name}</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
