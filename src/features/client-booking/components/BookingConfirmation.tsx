import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, Copy } from 'lucide-react'
import type { ConfirmedClientBooking } from '../types'
import { BookingStepper } from './BookingStepper'

interface BookingConfirmationProps {
  confirmation: ConfirmedClientBooking
  embedded?: boolean
  onStartOver?: () => void
}

function dateLabel(isoDate: string) {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'full', timeZone: 'UTC' }).format(new Date(`${isoDate.slice(0, 10)}T00:00:00Z`))
}

export function BookingConfirmation({ confirmation, embedded = false, onStartOver }: BookingConfirmationProps) {
  const { appointment, service, professional } = confirmation
  const [copied, setCopied] = useState(false)
  const isPending = appointment.status === 'PENDENTE'
  const resultTitle = isPending ? 'Aguardando confirmação do estabelecimento.' : 'Seu horário está confirmado.'
  const price = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: service.preco.moeda }).format(service.preco.valor)

  async function copyProtocol() {
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(appointment.id)
      else {
        const input = document.createElement('textarea')
        input.value = appointment.id
        input.style.position = 'fixed'
        input.style.opacity = '0'
        document.body.appendChild(input)
        try {
          input.select()
          if (!document.execCommand?.('copy')) return
        } finally {
          input.remove()
        }
      }
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  return (
    <main className={`booking-page booking-page--confirmation${embedded ? ' booking-page--embedded' : ''}`}>
      {!embedded && <header className="booking-public-header"><div className="brand-lockup" aria-label="Agenda+"><span className="brand-mark" aria-hidden="true">+</span><span className="brand-name">Agenda<span>+</span></span></div><h1>Novo agendamento</h1></header>}
      <BookingStepper currentStep="confirmation" hasService hasProfessional onStepChange={() => {}} readOnly finalLabel={isPending ? 'Pedido enviado' : 'Confirmado'} />
      <section className="booking-confirmation" aria-labelledby="confirmation-title">
        <span className="booking-confirmation__seal" aria-hidden="true"><Check size={31} strokeWidth={1.8} /></span>
        <p className="eyebrow">{isPending ? 'SOLICITAÇÃO ENVIADA' : 'AGENDAMENTO CONFIRMADO'}</p>
        {embedded ? <h2 id="confirmation-title">{resultTitle}</h2> : <h1 id="confirmation-title">{resultTitle}</h1>}
        <p>{isPending ? 'O estabelecimento recebeu seu pedido. O atendimento ainda depende de confirmação. Acompanhe o status em Meus agendamentos.' : 'Guarde os detalhes deste agendamento.'}</p>
        <dl className="booking-confirmation__details">
          <div><dt>Serviço</dt><dd>{service.nome}</dd><strong>{price}</strong></div>
          <div><dt>Profissional</dt><dd>{professional.nome}</dd></div>
          <div><dt>Data</dt><dd>{dateLabel(appointment.inicio)}</dd></div>
          <div><dt>Horário</dt><dd>{appointment.inicio.slice(11, 16)} – {appointment.fim.slice(11, 16)} <span>({service.duracaoMinutos} minutos)</span></dd></div>
        </dl>
        <div className="booking-confirmation__protocol"><span>Protocolo</span><code>{appointment.id}</code><button type="button" aria-label={copied ? 'Protocolo copiado' : 'Copiar protocolo'} onClick={() => void copyProtocol()}>{copied ? <Check size={17} /> : <Copy size={17} />}</button></div>
        <div className="booking-confirmation__actions"><Link to="/meus-agendamentos">Ver meus agendamentos</Link><button type="button" onClick={onStartOver}>Fazer outro agendamento</button></div>
      </section>
    </main>
  )
}
