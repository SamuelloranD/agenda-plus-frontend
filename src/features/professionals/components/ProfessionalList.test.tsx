import { cleanup, render, screen, within } from '@testing-library/react'
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
    const firstSchedule = screen.getAllByRole('list', { name: 'Horários de trabalho' })[0]
    expect(firstSchedule).toBeInTheDocument()
    expect(within(firstSchedule).getByRole('listitem')).toHaveTextContent('Seg')
    expect(within(firstSchedule).getByRole('listitem')).toHaveTextContent('08:00–20:00')
    expect(screen.queryByText(/08:00:00/)).not.toBeInTheDocument()
  })

  it('renders work hours as a compact grid of day and interval blocks', () => {
    render(<ProfessionalList
      professionals={[{
        id: 'professional-1',
        nome: 'André Silva',
        especialidade: 'Barbeiro',
        imagem: null,
        horariosTrabalho: [
          { diaSemana: 'MONDAY', inicio: '08:00:00', fim: '20:00:00' },
          { diaSemana: 'TUESDAY', inicio: '09:00:00', fim: '18:00:00' },
          { diaSemana: 'WEDNESDAY', inicio: '08:00:00', fim: '20:00:00' },
          { diaSemana: 'THURSDAY', inicio: '09:00:00', fim: '18:00:00' },
        ],
      }]}
      onEdit={vi.fn()}
      onDelete={vi.fn()}
    />)

    expect(screen.getByRole('list', { name: 'Horários de trabalho' })).toHaveClass('professional-card__schedule')
    expect(screen.getAllByRole('listitem')).toHaveLength(4)
  })
})
