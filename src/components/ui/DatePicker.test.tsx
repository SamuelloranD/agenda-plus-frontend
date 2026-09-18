import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { DatePicker } from './DatePicker'

afterEach(cleanup)

describe('DatePicker', () => {
  it('uses the shared trigger style and closes after choosing a day', () => {
    const onChange = vi.fn()

    render(<DatePicker id="appointment-date" value="2026-09-18" min="2026-09-18" onChange={onChange} />)

    const trigger = screen.getByRole('button', { name: 'Data do atendimento' })
    expect(trigger).toHaveTextContent('18/09/2026')

    fireEvent.click(trigger)
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '19 de setembro de 2026' }))

    expect(onChange).toHaveBeenCalledWith('2026-09-19')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('disables dates before the minimum date', () => {
    render(<DatePicker id="appointment-date" value="2026-09-18" min="2026-09-18" onChange={vi.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: 'Data do atendimento' }))

    expect(screen.getByRole('button', { name: '17 de setembro de 2026' })).toBeDisabled()
    expect(screen.getByRole('button', { name: '19 de setembro de 2026' })).toBeEnabled()
  })
})
