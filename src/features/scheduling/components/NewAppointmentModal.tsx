import { X } from 'lucide-react'
import { useEffect, type ReactNode } from 'react'

interface NewAppointmentModalProps {
  children: ReactNode
  isOpen?: boolean
  onClose?: () => void
}

export function NewAppointmentModal({ children, isOpen = false, onClose }: NewAppointmentModalProps) {
  useEffect(() => {
    if (!isOpen) return

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose?.()
    }

    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [isOpen, onClose])

  if (!isOpen) return <section className="appointment-folio" aria-labelledby="new-appointment-title">{children}</section>

  return (
    <div className="appointment-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose?.() }}>
      <section className="appointment-folio appointment-modal" role="dialog" aria-modal="true" aria-label="Nova folha de atendimento">
        <button type="button" className="appointment-modal__close" aria-label="Fechar folha de atendimento" onClick={() => onClose?.()}>
          <X size={22} strokeWidth={2.5} aria-hidden="true" />
        </button>
        {children}
      </section>
    </div>
  )
}
