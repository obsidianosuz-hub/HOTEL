import { create } from 'zustand';
import api from '../lib/api';

const useSettingsStore = create((set) => ({
  settings: null,
  loading: true,
  fetchSettings: async () => {
    try {
      const res = await api.get('/public/settings');
      set({ settings: res.data, loading: false });
    } catch (err) {
      console.error('Failed to fetch settings:', err);
      set({ loading: false });
    }
  },
  updateSettings: (newSettings) => set({ settings: newSettings }),
}));

export default useSettingsStore;
