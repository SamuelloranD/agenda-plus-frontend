import { Check, UsersRound } from 'lucide-react'
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
    <section className="booking-step booking-professional-step" aria-labelledby="professional-step-title">
      <header className="booking-step__header">
        <p className="eyebrow">PASSO 2 DE 4</p>
        <h2 id="professional-step-title">Escolha o profissional</h2>
        <p>Selecione um profissional da equipe ou deixe que a gente encontre o primeiro horário disponível.</p>
      </header>
      {isLoading && <LoadingState message="Carregando os profissionais…" />}
      {isError && <ErrorState message="Não foi possível carregar os profissionais." onRetry={onRetry} />}
      {!isLoading && !isError && professionals.length === 0 && <EmptyState message="Ainda não há profissionais disponíveis para reserva." />}
      {!isLoading && !isError && professionals.length > 0 && <div className="booking-professional-options">
        <button
          className={`booking-choice booking-choice--any booking-professional-any${selectedId === ANY_PROFESSIONAL_ID ? ' booking-choice--selected' : ''}`}
          type="button"
          onClick={() => onSelect(ANY_PROFESSIONAL_ID)}
          aria-pressed={selectedId === ANY_PROFESSIONAL_ID}
        >
          <UsersRound size={30} strokeWidth={1.7} aria-hidden="true" />
          <span className="booking-professional-any__copy"><strong>Qualquer profissional</strong><small>Sem preferência de profissional. Veja os horários disponíveis da equipe.</small></span>
          <span className="booking-choice__indicator" aria-hidden="true">{selectedId === ANY_PROFESSIONAL_ID && <Check size={14} strokeWidth={2.8} />}</span>
        </button>
        <div className="booking-card-grid booking-card-grid--professionals">
          {professionals.map((professional) => {
            const selected = selectedId === professional.id
            return <button
              className={`booking-choice booking-professional-choice${selected ? ' booking-choice--selected' : ''}`}
              type="button"
              key={professional.id}
              onClick={() => onSelect(professional.id)}
              aria-pressed={selected}
            >
              {professional.imagem ? <img className="booking-choice__avatar" src={professional.imagem} alt="" /> : <span className="booking-choice__avatar" aria-hidden="true">{professional.nome.slice(0, 1).toUpperCase()}</span>}
              <span className="booking-choice__indicator" aria-hidden="true">{selected && <Check size={14} strokeWidth={2.8} />}</span>
              <strong>{professional.nome}</strong>
              <span className="booking-professional-choice__specialty">{professional.especialidade}</span>
            </button>
          })}
        </div>
      </div>}
    </section>
  )
}
