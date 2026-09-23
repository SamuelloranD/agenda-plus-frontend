import { useRef, useState } from 'react'
import { CancelAppointmentDialog } from '../../client-appointments/components/CancelAppointmentDialog'
import { isWithinCancellationWindow } from '../../client-appointments/utils/appointmentPresentation'
import { useCancelAgendamento } from '../hooks/useCancelAgendamento'
import { useConfirmAgendamento } from '../hooks/useConfirmAgendamento'
import type { AgendamentoResponse } from '../../../types/scheduling'

interface AppointmentActionsProps {
  appointment: AgendamentoResponse
  serviceName: string
  professionalName: string
}

function errorMessage(error: unknown) {
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') return error.message
  return 'Não foi possível atualizar o agendamento.'
}

export function AppointmentActions({ appointment, serviceName, professionalName }: AppointmentActionsProps) {
  const confirm = useConfirmAgendamento()
  const cancel = useCancelAgendamento()
  const [error, setError] = useState<string | null>(null)
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false)
  const focusFallbackRef = useRef<HTMLDivElement>(null)
  const isPending = confirm.isPending || cancel.isPending

  if (appointment.status === 'CANCELADO' || appointment.status === 'CONCLUIDO') return null

  function handleCancel() {
    if (isPending) return
    setError(null)
    setIsCancelDialogOpen(true)
  }

  async function confirmCancellation() {
    if (isPending) return
    setError(null)
    try {
      await cancel.mutateAsync(appointment.id)
      setIsCancelDialogOpen(false)
    } catch (requestError) {
      setError(errorMessage(requestError))
    }
  }

  function handleConfirm() {
    if (isPending) return
    setError(null)
    confirm.mutate(appointment.id, { onError: (requestError) => setError(errorMessage(requestError)) })
  }

  return <>
  <div ref={focusFallbackRef} className="appointment-actions">
    {appointment.status === 'PENDENTE' && <button type="button" className="appointment-action appointment-action--confirm" onClick={handleConfirm} disabled={isPending}>{confirm.isPending ? 'Confirmando…' : 'Confirmar'}</button>}
    <button type="button" className="appointment-action appointment-action--cancel" onClick={handleCancel} disabled={isPending}>{cancel.isPending ? 'Cancelando…' : 'Cancelar'}</button>
    {error && <small className="appointment-action-error" role="alert">{error}</small>}
  </div>
  {isCancelDialogOpen && <CancelAppointmentDialog focusFallbackRef={focusFallbackRef} appointment={appointment} names={{ serviceName, professionalName }} isPending={cancel.isPending} errorMessage={error} showAdministrativeExceptionWarning={isWithinCancellationWindow(appointment)} onClose={() => { if (!cancel.isPending) setIsCancelDialogOpen(false) }} onConfirm={() => void confirmCancellation()} />}
  </>
}
