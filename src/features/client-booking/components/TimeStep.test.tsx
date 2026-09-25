import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { TimeStep } from './TimeStep'

afterEach(cleanup)

describe('TimeStep', () => {
  it('uses the shared date picker instead of the browser date input', () => {
    render(
      <TimeStep
        date="2099-09-24"
        slots={[]}
        selectedSlot={null}
        isLoading={false}
        isError={false}
        onRetry={vi.fn()}
        onDateChange={vi.fn()}
        onSelect={vi.fn()}
      />,
    )

    expect(screen.getByRole('button', { name: 'Data do atendimento' })).toHaveTextContent('24/09/2099')
    expect(document.querySelector('input[type="date"]')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Data do atendimento' }))

    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })
})
