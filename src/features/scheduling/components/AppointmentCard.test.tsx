import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, expect, it } from 'vitest'
import { AppointmentCard } from './AppointmentCard'
import type { AgendamentoResponse } from '../../../types/scheduling'
import { createAppointmentDirectory } from '../utils/appointmentDirectory'

const appointment: AgendamentoResponse = {
  id: 'appointment-1',
  inicio: '2026-09-16T09:00:00',
  fim: '2026-09-16T09:45:00',
  profissionalId: 'professional-1',
  clienteId: 'client-1',
  servicoId: 'service-1',
  status: 'CONFIRMADO',
}

describe('AppointmentCard', () => {
  it('renders resolved names and does not expose IDs in the weekly card', () => {
    const queryClient = new QueryClient()
    render(
      <QueryClientProvider client={queryClient}><AppointmentCard
        appointment={appointment}
        directory={createAppointmentDirectory({
          clients: [{ id: 'client-1', nome: 'Maria Souza', email: 'maria@example.com', role: 'CLIENTE' }],
          professionals: [{ id: 'professional-1', nome: 'João Silva', especialidade: 'Cabeleireiro', horariosTrabalho: [] }],
          services: [{ id: 'service-1', nome: 'Corte de Cabelo', duracaoMinutos: 45, preco: { valor: 80, moeda: 'BRL' } }],
        })}
      /></QueryClientProvider>,
    )

    expect(screen.getByText('Cliente Maria Souza')).toBeInTheDocument()
    expect(screen.getByText('Serviço Corte de Cabelo')).toBeInTheDocument()
    expect(screen.getByText('Profissional João Silva')).toBeInTheDocument()
    expect(screen.queryByText(/client-1|service-1|professional-1/)).not.toBeInTheDocument()
  })
})
