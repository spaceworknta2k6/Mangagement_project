'use client';

import { create } from 'zustand';
import api from '@/services/api';
import { CURRENT_ACADEMIC_TERM, getCurrentAcademicTerm, isPeriodInTerm } from '@/lib/academicTerm';

const usePeriodStore = create((set, get) => ({
  periods: [],
  selectedPeriodId: '',
  selectedSchoolYear: CURRENT_ACADEMIC_TERM.schoolYear,
  selectedSemester: CURRENT_ACADEMIC_TERM.semester,
  isLoading: false,
  hasFetched: false,

  fetchPeriods: async (token, force = false, user = null) => {
    if (!token) return [];
    if (get().hasFetched && !force && get().periods.length > 0) {
      return get().periods;
    }
    set({ isLoading: true });
    try {
      const res = await api.get('/periods', token).catch(() => api.get('/auth/periods', token).catch(() => ({ data: [] })));
      const list = res.data || [];
      const currentTerm = getCurrentAcademicTerm({ user, periods: list });
      const currentSelected = get().selectedPeriodId;
      const existingYear = get().selectedSchoolYear;
      const existingSem = get().selectedSemester;
      const selectedYear = !existingYear || existingYear === CURRENT_ACADEMIC_TERM.schoolYear ? currentTerm.schoolYear : existingYear;
      const selectedSem = !existingSem || existingSem === CURRENT_ACADEMIC_TERM.semester ? currentTerm.semester : existingSem;
      const selectedStillExists = list.some((period) => period._id === currentSelected && isPeriodInTerm(period, selectedYear, selectedSem));
      const defaultPeriod = list.find((period) => isPeriodInTerm(period, selectedYear, selectedSem)) || list[0];
      set({ 
        periods: list, 
        hasFetched: true,
        selectedSchoolYear: selectedYear,
        selectedSemester: selectedSem,
        selectedPeriodId: selectedStillExists ? currentSelected : (defaultPeriod?._id || '')
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
  setSelectedTerm: (schoolYear, semester) => {
    const periods = get().periods;
    const matched = periods.find((period) => isPeriodInTerm(period, schoolYear, semester));
    set({
      selectedSchoolYear: schoolYear,
      selectedSemester: semester,
      selectedPeriodId: matched?._id || '',
    });
  },
  
  clearPeriods: () => set({
    periods: [],
    selectedPeriodId: '',
    selectedSchoolYear: CURRENT_ACADEMIC_TERM.schoolYear,
    selectedSemester: CURRENT_ACADEMIC_TERM.semester,
    hasFetched: false,
  }),
}));

export default usePeriodStore;
