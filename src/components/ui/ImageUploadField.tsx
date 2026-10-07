import { useId, useState, type ChangeEvent } from 'react'

export const MAX_IMAGE_BYTES = 2 * 1024 * 1024
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const

interface ImageUploadFieldProps {
  id?: string
  label: string
  value: string | null
  onChange: (value: string | null) => void
  error?: string
}

function acceptedType(type: string): boolean {
  return ACCEPTED_IMAGE_TYPES.includes(type as (typeof ACCEPTED_IMAGE_TYPES)[number])
}

export function ImageUploadField({ id, label, value, onChange, error }: ImageUploadFieldProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const [fileError, setFileError] = useState<string | null>(null)

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    if (!acceptedType(file.type)) {
      setFileError('Selecione uma imagem JPG, PNG ou WebP.')
      return
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setFileError('A imagem deve ter no mÃ¡ximo 2 MiB.')
      return
    }

    setFileError(null)
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') onChange(reader.result)
      else setFileError('NÃ£o foi possÃ­vel ler a imagem selecionada.')
    }
    reader.onerror = () => setFileError('NÃ£o foi possÃ­vel ler a imagem selecionada.')
    reader.readAsDataURL(file)
  }

  return <div className="image-upload-field">
    <label className="image-upload-field__label" htmlFor={inputId}>{label}</label>
    <div className="image-upload-field__content">
      {value ? <img className="image-upload-field__preview" src={value} alt="" /> : <div className="image-upload-field__empty" aria-hidden="true">Sem imagem</div>}
      <div className="image-upload-field__controls">
        <input id={inputId} type="file" accept={ACCEPTED_IMAGE_TYPES.join(',')} onChange={handleFileChange} />
        <small>JPG, PNG ou WebP · mÃ¡ximo 2 MiB.</small>
        {value && <button type="button" className="quiet-action image-upload-field__remove" onClick={() => { setFileError(null); onChange(null) }}>Remover imagem</button>}
      </div>
    </div>
    {(fileError || error) && <small className="field-error" role="alert">{fileError ?? error}</small>}
  </div>
}
