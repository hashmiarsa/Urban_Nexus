import { create } from 'zustand'

const useAuthStore = create((set) => ({
  user:  JSON.parse(localStorage.getItem('user'))  || null,
  token: localStorage.getItem('token') || null,
  isAuthenticated: !!localStorage.getItem('token'),

  login: ({ user, token }) =>
    set(() => {
      localStorage.setItem('user',  JSON.stringify(user))
      localStorage.setItem('token', token)
      return { user, token, isAuthenticated: true }
    }),

  logout: () =>
    set(() => {
      localStorage.removeItem('user')
      localStorage.removeItem('token')
      return { user: null, token: null, isAuthenticated: false }
    }),

  updateUser: (updates) =>
    set((state) => {
      const updated = { ...state.user, ...updates }
      localStorage.setItem('user', JSON.stringify(updated))
      return { user: updated }
    }),
}))

export default useAuthStore