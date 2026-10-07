import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ProfessionalForm } from './ProfessionalForm'

const hooks = vi.hoisted(() => ({
  create: { mutate: vi.fn(), isPending: false, error: null },
  update: { mutate: vi.fn(), isPending: false, error: null },
}))

vi.mock('../hooks/useProfessionals', () => ({
  useCreateProfessional: () => hooks.create,
  useUpdateProfessional: () => hooks.update,
}))

afterEach(cleanup)
beforeEach(() => vi.clearAllMocks())

describe('ProfessionalForm image integration', () => {
  it('sends the selected image when creating a professional', async () => {
    render(<ProfessionalForm onDone={vi.fn()} />)
    fireEvent.change(screen.getByPlaceholderText('Nome completo'), { target: { value: 'André' } })
    fireEvent.change(screen.getByPlaceholderText(/Barbeiro/), { target: { value: 'Barbeiro' } })
    fireEvent.change(screen.getByLabelText('Imagem'), {
      target: { files: [new File(['a'], 'andre.jpg', { type: 'image/jpeg' })] },
    })
    await screen.findByAltText('')
    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar profissional' }))

    await waitFor(() => expect(hooks.create.mutate).toHaveBeenCalledWith(
      expect.objectContaining({ imagem: 'data:image/jpeg;base64,YQ==' }),
      expect.any(Object),
    ))
  })
})
