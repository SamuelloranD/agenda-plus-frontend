import { EmptyState } from '../../../components/ui/EmptyState'
import { ErrorState } from '../../../components/ui/ErrorState'
import { LoadingState } from '../../../components/ui/LoadingState'
import type { ServicoResponse } from '../../../types/services'

interface ServiceStepProps {
  services: ServicoResponse[]
  selectedId?: string
  isLoading: boolean
  isError: boolean
  onRetry: () => void
  onSelect: (service: ServicoResponse) => void
}

function formatPrice(service: ServicoResponse) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: service.preco.moeda,
  }).format(service.preco.valor)
}

export function ServiceStep({ services, selectedId, isLoading, isError, onRetry, onSelect }: ServiceStepProps) {
  return (
    <section className="booking-step" aria-labelledby="service-step-title">
      <header className="booking-step__header">
        <p className="eyebrow">PRIMEIRO GESTO</p>
        <h2 id="service-step-title">O que você deseja agendar?</h2>
        <p>Escolha o cuidado que melhor combina com este momento.</p>
      </header>
      {isLoading && <LoadingState message="Abrindo o caderno de serviços…" />}
      {isError && <ErrorState message="Não foi possível carregar os serviços." onRetry={onRetry} />}
      {!isLoading && !isError && services.length === 0 && <EmptyState message="Ainda não há serviços disponíveis para reserva." />}
      <div className="booking-card-grid">
        {services.map((service) => (
          <button
            className={selectedId === service.id ? 'booking-choice booking-choice--selected' : 'booking-choice'}
            type="button"
            key={service.id}
            onClick={() => onSelect(service)}
            aria-pressed={selectedId === service.id}
          >
            <span className="booking-choice__mark" aria-hidden="true">✦</span>
            <strong>{service.nome}</strong>
            <span>{service.duracaoMinutos} min · {formatPrice(service)}</span>
            <small>Selecionar serviço →</small>
          </button>
        ))}
      </div>
    </section>
  )
}
