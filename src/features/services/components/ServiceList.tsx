import type { ServicoResponse } from '../../../types/services'

interface ServiceListProps {
  services: ServicoResponse[]
  onEdit: (service: ServicoResponse) => void
  onDelete: (service: ServicoResponse) => void
  deletingId?: string
}

function formatCurrency(value: number, currency: string) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(value)
}

export function ServiceList({ services, onEdit, onDelete, deletingId }: ServiceListProps) {
  return <div className="service-list">{services.map((service, index) => <article className={`service-row service-row--${index % 3}`} key={service.id}>
    <div className="service-row__glyph" aria-hidden="true">✦</div>
    <div className="service-row__main"><h3>{service.nome}</h3><div><span>{service.duracaoMinutos} minutos</span><i>•</i><span>Preço fixo</span></div></div>
    <div className="service-row__price"><small>Valor</small><strong>{formatCurrency(service.preco.valor, service.preco.moeda)}</strong></div>
    <div className="catalog-card__actions"><button type="button" className="quiet-action" onClick={() => onEdit(service)}>Editar</button><button type="button" className="danger-action" onClick={() => onDelete(service)} disabled={deletingId === service.id}>{deletingId === service.id ? 'Excluindo…' : 'Excluir'}</button></div>
  </article>)}</div>
}
