import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { authApi } from '../../../services/api/auth'
import { useAuthStore } from '../../../store/authStore'

export function useSession() {
  const token = useAuthStore((state) => state.token)
  const user = useAuthStore((state) => state.user)
  const setSession = useAuthStore((state) => state.setSession)
  const clearSession = useAuthStore((state) => state.clearSession)
  const sessionQuery = useQuery({
    queryKey: ['auth', 'session', token],
    queryFn: authApi.me,
    enabled: Boolean(token),
    retry: false,
  })

  useEffect(() => {
    if (token && sessionQuery.data) {
      setSession(token, sessionQuery.data)
    }
  }, [sessionQuery.data, setSession, token])

  return {
    token,
    user: sessionQuery.data ?? user,
    setSession,
    clearSession,
    isLoading: Boolean(token) && sessionQuery.isPending,
    error: sessionQuery.error,
    refetch: sessionQuery.refetch,
  }
}
