import type { BookingStep } from '../types'

const steps: Array<{ id: BookingStep; label: string }> = [
  { id: 'service', label: 'Serviço' },
  { id: 'professional', label: 'Profissional' },
  { id: 'time', label: 'Data e horário' },
]

interface BookingStepperProps {
  currentStep: BookingStep
  hasService: boolean
  hasProfessional: boolean
  onStepChange: (step: BookingStep) => void
}

const bookingTypographyStyles = `
@media (max-width: 980px) {
  .booking-editorial h1 { font-size: clamp(30px, 5.2vw, 40px); line-height: 1.05; }
  .booking-editorial .section-label { font-size: clamp(9px, 1.2vw, 10px); line-height: 1.3; }
  .booking-editorial > p:last-child { font-size: clamp(12px, 1.6vw, 14px); line-height: 1.5; }
  .booking-step__header h2 { font-size: clamp(27px, 4.5vw, 36px); line-height: 1.08; }
  .booking-step__header > p:last-child { font-size: clamp(12px, 1.6vw, 14px); line-height: 1.5; }
  .booking-choice strong { font-size: 18px; line-height: 1.18; }
  .booking-choice > span:not(.booking-choice__mark, .booking-choice__avatar) { font-size: 12px; line-height: 1.45; }
  .booking-choice small { font-size: 11px; line-height: 1.3; }
  .booking-time strong { font-size: 16px; line-height: 1.1; }
  .booking-time span, .booking-time small { font-size: 9px; line-height: 1.3; }
}

@media (max-width: 620px) {
  .booking-editorial h1 { font-size: clamp(29px, 8.2vw, 36px); }
  .booking-editorial > p:last-child { font-size: 12px; }
  .booking-step__header h2 { font-size: clamp(25px, 7vw, 32px); }
  .booking-step__header > p:last-child { font-size: 12px; }
  .booking-choice strong { font-size: 17px; }
  .booking-time strong { font-size: 15px; }
}
`

export function BookingStepper({ currentStep, hasService, hasProfessional, onStepChange }: BookingStepperProps) {
  const currentIndex = steps.findIndex(({ id }) => id === currentStep)

  return (
    <>
      <style>{bookingTypographyStyles}</style>
      <ol className="booking-stepper" aria-label="Etapas do agendamento">
        {steps.map((step, index) => {
          const disabled = (step.id === 'professional' && !hasService) || (step.id === 'time' && !hasProfessional)
          return (
            <li className={index <= currentIndex ? 'booking-stepper__item booking-stepper__item--active' : 'booking-stepper__item'} key={step.id}>
              <button type="button" disabled={disabled} onClick={() => onStepChange(step.id)} aria-current={step.id === currentStep ? 'step' : undefined}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                {step.label}
              </button>
            </li>
          )
        })}
      </ol>
    </>
  )
}
