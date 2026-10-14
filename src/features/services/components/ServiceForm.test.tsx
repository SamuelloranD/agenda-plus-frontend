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
  it.each([
    ['novo', undefined],
    ['edição', { id: 'service-1', nome: 'Barba', descricao: '', duracaoMinutos: 30, preco: { valor: 60, moeda: 'BRL' } }],
  ])('confirma o descarte ao cancelar no modo %s', async (_mode, service) => {
    const onCancel = vi.fn()
    const router = createMemoryRouter([{ path: '/', element: <ServiceForm service={service} onDone={vi.fn()} onCancel={onCancel} /> }])
    render(<RouterProvider router={router} />)
    fireEvent.change(screen.getByPlaceholderText('Descreva o serviço...'), { target: { value: 'Alterado' } })
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(screen.getByRole('dialog', { name: 'Descartar alterações?' })).toBeInTheDocument()
    expect(onCancel).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Continuar editando' }))
    expect(screen.getByRole('dialog', { name: service ? 'Editar serviço' : 'Novo serviço' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    fireEvent.click(screen.getByRole('button', { name: 'Descartar alterações' }))
    expect(onCancel).toHaveBeenCalledOnce()
  })

  it('envia o valor numérico após digitação monetária da direita para a esquerda', async () => {
    const router = createMemoryRouter([{ path: '/', element: <ServiceForm onDone={vi.fn()} /> }])
    render(<RouterProvider router={router} />)
    fireEvent.change(screen.getByPlaceholderText('Ex.: Corte de cabelo'), { target: { value: 'Barba' } })
    const price = screen.getByRole('textbox', { name: /Preço \(R\$\)/ })
    for (const digit of '123456') fireEvent.change(price, { target: { value: `${(price as HTMLInputElement).value}${digit}` } })
    expect(price).toHaveValue('1.234,56')
    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar serviço' }))
    await waitFor(() => expect(hooks.create.mutate).toHaveBeenCalledWith(expect.objectContaining({ preco: { valor: 1234.56, moeda: 'BRL' } }), expect.any(Object)))
  })
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
