'use client';

import { create } from 'zustand';
import api from '@/services/api';

const usePeriodStore = create((set, get) => ({
  periods: [],
  selectedPeriodId: '',
  isLoading: false,
  hasFetched: false,

  fetchPeriods: async (token, force = false) => {
    if (!token) return [];
    if (get().hasFetched && !force && get().periods.length > 0) {
      return get().periods;
    }
    set({ isLoading: true });
    try {
      const res = await api.get('/periods', token).catch(() => api.get('/auth/periods', token).catch(() => ({ data: [] })));
      const list = res.data || [];
      const currentSelected = get().selectedPeriodId;
      set({ 
        periods: list, 
        hasFetched: true,
        selectedPeriodId: currentSelected || (list.length > 0 ? list[0]._id : '') 
      });
      return list;
    } catch (err) {
      console.error('Failed to fetch periods:', err);
      return [];
    } finally {
      set({ isLoading: false });
    }
  },

  setSelectedPeriodId: (id) => set({ selectedPeriodId: id }),
  
  clearPeriods: () => set({ periods: [], selectedPeriodId: '', hasFetched: false }),
}));

export default usePeriodStore;
