import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { authApi } from './services/api/auth'
import { authStore } from './store/authStore'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  localStorage.clear()
  authStore.setState({ token: null, user: null })
})

describe('App session bootstrap', () => {
  it('restores the current user before rendering a protected route', async () => {
    localStorage.setItem('agenda-plus:auth-token', 'persisted-token')
    authStore.setState({ token: 'persisted-token', user: null })
    vi.spyOn(authApi, 'me').mockResolvedValue({
      id: '4fc4c538-9584-47db-bf89-a572bfab4a91',
      nome: 'Admin',
      email: 'admin@agenda.plus',
      role: 'ADMIN',
    })
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/painel']}>
          <App />
        </MemoryRouter>
      </QueryClientProvider>,
    )

    expect(await screen.findByRole('heading', { name: 'Painel' })).toBeInTheDocument()
  })
})
