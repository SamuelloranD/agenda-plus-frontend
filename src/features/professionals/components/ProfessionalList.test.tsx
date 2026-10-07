import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ProfessionalList } from './ProfessionalList'

afterEach(cleanup)

describe('ProfessionalList images', () => {
  it('renders a photo when available and keeps initials as fallback', () => {
    render(<ProfessionalList
      professionals={[
        { id: 'with-image', nome: 'André Silva', especialidade: 'Barbeiro', imagem: 'data:image/jpeg;base64,YQ==', horariosTrabalho: [] },
        { id: 'without-image', nome: 'Beatriz Lima', especialidade: 'Manicure', imagem: null, horariosTrabalho: [] },
      ]}
      onEdit={vi.fn()}
      onDelete={vi.fn()}
    />)

    expect(screen.getByAltText('')).toHaveAttribute('src', 'data:image/jpeg;base64,YQ==')
    expect(screen.getByText('BL')).toBeInTheDocument()
  })
})
