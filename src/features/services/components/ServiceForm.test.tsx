import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ServiceForm } from './ServiceForm'

const hooks = vi.hoisted(() => ({
  create: { mutate: vi.fn(), isPending: false, error: null },
  update: { mutate: vi.fn(), isPending: false, error: null },
}))

vi.mock('../hooks/useServices', () => ({
  useCreateService: () => hooks.create,
  useUpdateService: () => hooks.update,
}))

afterEach(cleanup)
beforeEach(() => vi.clearAllMocks())

describe('ServiceForm image integration', () => {
  it('sends null when removing an existing service image', async () => {
    render(<ServiceForm service={{ id: 'service-1', nome: 'Corte', duracaoMinutos: 30, preco: { valor: 50, moeda: 'BRL' }, imagem: 'data:image/png;base64,old' }} onDone={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Remover imagem' }))
    fireEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }))

    await waitFor(() => expect(hooks.update.mutate).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'service-1', input: expect.objectContaining({ imagem: null }) }),
      expect.any(Object),
    ))
  })
})
