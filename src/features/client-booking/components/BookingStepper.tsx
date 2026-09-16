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

export function BookingStepper({ currentStep, hasService, hasProfessional, onStepChange }: BookingStepperProps) {
  const currentIndex = steps.findIndex(({ id }) => id === currentStep)

  return (
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
  )
}
