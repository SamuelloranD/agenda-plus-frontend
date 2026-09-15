import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { authApi } from '../../../services/api/auth'
import { authStore } from '../../../store/authStore'
import type { User } from '../../../types/auth'
import { useSession } from './useSession'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  localStorage.clear()
  authStore.setState({ token: null, user: null })
})

describe('useSession', () => {
  it('loads a separate current user after the token changes', async () => {
    const usersByToken = {
      'token-a': {
        id: '4fc4c538-9584-47db-bf89-a572bfab4a91',
        nome: 'Conta A',
        email: 'a@agenda.plus',
        role: 'ADMIN' as const,
      },
      'token-b': {
        id: '53f1b75c-ffb8-4289-a536-d20e24f360b1',
        nome: 'Conta B',
        email: 'b@agenda.plus',
        role: 'CLIENTE' as const,
      },
    }
    let resolveSecondUser!: (user: User) => void
    vi.spyOn(authApi, 'me').mockImplementation(() => {
      const token = authStore.getState().token as keyof typeof usersByToken
      if (token === 'token-a') {
        return Promise.resolve(usersByToken[token])
      }

      return new Promise<User>((resolve) => {
        resolveSecondUser = resolve
      })
    })
    authStore.setState({ token: 'token-a', user: null })
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )

    const { result } = renderHook(() => useSession(), { wrapper })

    await waitFor(() => expect(authStore.getState().user?.nome).toBe('Conta A'))
    expect(queryClient.getQueryCache().getAll().map((query) => query.queryKey)).toEqual([
      ['auth', 'session'],
    ])

    act(() => {
      authStore.setState({ token: 'token-b', user: null })
    })

    await waitFor(() => {
      expect(queryClient.getQueryData(['auth', 'session'])).toBeUndefined()
      expect(result.current.user).toBeNull()
    })

    act(() => {
      resolveSecondUser(usersByToken['token-b'])
    })

    await waitFor(() => expect(authStore.getState().user?.nome).toBe('Conta B'))
    expect(queryClient.getQueryCache().getAll().map((query) => query.queryKey)).toEqual([
      ['auth', 'session'],
    ])
  })
})
