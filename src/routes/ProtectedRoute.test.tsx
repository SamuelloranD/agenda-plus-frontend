import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'
import { AppRoutes } from './AppRoutes'

afterEach(cleanup)

describe('ProtectedRoute', () => {
  it('redirects visitors without a session from the admin panel to login', () => {
    render(
      <MemoryRouter initialEntries={['/painel']}>
        <AppRoutes />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: 'Entrar' })).toBeInTheDocument()
  })

  it('renders protected content for an authenticated ADMIN', () => {
    render(
      <MemoryRouter initialEntries={['/painel']}>
        <AppRoutes session={{ role: 'ADMIN' }} />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: 'Painel' })).toBeInTheDocument()
  })

  it('redirects an authenticated CLIENTE from the admin panel to login', () => {
    render(
      <MemoryRouter initialEntries={['/painel']}>
        <AppRoutes session={{ role: 'CLIENTE' }} />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: 'Entrar' })).toBeInTheDocument()
  })
})
