import { EmptyState } from '../../../components/ui/EmptyState'
import { ErrorState } from '../../../components/ui/ErrorState'
import { LoadingState } from '../../../components/ui/LoadingState'
import type { ProfissionalResponse } from '../../../types/professionals'
import { ANY_PROFESSIONAL_ID } from '../types'

interface ProfessionalStepProps {
  professionals: ProfissionalResponse[]
  selectedId: string | null
  isLoading: boolean
  isError: boolean
  onRetry: () => void
  onSelect: (professionalId: string) => void
}

export function ProfessionalStep({ professionals, selectedId, isLoading, isError, onRetry, onSelect }: ProfessionalStepProps) {
  return (
    <section className="booking-step" aria-labelledby="professional-step-title">
      <header className="booking-step__header">
        <p className="eyebrow">QUEM CUIDA</p>
        <h2 id="professional-step-title">Com quem?</h2>
        <p>Escolha alguém da casa ou deixe que a agenda encontre o primeiro horário livre.</p>
      </header>
      {isLoading && <LoadingState message="Conhecendo os profissionais…" />}
      {isError && <ErrorState message="Não foi possível carregar os profissionais." onRetry={onRetry} />}
      {!isLoading && !isError && professionals.length === 0 && <EmptyState message="Ainda não há profissionais disponíveis para reserva." />}
      {professionals.length > 0 && (
        <div className="booking-card-grid booking-card-grid--professionals">
          <button
            className={selectedId === ANY_PROFESSIONAL_ID ? 'booking-choice booking-choice--selected booking-choice--any' : 'booking-choice booking-choice--any'}
            type="button"
            onClick={() => onSelect(ANY_PROFESSIONAL_ID)}
            aria-pressed={selectedId === ANY_PROFESSIONAL_ID}
          >
            <strong>Qualquer profissional</strong>
            <span>Mostra os horários de toda a equipe</span>
            <small>Encontrar a primeira disponibilidade</small>
          </button>
          {professionals.map((professional) => (
            <button
              className={selectedId === professional.id ? 'booking-choice booking-choice--selected' : 'booking-choice'}
              type="button"
              key={professional.id}
              onClick={() => onSelect(professional.id)}
              aria-pressed={selectedId === professional.id}
            >
              <span className="booking-choice__avatar" aria-hidden="true">{professional.nome.slice(0, 1).toUpperCase()}</span>
              <strong>{professional.nome}</strong>
              <span>{professional.especialidade}</span>
              <small>Ver horários</small>
            </button>
          ))}
        </div>
      )}
    </section>
  )
}
