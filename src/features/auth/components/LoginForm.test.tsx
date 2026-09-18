import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { authApi } from '../../../services/api/auth'
import { authStore } from '../../../store/authStore'
import { LoginForm } from './LoginForm'
import { RegisterForm } from './RegisterForm'
import { getPendingReturnPath } from '../hooks/useAuthMutations'

function renderAuthForm(children: ReactNode, initialEntry = '/login') {
  const queryClient = new QueryClient({
    defaultOptions: {
      mutations: { retry: false },
      queries: { retry: false },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="*" element={children} />
          <Route path="/painel" element={<h1>Painel autenticado</h1>} />
          <Route path="/meus-agendamentos" element={<h1>Meus agendamentos</h1>} />
          <Route path="/agendar/resumo" element={<h1>Resumo da reserva</h1>} />
          <Route path="/agendar" element={<h1>Agendar público</h1>} />
          <Route path="/agendar/*" element={<h1>Agendar público</h1>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  localStorage.clear()
  authStore.setState({ token: null, user: null })
})

describe('LoginForm', () => {
  it.each([
    '/meus-agendamentos/', '/meus-agendamentos/other', '/meus-agendamentos-malformed',
    '/meus-agendamentos?next=https://example.com', '/meus-agendamentos#other',
    '//example.com/meus-agendamentos', 'https://example.com/meus-agendamentos',
    '/\\example.com/meus-agendamentos', '/painel',
  ])('rejects unsafe or non-exact appointment return destination %s', (path) => {
    expect(getPendingReturnPath(`?returnTo=${encodeURIComponent(path)}`)).toBeNull()
  })

  it.each(['login', 'cadastro'])('returns a client to exact /meus-agendamentos after %s', async (flow) => {
    const user = { id: 'client-1', nome: 'Cliente Agenda', email: 'cliente@agenda.plus', role: 'CLIENTE' as const }
    vi.spyOn(authApi, 'login').mockResolvedValue({ token: 'client-token', tokenType: 'Bearer', expiresIn: 3600 })
    vi.spyOn(authApi, 'me').mockResolvedValue(user)
    vi.spyOn(authApi, 'registerClient').mockResolvedValue(user)
    renderAuthForm(flow === 'login' ? <LoginForm /> : <RegisterForm />, `/${flow}?returnTo=%2Fmeus-agendamentos`)

    if (flow === 'cadastro') {
      expect(screen.getByRole('radio', { name: /cliente/i })).toBeChecked()
      fireEvent.change(screen.getByLabelText(/nome/i), { target: { value: user.nome } })
    }
    fireEvent.change(screen.getByLabelText(/e-mail/i), { target: { value: user.email } })
    fireEvent.change(screen.getByLabelText(/senha/i), { target: { value: 'segredo123' } })
    fireEvent.click(screen.getByRole('button', { name: flow === 'login' ? /entrar/i : /criar conta/i }))

    expect(await screen.findByRole('heading', { name: 'Meus agendamentos' })).toBeInTheDocument()
  })

  it('renders inline validation messages for blank credentials', async () => {
    renderAuthForm(<LoginForm />)

    fireEvent.submit(screen.getByRole('button', { name: /entrar/i }).closest('form')!)

    expect(await screen.findByText('Informe o e-mail.')).toBeInTheDocument()
    expect(screen.getByText('Informe a senha.')).toBeInTheDocument()
  })

  it('stores the authenticated session and navigates an admin to the panel', async () => {
    vi.spyOn(authApi, 'login').mockResolvedValue({
      token: 'admin-token',
      tokenType: 'Bearer',
      expiresIn: 3600,
    })
    vi.spyOn(authApi, 'me').mockResolvedValue({
      id: '4fc4c538-9584-47db-bf89-a572bfab4a91',
      nome: 'Mestre Agenda',
      email: 'mestre@agenda.plus',
      role: 'ADMIN',
    })
    renderAuthForm(<LoginForm />)

    fireEvent.change(screen.getByLabelText(/e-mail/i), {
      target: { value: 'mestre@agenda.plus' },
    })
    fireEvent.change(screen.getByLabelText(/senha/i), {
      target: { value: 'segredo123' },
    })
    fireEvent.click(screen.getByRole('button', { name: /entrar/i }))

    expect(await screen.findByRole('heading', { name: 'Painel autenticado' })).toBeInTheDocument()
    expect(authStore.getState()).toMatchObject({
      token: 'admin-token',
      user: { email: 'mestre@agenda.plus', role: 'ADMIN' },
    })
  })

  it.each(['/agendar', '/meus-agendamentos'])('keeps an admin in the panel when returning to %s', async (returnTo) => {
    vi.spyOn(authApi, 'login').mockResolvedValue({
      token: 'admin-token',
      tokenType: 'Bearer',
      expiresIn: 3600,
    })
    vi.spyOn(authApi, 'me').mockResolvedValue({
      id: '4fc4c538-9584-47db-bf89-a572bfab4a91',
      nome: 'Mestre Agenda',
      email: 'mestre@agenda.plus',
      role: 'ADMIN',
    })
    renderAuthForm(<LoginForm />, `/login?returnTo=${encodeURIComponent(returnTo)}`)

    fireEvent.change(screen.getByLabelText(/e-mail/i), { target: { value: 'mestre@agenda.plus' } })
    fireEvent.change(screen.getByLabelText(/senha/i), { target: { value: 'segredo123' } })
    fireEvent.click(screen.getByRole('button', { name: /entrar/i }))

    expect(await screen.findByRole('heading', { name: 'Painel autenticado' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Agendar público' })).not.toBeInTheDocument()
  })

  it('shows a friendly generic API error inline', async () => {
    vi.spyOn(authApi, 'login').mockRejectedValue({ message: 'Serviço indisponível.' })
    renderAuthForm(<LoginForm />)

    fireEvent.change(screen.getByLabelText(/e-mail/i), { target: { value: 'mestre@agenda.plus' } })
    fireEvent.change(screen.getByLabelText(/senha/i), { target: { value: 'segredo123' } })
    fireEvent.click(screen.getByRole('button', { name: /entrar/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Serviço indisponível.')
  })

  it('falls back from an unsafe client return path to the public booking entry', async () => {
    vi.spyOn(authApi, 'login').mockResolvedValue({ token: 'client-token', tokenType: 'Bearer', expiresIn: 3600 })
    vi.spyOn(authApi, 'me').mockResolvedValue({
      id: '53f1b75c-ffb8-4289-a536-d20e24f360b1',
      nome: 'Cliente Agenda',
      email: 'cliente@agenda.plus',
      role: 'CLIENTE',
    })
    renderAuthForm(<LoginForm />, '/login?returnTo=%2Fagendar-malformed')

    fireEvent.change(screen.getByLabelText(/e-mail/i), { target: { value: 'cliente@agenda.plus' } })
    fireEvent.change(screen.getByLabelText(/senha/i), { target: { value: 'segredo123' } })
    fireEvent.click(screen.getByRole('button', { name: /entrar/i }))

    expect(await screen.findByRole('heading', { name: 'Agendar público' })).toBeInTheDocument()
  })
})

describe('RegisterForm', () => {
  it('defaults to client registration when returning to a pending booking', () => {
    renderAuthForm(<RegisterForm />, '/cadastro?returnTo=%2Fagendar')

    expect(screen.getByRole('radio', { name: /cliente/i })).toBeChecked()
    expect(screen.getByRole('radio', { name: /negócio/i })).not.toBeChecked()
  })

  it('switches to client registration and returns to the pending booking path', async () => {
    const registerClient = vi.spyOn(authApi, 'registerClient').mockResolvedValue({
      id: '53f1b75c-ffb8-4289-a536-d20e24f360b1',
      nome: 'Cliente Agenda',
      email: 'cliente@agenda.plus',
      role: 'CLIENTE',
    })
    const registerBusiness = vi.spyOn(authApi, 'registerBusiness')
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
    renderAuthForm(<RegisterForm />, '/cadastro?returnTo=%2Fagendar%2Fresumo')

    fireEvent.click(screen.getByRole('radio', { name: /cliente/i }))
    fireEvent.change(screen.getByLabelText(/nome/i), {
      target: { value: 'Cliente Agenda' },
    })
    fireEvent.change(screen.getByLabelText(/e-mail/i), {
      target: { value: 'cliente@agenda.plus' },
    })
    fireEvent.change(screen.getByLabelText(/senha/i), {
      target: { value: 'segredo123' },
    })
    fireEvent.click(screen.getByRole('button', { name: /criar conta/i }))

    expect(await screen.findByRole('heading', { name: 'Resumo da reserva' })).toBeInTheDocument()
    await waitFor(() => expect(registerClient).toHaveBeenCalledWith({
      nome: 'Cliente Agenda',
      email: 'cliente@agenda.plus',
      senha: 'segredo123',
    }))
    expect(registerBusiness).not.toHaveBeenCalled()
  })

  it('shows that the account was created when automatic sign-in fails', async () => {
    vi.spyOn(authApi, 'registerBusiness').mockResolvedValue({
      id: '4fc4c538-9584-47db-bf89-a572bfab4a91',
      nome: 'Ateliê Agenda',
      email: 'atelier@agenda.plus',
      role: 'ADMIN',
    })
    vi.spyOn(authApi, 'login').mockRejectedValue({ status: 503, message: 'Serviço indisponível.' })
    renderAuthForm(<RegisterForm />, '/cadastro?returnTo=%2Fagendar%2Fresumo')

    fireEvent.click(screen.getByRole('radio', { name: /negócio/i }))
    fireEvent.change(screen.getByLabelText(/nome/i), { target: { value: 'Ateliê Agenda' } })
    fireEvent.change(screen.getByLabelText(/e-mail/i), { target: { value: 'atelier@agenda.plus' } })
    fireEvent.change(screen.getByLabelText(/senha/i), { target: { value: 'segredo123' } })
    fireEvent.click(screen.getByRole('button', { name: /criar conta/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Sua conta foi criada')
    expect(screen.getByRole('link', { name: /entre com seus dados/i })).toHaveAttribute(
      'href',
      '/login?returnTo=%2Fagendar%2Fresumo',
    )
    expect(screen.queryByText(/não foi possível criar a conta/i)).not.toBeInTheDocument()
  })

  it('shows duplicate email failures inline without suggesting account creation again', async () => {
    vi.spyOn(authApi, 'registerBusiness').mockRejectedValue({
      status: 409,
      code: 'EMAIL_ALREADY_EXISTS',
      message: 'Este e-mail já está cadastrado.',
    })
    renderAuthForm(<RegisterForm />)

    fireEvent.change(screen.getByLabelText(/nome/i), { target: { value: 'Ateliê Agenda' } })
    fireEvent.change(screen.getByLabelText(/e-mail/i), { target: { value: 'mestre@agenda.plus' } })
    fireEvent.change(screen.getByLabelText(/senha/i), { target: { value: 'segredo123' } })
    fireEvent.click(screen.getByRole('button', { name: /criar conta/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Este e-mail já está cadastrado.')
  })
})
