import { fireEvent, render, screen, cleanup } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'
import { AdminShell } from './AdminShell'
import { authStore } from '../../store/authStore'

afterEach(() => { cleanup(); authStore.setState({ token: null, user: null }) })

function renderShell() {
  return render(<MemoryRouter initialEntries={['/painel']}><AdminShell title="Painel" subtitle="Visão geral"><p>Conteúdo</p></AdminShell></MemoryRouter>)
}

describe('AdminShell responsive interaction', () => {
  it('uses the warm paper surface and active navigation treatment', () => {
    const { container } = renderShell()
    expect(container.querySelector('.admin-sidebar')).toHaveClass('admin-sidebar--paper')
    expect(container.querySelector('.admin-sidebar a.admin-nav-link--active')).toHaveClass('admin-nav-link--active')
  })

  it('keeps mobile layers ordered below the toggle', () => {
    const { container } = renderShell()
    const css = container.querySelector('style')?.textContent ?? ''
    expect(css).toMatch(/\.sidebar-overlay\{[^}]*z-index:2/)
    expect(css).toMatch(/\.admin-sidebar\{[^}]*z-index:3/)
    expect(css).toMatch(/\.admin-menu-button\{[^}]*z-index:4/)
  })

  it('keeps the desktop sidebar fixed while the main content scrolls', () => {
    const { container } = renderShell()
    const css = (container.querySelector('style')?.textContent ?? '').split('@media')[0]
    expect(css).toMatch(/\.admin-sidebar\{[^}]*position:fixed/)
    expect(css).toMatch(/\.admin-main\{[^}]*margin-left:250px/)
  })

  it('places the open transform after the mobile closed transform', () => {
    const { container } = renderShell()
    const css = container.querySelector('style')?.textContent ?? ''
    expect(css.indexOf('transform:translateX(-100%)')).toBeGreaterThan(-1)
    expect(css.lastIndexOf('.sidebar-open .admin-sidebar{transform:translateX(0)}')).toBeGreaterThan(css.indexOf('transform:translateX(-100%)'))
  })

  it('closes the sidebar by overlay, Escape, and right-to-left swipe', () => {
    const { container } = renderShell()
    const openButton = container.querySelector('.admin-menu-button') as HTMLButtonElement
    const shell = container.querySelector('.admin-shell') as HTMLElement
    fireEvent.click(openButton)
    expect(container.querySelector('.admin-shell')).toHaveClass('sidebar-open')
    expect(container.querySelector('.admin-menu-button')).toBeNull()

    fireEvent.touchStart(shell, { changedTouches: [{ clientX: 300 }] })
    fireEvent.touchEnd(shell, { changedTouches: [{ clientX: 200 }] })
    expect(container.querySelector('.admin-shell')).not.toHaveClass('sidebar-open')

    fireEvent.click(container.querySelector('.admin-menu-button') as HTMLButtonElement)
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(container.querySelector('.admin-shell')).not.toHaveClass('sidebar-open')

    fireEvent.click(container.querySelector('.admin-menu-button') as HTMLButtonElement)
    fireEvent.click(screen.getByTestId('sidebar-overlay'))
    expect(container.querySelector('.admin-shell')).not.toHaveClass('sidebar-open')
  })

  it('uses a square accessible hit area when opening the sidebar', () => {
    const { container } = renderShell()
    const toggle = container.querySelector('.admin-menu-button') as HTMLButtonElement
    expect(toggle).toHaveAttribute('aria-label', 'Abrir navegação')
    const css = container.querySelector('style')?.textContent ?? ''
    expect(css).toContain('width:44px;height:44px')
    expect(css).toContain('border-radius:4px')
  })

  it('clears the session and redirects to login when signing out', () => {
    authStore.setState({ token: 'admin-token', user: { id: 'admin-1', nome: 'Admin', email: 'admin@agenda.plus', role: 'ADMIN' } })
    render(<MemoryRouter initialEntries={['/painel']}><Routes><Route path="/painel" element={<AdminShell title="Painel"><p>Conteúdo</p></AdminShell>} /><Route path="/login" element={<h1>Login</h1>} /></Routes></MemoryRouter>)
    fireEvent.click(screen.getByRole('button', { name: 'Sair' }))
    expect(authStore.getState()).toMatchObject({ token: null, user: null })
    expect(screen.getByRole('heading', { name: 'Login' })).toBeInTheDocument()
  })
})
