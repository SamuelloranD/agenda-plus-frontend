import { cleanup, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'
import { authStore } from '../../store/authStore'
import { ClientSidebar } from './ClientSidebar'
import { Sidebar } from './Sidebar'

afterEach(() => {
  cleanup()
  authStore.setState({ token: null, user: null })
})

describe('role sidebars', () => {
  it('shows admin navigation in order and the signed-in administrator in the footer', () => {
    authStore.setState({ token: 'admin-token', user: { id: 'admin-1', nome: 'João da Silva', email: 'admin@example.test', role: 'ADMIN' } })
    render(<MemoryRouter initialEntries={['/painel/agenda']}><Sidebar /></MemoryRouter>)

    const sidebar = screen.getByRole('complementary', { name: 'Navegação administrativa' })
    const links = within(sidebar).getAllByRole('link')
    expect(links.map((link) => link.textContent)).toEqual([
      'Novo agendamento', 'Visão geral', 'Agenda', 'Profissionais', 'Serviços',
    ])
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '/painel/agendamentos/novo', '/painel', '/painel/agenda', '/painel/profissionais', '/painel/servicos',
    ])
    expect(within(sidebar).getByRole('link', { name: 'Agenda' })).toHaveAttribute('aria-current', 'page')
    expect(within(sidebar).getByText('João da Silva')).toBeInTheDocument()
    expect(within(sidebar).getByText('Administrador')).toBeInTheDocument()
    expect(within(sidebar).queryByText(/Barbearia do João/)).not.toBeInTheDocument()
    expect(within(sidebar).queryByRole('button', { name: /João da Silva/ })).not.toBeInTheDocument()
    expect(within(sidebar).getByRole('button', { name: 'Sair' })).toBeInTheDocument()
  })

  it('shows only client routes and the signed-in client in the footer', () => {
    authStore.setState({ token: 'client-token', user: { id: 'client-1', nome: 'Ana Souza', email: 'ana@example.test', role: 'CLIENTE' } })
    render(<MemoryRouter initialEntries={['/meus-agendamentos']}><ClientSidebar /></MemoryRouter>)

    const sidebar = screen.getByRole('complementary', { name: 'Navegação do cliente' })
    const links = within(sidebar).getAllByRole('link')
    expect(links.map((link) => link.textContent)).toEqual(['Novo agendamento', 'Meus agendamentos'])
    expect(links.map((link) => link.getAttribute('href'))).toEqual(['/agendar', '/meus-agendamentos'])
    expect(within(sidebar).getByRole('link', { name: 'Meus agendamentos' })).toHaveAttribute('aria-current', 'page')
    expect(within(sidebar).getByText('Ana Souza')).toBeInTheDocument()
    expect(within(sidebar).getByText('Cliente')).toBeInTheDocument()
    expect(within(sidebar).queryByRole('link', { name: 'Agenda' })).not.toBeInTheDocument()
    expect(within(sidebar).queryByRole('button', { name: /Ana Souza/ })).not.toBeInTheDocument()
    expect(within(sidebar).getByRole('button', { name: 'Sair' })).toBeInTheDocument()
  })
})
