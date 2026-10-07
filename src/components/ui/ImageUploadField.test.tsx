import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ImageUploadField } from './ImageUploadField'

afterEach(cleanup)

describe('ImageUploadField', () => {
  it('converts a valid image file into a preview Data URL', async () => {
    const onChange = vi.fn()

    const view = render(<ImageUploadField id="professional-image" label="Imagem" value={null} onChange={onChange} />)
    fireEvent.change(screen.getByLabelText('Imagem'), {
      target: { files: [new File(['a'], 'foto.jpg', { type: 'image/jpeg' })] },
    })

    await waitFor(() => expect(onChange).toHaveBeenCalledWith('data:image/jpeg;base64,YQ=='))
    view.rerender(<ImageUploadField id="professional-image" label="Imagem" value="data:image/jpeg;base64,YQ==" onChange={onChange} />)
    expect(screen.getByAltText('')).toHaveAttribute('src', 'data:image/jpeg;base64,YQ==')
  })

  it('rejects an unsupported file without changing the current image', async () => {
    const onChange = vi.fn()

    render(<ImageUploadField id="service-image" label="Imagem" value="data:image/png;base64,old" onChange={onChange} />)
    fireEvent.change(screen.getByLabelText('Imagem'), {
      target: { files: [new File(['a'], 'icone.svg', { type: 'image/svg+xml' })] },
    })

    expect(await screen.findByRole('alert')).toHaveTextContent('Selecione uma imagem JPG, PNG ou WebP.')
    expect(onChange).not.toHaveBeenCalled()
    expect(screen.getByAltText('')).toHaveAttribute('src', 'data:image/png;base64,old')
  })

  it('removes the current image when requested', () => {
    const onChange = vi.fn()

    render(<ImageUploadField id="service-image" label="Imagem" value="data:image/png;base64,old" onChange={onChange} />)
    fireEvent.click(screen.getByRole('button', { name: 'Remover imagem' }))

    expect(onChange).toHaveBeenCalledWith(null)
  })
})
