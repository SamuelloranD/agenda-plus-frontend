import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'
import { authStore } from '../../store/authStore'
import { ClientShell } from './ClientShell'

afterEach(() => {
  cleanup()
  authStore.setState({ token: null, user: null })
})

describe('ClientShell mobile navigation', () => {
  it('opens a modal menu, traps focus, and restores it on Escape', () => {
    authStore.setState({ token: 'client-token', user: { id: 'c1', nome: 'Ana Souza', email: 'ana@example.test', role: 'CLIENTE' } })
    render(<MemoryRouter initialEntries={['/meus-agendamentos']}><ClientShell title="Meus agendamentos" subtitle="Acompanhe seus horários"><p>Conteúdo</p></ClientShell></MemoryRouter>)

    fireEvent.click(screen.getByRole('button', { name: 'Abrir navegação' }))
    const dialog = screen.getByRole('dialog', { name: 'Navegação do cliente' })
    const firstLink = within(dialog).getByRole('link', { name: 'Novo agendamento' })
    expect(firstLink).toHaveFocus()
    expect(screen.getByRole('main')).toHaveAttribute('inert')

    const logout = within(dialog).getByRole('button', { name: 'Sair' })
    logout.focus()
    fireEvent.keyDown(document, { key: 'Tab' })
    expect(firstLink).toHaveFocus()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Abrir navegação' })).toHaveFocus()
  })
})
