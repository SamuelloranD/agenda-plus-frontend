import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ProfessionalsPage } from './ProfessionalsPage'
import { ServicesPage } from './ServicesPage'

const hooks = vi.hoisted(() => ({
  professionals: vi.fn(),
  deleteProfessional: vi.fn(),
  services: vi.fn(),
  deleteService: vi.fn(),
  mutateProfessional: vi.fn(),
  mutateService: vi.fn(),
}))

vi.mock('../features/professionals/hooks/useProfessionals', () => ({
  useProfessionals: hooks.professionals,
  useDeleteProfessional: hooks.deleteProfessional,
}))

vi.mock('../features/services/hooks/useServices', () => ({
  useServices: hooks.services,
  useDeleteService: hooks.deleteService,
}))

const professional = {
  id: 'professional-1',
  nome: 'João Silva',
  especialidade: 'Cabeleireiro',
  horariosTrabalho: [],
}

const service = {
  id: 'service-1',
  nome: 'Corte clássico',
  duracaoMinutos: 45,
  preco: { valor: 80, moeda: 'BRL' },
}

function loadedQuery(data: unknown) {
  return { data, isLoading: false, isError: false, refetch: vi.fn() }
}

beforeEach(() => {
  vi.clearAllMocks()
  hooks.professionals.mockReturnValue(loadedQuery([professional]))
  hooks.services.mockReturnValue(loadedQuery([service]))
  hooks.deleteProfessional.mockReturnValue({ mutate: hooks.mutateProfessional, isPending: false, isError: false })
  hooks.deleteService.mockReturnValue({ mutate: hooks.mutateService, isPending: false, isError: false })
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('catalog deletion confirmations', () => {
  it('does not delete a professional until the destructive action is confirmed', () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false)
    render(<ProfessionalsPage />)

    fireEvent.click(screen.getByRole('button', { name: 'Excluir' }))
    expect(confirm).toHaveBeenCalledWith('Excluir João Silva? Esta ação não pode ser desfeita.')
    expect(hooks.mutateProfessional).not.toHaveBeenCalled()

    confirm.mockReturnValue(true)
    fireEvent.click(screen.getByRole('button', { name: 'Excluir' }))
    expect(hooks.mutateProfessional).toHaveBeenCalledWith('professional-1', expect.any(Object))
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
