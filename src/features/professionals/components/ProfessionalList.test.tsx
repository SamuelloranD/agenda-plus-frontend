import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ProfessionalList } from './ProfessionalList'

afterEach(cleanup)

describe('ProfessionalList images', () => {
  it('renders a photo when available and keeps initials as fallback', () => {
    render(<ProfessionalList
      professionals={[
        { id: 'with-image', nome: 'André Silva', especialidade: 'Barbeiro', imagem: 'data:image/jpeg;base64,YQ==', horariosTrabalho: [{ diaSemana: 'MONDAY', inicio: '08:00:00', fim: '20:00:00' }] },
        { id: 'without-image', nome: 'Beatriz Lima', especialidade: 'Manicure', imagem: null, horariosTrabalho: [] },
      ]}
      onEdit={vi.fn()}
      onDelete={vi.fn()}
    />)

    expect(screen.getByAltText('')).toHaveAttribute('src', 'data:image/jpeg;base64,YQ==')
    expect(screen.getByText('BL')).toBeInTheDocument()
    expect(screen.getByText('Seg · 08:00–20:00')).toBeInTheDocument()
    expect(screen.queryByText(/08:00:00/)).not.toBeInTheDocument()
  })
})
