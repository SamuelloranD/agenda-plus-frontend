import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ProfessionalForm } from './ProfessionalForm'

const hooks = vi.hoisted(() => ({
  create: { mutateAsync: vi.fn(), isPending: false },
  update: { mutateAsync: vi.fn(), isPending: false },
}))

vi.mock('../hooks/useProfessionals', () => ({
  useCreateProfessional: () => hooks.create,
  useUpdateProfessional: () => hooks.update,
}))

afterEach(cleanup)
beforeEach(() => {
  vi.clearAllMocks()
  hooks.create.mutateAsync.mockResolvedValue({})
  hooks.update.mutateAsync.mockResolvedValue({})
})

describe('ProfessionalForm', () => {
  it('submits a new professional without invented work hours and with the selected photo', async () => {
    const done = vi.fn()
    render(<ProfessionalForm onDone={done} onCancel={vi.fn()} />)
    fireEvent.change(screen.getByRole('textbox', { name: /Nome/ }), { target: { value: 'Andre' } })
    fireEvent.change(screen.getByRole('textbox', { name: /Especialidade/ }), { target: { value: 'Barbeiro' } })
    fireEvent.change(screen.getByLabelText('Foto do profissional'), {
      target: { files: [new File(['a'], 'andre.jpg', { type: 'image/jpeg' })] },
    })
    await waitFor(() => expect(screen.getByAltText('')).toHaveAttribute('src', 'data:image/jpeg;base64,YQ=='))
    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar profissional' }))
    await waitFor(() => expect(hooks.create.mutateAsync).toHaveBeenCalledWith(expect.objectContaining({
      nome: 'Andre', especialidade: 'Barbeiro', imagem: 'data:image/jpeg;base64,YQ==', ativo: true, horariosTrabalho: [],
    })))
    expect(done).toHaveBeenCalled()
  })

  it('keeps two periods when copying a day to another day', () => {
    render(<ProfessionalForm onDone={vi.fn()} onCancel={vi.fn()} />)
    fireEvent.click(screen.getByRole('switch', { name: /Atendimento na segunda-feira/ }))
    fireEvent.change(screen.getByLabelText(/Início da segunda-feira, período 1/), { target: { value: '08:00' } })
    fireEvent.change(screen.getByLabelText(/Fim da segunda-feira, período 1/), { target: { value: '12:00' } })
    fireEvent.click(screen.getByRole('button', { name: /Adicionar período de atendimento à segunda-feira/ }))
    fireEvent.change(screen.getByLabelText(/Início da segunda-feira, período 2/), { target: { value: '13:00' } })
    fireEvent.change(screen.getByLabelText(/Fim da segunda-feira, período 2/), { target: { value: '17:00' } })
    fireEvent.click(screen.getByRole('button', { name: 'Copiar semana' }))
    const panel = screen.getByRole('group', { name: 'Copiar horários para outros dias' })
    fireEvent.click(within(panel).getByRole('checkbox', { name: 'Terça-feira' }))
    fireEvent.click(within(panel).getByRole('button', { name: 'Copiar horários' }))
    expect(screen.getByLabelText(/Início da terça-feira, período 1/)).toHaveValue('08:00')
    expect(screen.getByLabelText(/Fim da terça-feira, período 2/)).toHaveValue('17:00')
  })

  it('keeps the photo and status changes in the draft until save', () => {
    const onCancel = vi.fn()
    render(<ProfessionalForm onDone={vi.fn()} onCancel={onCancel} professional={{
      id: 'person-1', nome: 'André', especialidade: 'Barbeiro', imagem: 'data:image/jpeg;base64,YQ==', ativo: true, horariosTrabalho: [],
    }} />)
    fireEvent.click(screen.getByRole('button', { name: 'Remover' }))
    fireEvent.click(screen.getByRole('switch', { name: 'Ativo' }))
    expect(screen.queryByAltText('')).not.toBeInTheDocument()
    expect(screen.getByText('Inativo')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(onCancel).toHaveBeenCalled()
    expect(hooks.update.mutateAsync).not.toHaveBeenCalled()
  })

  it('asks to review future bookings that fall outside changed hours', async () => {
    const nextMonday = new Date()
    nextMonday.setDate(nextMonday.getDate() + ((8 - nextMonday.getDay()) % 7 || 7))
    const date = `${nextMonday.getFullYear()}-${String(nextMonday.getMonth() + 1).padStart(2, '0')}-${String(nextMonday.getDate()).padStart(2, '0')}`
    render(<ProfessionalForm onDone={vi.fn()} onCancel={vi.fn()} professional={{
      id: 'person-1', nome: 'André', especialidade: 'Barbeiro', imagem: null, ativo: true,
      horariosTrabalho: [{ diaSemana: 'MONDAY', inicio: '08:00:00', fim: '12:00:00' }],
    }} appointments={[{ id: 'booking-1', inicio: `${date}T09:00:00`, fim: `${date}T09:30:00`, profissionalId: 'person-1', clienteId: 'client-1', servicoId: 'service-1', status: 'CONFIRMADO' }]} />)
    fireEvent.click(screen.getByRole('switch', { name: /Atendimento na segunda-feira/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }))
    expect(await screen.findByRole('dialog', { name: 'Revisar impacto nos agendamentos' })).toHaveTextContent('1 agendamento(s) futuro(s)')
    expect(hooks.update.mutateAsync).not.toHaveBeenCalled()
  })
})
