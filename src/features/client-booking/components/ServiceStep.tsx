import { Check, Clock3, Eye, Scissors, Sparkles } from 'lucide-react'
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

function serviceIcon(name: string) {
  if (/sobrancelh|olh|cíli/i.test(name)) return Eye
  if (/barb|corte|cabelo/i.test(name)) return Scissors
  return Sparkles
}

export function ServiceStep({ services, selectedId, isLoading, isError, onRetry, onSelect }: ServiceStepProps) {
  return (
    <section className="booking-step booking-service-step" aria-labelledby="service-step-title">
      <header className="booking-step__header">
        <p className="eyebrow">PASSO 1 DE 4</p>
        <h2 id="service-step-title">Escolha o serviço</h2>
        <p>Selecione o serviço que melhor atende às suas necessidades.</p>
      </header>
      {isLoading && <LoadingState message="Carregando os serviços…" />}
      {isError && <ErrorState message="Não foi possível carregar os serviços." onRetry={onRetry} />}
      {!isLoading && !isError && services.length === 0 && <EmptyState message="Ainda não há serviços disponíveis para reserva." />}
      {!isLoading && !isError && services.length > 0 && <div className="booking-card-grid booking-card-grid--services">
        {services.map((service) => {
          const Icon = serviceIcon(service.nome)
          const selected = selectedId === service.id
          return <button
            className={`booking-choice booking-service-choice${selected ? ' booking-choice--selected' : ''}`}
            type="button"
            key={service.id}
            onClick={() => onSelect(service)}
            aria-pressed={selected}
          >
            <Icon className="booking-service-choice__icon" size={31} strokeWidth={1.65} aria-hidden="true" />
            {selected && <span className="booking-choice__indicator" aria-hidden="true"><Check size={14} strokeWidth={2.8} /></span>}
            <strong>{service.nome}</strong>
            <span className="booking-service-choice__duration"><Clock3 size={15} aria-hidden="true" />{service.duracaoMinutos} min</span>
            <b className="booking-service-choice__price">{formatPrice(service)}</b>
          </button>
        })}
      </div>}
    </section>
  )
}
