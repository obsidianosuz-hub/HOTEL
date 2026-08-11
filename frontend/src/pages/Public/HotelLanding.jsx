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
    <div className="min-h-screen bg-black text-white" style={themeVars}>
      <style>{`
        .accent-hover:hover { border-color: var(--accent) !important; }
        .accent-link:hover { color: var(--accent-2) !important; }
      `}</style>

      {/* Header */}
      <header className="border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {info?.logo_url && !logoError ? (
              <img src={info.logo_url} alt={name} onError={() => setLogoError(true)} className="w-9 h-9 rounded-full object-cover" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-sm font-bold">
                {initials}
              </div>
            )}
            <span className="text-xl font-bold bg-gradient-to-r from-[var(--accent)] to-[var(--accent-2)] bg-clip-text text-transparent">{name}</span>
          </div>
          <Link to="/guest/login" className="px-5 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 font-medium text-sm transition-colors">
            Kirish
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-20 pb-16 text-center">
        <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase mb-6" style={{ border: `1px solid ${accent2}66`, color: accent2 }}>
          Mehmonxonaga xush kelibsiz
        </span>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight mb-6">
          <span className="bg-gradient-to-r from-[var(--accent)] via-[var(--accent-2)] to-[var(--accent)] bg-clip-text text-transparent">{name}</span>
        </h1>
        {info?.description && (
          <p className="text-slate-300 text-lg max-w-2xl mx-auto mb-10 leading-relaxed">{info.description}</p>
        )}
        <div className="flex flex-wrap items-center justify-center gap-4">
          <a href="#xonalar" className="px-6 py-3 rounded-full font-semibold flex items-center gap-2 text-white shadow-lg transition-opacity hover:opacity-90" style={{ background: `linear-gradient(to right, ${accent}, ${accent2})`, boxShadow: `0 10px 25px -10px ${accent}66` }}>
            Xonalar bilan tanishish <ArrowRight className="w-4 h-4" />
          </a>
          <a href="#boglanish" className="px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 font-semibold transition-colors">
            Biz bilan bog'laning
          </a>
        </div>
      </section>

      {/* Rooms */}
      {info?.room_types?.length > 0 && (
        <section id="xonalar" className="max-w-6xl mx-auto px-6 py-16 border-t border-white/10">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-2">Bizning Xonalarimiz</h2>
          <p className="text-slate-400 text-center mb-12">Har bir mehmon uchun qulay va zamonaviy xonalar</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {info.room_types.map(rt => (
              <div key={rt.id} className="accent-hover rounded-2xl border border-white/10 bg-white/5 p-6 transition-colors">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: `linear-gradient(to bottom right, ${accent}33, ${accent2}33)` }}>
                  <BedDouble className="w-6 h-6" style={{ color: accent2 }} />
                </div>
                <h3 className="text-lg font-bold mb-1">{rt.name}</h3>
                {rt.description && <p className="text-slate-400 text-sm mb-4">{rt.description}</p>}
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1.5 text-slate-400"><Users className="w-4 h-4" /> {rt.capacity} kishi</span>
                  <span className="font-bold" style={{ color: accent2 }}>{Number(rt.base_price).toLocaleString()} so'm/kecha</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Contact */}
      <section id="boglanish" className="max-w-4xl mx-auto px-6 py-16 border-t border-white/10 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold mb-10">Biz Bilan Bog'laning</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {info?.address && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <MapPin className="w-6 h-6 mx-auto mb-3" style={{ color: accent2 }} />
              <p className="text-slate-300 text-sm">{info.address}</p>
            </div>
          )}
          {info?.contact_phone && (
            <a href={`tel:${info.contact_phone}`} className="accent-hover rounded-2xl border border-white/10 bg-white/5 p-6 transition-colors">
              <Phone className="w-6 h-6 mx-auto mb-3" style={{ color: accent2 }} />
              <p className="text-slate-300 text-sm">{info.contact_phone}</p>
            </a>
          )}
          {info?.contact_email && (
            <a href={`mailto:${info.contact_email}`} className="accent-hover rounded-2xl border border-white/10 bg-white/5 p-6 transition-colors">
              <Mail className="w-6 h-6 mx-auto mb-3" style={{ color: accent2 }} />
              <p className="text-slate-300 text-sm">{info.contact_email}</p>
            </a>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10">
        <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xs font-bold">
              {initials}
            </div>
            <span className="font-semibold bg-gradient-to-r from-[var(--accent)] to-[var(--accent-2)] bg-clip-text text-transparent">{name}</span>
          </div>
          {(social.telegram || social.instagram) && (
            <div className="flex items-center gap-4 text-slate-400 text-sm">
              {social.telegram && (
                <a href={`https://t.me/${String(social.telegram).replace('@', '')}`} target="_blank" rel="noreferrer" className="accent-link flex items-center gap-1.5 transition-colors">
                  <Send className="w-4 h-4" /> {social.telegram}
                </a>
              )}
              {social.instagram && (
                <a href={`https://instagram.com/${String(social.instagram).replace('@', '')}`} target="_blank" rel="noreferrer" className="accent-link flex items-center gap-1.5 transition-colors">
                  <Instagram className="w-4 h-4" /> {social.instagram}
                </a>
              )}
            </div>
          )}
          <p className="text-slate-500 text-xs">&copy; {new Date().getFullYear()} {name}</p>
        </div>
      </footer>
    </div>
  );
}
