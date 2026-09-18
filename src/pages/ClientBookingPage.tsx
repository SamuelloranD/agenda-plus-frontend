import { Link } from 'react-router-dom'
import { BookingAuthPrompt } from '../features/client-booking/components/BookingAuthPrompt'
import { BookingConfirmation } from '../features/client-booking/components/BookingConfirmation'
import { BookingStepper } from '../features/client-booking/components/BookingStepper'
import { BookingSummary } from '../features/client-booking/components/BookingSummary'
import { ProfessionalStep } from '../features/client-booking/components/ProfessionalStep'
import { ServiceStep } from '../features/client-booking/components/ServiceStep'
import { TimeStep } from '../features/client-booking/components/TimeStep'
import { useClientBooking } from '../features/client-booking/hooks/useClientBooking'
import { ANY_PROFESSIONAL_ID } from '../features/client-booking/types'

interface ClientBookingPageProps {
  embedded?: boolean
}

export function ClientBookingPage({ embedded = false }: ClientBookingPageProps) {
  const booking = useClientBooking()
  const { selection } = booking

  if (booking.confirmation) {
    return <BookingConfirmation confirmation={booking.confirmation} embedded={embedded} />
  }

  const assignedProfessional = selection.slot?.candidates.find(({ id }) => id === selection.slot?.profissionalId)
  const chosenProfessional = booking.professionals.find(({ id }) => id === selection.professionalChoice)
  const professionalLabel = assignedProfessional?.nome
    ?? chosenProfessional?.nome
    ?? (selection.professionalChoice === ANY_PROFESSIONAL_ID ? 'Qualquer profissional' : 'A escolher')
  const hasCompleteSelection = Boolean(selection.service && selection.professionalChoice && selection.slot)
  const isClient = booking.session.user?.role === 'CLIENTE'

  return (
    <main className={`booking-page${embedded ? ' booking-page--embedded' : ''}`}>
      {!embedded && <header className="booking-public-header">
        <div className="brand-lockup" aria-label="Agenda+">
          <span className="brand-mark" aria-hidden="true">+</span>
          <span className="brand-name">Agenda<span>+</span></span>
        </div>
        {isClient ? <span className="booking-client-name">Olá, {booking.session.user?.nome}</span> : <Link to="/login?returnTo=%2Fagendar">Entrar</Link>}
      </header>}

      <section className="booking-hero" aria-labelledby="booking-title">
        <div>
          <p className="eyebrow">RESERVA ONLINE · CADERNO DE ATENDIMENTO</p>
          <h1 id="booking-title">Encontre um tempo <em>para você.</em></h1>
        </div>
        <p>Escolha o serviço, quem irá cuidar de você e o melhor momento. O restante fica por nossa conta.</p>
      </section>

      <BookingStepper
        currentStep={booking.step}
        hasService={Boolean(selection.service)}
        hasProfessional={Boolean(selection.professionalChoice)}
        onStepChange={booking.goToStep}
      />

      <div className="booking-layout">
        <div className="booking-workspace">
          {booking.step === 'service' && (
            <ServiceStep
              services={booking.servicesQuery.data ?? []}
              selectedId={selection.service?.id}
              isLoading={booking.servicesQuery.isLoading}
              isError={booking.servicesQuery.isError}
              onRetry={() => void booking.servicesQuery.refetch()}
              onSelect={booking.selectService}
            />
          )}
          {booking.step === 'professional' && (
            <ProfessionalStep
              professionals={booking.professionals}
              selectedId={selection.professionalChoice}
              isLoading={booking.professionalsQuery.isLoading}
              isError={booking.professionalsQuery.isError}
              onRetry={() => void booking.professionalsQuery.refetch()}
              onSelect={booking.selectProfessional}
            />
          )}
          {booking.step === 'time' && (
            <TimeStep
              date={selection.date}
              slots={booking.slots}
              selectedSlot={selection.slot}
              isLoading={booking.availability.isLoading}
              isError={booking.availability.isError}
              onRetry={() => void booking.availability.refetch()}
              onDateChange={booking.selectDate}
              onSelect={booking.selectSlot}
            />
          )}
        </div>

        <aside className="booking-sidebar">
          <BookingSummary
            selection={selection}
            professionalLabel={professionalLabel}
            canConfirm={hasCompleteSelection && isClient}
            isPending={booking.createAppointment.isPending}
            error={booking.createAppointment.error}
            onConfirm={() => void booking.confirmBooking()}
          />
          {hasCompleteSelection && !isClient && (
            <BookingAuthPrompt
              role={booking.session.user?.role}
              isLoading={booking.session.isLoading}
              onSwitchAccount={booking.session.clearSession}
            />
          )}
        </aside>
      </div>
    </main>
  )
}
