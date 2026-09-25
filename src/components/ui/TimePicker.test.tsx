import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { TimePicker } from './TimePicker'

afterEach(cleanup)

describe('TimePicker', () => {
  it('opens a rounded custom picker and updates the selected time', () => {
    const onChange = vi.fn()

    render(<TimePicker id="work-start" value="09:00" onChange={onChange} />)

    fireEvent.click(screen.getByRole('button', { name: 'Horário 09:00' }))

    expect(screen.getByRole('dialog', { name: 'Selecionar horário' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: '09', selected: true })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: '00', selected: true })).toBeInTheDocument()

    fireEvent.click(within(screen.getByRole('listbox', { name: 'Horas' })).getByRole('option', { name: '10', selected: false }))

    expect(onChange).toHaveBeenCalledWith('10:00')
  })
})
