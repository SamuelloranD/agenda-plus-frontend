import { ArrowRight, CalendarDays, Clock3, Info, LockKeyhole, Scissors, Tag, UserRound } from 'lucide-react'
import type { ApiError } from '../../../types/api'
import type { BookingStep, ClientBookingSelection } from '../types'

interface BookingSummaryProps {
  step?: BookingStep
  selection: ClientBookingSelection
  professionalLabel: string
  canConfirm: boolean
  isPending: boolean
  error: unknown
  onConfirm: () => void
  onContinue?: () => void
  onEdit?: () => void
}

function dateParts(date: string) {
  return new Date(`${date}T00:00:00Z`)
}

function appointmentErrorMessage(error: unknown) {
  if (typeof error === 'string') return error
  const apiError = error as ApiError | null
  if (apiError?.status === 409) return 'Este horário não está mais disponível. Escolha outra opção.'
  return apiError?.message ?? 'Não foi possível enviar a solicitação. Tente novamente.'
}

export function BookingSummary({ step = 'time', selection, professionalLabel, canConfirm, isPending, error, onConfirm, onContinue, onEdit }: BookingSummaryProps) {
  const date = selection.professionalChoice && (step === 'time' || selection.slot) ? dateParts(selection.date) : null
  const dateLabel = date ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long', timeZone: 'UTC' }).format(date) : 'A escolher'
  const weekday = date ? new Intl.DateTimeFormat('pt-BR', { weekday: 'long', timeZone: 'UTC' }).format(date) : null
  const price = selection.service?.preco
  const priceLabel = price && Number.isFinite(price.valor) ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: price.moeda }).format(price.valor) : 'A consultar'
  const isIntro = step !== 'time'
  const canContinue = step === 'service' ? Boolean(selection.service) : Boolean(selection.professionalChoice)
  const actionLabel = step === 'service' ? 'Escolher profissional' : 'Escolher data e horário'
  const noticeText = step === 'service'
    ? 'Após escolher o serviço, continue para selecionar o profissional.'
    : 'Após escolher o profissional, continue para selecionar a data e o horário.'

  return (
    <section className={`booking-summary${isIntro ? ' booking-summary--intro' : ''}`} aria-labelledby="booking-summary-title">
      <div className="booking-summary__heading"><h2 id="booking-summary-title">Seu agendamento</h2>{step !== 'service' && onEdit && <button type="button" onClick={onEdit}>Editar</button>}</div>
      <div className="booking-summary__details" role="list">
        <div className="booking-summary__item" role="listitem"><span className="booking-summary__icon"><Scissors size={22} /></span><span><span className="booking-summary__label">Serviço</span><strong className="booking-summary__value">{selection.service?.nome ?? 'A escolher'}</strong></span>{isIntro && selection.service && <b className="booking-summary__inline-price">{priceLabel}</b>}</div>
        <div className="booking-summary__item" role="listitem"><span className="booking-summary__icon"><UserRound size={22} /></span><span><span className="booking-summary__label">Profissional</span><strong className="booking-summary__value">{professionalLabel}</strong></span></div>
        <div className="booking-summary__item" role="listitem"><span className="booking-summary__icon"><CalendarDays size={22} /></span><span><span className="booking-summary__label">Data</span><strong className="booking-summary__value">{dateLabel}</strong>{weekday && <small>{weekday.charAt(0).toUpperCase() + weekday.slice(1)}</small>}</span></div>
        <div className="booking-summary__item" role="listitem"><span className="booking-summary__icon"><Clock3 size={22} /></span><span><span className="booking-summary__label">Horário</span><strong className="booking-summary__value">{selection.slot?.inicio.slice(11, 16) ?? 'A escolher'}</strong>{selection.service && (!isIntro || selection.slot) && <small>Duração estimada: {selection.service.duracaoMinutos} minutos</small>}</span></div>
        {!isIntro && <div className="booking-summary__item" role="listitem"><span className="booking-summary__icon"><Tag size={22} /></span><span><span className="booking-summary__label">Valor</span><strong className="booking-summary__value">{priceLabel}</strong></span></div>}
      </div>
      <div className="booking-summary__notice"><Info size={20} aria-hidden="true" /><div><strong>{isIntro ? 'Você ainda não concluiu seu agendamento' : 'Este é um pedido de agendamento'}</strong><p>{isIntro ? noticeText : 'Sua solicitação será enviada ao estabelecimento e ficará aguardando confirmação.'}</p></div></div>
      {Boolean(error) && <p className="booking-confirm-error" role="alert">{appointmentErrorMessage(error)}</p>}
      <button className="booking-confirm" type="button" disabled={isIntro ? !canContinue : !canConfirm || isPending} onClick={isIntro ? onContinue : onConfirm}>{isIntro ? <>{actionLabel}<ArrowRight size={17} aria-hidden="true" /></> : isPending ? 'Enviando solicitação…' : 'Solicitar agendamento'}</button>
      <small className="booking-summary__note"><LockKeyhole size={17} aria-hidden="true" />Seus dados são necessários para processar esta solicitação de agendamento.</small>
    </section>
  )
}
