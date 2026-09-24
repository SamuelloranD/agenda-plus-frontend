import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { LoginForm } from '../features/auth/components/LoginForm'
import { RegisterForm } from '../features/auth/components/RegisterForm'
import { authApi } from '../services/api/auth'
import { authStore } from '../store/authStore'
import { AppRoutes } from './AppRoutes'

function LocationProbe() {
  const location = useLocation()
  return <output aria-label="Localização atual">{location.pathname}{location.search}</output>
}

function renderWithQuery(children: ReactNode, initialEntry: string) {
  const queryClient = new QueryClient({
    defaultOptions: {
      mutations: { retry: false },
      queries: { retry: false },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        {children}
        <LocationProbe />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

function renderAuthForm(children: ReactNode, initialEntry: string) {
  return renderWithQuery(
    <Routes>
      <Route path="*" element={children} />
      <Route path="/painel" element={<h1>Painel autenticado</h1>} />
      <Route path="/meus-agendamentos" element={<h1>Área do cliente</h1>} />
      <Route path="/agendar/*" element={<h1>Wizard de agendamento</h1>} />
    </Routes>,
    initialEntry,
  )
}

function mockClientAuthentication() {
  vi.spyOn(authApi, 'login').mockResolvedValue({
    token: 'client-token',
    tokenType: 'Bearer',
    expiresIn: 3600,
  })
  vi.spyOn(authApi, 'me').mockResolvedValue({
    id: '53f1b75c-ffb8-4289-a536-d20e24f360b1',
    nome: 'Cliente Agenda',
    email: 'cliente@agenda.plus',
    role: 'CLIENTE',
  })
}

function submitLogin() {
  fireEvent.change(screen.getByLabelText(/e-mail/i), { target: { value: 'cliente@agenda.plus' } })
  fireEvent.change(screen.getByLabelText(/senha/i), { target: { value: 'segredo123' } })
  fireEvent.click(screen.getByRole('button', { name: /entrar/i }))
}

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  localStorage.clear()
  authStore.setState({ token: null, user: null })
})

describe('ClientRoute', () => {
  it('renders the client shell only for an authenticated CLIENTE', () => {
    renderWithQuery(
      <AppRoutes session={{ role: 'CLIENTE' }} />,
      '/meus-agendamentos',
    )

    expect(screen.getByRole('heading', { name: 'Meus agendamentos' })).toBeInTheDocument()
    expect(screen.getByLabelText('Navegação do cliente')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Meus agendamentos' })).toHaveClass('client-nav-link--active')
    expect(screen.getByRole('link', { name: 'Novo agendamento' })).toHaveAttribute('href', '/agendar')
    expect(screen.queryByText('Visão geral')).not.toBeInTheDocument()
  })

  it('keeps the client sidebar while an authenticated CLIENTE books an appointment', () => {
    renderWithQuery(
      <AppRoutes session={{ role: 'CLIENTE' }} />,
      '/agendar',
    )

    expect(document.querySelector('.client-sidebar')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Meus agendamentos' })).toHaveAttribute('href', '/meus-agendamentos')
    expect(screen.getByRole('link', { name: 'Novo agendamento' })).toHaveClass('client-nav-link--active')
  })

  it('keeps the client sidebar fixed on authenticated pages', () => {
    const { container } = renderWithQuery(
      <AppRoutes session={{ role: 'CLIENTE' }} />,
      '/meus-agendamentos',
    )

    expect(container.querySelector('.client-sidebar')).toHaveAttribute('id', 'client-sidebar')
    expect(container.querySelector('.client-main')).toBeInTheDocument()
  })

  it('redirects an ADMIN from the client area to the panel', () => {
    renderWithQuery(
      <AppRoutes session={{ role: 'ADMIN' }} />,
      '/meus-agendamentos',
    )

    expect(screen.getByRole('heading', { name: 'Painel' })).toBeInTheDocument()
    expect(screen.getByLabelText('Localização atual')).toHaveTextContent('/painel')
  })

  it('redirects a visitor to login with the client return path', () => {
    renderWithQuery(<AppRoutes />, '/meus-agendamentos')

    expect(screen.getByRole('heading', { name: 'Entrar' })).toBeInTheDocument()
    expect(screen.getByLabelText('Localização atual')).toHaveTextContent(
      '/login?returnTo=/meus-agendamentos',
    )
  })

  it('clears the client session and navigates to login on logout', () => {
    authStore.setState({
      token: 'client-token',
      user: {
        id: '53f1b75c-ffb8-4289-a536-d20e24f360b1',
        nome: 'Cliente Agenda',
        email: 'cliente@agenda.plus',
        role: 'CLIENTE',
      },
    })
    renderWithQuery(
      <AppRoutes session={{ role: 'CLIENTE' }} />,
      '/meus-agendamentos',
    )

    fireEvent.click(screen.getByRole('button', { name: 'Sair' }))

    expect(authStore.getState()).toMatchObject({ token: null, user: null })
    expect(screen.getByRole('heading', { name: 'Entrar' })).toBeInTheDocument()
    expect(screen.getByLabelText('Localização atual')).toHaveTextContent('/login')
  })

  it('removes the close toggle while the opaque overlay is open', () => {
    const { container } = renderWithQuery(
      <AppRoutes session={{ role: 'CLIENTE' }} />,
      '/meus-agendamentos',
    )

    const toggle = container.querySelector('.admin-menu-button') as HTMLButtonElement
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(toggle).toHaveAttribute('aria-controls', 'client-sidebar')
    expect(toggle).toHaveAttribute('aria-label', 'Abrir navegação')
    fireEvent.click(toggle)

    expect(container.querySelector('.admin-menu-button')).toBeNull()
    expect(screen.getByTestId('client-sidebar-overlay')).toHaveClass('client-sidebar-overlay--opaque')
    expect(container.querySelector('.client-shell')).toHaveClass('sidebar-open')

    fireEvent.click(screen.getByTestId('client-sidebar-overlay'))
    expect(container.querySelector('.admin-menu-button')).toHaveAttribute('aria-label', 'Abrir navegação')
  })
})

describe('client authentication destinations', () => {
  it('sends a CLIENTE login to their appointments by default', async () => {
    mockClientAuthentication()
    renderAuthForm(<LoginForm />, '/login')

    submitLogin()

    expect(await screen.findByRole('heading', { name: 'Área do cliente' })).toBeInTheDocument()
    expect(screen.getByLabelText('Localização atual')).toHaveTextContent('/meus-agendamentos')
  })

  it('keeps the booking wizard return path ahead of the client default', async () => {
    mockClientAuthentication()
    renderAuthForm(<LoginForm />, '/login?returnTo=%2Fagendar')

    submitLogin()

    expect(await screen.findByRole('heading', { name: 'Wizard de agendamento' })).toBeInTheDocument()
    expect(screen.getByLabelText('Localização atual')).toHaveTextContent('/agendar')
  })

  it('sends a new CLIENTE registration to their appointments by default', async () => {
    vi.spyOn(authApi, 'registerClient').mockResolvedValue({
      id: '53f1b75c-ffb8-4289-a536-d20e24f360b1',
      nome: 'Cliente Agenda',
      email: 'cliente@agenda.plus',
      role: 'CLIENTE',
    })
    mockClientAuthentication()
    renderAuthForm(<RegisterForm />, '/cadastro')

    fireEvent.click(screen.getByRole('radio', { name: /cliente/i }))
    fireEvent.change(screen.getByLabelText(/nome/i), { target: { value: 'Cliente Agenda' } })
    fireEvent.change(screen.getByLabelText(/e-mail/i), { target: { value: 'cliente@agenda.plus' } })
    fireEvent.change(screen.getByLabelText(/senha/i), { target: { value: 'segredo123' } })
    fireEvent.click(screen.getByRole('button', { name: /criar conta/i }))

    expect(await screen.findByRole('heading', { name: 'Área do cliente' })).toBeInTheDocument()
    await waitFor(() => expect(authStore.getState().user?.role).toBe('CLIENTE'))
    expect(screen.getByLabelText('Localização atual')).toHaveTextContent('/meus-agendamentos')
  })
})
