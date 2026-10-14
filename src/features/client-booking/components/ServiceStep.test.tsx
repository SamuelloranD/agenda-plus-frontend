import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ServiceStep } from './ServiceStep'

describe('ServiceStep', () => {
  it('shows real duration and price and marks the selected service', () => {
    const onSelect = vi.fn()
    const service = { id: 's1', nome: 'Barba', duracaoMinutos: 30, preco: { valor: 60, moeda: 'BRL' } }
    render(<ServiceStep services={[service]} selectedId="s1" isLoading={false} isError={false} onRetry={vi.fn()} onSelect={onSelect} />)

    expect(screen.getByRole('heading', { name: 'Escolha o serviço' })).toBeInTheDocument()
    const choice = screen.getByRole('button', { name: /Barba/ })
    expect(choice).toHaveAttribute('aria-pressed', 'true')
    expect(choice).toHaveTextContent('30 min')
    expect(choice).toHaveTextContent('R$ 60,00')
    fireEvent.click(choice)
    expect(onSelect).toHaveBeenCalledWith(service)
  })
})
