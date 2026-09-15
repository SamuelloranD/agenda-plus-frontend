import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { authApi } from '../../../services/api/auth'
import { authStore, useAuthStore } from '../../../store/authStore'

const SESSION_QUERY_KEY = ['auth', 'session'] as const

export function useSession() {
  const queryClient = useQueryClient()
  const token = useAuthStore((state) => state.token)
  const user = useAuthStore((state) => state.user)
  const setSession = useAuthStore((state) => state.setSession)
  const clearSession = useAuthStore((state) => state.clearSession)
  const sessionQuery = useQuery({
    queryKey: SESSION_QUERY_KEY,
    queryFn: authApi.me,
    enabled: Boolean(token),
    retry: false,
  })

  useEffect(() => authStore.subscribe((state, previousState) => {
    if (state.token === previousState.token) {
      return
    }

    if (!state.token) {
      queryClient.removeQueries({ queryKey: SESSION_QUERY_KEY, exact: true })
      return
    }

    void queryClient.resetQueries({ queryKey: SESSION_QUERY_KEY, exact: true })
  }), [queryClient])

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
