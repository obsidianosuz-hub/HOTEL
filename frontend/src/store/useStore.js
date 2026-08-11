import { create } from 'zustand';

const storedUser = localStorage.getItem('user');
const storedGuest = localStorage.getItem('guest');
const storedTheme = localStorage.getItem('themeMode') || 'light';

const parseJSON = (str) => {
  if (!str || str === 'undefined') return null;
  try {
    return JSON.parse(str);
  } catch (e) {
    return null;
  }
};

// Apply dark class immediately on load (before React renders)
if (storedTheme === 'dark') {
  document.documentElement.classList.add('dark');
} else {
  document.documentElement.classList.remove('dark');
}

const useStore = create((set) => ({
  user: parseJSON(storedUser),
  guest: parseJSON(storedGuest),
  token: localStorage.getItem('token') === 'undefined' ? null : (localStorage.getItem('token') || null),

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
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
    set({ user });
  },
  setGuest: (guest) => {
    if (guest) {
      localStorage.setItem('guest', JSON.stringify(guest));
    } else {
      localStorage.removeItem('guest');
    }
    set({ guest });
  }
}));

export default useStore;
