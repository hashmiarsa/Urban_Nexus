import { create } from 'zustand'

const useProjectStore = create((set) => ({
  filters: {
    status:     '',
    type:       '',
    department: '',
    dateFrom:   '',
    dateTo:     '',
    page:       1,
    limit:      20,
  },

  viewMode: 'table', // 'table' | 'card'

  setFilter: (key, value) =>
    set((state) => ({
      filters: { ...state.filters, [key]: value, page: 1 },
    })),

  setPage: (page) =>
    set((state) => ({
      filters: { ...state.filters, page },
    })),

  resetFilters: () =>
    set({
      filters: {
        status: '', type: '', department: '',
        dateFrom: '', dateTo: '', page: 1, limit: 20,
      },
    }),

  setViewMode: (mode) => set({ viewMode: mode }),
}))

export default useProjectStore