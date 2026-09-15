import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { AppRoutes } from './AppRoutes'

describe('ProtectedRoute', () => {
  it('redirects visitors without a session from the admin panel to login', () => {
    render(
      <MemoryRouter initialEntries={['/painel']}>
        <AppRoutes />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: 'Entrar' })).toBeInTheDocument()
  })
})
