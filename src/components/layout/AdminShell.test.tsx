import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup } from '@testing-library/react'
import { AdminShell } from './AdminShell'

afterEach(cleanup)

describe('AdminShell responsive interaction', () => {
  it('uses the warm paper surface and accent treatment for the sidebar', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/painel']}>
        <AdminShell title="Painel" subtitle="Visão geral"><p>Conteúdo</p></AdminShell>
      </MemoryRouter>,
    )

    const sidebar = container.querySelector('.admin-sidebar')
    const activeLink = container.querySelector('.admin-sidebar a.admin-nav-link--active')

    expect(sidebar).toHaveClass('admin-sidebar--paper')
    expect(sidebar).toHaveStyle({ backgroundColor: 'var(--paper)' })
    expect(activeLink).toHaveClass('admin-nav-link--active')
  })

  it('keeps mobile layers ordered below the toggle', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/painel']}>
        <AdminShell title="Painel" subtitle="Visão geral"><p>Conteúdo</p></AdminShell>
      </MemoryRouter>,
    )

    const css = container.querySelector('style')?.textContent ?? ''
    expect(css).toMatch(/\.admin-main\{[^}]*position:relative;[^}]*padding/)
    expect(css).not.toMatch(/\.admin-main\{[^}]*z-index:/)
    expect(css).toMatch(/\.sidebar-overlay\{[^}]*z-index:2/)
    expect(css).toMatch(/\.admin-sidebar\{[^}]*z-index:3/)
    expect(css).toMatch(/\.admin-menu-button\{[^}]*z-index:4/)
  })

  it('places the open transform after the mobile closed transform', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/painel']}>
        <AdminShell title="Painel" subtitle="Visão geral"><p>Conteúdo</p></AdminShell>
      </MemoryRouter>,
    )

    const css = container.querySelector('style')?.textContent ?? ''
    const closedRule = css.indexOf('transform:translateX(-100%)')
    const openRule = css.lastIndexOf('.sidebar-open .admin-sidebar{transform:translateX(0)}')

    expect(closedRule).toBeGreaterThan(-1)
    expect(openRule).toBeGreaterThan(closedRule)
  })

  it('opens with a close toggle and closes when the overlay is clicked', () => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 375 })
    const { container } = render(
      <MemoryRouter initialEntries={['/painel']}>
        <AdminShell title="Painel" subtitle="Visão geral"><p>Conteúdo</p></AdminShell>
      </MemoryRouter>,
    )

    const openButton = container.querySelector('.admin-menu-button') as HTMLButtonElement
    fireEvent.click(openButton)

    expect(openButton).toHaveAttribute('aria-label', 'Fechar navegação')
    expect(openButton).toHaveTextContent('×')
    expect(container.querySelector('.admin-shell')).toHaveClass('sidebar-open')

    fireEvent.click(screen.getByTestId('sidebar-overlay'))

    expect(openButton).toHaveAttribute('aria-label', 'Abrir navegação')
    expect(container.querySelector('.admin-shell')).not.toHaveClass('sidebar-open')
  })
})
