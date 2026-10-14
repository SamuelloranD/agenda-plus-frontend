import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ProfessionalStep } from './ProfessionalStep'
import { ANY_PROFESSIONAL_ID } from '../types'

describe('ProfessionalStep', () => {
  it('offers any professional and shows the team specialty without invented descriptions', () => {
    const onSelect = vi.fn()
    const professional = { id: 'p1', nome: 'André', especialidade: 'Barbeiro', horariosTrabalho: [] }
    render(<ProfessionalStep professionals={[professional]} selectedId="p1" isLoading={false} isError={false} onRetry={vi.fn()} onSelect={onSelect} />)

    expect(screen.getByRole('heading', { name: 'Escolha o profissional' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /André/ })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: /André/ })).toHaveTextContent('Barbeiro')
    fireEvent.click(screen.getByRole('button', { name: /Qualquer profissional/ }))
    expect(onSelect).toHaveBeenCalledWith(ANY_PROFESSIONAL_ID)
  })
})
