import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import useAuthStore from '@/store/authStore'
import authApi from '@/api/auth.api'
import { getHomeRoute } from '@/utils/roles'
import toast from 'react-hot-toast'

export default function useAuth() {
  const { user, token, isAuthenticated, login, logout } = useAuthStore()
  const navigate = useNavigate()

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: ({ data }) => {
      const { user: u, token: t } = data.data
      login({ user: u, token: t })
      toast.success(`Welcome back, ${u.name}`)
      navigate(getHomeRoute(u.role))
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Login failed')
    },
  })

  const handleLogout = useCallback(() => {
    logout()
    navigate('/login')
    toast.success('Logged out successfully')
  }, [logout, navigate])

  const { data: meData } = useQuery({
    queryKey: ['me'],
    queryFn: () => authApi.getMe().then((r) => r.data.data),
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 10,
  })

  return {
    user:            meData || user,
    token,
    isAuthenticated,
    isLoading:       loginMutation.isPending,
    login:           loginMutation.mutate,
    logout:          handleLogout,
  }
}