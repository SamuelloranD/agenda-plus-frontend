import { cleanup, render, screen, waitFor } from '@testing-library/react'
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

describe('ServiceForm', () => {
  it('does not render an image field or submit image data', async () => {
    render(<ServiceForm service={{ id: 'service-1', nome: 'Corte', duracaoMinutos: 30, preco: { valor: 50, moeda: 'BRL' } }} onDone={vi.fn()} />)

    expect(screen.queryByLabelText('Imagem')).not.toBeInTheDocument()
    screen.getByRole('button', { name: 'Salvar alterações' }).click()

    await waitFor(() => expect(hooks.update.mutate).toHaveBeenCalledWith(
      { id: 'service-1', input: { nome: 'Corte', duracaoMinutos: 30, preco: { valor: 50, moeda: 'BRL' } } },
      expect.any(Object),
    ))
  })
})
