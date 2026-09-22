import { useState } from 'react'
import { useCancelAgendamento } from '../hooks/useCancelAgendamento'
import { useConfirmAgendamento } from '../hooks/useConfirmAgendamento'
import type { AgendamentoResponse } from '../../../types/scheduling'

interface AppointmentActionsProps {
  appointment: AgendamentoResponse
}

function errorMessage(error: unknown) {
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') return error.message
  return 'Não foi possível atualizar o agendamento.'
}

export function AppointmentActions({ appointment }: AppointmentActionsProps) {
  const confirm = useConfirmAgendamento()
  const cancel = useCancelAgendamento()
  const [error, setError] = useState<string | null>(null)
  const isPending = confirm.isPending || cancel.isPending

  if (appointment.status === 'CANCELADO' || appointment.status === 'CONCLUIDO') return null

  function handleCancel() {
    if (isPending || !window.confirm('Cancelar este agendamento? Esta ação não pode ser desfeita.')) return
    setError(null)
    cancel.mutate(appointment.id, { onError: (requestError) => setError(errorMessage(requestError)) })
  }

  function handleConfirm() {
    if (isPending) return
    setError(null)
    confirm.mutate(appointment.id, { onError: (requestError) => setError(errorMessage(requestError)) })
  }

  return <div className="appointment-actions">
    {appointment.status === 'PENDENTE' && <button type="button" className="appointment-action appointment-action--confirm" onClick={handleConfirm} disabled={isPending}>{confirm.isPending ? 'Confirmando…' : 'Confirmar'}</button>}
    <button type="button" className="appointment-action appointment-action--cancel" onClick={handleCancel} disabled={isPending}>{cancel.isPending ? 'Cancelando…' : 'Cancelar'}</button>
    {error && <small className="appointment-action-error" role="alert">{error}</small>}
  </div>
}
