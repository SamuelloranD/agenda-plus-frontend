import type { BookingStep } from '../types'

const steps: Array<{ id: BookingStep; label: string }> = [
  { id: 'service', label: 'Serviço' },
  { id: 'professional', label: 'Profissional' },
  { id: 'time', label: 'Data e horário' },
]

interface BookingStepperProps {
  currentStep: BookingStep | 'confirmation'
  hasService: boolean
  hasProfessional: boolean
  onStepChange: (step: BookingStep) => void
  readOnly?: boolean
  finalLabel?: string
}

export function BookingStepper({ currentStep, hasService, hasProfessional, onStepChange, readOnly = false, finalLabel = 'Confirmação' }: BookingStepperProps) {
  const currentIndex = currentStep === 'confirmation' ? 3 : steps.findIndex(({ id }) => id === currentStep)

  return (
    <ol className="booking-stepper" aria-label="Etapas do agendamento">
        {[...steps, { id: 'confirmation' as const, label: finalLabel }].map((step, index) => {
          const disabled = readOnly || (step.id === 'confirmation' && currentStep !== 'confirmation') || (step.id === 'professional' && !hasService) || (step.id === 'time' && !hasProfessional)
          return (
            <li className={`booking-stepper__item${index < currentIndex ? ' booking-stepper__item--done' : ''}${index === currentIndex ? ' booking-stepper__item--active' : ''}`} key={step.id}>
              <button type="button" disabled={disabled} onClick={() => { if (step.id !== 'confirmation') onStepChange(step.id) }} aria-current={step.id === currentStep ? 'step' : undefined} aria-label={step.label}>
                <span className="booking-stepper__number" aria-hidden="true">{index < currentIndex ? '✓' : String(index + 1).padStart(2, '0')}</span>
                <span className="booking-stepper__label">{step.label}</span>
              </button>
            </li>
          )
        })}
    </ol>
  )
}
