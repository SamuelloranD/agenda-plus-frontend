import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { AppointmentCard } from './AppointmentCard'
import type { AgendamentoResponse } from '../../../types/scheduling'

function appointment(status: AgendamentoResponse['status']): AgendamentoResponse {
  return {
    id: `appointment-${status}`,
    inicio: '2026-09-16T09:00:00',
    fim: '2026-09-16T09:45:00',
    profissionalId: 'same-professional',
    clienteId: `client-${status}`,
    servicoId: 'service-1',
    status,
  }
}

afterEach(cleanup)

describe('AppointmentCard professional rail', () => {
  it('uses the same professional tone when only appointment status changes', () => {
    render(<><AppointmentCard appointment={appointment('PENDENTE')} /><AppointmentCard appointment={appointment('CONFIRMADO')} /></>)

    const cards = screen.getAllByRole('article')
    const tones = cards.map((card) => [...card.classList].find((name) => name.startsWith('appointment-card--')))

    expect(tones[0]).toBe(tones[1])
    expect(screen.getByText('PENDENTE')).toBeInTheDocument()
    expect(screen.getByText('CONFIRMADO')).toBeInTheDocument()
  })
})
