import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ServiceStep } from './ServiceStep'

afterEach(cleanup)

describe('ServiceStep', () => {
  it('does not render the decorative star in service choices', () => {
    render(<ServiceStep
      services={[{ id: 'service-1', nome: 'Barba', duracaoMinutos: 30, preco: { valor: 60, moeda: 'BRL' } }]}
      selectedId={undefined}
      isLoading={false}
      isError={false}
      onRetry={vi.fn()}
      onSelect={vi.fn()}
    />)

    expect(screen.getByText('Barba')).toBeInTheDocument()
    expect(screen.queryByText('✦')).not.toBeInTheDocument()
  })
})
