import { fireEvent, render, screen, cleanup } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'
import { AdminShell } from './AdminShell'
import { authStore } from '../../store/authStore'

afterEach(() => {
  cleanup()
  authStore.setState({ token: null, user: null })
})

describe('AdminShell responsive interaction', () => {
  it('uses the warm paper surface and accent treatment for the sidebar', () => {
    const { container } = render(<MemoryRouter initialEntries={['/painel']}><AdminShell title="Painel" subtitle="Visão geral"><p>Conteúdo</p></AdminShell></MemoryRouter>)
    const sidebar = container.querySelector('.admin-sidebar')
    const activeLink = container.querySelector('.admin-sidebar a.admin-nav-link--active')
    expect(sidebar).toHaveClass('admin-sidebar--paper')
    expect(sidebar).toHaveStyle({ backgroundColor: 'var(--paper)' })
    expect(activeLink).toHaveClass('admin-nav-link--active')
  })

  it('keeps mobile layers ordered below the toggle', () => {
    const { container } = render(<MemoryRouter initialEntries={['/painel']}><AdminShell title="Painel" subtitle="Visão geral"><p>Conteúdo</p></AdminShell></MemoryRouter>)
    const css = container.querySelector('style')?.textContent ?? ''
    expect(css).toMatch(/\.admin-main\{[^}]*position:relative;[^}]*padding/)
    expect(css).not.toMatch(/\.admin-main\{[^}]*z-index:/)
    expect(css).toMatch(/\.sidebar-overlay\{[^}]*z-index:2/)
    expect(css).toMatch(/\.admin-sidebar\{[^}]*z-index:3/)
    expect(css).toMatch(/\.admin-menu-button\{[^}]*z-index:4/)
  })

  it('keeps the desktop sidebar fixed while the main content scrolls', () => {
    const { container } = render(<MemoryRouter initialEntries={['/painel']}><AdminShell title="Painel" subtitle="Visão geral"><p>Conteúdo</p></AdminShell></MemoryRouter>)
    const desktopCss = (container.querySelector('style')?.textContent ?? '').split('@media')[0]
    expect(desktopCss).toMatch(/\.admin-sidebar\{[^}]*position:fixed/)
    expect(desktopCss).toMatch(/\.admin-main\{[^}]*margin-left:250px/)
  })

  it('places the open transform after the mobile closed transform', () => {
    const { container } = render(<MemoryRouter initialEntries={['/painel']}><AdminShell title="Painel" subtitle="Visão geral"><p>Conteúdo</p></AdminShell></MemoryRouter>)
    const css = container.querySelector('style')?.textContent ?? ''
    expect(css.indexOf('transform:translateX(-100%)')).toBeGreaterThan(-1)
    expect(css.lastIndexOf('.sidebar-open .admin-sidebar{transform:translateX(0)}')).toBeGreaterThan(css.indexOf('transform:translateX(-100%)'))
  })

  it('opens with an accessible icon toggle and closes when the overlay is clicked', () => {
    const { container } = render(<MemoryRouter initialEntries={['/painel']}><AdminShell title="Painel" subtitle="Visão geral"><p>Conteúdo</p></AdminShell></MemoryRouter>)
    const openButton = container.querySelector('.admin-menu-button') as HTMLButtonElement
    fireEvent.click(openButton)
    expect(openButton).toHaveAttribute('aria-label', 'Fechar navegação')
    expect(openButton.querySelector('svg')).toBeInTheDocument()
    expect(container.querySelector('.admin-shell')).toHaveClass('sidebar-open')
    fireEvent.click(screen.getByTestId('sidebar-overlay'))
    expect(openButton).toHaveAttribute('aria-label', 'Abrir navegação')
    expect(container.querySelector('.admin-shell')).not.toHaveClass('sidebar-open')
  })

  it('uses a square keyboard-accessible hit area and closes with Escape', () => {
    const { container } = render(<MemoryRouter initialEntries={['/painel']}><AdminShell title="Painel" subtitle="Visão geral"><p>Conteúdo</p></AdminShell></MemoryRouter>)
    const toggle = container.querySelector('.admin-menu-button') as HTMLButtonElement
    expect(toggle).toHaveClass('admin-menu-button--editorial')
    expect(toggle).toHaveStyle({ width: '44px', height: '44px', borderRadius: '4px' })
    fireEvent.click(toggle)
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(container.querySelector('.admin-shell')).not.toHaveClass('sidebar-open')
  })

  it('clears the session and redirects to login when signing out', () => {
    authStore.setState({ token: 'admin-token', user: { id: 'admin-1', nome: 'Admin', email: 'admin@agenda.plus', role: 'ADMIN' } })
    render(<MemoryRouter initialEntries={['/painel']}><Routes><Route path="/painel" element={<AdminShell title="Painel"><p>Conteúdo</p></AdminShell>} /><Route path="/login" element={<h1>Login</h1>} /></Routes></MemoryRouter>)
    fireEvent.click(screen.getByRole('button', { name: 'Sair' }))
    expect(authStore.getState()).toMatchObject({ token: null, user: null })
    expect(screen.getByRole('heading', { name: 'Login' })).toBeInTheDocument()
  })
})
