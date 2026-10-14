import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ProfessionalList } from './ProfessionalList'

afterEach(cleanup)

const professional = {
  id: 'professional-1', nome: 'André Silva', especialidade: 'Barbeiro', imagem: null, ativo: true,
  horariosTrabalho: [
    { diaSemana: 'MONDAY', inicio: '08:00:00', fim: '12:00:00' },
    { diaSemana: 'MONDAY', inicio: '13:00:00', fim: '17:00:00' },
    { diaSemana: 'TUESDAY', inicio: '08:00:00', fim: '12:00:00' },
    { diaSemana: 'TUESDAY', inicio: '13:00:00', fim: '17:00:00' },
  ],
}

describe('ProfessionalList', () => {
  it('shows real status, image fallback, grouped hours and card actions', () => {
    const onEdit = vi.fn()
    const onAgenda = vi.fn()
    const onToggleStatus = vi.fn()
    render(<ProfessionalList professionals={[professional]} onNew={vi.fn()} onEdit={onEdit} onAgenda={onAgenda} onToggleStatus={onToggleStatus} onDelete={vi.fn()} />)
    expect(screen.getByText('AS')).toBeInTheDocument()
    expect(screen.getByText('Ativo')).toBeInTheDocument()
    expect(screen.getByText(/Seg–Ter · 08:00–12:00 e 13:00–17:00/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Ver agenda' }))
    expect(onAgenda).toHaveBeenCalledWith(professional)
    fireEvent.click(screen.getByRole('button', { name: 'Editar' }))
    expect(onEdit).toHaveBeenCalledWith(professional)
    fireEvent.click(screen.getByRole('button', { name: /Mais ações para André Silva/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Desativar profissional' }))
    expect(onToggleStatus).toHaveBeenCalledWith(professional)
  })
})
