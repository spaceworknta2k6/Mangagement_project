'use client';

import { create } from 'zustand';

const STORAGE_KEY = 'karl_access_token';

const clearLegacyReadableCookie = () => {
  if (typeof document === 'undefined') return;
  document.cookie = 'karl_token=; Max-Age=0; Path=/; SameSite=Strict';
};

const useAuthStore = create((set) => ({
  token: null,
  user: null,       // { _id, email, role, studentId?, lecturerId? }
  isLoading: true,

  // Called on app boot to restore the frontend access token.
  hydrate: () => {
    const token = typeof window !== 'undefined'
      ? window.localStorage.getItem(STORAGE_KEY)
      : null;
    clearLegacyReadableCookie();
    set({ token, isLoading: false });
  },

  setAuth: (token, user) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, token);
      clearLegacyReadableCookie();
    }
    set({ token, user });
  },

  setUser: (user) => set({ user }),

  logout: () => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(STORAGE_KEY);
      clearLegacyReadableCookie();
    }
    set({ token: null, user: null });
  },
}));

export default useAuthStore;
