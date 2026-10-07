import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ServiceList } from './ServiceList'

afterEach(cleanup)

describe('ServiceList', () => {
  it('does not render a decorative service glyph', () => {
    render(<ServiceList
      services={[{ id: 'service-1', nome: 'Barba', duracaoMinutos: 30, preco: { valor: 50, moeda: 'BRL' } }]}
      onEdit={vi.fn()}
      onDelete={vi.fn()}
    />)

    expect(screen.queryByAltText('')).not.toBeInTheDocument()
    expect(screen.queryByText('✦')).not.toBeInTheDocument()
  })
})
