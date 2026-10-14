import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { TimeStep } from './TimeStep'
import { addCalendarDays, todayKey } from '../utils/bookingTime'

afterEach(cleanup)

describe('TimeStep', () => {
  const slots = [
    { key: 'morning', inicio: '2099-09-24T09:00:00', fim: '2099-09-24T09:30:00', candidates: [{ id: 'p1', nome: 'Ana', especialidade: '', horariosTrabalho: [] }] },
    { key: 'afternoon', inicio: '2099-09-24T13:00:00', fim: '2099-09-24T13:30:00', candidates: [{ id: 'p1', nome: 'Ana', especialidade: '', horariosTrabalho: [] }] },
    { key: 'night', inicio: '2099-09-24T19:00:00', fim: '2099-09-24T19:30:00', candidates: [{ id: 'p1', nome: 'Ana', especialidade: '', horariosTrabalho: [] }] },
  ]

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

  it('filters real slots by shift and keeps evening availability under Todos', () => {
    render(<TimeStep date="2099-09-24" slots={slots} selectedSlot={null} isLoading={false} isError={false} onRetry={vi.fn()} onDateChange={vi.fn()} onSelect={vi.fn()} />)

    expect(screen.getByRole('button', { name: /^09:00,/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^13:00,/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^19:00,/ })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Manhã' }))
    expect(screen.getByRole('button', { name: /^09:00,/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^13:00,/ })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Manhã' })).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(screen.getByRole('button', { name: 'Tarde' }))
    expect(screen.getByRole('button', { name: /^13:00,/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^09:00,/ })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Todos' }))
    expect(screen.getByRole('button', { name: /^19:00,/ })).toBeInTheDocument()
  })

  it('selects a quick date through the same date callback', () => {
    const onDateChange = vi.fn()
    render(<TimeStep date="2099-09-24" slots={[]} selectedSlot={null} isLoading={false} isError={false} onRetry={vi.fn()} onDateChange={onDateChange} onSelect={vi.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: /25\/09/ }))
    expect(onDateChange).toHaveBeenCalledWith('2099-09-25')
  })

  it('always shows the previous control and disables it when today is the first visible date', () => {
    render(<TimeStep date={todayKey()} slots={[]} selectedSlot={null} isLoading={false} isError={false} onRetry={vi.fn()} onDateChange={vi.fn()} onSelect={vi.fn()} />)

    const previous = screen.getByRole('button', { name: 'Mostrar dias anteriores' })
    expect(previous).toBeVisible()
    expect(previous).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: 'Mostrar próximos dias' }))
    expect(previous).toBeEnabled()
    fireEvent.click(previous)
    expect(previous).toBeDisabled()
    expect(screen.getByRole('button', { name: new RegExp(todayKey().slice(8, 10)) })).toBeInTheDocument()
  })

  it('can move back to earlier valid dates even when the selected date starts the strip', () => {
    const selected = addCalendarDays(todayKey(), 5)
    render(<TimeStep date={selected} slots={[]} selectedSlot={null} isLoading={false} isError={false} onRetry={vi.fn()} onDateChange={vi.fn()} onSelect={vi.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: 'Mostrar dias anteriores' }))
    const firstEarlier = addCalendarDays(todayKey(), 0)
    expect(screen.getByRole('button', { name: new RegExp(`${firstEarlier.slice(8, 10)}/${firstEarlier.slice(5, 7)}`) })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Mostrar dias anteriores' })).toBeDisabled()
  })

  it('shows available slots and a retry when one professional agenda fails', () => {
    const onRetry = vi.fn()
    render(<TimeStep date="2099-09-24" slots={slots} selectedSlot={null} isLoading={false} isError={false} isPartialError onRetry={onRetry} onDateChange={vi.fn()} onSelect={vi.fn()} />)

    expect(screen.getByRole('button', { name: /^09:00,/ })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))
    expect(onRetry).toHaveBeenCalledOnce()
  })
})
