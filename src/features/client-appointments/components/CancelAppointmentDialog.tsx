import { useEffect, useRef } from 'react'
import type { AgendamentoResponse } from '../../../types/scheduling'
import {
  formatAppointmentDate,
  formatAppointmentTimeRange,
  type ClientAppointmentNames,
} from '../utils/appointmentPresentation'

interface CancelAppointmentDialogProps {
  appointment: AgendamentoResponse
  names: ClientAppointmentNames
  isPending: boolean
  errorMessage: string | null
  onClose: () => void
  onConfirm: () => void
}

export function CancelAppointmentDialog({
  appointment,
  names,
  isPending,
  errorMessage,
  onClose,
  onConfirm,
}: CancelAppointmentDialogProps) {
  const dialogRef = useRef<HTMLElement>(null)
  const cancelButtonRef = useRef<HTMLButtonElement>(null)
  const previouslyFocusedElement = useRef<HTMLElement | null>(null)

  useEffect(() => {
    previouslyFocusedElement.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    cancelButtonRef.current?.focus()
    return () => previouslyFocusedElement.current?.focus()
  }, [])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !isPending) onClose()
      if (event.key !== 'Tab') return

      const focusableElements = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])',
      ) ?? [])
      if (focusableElements.length === 0) {
        event.preventDefault()
        return
      }

      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]
      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault()
        lastElement.focus()
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault()
        firstElement.focus()
      } else if (!dialogRef.current?.contains(document.activeElement)) {
        event.preventDefault()
        firstElement.focus()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isPending, onClose])

  return (
    <div className="cancel-dialog-backdrop">
      <section
        ref={dialogRef}
        className="cancel-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cancel-dialog-title"
        aria-describedby="cancel-dialog-description"
      >
        <p className="section-label">Revisar solicitação</p>
        <h2 id="cancel-dialog-title">Cancelar agendamento</h2>
        <p id="cancel-dialog-description">Confirme os dados antes de cancelar. Esta ação não poderá ser desfeita.</p>
        <dl>
          <div><dt>Serviço</dt><dd>{names.serviceName}</dd></div>
          <div><dt>Profissional</dt><dd>{names.professionalName}</dd></div>
          <div><dt>Data</dt><dd>{formatAppointmentDate(appointment.inicio)}</dd></div>
          <div><dt>Horário</dt><dd>{formatAppointmentTimeRange(appointment.inicio, appointment.fim)}</dd></div>
        </dl>
        {errorMessage && <p className="cancel-dialog__error" role="alert">{errorMessage}</p>}
        <footer>
          <button ref={cancelButtonRef} className="quiet-action" type="button" disabled={isPending} onClick={onClose}>Voltar</button>
          <button className="danger-action" type="button" disabled={isPending} onClick={onConfirm}>
            {isPending ? 'Cancelando…' : 'Confirmar cancelamento'}
          </button>
        </footer>
      </section>
    </div>
  )
}
