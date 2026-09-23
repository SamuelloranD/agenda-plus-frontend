import type { ApiError } from '../../../types/api'
import type { ClientBookingSelection } from '../types'

interface BookingSummaryProps {
  selection: ClientBookingSelection
  professionalLabel: string
  canConfirm: boolean
  isPending: boolean
  error: unknown
  onConfirm: () => void
}

function dateLabel(date: string) {
  if (!date) return 'A escolher'
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(new Date(`${date}T12:00:00`))
}

function appointmentErrorMessage(error: unknown) {
  const apiError = error as ApiError | null
  if (apiError?.status === 409) return 'Este horário acabou de ser reservado. Escolha outro horário.'
  return apiError?.message ?? 'Não foi possível confirmar o agendamento. Tente novamente.'
}

export function BookingSummary({ selection, professionalLabel, canConfirm, isPending, error, onConfirm }: BookingSummaryProps) {
  return (
    <section className="booking-summary" aria-labelledby="booking-summary-title">
      <p className="eyebrow">SEU AGENDAMENTO</p>
      <h2 id="booking-summary-title">Resumo da reserva</h2>
      <dl>
        <div><dt>Serviço</dt><dd>{selection.service?.nome ?? 'A escolher'}</dd></div>
        <div><dt>Profissional</dt><dd>{professionalLabel}</dd></div>
        <div><dt>Data</dt><dd>{selection.professionalChoice ? dateLabel(selection.date) : 'A escolher'}</dd></div>
        <div><dt>Horário</dt><dd>{selection.slot ? `${selection.slot.inicio.slice(11, 16)}–${selection.slot.fim.slice(11, 16)}` : 'A escolher'}</dd></div>
      </dl>
      {Boolean(error) && <p className="booking-confirm-error" role="alert">{appointmentErrorMessage(error)}</p>}
      {canConfirm && (
        <button className="booking-confirm" type="button" disabled={isPending} onClick={onConfirm}>
          {isPending ? 'Confirmando…' : 'Confirmar agendamento'}
        </button>
      )}
      <small className="booking-summary__note">O horário será registrado como pendente até a confirmação do estabelecimento.</small>
    </section>
  )
}
