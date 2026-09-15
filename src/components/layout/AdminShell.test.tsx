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
