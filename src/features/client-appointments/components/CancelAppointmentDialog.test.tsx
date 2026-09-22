import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { AgendamentoResponse } from '../../../types/scheduling'
import { CancelAppointmentDialog } from './CancelAppointmentDialog'

const appointment: AgendamentoResponse = {
  id: 'appointment-1',
  inicio: '2026-09-20T14:00:00',
  fim: '2026-09-20T15:00:00',
  profissionalId: 'professional-1',
  clienteId: 'client-1',
  servicoId: 'service-1',
  status: 'CONFIRMADO',
}

describe('CancelAppointmentDialog', () => {
  it('shows the administrative exception warning only when requested', () => {
    const fallbackRef = { current: null }
    const { rerender } = render(
      <CancelAppointmentDialog
        appointment={appointment}
        names={{ serviceName: 'Corte', professionalName: 'João' }}
        isPending={false}
        errorMessage={null}
        showAdministrativeExceptionWarning
        focusFallbackRef={fallbackRef}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />,
    )

    expect(screen.getByText(/dentro da janela de 24 horas/i)).toBeInTheDocument()

    rerender(
      <CancelAppointmentDialog
        appointment={appointment}
        names={{ serviceName: 'Corte', professionalName: 'João' }}
        isPending={false}
        errorMessage={null}
        focusFallbackRef={fallbackRef}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />,
    )

    expect(screen.queryByText(/dentro da janela de 24 horas/i)).not.toBeInTheDocument()
  })
})
