import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { AppRoutes } from './AppRoutes'

afterEach(cleanup)

function renderRoutes(children: ReactNode) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })

  return render(
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>,
  )
}

describe('ProtectedRoute', () => {
  it('redirects visitors without a session from the admin panel to login', () => {
    renderRoutes(
      <MemoryRouter initialEntries={['/painel']}>
        <AppRoutes />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: 'Entrar' })).toBeInTheDocument()
  })

  it('renders protected content for an authenticated ADMIN', () => {
    renderRoutes(
      <MemoryRouter initialEntries={['/painel']}>
        <AppRoutes session={{ role: 'ADMIN' }} />
      </MemoryRouter>,
    )

    expect(document.querySelector('.admin-header h1')).toHaveTextContent('Painel')
    expect(screen.getByLabelText('Navegação administrativa')).toBeInTheDocument()
    expect(document.querySelector('.admin-header')).toBeInTheDocument()
    expect(document.querySelector('.admin-shell')).toBeInTheDocument()
  })

  it('redirects an authenticated CLIENTE from the admin panel to login', () => {
    renderRoutes(
      <MemoryRouter initialEntries={['/painel']}>
        <AppRoutes session={{ role: 'CLIENTE' }} />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: 'Entrar' })).toBeInTheDocument()
  })

  it('renders the professionals route for an authenticated ADMIN', () => {
    renderRoutes(
      <MemoryRouter initialEntries={['/painel/profissionais']}>
        <AppRoutes session={{ role: 'ADMIN' }} />
      </MemoryRouter>,
    )

    expect(document.querySelector('.admin-header h1')).toHaveTextContent('Profissionais')
  })
})
