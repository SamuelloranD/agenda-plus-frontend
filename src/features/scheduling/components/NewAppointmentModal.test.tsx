import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { NewAppointmentModal } from './NewAppointmentModal'

afterEach(cleanup)

describe('NewAppointmentModal', () => {
  it('renders a dialog and closes it from the close action', () => {
    const onClose = vi.fn()

    render(<NewAppointmentModal isOpen onClose={onClose}><p>Folha de atendimento</p></NewAppointmentModal>)

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    const closeButton = screen.getByRole('button', { name: 'Fechar folha de atendimento' })
    expect(closeButton.querySelector('svg')).toBeInTheDocument()
    expect(closeButton).not.toHaveTextContent('×')
    fireEvent.click(closeButton)
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
