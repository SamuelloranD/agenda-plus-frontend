import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ProfessionalsPage } from './ProfessionalsPage'
import { ServicesPage } from './ServicesPage'

const hooks = vi.hoisted(() => ({
  professionals: vi.fn(), deleteProfessional: vi.fn(), changeProfessionalStatus: vi.fn(),
  services: vi.fn(), deleteService: vi.fn(), mutateProfessional: vi.fn(), mutateService: vi.fn(),
}))

vi.mock('../features/professionals/hooks/useProfessionals', () => ({
  useProfessionals: hooks.professionals,
  useDeleteProfessional: hooks.deleteProfessional,
  useChangeProfessionalStatus: hooks.changeProfessionalStatus,
}))

vi.mock('../features/services/hooks/useServices', () => ({
  useServices: hooks.services,
  useDeleteService: hooks.deleteService,
}))

const professional = { id: 'professional-1', nome: 'João Silva', especialidade: 'Cabeleireiro', imagem: null, horariosTrabalho: [] }
const service = { id: 'service-1', nome: 'Corte clássico', duracaoMinutos: 45, preco: { valor: 80, moeda: 'BRL' } }
function loadedQuery(data: unknown) { return { data, isLoading: false, isError: false, refetch: vi.fn() } }

beforeEach(() => {
  vi.clearAllMocks()
  hooks.professionals.mockReturnValue(loadedQuery([professional]))
  hooks.services.mockReturnValue(loadedQuery([service]))
  hooks.deleteProfessional.mockReturnValue({ mutateAsync: hooks.mutateProfessional, isPending: false, isError: false })
  hooks.changeProfessionalStatus.mockReturnValue({ mutateAsync: vi.fn(), isPending: false })
  hooks.mutateProfessional.mockResolvedValue(undefined)
  hooks.deleteService.mockReturnValue({ mutate: hooks.mutateService, isPending: false, isError: false })
})
afterEach(() => { cleanup(); vi.restoreAllMocks() })

describe('catalog deletion confirmations', () => {
  it('does not delete a professional until the destructive action is confirmed', async () => {
    render(<MemoryRouter><ProfessionalsPage /></MemoryRouter>)
    fireEvent.click(screen.getByRole('button', { name: /Mais ações para/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Excluir profissional' }))
    expect(hooks.mutateProfessional).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(hooks.mutateProfessional).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: /Mais ações para/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Excluir profissional' }))
    fireEvent.click(screen.getByRole('button', { name: 'Excluir profissional' }))
    await waitFor(() => expect(hooks.mutateProfessional).toHaveBeenCalledWith('professional-1'))
  })

  it('does not delete a service until the destructive action is confirmed', () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false)
    render(<ServicesPage />)
    fireEvent.click(screen.getByRole('button', { name: 'Excluir' }))
    expect(confirm).toHaveBeenCalledWith('Excluir Corte clássico? Esta ação não pode ser desfeita.')
    expect(hooks.mutateService).not.toHaveBeenCalled()
    confirm.mockReturnValue(true)
    fireEvent.click(screen.getByRole('button', { name: 'Excluir' }))
    expect(hooks.mutateService).toHaveBeenCalledWith('service-1', expect.any(Object))
  })
})
