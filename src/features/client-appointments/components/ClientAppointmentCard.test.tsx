import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
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
  it('shows resolved names, date, time, status, and an eligible cancellation action', () => {
    const onCancel = vi.fn()
    render(
      <ClientAppointmentCard
        appointment={appointment}
        names={{ professionalName: 'João Silva', serviceName: 'Corte de Cabelo' }}
        now={new Date('2026-09-19T10:00:00')}
        price={80}
        onCancel={onCancel}
      />,
    )

    expect(screen.getByRole('heading', { name: 'Corte de Cabelo' })).toBeInTheDocument()
    expect(screen.getByText('João Silva')).toBeInTheDocument()
    expect(screen.getByText(/domingo, 20 de setembro de 2026/i)).toBeInTheDocument()
    expect(screen.getByText('14:00 — 14:45')).toBeInTheDocument()
    expect(screen.getByText('CONFIRMADO')).toBeInTheDocument()
    expect(screen.getByText('R$ 80,00')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('shows cancellation for an eligible pending appointment', () => {
    render(
      <ClientAppointmentCard
        appointment={{ ...appointment, status: 'PENDENTE' }}
        names={{ professionalName: 'João Silva', serviceName: 'Corte de Cabelo' }}
        now={new Date('2026-09-19T10:00:00')}
        onCancel={() => undefined}
      />,
    )

    expect(screen.getByText('PENDENTE')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument()
  })

  it('never renders raw IDs when catalog names are missing', () => {
    render(
      <ClientAppointmentCard
        appointment={appointment}
        names={{ professionalName: 'Profissional não identificado', serviceName: 'Serviço não identificado' }}
        now={new Date('2026-09-19T10:00:00')}
        onCancel={() => undefined}
      />,
    )

    expect(screen.getByText('Serviço não identificado')).toBeInTheDocument()
    expect(screen.getByText('Profissional não identificado')).toBeInTheDocument()
    expect(screen.queryByText(/appointment-1|professional-1|service-1|client-1/)).not.toBeInTheDocument()
  })

  it.each([
    ['CANCELADO', '2026-09-19T10:00:00'],
    ['CONCLUIDO', '2026-09-19T10:00:00'],
    ['CONFIRMADO', '2026-09-21T10:00:00'],
  ] as const)('hides cancellation for %s appointments at %s', (status, now) => {
    render(
      <ClientAppointmentCard
        appointment={{ ...appointment, status }}
        names={{ professionalName: 'João Silva', serviceName: 'Corte de Cabelo' }}
        now={new Date(now)}
        onCancel={() => undefined}
      />,
    )

    expect(screen.queryByRole('button', { name: 'Cancelar' })).not.toBeInTheDocument()
  })
})
