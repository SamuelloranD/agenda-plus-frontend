import type { ProfissionalResponse } from '../../../types/professionals'

interface ProfessionalListProps {
  professionals: ProfissionalResponse[]
  onEdit: (professional: ProfissionalResponse) => void
  onDelete: (professional: ProfissionalResponse) => void
  deletingId?: string
}

const weekdayLabels: Record<string, string> = { MONDAY: 'Seg', TUESDAY: 'Ter', WEDNESDAY: 'Qua', THURSDAY: 'Qui', FRIDAY: 'Sex', SATURDAY: 'Sáb', SUNDAY: 'Dom' }

export function ProfessionalList({ professionals, onEdit, onDelete, deletingId }: ProfessionalListProps) {
  return <div className="professional-list">{professionals.map((professional, index) => <article className="professional-card" key={professional.id}>
    <div className={`professional-card__mark professional-card__mark--${index % 3}`} aria-hidden="true">{professional.nome.split(' ').map((name) => name[0]).join('').slice(0, 2)}</div>
    <div className="professional-card__main"><p className="section-label">Corpo técnico</p><h3>{professional.nome}</h3><p>{professional.especialidade}</p><div className="work-pill-list">{professional.horariosTrabalho.map(({ diaSemana, inicio, fim }) => <span key={`${diaSemana}-${inicio}-${fim}`}>{weekdayLabels[diaSemana] ?? diaSemana} · {inicio}–{fim}</span>)}</div></div>
    <div className="catalog-card__actions"><button type="button" className="quiet-action" onClick={() => onEdit(professional)}>Editar</button><button type="button" className="danger-action" onClick={() => onDelete(professional)} disabled={deletingId === professional.id}>{deletingId === professional.id ? 'Excluindo…' : 'Excluir'}</button></div>
  </article>)}</div>
}
