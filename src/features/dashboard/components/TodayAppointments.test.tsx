import { cleanup, render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, describe, expect, it } from 'vitest'
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

function renderList(appointments: AgendamentoResponse[], emptyMessage?: string) {
  const queryClient = new QueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <TodayAppointments
        appointments={appointments}
        directory={createAppointmentDirectory({
          clients: [{ id: 'client-1', nome: 'Maria Souza', email: 'maria@example.com', role: 'CLIENTE' }],
          professionals: [{ id: 'professional-1', nome: 'Joao Silva', especialidade: 'Cabeleireiro', horariosTrabalho: [] }],
          services: [{ id: 'service-1', nome: 'Corte de Cabelo', duracaoMinutos: 45, preco: { valor: 80, moeda: 'BRL' } }],
        })}
        emptyMessage={emptyMessage}
      />
    </QueryClientProvider>,
  )
}

afterEach(cleanup)

describe('TodayAppointments', () => {
  it('renders catalog names and prices', () => {
    renderList([appointment])

    expect(screen.getByText('Cliente Maria Souza')).toBeInTheDocument()
    expect(screen.getByText(/Corte de Cabelo/)).toBeInTheDocument()
    expect(screen.getByText('R$ 80,00')).toBeInTheDocument()
  })

  it('uses a custom empty message for another dashboard time range', () => {
    renderList([], 'Nenhum atendimento futuro reservado.')

    expect(screen.getByText('Nenhum atendimento futuro reservado.')).toBeInTheDocument()
  })
})
