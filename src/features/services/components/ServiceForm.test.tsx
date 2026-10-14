import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
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
    const router = createMemoryRouter([{ path: '/', element: <ServiceForm service={{ id: 'service-1', nome: 'Corte', duracaoMinutos: 30, preco: { valor: 50, moeda: 'BRL' } }} onDone={vi.fn()} /> }])
    render(<RouterProvider router={router} />)

    expect(screen.queryByLabelText('Imagem')).not.toBeInTheDocument()
    screen.getByRole('button', { name: 'Salvar alterações' }).click()

    await waitFor(() => expect(hooks.update.mutate).toHaveBeenCalledWith(
      { id: 'service-1', input: { nome: 'Corte', descricao: '', ativo: true, duracaoMinutos: 30, preco: { valor: 50, moeda: 'BRL' } } },
      expect.any(Object),
    ))
  })

  it('protects unsaved changes when navigation leaves the editor', async () => {
    const router = createMemoryRouter([
      { path: '/', element: <ServiceForm onDone={vi.fn()} /> },
      { path: '/away', element: <p>Outra página</p> },
    ])
    render(<RouterProvider router={router} />)
    fireEvent.change(screen.getByPlaceholderText('Ex.: Corte de cabelo'), { target: { value: 'Barba' } })
    void router.navigate('/away')
    expect(await screen.findByRole('dialog', { name: 'Descartar alterações?' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Continuar editando' }))
    expect(screen.getByRole('dialog', { name: 'Novo serviço' })).toBeInTheDocument()
    void router.navigate('/away')
    fireEvent.click(await screen.findByRole('button', { name: 'Descartar alterações' }))
    expect(await screen.findByText('Outra página')).toBeInTheDocument()
  })
})
