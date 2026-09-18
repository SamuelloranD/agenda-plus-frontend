import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Select } from './Select'

afterEach(cleanup)

const options = [
  { value: 'service-1', label: 'Corte clássico' },
  { value: 'service-2', label: 'Barba tradicional' },
]

describe('Select', () => {
  it('opens the listbox and reports the selected option', () => {
    const onChange = vi.fn()

    function ControlledSelect() {
      const [value, setValue] = useState('')
      return <Select id="service" value={value} onChange={(nextValue) => { onChange(nextValue); setValue(nextValue) }} options={options} placeholder="Selecione o serviço" />
    }

    render(<ControlledSelect />)

    const trigger = screen.getByRole('combobox')
    expect(trigger.querySelector('svg')).toBeInTheDocument()
    expect(trigger.querySelector('path')).toHaveAttribute('stroke', 'currentColor')
    expect(trigger).toHaveTextContent('Selecione o serviço')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()

    fireEvent.click(trigger)
    fireEvent.click(screen.getByRole('option', { name: 'Corte clássico' }))

    expect(onChange).toHaveBeenCalledWith('service-1')
    expect(trigger).toHaveTextContent('Corte clássico')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('closes as soon as a pointer starts selecting an option', () => {
    render(<Select id="service" value="" onChange={vi.fn()} options={options} />)

    fireEvent.click(screen.getByRole('combobox'))
    fireEvent.pointerDown(screen.getByRole('option', { name: 'Corte clássico' }))

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })
})
