import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { BookingStepper } from './BookingStepper'

describe('BookingStepper', () => {
  it('names each step when the visible labels are hidden on mobile', () => {
    render(<BookingStepper currentStep="time" hasService hasProfessional onStepChange={vi.fn()} />)

    expect(screen.getByRole('button', { name: 'Serviço' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Profissional' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Data e horário' })).toHaveAttribute('aria-current', 'step')
    expect(screen.getByRole('button', { name: 'Confirmação' })).toBeDisabled()
  })
})
