import { Pencil, Trash2 } from 'lucide-react'
import type { ProfissionalResponse } from '../../../types/professionals'
import { getProfessionalTone, professionalToneColors } from '../../scheduling/utils/professionalTone'

interface ProfessionalListProps {
  professionals: ProfissionalResponse[]
  onEdit: (professional: ProfissionalResponse) => void
  onDelete: (professional: ProfissionalResponse) => void
  deletingId?: string
}

const weekdayLabels: Record<string, string> = { MONDAY: 'Seg', TUESDAY: 'Ter', WEDNESDAY: 'Qua', THURSDAY: 'Qui', FRIDAY: 'Sex', SATURDAY: 'Sáb', SUNDAY: 'Dom' }

function formatHour(value: string) {
  return value.slice(0, 5)
}

export function ProfessionalList({ professionals, onEdit, onDelete, deletingId }: ProfessionalListProps) {
  return (
    <div className="professional-list">
      {professionals.map((professional) => {
        const tone = getProfessionalTone(professional.id)
        return (
          <article className={`professional-card professional-card--${tone}`} style={{ borderTopColor: professionalToneColors[tone] }} key={professional.id}>
            <div className="professional-card__identity">
              {professional.imagem ? <img className="professional-card__photo" src={professional.imagem} alt="" /> : <div className={`professional-card__mark professional-card__mark--${tone}`} style={{ backgroundColor: professionalToneColors[tone] }} aria-hidden="true">{professional.nome.split(' ').map((name) => name[0]).join('').slice(0, 2)}</div>}
              <div className="professional-card__main"><h3>{professional.nome}</h3><p>{professional.especialidade}</p></div>
            </div>
            <div className="professional-card__schedule" role="list" aria-label="Horários de trabalho">
              {professional.horariosTrabalho.map(({ diaSemana, inicio, fim }) => <div key={`${diaSemana}-${inicio}-${fim}`} role="listitem"><strong>{weekdayLabels[diaSemana] ?? diaSemana}</strong><time>{formatHour(inicio)}–{formatHour(fim)}</time></div>)}
            </div>
            <div className="professional-card__actions">
              <button type="button" className="professional-card__icon-action" onClick={() => onEdit(professional)} aria-label={`Editar profissional ${professional.nome}`} title="Editar profissional"><Pencil size={15} strokeWidth={1.8} aria-hidden="true" /></button>
              <button type="button" className="professional-card__icon-action professional-card__icon-action--danger" onClick={() => onDelete(professional)} disabled={deletingId === professional.id} aria-label={`Excluir profissional ${professional.nome}`} title="Excluir profissional"><Trash2 size={15} strokeWidth={1.8} aria-hidden="true" /></button>
            </div>
          </article>
        )
      })}
    </div>
  )
}
