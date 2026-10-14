import { useEffect, useRef } from 'react'

interface ProfessionalConfirmDialogProps {
  title: string
  description: string
  confirmLabel: string
  cancelLabel?: string
  danger?: boolean
  busy?: boolean
  onCancel: () => void
  onConfirm: () => void
}

export function ProfessionalConfirmDialog({ title, description, confirmLabel, cancelLabel = 'Cancelar', danger = false, busy = false, onCancel, onConfirm }: ProfessionalConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null)
  const confirmRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
    cancelRef.current?.focus()
    return () => previous?.focus()
  }, [])
  return (
    <div className="professional-dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onCancel() }}>
      <section className="professional-dialog" role="dialog" aria-modal="true" aria-labelledby="professional-dialog-title" aria-describedby="professional-dialog-description" onKeyDown={(event) => {
        if (event.key === 'Escape' && !busy) { event.preventDefault(); onCancel() }
        if (event.key === 'Tab') {
          if (event.shiftKey && document.activeElement === cancelRef.current) { event.preventDefault(); confirmRef.current?.focus() }
          else if (!event.shiftKey && document.activeElement === confirmRef.current) { event.preventDefault(); cancelRef.current?.focus() }
        }
      }}>
        <h2 id="professional-dialog-title">{title}</h2>
        <p id="professional-dialog-description">{description}</p>
        <div>
          <button type="button" ref={cancelRef} className="professional-dialog__cancel" disabled={busy} onClick={onCancel}>{cancelLabel}</button>
          <button type="button" ref={confirmRef} className={danger ? 'professional-dialog__confirm is-danger' : 'professional-dialog__confirm'} disabled={busy} onClick={onConfirm}>{busy ? 'Aguarde…' : confirmLabel}</button>
        </div>
      </section>
    </div>
  )
}
