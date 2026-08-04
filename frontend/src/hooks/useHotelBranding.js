import { useState, useEffect } from 'react';
import api, { API_ORIGIN } from '../lib/api';

// Shared across the app so Sidebar/Login always reflect whatever Admin > Settings > Branding has configured,
// without every consumer re-fetching. The public endpoint needs no auth — it's the same one the guest landing page uses.
let cache = null;
let inflight = null;

export default function useHotelBranding() {
  const [branding, setBranding] = useState(cache || { name: 'Hotel ERP', logo_url: null });

  useEffect(() => {
    if (cache) { setBranding(cache); return; }
    if (!inflight) {
      inflight = api.get('/public/hotel-info')
        .then(res => {
          cache = { name: res.data?.name || 'Hotel ERP', logo_url: res.data?.logo_url || null };
          return cache;
        })
        .catch(() => ({ name: 'Hotel ERP', logo_url: null }));
    }
    inflight.then(setBranding);
  }, []);

  return { ...branding, logoSrc: branding.logo_url ? `${API_ORIGIN}${branding.logo_url}` : null };
}
