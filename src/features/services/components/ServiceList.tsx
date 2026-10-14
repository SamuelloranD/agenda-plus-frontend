import { useEffect, useRef, useState } from 'react'
import { Clock3, MoreVertical, Pencil, Power, Trash2 } from 'lucide-react'
import type { ServicoResponse } from '../../../types/services'

interface ServiceListProps {
  services: ServicoResponse[]
  onEdit: (service: ServicoResponse) => void
  onDelete: (service: ServicoResponse) => void
  onStatus?: (service: ServicoResponse) => void
  deletingId?: string
}

const money = (value: number, currency: string) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(value)

function ServiceCard({ service, index, onEdit, onDelete, onStatus, deletingId }: ServiceListProps & { service: ServicoResponse; index: number }) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (!open) return
    const close = (event: PointerEvent) => { if (!menuRef.current?.contains(event.target as Node)) setOpen(false) }
    document.addEventListener('pointerdown', close)
    return () => document.removeEventListener('pointerdown', close)
  }, [open])
  return <article className={`services-card services-card--${index % 3}`}>
    <div className="services-card__heading"><h3>{service.nome}</h3><span className={service.ativo === false ? 'services-status is-inactive' : 'services-status'}>{service.ativo === false ? 'Inativo' : 'Ativo'}</span></div>
    {service.descricao && <p className="services-card__description">{service.descricao}</p>}
    <div className="services-card__facts"><div><Clock3 size={20} aria-hidden="true" /><span><small>Duração</small><strong>{service.duracaoMinutos} minutos</strong></span></div><div><span className="services-card__currency" aria-hidden="true">$</span><span><small>Preço</small><strong>{money(service.preco.valor, service.preco.moeda)}</strong></span></div></div>
    <div className="services-card__actions"><button type="button" className="services-outline" onClick={() => onEdit(service)}><Pencil size={15} aria-hidden="true" /> Editar serviço</button><div className="services-card__menu" ref={menuRef} onKeyDown={(event) => { if (event.key === 'Escape') { event.preventDefault(); setOpen(false); triggerRef.current?.focus() } }}><button ref={triggerRef} type="button" className="services-icon-button" aria-label={`Ações de ${service.nome}`} aria-expanded={open} onClick={() => setOpen((current) => !current)}><MoreVertical size={18} aria-hidden="true" /></button>{open && <div className="services-card__menu-panel"><button type="button" onClick={() => { setOpen(false); onEdit(service) }}><Pencil size={16} />Editar serviço</button>{onStatus && <button type="button" onClick={() => { setOpen(false); onStatus(service) }}><Power size={16} />{service.ativo === false ? 'Ativar serviço' : 'Desativar serviço'}</button>}<button type="button" className="is-danger" disabled={deletingId === service.id} onClick={() => { setOpen(false); onDelete(service) }}><Trash2 size={16} />Excluir serviço</button></div>}</div></div>
  </article>
}

export function ServiceList(props: ServiceListProps) {
  return <div className="services-grid">{props.services.map((service, index) => <ServiceCard key={service.id} {...props} service={service} index={index} />)}</div>
}
