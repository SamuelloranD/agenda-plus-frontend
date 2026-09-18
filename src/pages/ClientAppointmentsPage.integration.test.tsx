import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
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

it('restores connected focus after the real mutation invalidates and refetches the client list', async () => {
  const appointment: AgendamentoResponse = {
    id: 'appointment-1', inicio: '2099-09-20T14:00:00', fim: '2099-09-20T14:45:00',
    clienteId: 'client-1', profissionalId: 'professional-1', servicoId: 'service-1', status: 'CONFIRMADO',
  }
  const cancelled = { ...appointment, status: 'CANCELADO' as const }
  const page = { conteudo: [appointment], pagina: 0, tamanho: 20, totalElementos: 1, totalPaginas: 1 }
  vi.spyOn(schedulingApi, 'listMine').mockResolvedValueOnce(page).mockResolvedValue({ ...page, conteudo: [cancelled] })
  vi.spyOn(schedulingApi, 'cancel').mockResolvedValue(cancelled)
  vi.spyOn(professionalsApi, 'list').mockResolvedValue([
    { id: 'professional-1', nome: 'João Silva', especialidade: 'Cabeleireiro', horariosTrabalho: [] },
  ])
  vi.spyOn(servicesApi, 'list').mockResolvedValue([
    { id: 'service-1', nome: 'Corte de Cabelo', duracaoMinutos: 45, preco: { valor: 80, moeda: 'BRL' } },
  ])
  useAuthStore.setState({
    token: 'token', user: { id: 'client-1', nome: 'Maria', email: 'maria@example.com', role: 'CLIENTE' },
  })
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  const view = render(<QueryClientProvider client={client}><ClientAppointmentsPage /></QueryClientProvider>)
  try {
    const opener = await screen.findByRole('button', { name: 'Cancelar' })
    opener.focus()
    fireEvent.click(opener)
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar cancelamento' }))

    expect(await screen.findByText('CANCELADO')).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(opener.isConnected).toBe(false)
    expect(screen.getByRole('region', { name: 'Meus agendamentos' })).toHaveFocus()
    expect(screen.getByText('Corte de Cabelo')).toBeInTheDocument()
    expect(schedulingApi.listMine).toHaveBeenLastCalledWith({ pagina: 0, tamanho: 20 })
  } finally {
    view.unmount()
    client.clear()
  }
})
