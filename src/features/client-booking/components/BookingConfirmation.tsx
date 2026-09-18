import type { ConfirmedClientBooking } from '../types'

interface BookingConfirmationProps {
  confirmation: ConfirmedClientBooking
  embedded?: boolean
}

function dateLabel(isoDate: string) {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'full' }).format(new Date(isoDate))
}

export function BookingConfirmation({ confirmation, embedded = false }: BookingConfirmationProps) {
  const { appointment, service, professional } = confirmation
  return (
    <main className={`booking-page booking-page--confirmation${embedded ? ' booking-page--embedded' : ''}`}>
      {!embedded && <header className="booking-public-header">
        <div className="brand-lockup" aria-label="Agenda+">
          <span className="brand-mark" aria-hidden="true">+</span>
          <span className="brand-name">Agenda<span>+</span></span>
        </div>
        <span className="edition-label">RESERVA CONFIRMADA</span>
      </header>}
      <section className="booking-confirmation" aria-labelledby="confirmation-title">
        <span className="booking-confirmation__seal" aria-hidden="true">✓</span>
        <p className="eyebrow">TUDO CERTO</p>
        <h1 id="confirmation-title">Seu horário está reservado.</h1>
        <p>Guarde os detalhes deste encontro. O estabelecimento seguirá com a confirmação final.</p>
        <dl>
          <div><dt>Data</dt><dd>{dateLabel(appointment.inicio)}</dd></div>
          <div><dt>Horário</dt><dd>{appointment.inicio.slice(11, 16)}–{appointment.fim.slice(11, 16)}</dd></div>
          <div><dt>Serviço</dt><dd>{service.nome}</dd></div>
          <div><dt>Profissional</dt><dd>{professional.nome}</dd></div>
        </dl>
        <small>PROTOCOLO · {appointment.id}</small>
      </section>
    </main>
  )
}
