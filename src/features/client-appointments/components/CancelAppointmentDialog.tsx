import { useEffect, useRef, type RefObject } from 'react'
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
  focusFallbackRef: RefObject<HTMLElement | null>
  showAdministrativeExceptionWarning?: boolean
}

export function CancelAppointmentDialog({
  appointment,
  names,
  isPending,
  errorMessage,
  onClose,
  onConfirm,
  focusFallbackRef,
  showAdministrativeExceptionWarning = false,
}: CancelAppointmentDialogProps) {
  const dialogRef = useRef<HTMLElement>(null)
  const cancelButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const fallback = focusFallbackRef.current
    cancelButtonRef.current?.focus()
    return () => {
      const target = opener?.isConnected ? opener : fallback
      if (target?.isConnected) target.focus()
    }
  }, [focusFallbackRef])

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
      <style>{cancelDialogStyles}</style>
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
        {showAdministrativeExceptionWarning && <p className="cancel-dialog__warning" role="alert">Este agendamento está dentro da janela de 24 horas de antecedência. Cancelar mesmo assim?</p>}
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

const cancelDialogStyles = `
.cancel-dialog__warning{margin:18px 0;padding:12px 14px;color:var(--ink);background:#f6eddc;border-left:3px solid var(--mustard);font-size:12px;line-height:1.5}
.cancel-dialog-backdrop{position:fixed;inset:0;z-index:20;display:grid;place-items:center;padding:20px;background:rgb(31 31 30 / 68%);animation:cancel-dialog-fade .16s ease-out}.cancel-dialog{width:min(100%,520px);max-height:calc(100svh - 40px);overflow:auto;padding:clamp(26px,5vw,42px);background:var(--paper);border:1px solid var(--line);box-shadow:0 24px 70px rgb(31 31 30 / 32%);animation:cancel-dialog-rise .18s ease-out}.cancel-dialog-backdrop:focus{outline:none}.cancel-dialog h2{margin:8px 0 0;font:500 36px/1.1 'Newsreader',Georgia,serif}.cancel-dialog>p:not(.section-label,.cancel-dialog__error,.cancel-dialog__warning){margin:14px 0 0;color:var(--muted-ink);font-size:13px;line-height:1.65}.cancel-dialog dl{margin:26px 0}.cancel-dialog dl div{display:grid;grid-template-columns:100px 1fr;gap:15px;padding:11px 0;border-bottom:1px solid var(--line)}.cancel-dialog dt{color:var(--muted-ink);font-size:9px;font-weight:700;letter-spacing:.1em;text-transform:uppercase}.cancel-dialog dd{margin:0;font-size:13px;font-weight:600}.cancel-dialog__error{margin:0 0 18px;padding:11px 13px;color:#8f2f21;background:#fff2ed;border-left:3px solid var(--terracotta);font-size:12px;line-height:1.5}.cancel-dialog footer{display:flex;justify-content:flex-end;gap:10px}.cancel-dialog footer button:disabled{cursor:wait;opacity:.65}@keyframes cancel-dialog-fade{from{opacity:0}to{opacity:1}}@keyframes cancel-dialog-rise{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}@media(prefers-reduced-motion:reduce){.cancel-dialog-backdrop,.cancel-dialog{animation:none}}
`
