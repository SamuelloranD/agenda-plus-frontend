import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ServiceList } from './ServiceList'

afterEach(cleanup)

describe('ServiceList images', () => {
  it('renders a thumbnail when available and keeps the glyph as fallback', () => {
    render(<ServiceList
      services={[
        { id: 'with-image', nome: 'Barba', duracaoMinutos: 30, preco: { valor: 50, moeda: 'BRL' }, imagem: 'data:image/webp;base64,YQ==' },
        { id: 'without-image', nome: 'Corte', duracaoMinutos: 45, preco: { valor: 80, moeda: 'BRL' }, imagem: null },
      ]}
      onEdit={vi.fn()}
      onDelete={vi.fn()}
    />)

    expect(screen.getByAltText('')).toHaveAttribute('src', 'data:image/webp;base64,YQ==')
    expect(screen.getByText('✦')).toBeInTheDocument()
  })
})
