import { create } from 'zustand';

const storedUser = localStorage.getItem('user');
const storedGuest = localStorage.getItem('guest');
const storedTheme = localStorage.getItem('themeMode') || 'light';

// Apply dark class immediately on load (before React renders)
if (storedTheme === 'dark') {
  document.documentElement.classList.add('dark');
} else {
  document.documentElement.classList.remove('dark');
}

const useStore = create((set) => ({
  user: storedUser ? JSON.parse(storedUser) : null,
  guest: storedGuest ? JSON.parse(storedGuest) : null,
  token: localStorage.getItem('token') || null,

  setToken: (token) => {
    localStorage.setItem('token', token);
    set({ token });
  },

  themeMode: storedTheme,
  toggleTheme: () => set((state) => {
    const newTheme = state.themeMode === 'light' ? 'dark' : 'light';
    localStorage.setItem('themeMode', newTheme);
    // Immediately apply to entire document
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    return { themeMode: newTheme };
  }),

  setTheme: (theme) => {
    localStorage.setItem('themeMode', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    set({ themeMode: theme });
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('guest');
    set({ user: null, guest: null, token: null });
  },

  setUser: (user) => {
    localStorage.setItem('user', JSON.stringify(user));
    set({ user });
  },
  setGuest: (guest) => {
    localStorage.setItem('guest', JSON.stringify(guest));
    set({ guest });
  },
}));

export default useStore;
