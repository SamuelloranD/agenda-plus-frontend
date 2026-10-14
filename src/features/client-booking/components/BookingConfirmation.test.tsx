import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { BookingConfirmation } from './BookingConfirmation'

describe('BookingConfirmation', () => {
  it('calls a pending appointment a sent request rather than a confirmed visit', () => {
    const onStartOver = vi.fn()
    render(<MemoryRouter><BookingConfirmation embedded onStartOver={onStartOver} confirmation={{
      appointment: { id: 'a1', inicio: '2099-09-24T08:00:00', fim: '2099-09-24T08:30:00', clienteId: 'c1', profissionalId: 'p1', servicoId: 's1', status: 'PENDENTE' },
      service: { id: 's1', nome: 'Barba', duracaoMinutos: 30, preco: { valor: 50, moeda: 'BRL' } },
      professional: { id: 'p1', nome: 'André', especialidade: '', horariosTrabalho: [] },
    }} /></MemoryRouter>)

    expect(screen.getByRole('heading', { name: 'Aguardando confirmação do estabelecimento.' })).toBeInTheDocument()
    expect(screen.getByText('SOLICITAÇÃO ENVIADA')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Pedido enviado' })).toHaveAttribute('aria-current', 'step')
    expect(screen.getByText(/R\$\s*50,00/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ver meus agendamentos' })).toHaveAttribute('href', '/meus-agendamentos')
    fireEvent.click(screen.getByRole('button', { name: 'Fazer outro agendamento' }))
    expect(onStartOver).toHaveBeenCalledOnce()
    expect(screen.queryByText(/agendamento confirmado/i)).not.toBeInTheDocument()
  })

  it('uses the actual confirmed status in the result', () => {
    render(<MemoryRouter><BookingConfirmation embedded confirmation={{
      appointment: { id: 'a2', inicio: '2099-09-24T08:00:00', fim: '2099-09-24T08:30:00', clienteId: 'c1', profissionalId: 'p1', servicoId: 's1', status: 'CONFIRMADO' },
      service: { id: 's1', nome: 'Barba', duracaoMinutos: 30, preco: { valor: 50, moeda: 'BRL' } },
      professional: { id: 'p1', nome: 'André', especialidade: '', horariosTrabalho: [] },
    }} /></MemoryRouter>)

    expect(screen.getByRole('heading', { name: 'Seu horário está confirmado.' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Confirmado' })).toHaveAttribute('aria-current', 'step')
  })
})
