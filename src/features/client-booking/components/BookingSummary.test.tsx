import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { BookingSummary } from './BookingSummary'

afterEach(cleanup)

describe('BookingSummary', () => {
  const partialSelection = {
    service: { id: 'service', nome: 'Barba', duracaoMinutos: 30, preco: { valor: 60, moeda: 'BRL' } },
    professionalChoice: null,
    date: '2099-09-24',
    slot: null,
  }

  it('advances from service selection through the summary action', () => {
    const onContinue = vi.fn()
    render(<BookingSummary step="service" selection={partialSelection} professionalLabel="A escolher" canConfirm={false} isPending={false} error={null} onConfirm={vi.fn()} onContinue={onContinue} />)

    expect(screen.getByText('Você ainda não concluiu seu agendamento')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Editar' })).not.toBeInTheDocument()
    expect(screen.getByText(/R\$\s*60,00/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Escolher profissional' }))
    expect(onContinue).toHaveBeenCalledOnce()
  })

  it('waits for a service before allowing the next step', () => {
    render(<BookingSummary step="service" selection={{ ...partialSelection, service: null }} professionalLabel="A escolher" canConfirm={false} isPending={false} error={null} onConfirm={vi.fn()} onContinue={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Escolher profissional' })).toBeDisabled()
  })

  it('advances from professional selection without submitting a booking', () => {
    const onContinue = vi.fn()
    const onConfirm = vi.fn()
    render(<BookingSummary step="professional" selection={{ ...partialSelection, professionalChoice: 'p1' }} professionalLabel="André" canConfirm={false} isPending={false} error={null} onConfirm={onConfirm} onContinue={onContinue} onEdit={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Escolher data e horário' }))
    expect(onContinue).toHaveBeenCalledOnce()
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('shows the real service price, duration and selected slot before sending a request', () => {
    const onConfirm = vi.fn()
    const onEdit = vi.fn()
    render(<BookingSummary selection={{
      service: { id: 'service', nome: 'Barba', duracaoMinutos: 30, preco: { valor: 50, moeda: 'BRL' } },
      professionalChoice: 'professional', date: '2099-09-24',
      slot: { key: 'slot', inicio: '2099-09-24T08:00:00', fim: '2099-09-24T08:30:00', profissionalId: 'professional', candidates: [] },
    }} professionalLabel="André" canConfirm isPending={false} error={null} onConfirm={onConfirm} onEdit={onEdit} />)

    expect(screen.getByRole('heading', { name: 'Seu agendamento' })).toBeInTheDocument()
    expect(screen.getByRole('list')).toBeInTheDocument()
    expect(screen.getAllByRole('listitem')).toHaveLength(5)
    expect(screen.getByText(/R\$\s*50,00/)).toBeInTheDocument()
    expect(screen.getByText('Duração estimada: 30 minutos')).toBeInTheDocument()
    expect(screen.getByText('08:00')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Editar' }))
    expect(onEdit).toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Solicitar agendamento' }))
    expect(onConfirm).toHaveBeenCalled()
  })
})
