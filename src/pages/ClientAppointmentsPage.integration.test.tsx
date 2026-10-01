import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { professionalsApi } from '../services/api/professionals'
import { schedulingApi } from '../services/api/scheduling'
import { servicesApi } from '../services/api/services'
import { useAuthStore } from '../store/authStore'
import type { AgendamentoResponse } from '../types/scheduling'
import { ClientAppointmentsPage } from './ClientAppointmentsPage'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  useAuthStore.getState().clearSession()
})

it('loads the client appointment area without exposing cancellation controls', async () => {
  const appointment: AgendamentoResponse = {
    id: 'appointment-1', inicio: '2099-09-20T14:00:00', fim: '2099-09-20T14:45:00',
    clienteId: 'client-1', profissionalId: 'professional-1', servicoId: 'service-1', status: 'CONFIRMADO',
  }
  const page = { conteudo: [appointment], pagina: 0, tamanho: 20, totalElementos: 1, totalPaginas: 1 }
  vi.spyOn(schedulingApi, 'listMine').mockResolvedValue(page)
  const cancel = vi.spyOn(schedulingApi, 'cancel')
  vi.spyOn(professionalsApi, 'list').mockResolvedValue([
    { id: 'professional-1', nome: 'Joao Silva', especialidade: 'Cabeleireiro', horariosTrabalho: [] },
  ])
  vi.spyOn(servicesApi, 'list').mockResolvedValue([
    { id: 'service-1', nome: 'Corte de Cabelo', duracaoMinutos: 45, preco: { valor: 80, moeda: 'BRL' } },
  ])
  useAuthStore.setState({ token: 'token', user: { id: 'client-1', nome: 'Maria', email: 'maria@example.com', role: 'CLIENTE' } })
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  const view = render(<QueryClientProvider client={client}><ClientAppointmentsPage /></QueryClientProvider>)

  try {
    expect(await screen.findByText('Corte de Cabelo')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Cancelar' })).not.toBeInTheDocument()
    expect(cancel).not.toHaveBeenCalled()
  } finally {
    view.unmount()
    client.clear()
  }
})
