import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import type { AgendamentoResponse } from '../../../types/scheduling'
import { ClientAppointmentCard } from './ClientAppointmentCard'

const appointment: AgendamentoResponse = {
  id: 'appointment-1',
  inicio: '2026-09-20T14:00:00',
  fim: '2026-09-20T14:45:00',
  profissionalId: 'professional-1',
  clienteId: 'client-1',
  servicoId: 'service-1',
  status: 'CONFIRMADO',
}

afterEach(cleanup)

describe('ClientAppointmentCard', () => {
  it('shows resolved names, date, time, status, and no cancellation action', () => {
    render(
      <ClientAppointmentCard
        appointment={appointment}
        names={{ professionalName: 'João Silva', serviceName: 'Corte de Cabelo' }}
        price={80}
      />,
    )

    expect(screen.getByRole('heading', { name: 'Corte de Cabelo' })).toBeInTheDocument()
    expect(screen.getByText('João Silva')).toBeInTheDocument()
    expect(screen.getByText(/domingo, 20 de setembro de 2026/i)).toBeInTheDocument()
    expect(screen.getByText('14:00 — 14:45')).toBeInTheDocument()
    expect(screen.getByText('CONFIRMADO')).toBeInTheDocument()
    expect(screen.getByText('R$ 80,00')).toBeInTheDocument()

    expect(screen.queryByRole('button', { name: 'Cancelar' })).not.toBeInTheDocument()
  })

  it('does not expose cancellation for a pending appointment', () => {
    render(
      <ClientAppointmentCard
        appointment={{ ...appointment, status: 'PENDENTE' }}
        names={{ professionalName: 'João Silva', serviceName: 'Corte de Cabelo' }}
      />,
    )

    expect(screen.getByText('PENDENTE')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Cancelar' })).not.toBeInTheDocument()
  })

  it('never renders raw IDs when catalog names are missing', () => {
    render(
      <ClientAppointmentCard
        appointment={appointment}
        names={{ professionalName: 'Profissional não identificado', serviceName: 'Serviço não identificado' }}
      />,
    )

    expect(screen.getByText('Serviço não identificado')).toBeInTheDocument()
    expect(screen.getByText('Profissional não identificado')).toBeInTheDocument()
    expect(screen.queryByText(/appointment-1|professional-1|service-1|client-1/)).not.toBeInTheDocument()
  })

  it.each(['CANCELADO', 'CONCLUIDO', 'CONFIRMADO'] as const)('hides cancellation for %s appointments', (status) => {
    render(
      <ClientAppointmentCard
        appointment={{ ...appointment, status }}
        names={{ professionalName: 'João Silva', serviceName: 'Corte de Cabelo' }}
      />,
    )

    expect(screen.queryByRole('button', { name: 'Cancelar' })).not.toBeInTheDocument()
  })
})
