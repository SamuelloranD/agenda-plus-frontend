import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, expect, it } from 'vitest'
import { TodayAppointments } from './TodayAppointments'
import type { AgendamentoResponse } from '../../../types/scheduling'
import { createAppointmentDirectory } from '../../scheduling/utils/appointmentDirectory'

const appointment: AgendamentoResponse = {
  id: 'appointment-1',
  inicio: '2026-09-16T09:00:00',
  fim: '2026-09-16T09:45:00',
  profissionalId: 'professional-1',
  clienteId: 'client-1',
  servicoId: 'service-1',
  status: 'PENDENTE',
}

describe('TodayAppointments', () => {
  it('renders catalog names instead of shortened IDs', () => {
    const queryClient = new QueryClient()
    render(
      <QueryClientProvider client={queryClient}><TodayAppointments
        appointments={[appointment]}
        directory={createAppointmentDirectory({
          clients: [{ id: 'client-1', nome: 'Maria Souza', email: 'maria@example.com', role: 'CLIENTE' }],
          professionals: [{ id: 'professional-1', nome: 'João Silva', especialidade: 'Cabeleireiro', horariosTrabalho: [] }],
          services: [{ id: 'service-1', nome: 'Corte de Cabelo', duracaoMinutos: 45, preco: { valor: 80, moeda: 'BRL' } }],
        })}
      /></QueryClientProvider>,
    )

    expect(screen.getByText('Cliente Maria Souza')).toBeInTheDocument()
    expect(screen.getByText('Serviço Corte de Cabelo · Profissional João Silva')).toBeInTheDocument()
    expect(screen.queryByText(/client-1|service-1|professional-1/)).not.toBeInTheDocument()
  })

  it('renders friendly fallback labels when names are unavailable', () => {
    const queryClient = new QueryClient()
    render(
      <QueryClientProvider client={queryClient}><TodayAppointments
        appointments={[appointment]}
        directory={createAppointmentDirectory({ clients: [], professionals: [], services: [] })}
      /></QueryClientProvider>,
    )

    expect(screen.getByText('Cliente Cliente não identificado')).toBeInTheDocument()
    expect(screen.getByText('Serviço Serviço não identificado · Profissional Profissional não identificado')).toBeInTheDocument()
    expect(screen.queryByText(/professional-1|client-1|service-1/)).not.toBeInTheDocument()
  })
})
