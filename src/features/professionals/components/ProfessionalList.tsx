import { useEffect, useRef, useState } from 'react'
import { CalendarDays, MoreVertical, Pencil, Plus, UsersRound } from 'lucide-react'
import type { ProfissionalResponse } from '../../../types/professionals'
import { getProfessionalTone, professionalToneColors } from '../../scheduling/utils/professionalTone'
import { scheduleSummary } from '../utils/professionalSchedule'

interface ProfessionalListProps {
  professionals: ProfissionalResponse[]
  onNew: () => void
  onEdit: (professional: ProfissionalResponse) => void
  onAgenda: (professional: ProfissionalResponse) => void
  onToggleStatus: (professional: ProfissionalResponse) => void
  onDelete: (professional: ProfissionalResponse) => void
  busyId?: string
}

function ProfessionalCard({ professional, onEdit, onAgenda, onToggleStatus, onDelete, busyId }: Omit<ProfessionalListProps, 'professionals' | 'onNew'> & { professional: ProfissionalResponse }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [imageFailed, setImageFailed] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const schedule = scheduleSummary(professional.horariosTrabalho)
  const tone = getProfessionalTone(professional.id)
  const initials = professional.nome.trim().split(/\s+/).slice(0, 2).map((word) => word[0]).join('').toUpperCase()
  const isActive = professional.ativo !== false

  useEffect(() => {
    if (!menuOpen) return
    const outside = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false)
    }
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setMenuOpen(false); menuButtonRef.current?.focus() }
    }
    document.addEventListener('pointerdown', outside)
    document.addEventListener('keydown', escape)
    return () => {
      document.removeEventListener('pointerdown', outside)
      document.removeEventListener('keydown', escape)
    }
  }, [menuOpen])

  const action = (callback: (professional: ProfissionalResponse) => void) => {
    setMenuOpen(false)
    callback(professional)
  }

  return (
    <article className="professionals-card" style={{ borderTopColor: professionalToneColors[tone] }}>
      <div className="professionals-card__identity">
        {professional.imagem && !imageFailed
          ? <img className="professionals-card__photo" src={professional.imagem} alt="" onError={() => setImageFailed(true)} />
          : <span className="professionals-card__avatar" aria-hidden="true">{initials}</span>}
        <div>
          <h3>{professional.nome}</h3>
          <p>{professional.especialidade}</p>
          <span className={`professionals-status professionals-status--${isActive ? 'active' : 'inactive'}`}>{isActive ? 'Ativo' : 'Inativo'}</span>
        </div>
      </div>
      <div className="professionals-card__schedule">
        <p>Horários de atendimento</p>
        {schedule.length === 0
          ? <span className="professionals-card__no-hours">Sem horários cadastrados</span>
          : <>
            {schedule.slice(0, 3).map((line) => <div key={line}><CalendarDays size={17} aria-hidden="true" /><span>{line}</span></div>)}
            {schedule.length > 3 && <details><summary>Ver horários completos</summary>{schedule.slice(3).map((line) => <p key={line}>{line}</p>)}</details>}
          </>}
      </div>
      <div className="professionals-card__actions">
        <button type="button" className="professionals-card__agenda" onClick={() => onAgenda(professional)}>Ver agenda</button>
        <button type="button" className="professionals-card__edit" onClick={() => onEdit(professional)}><Pencil size={16} aria-hidden="true" />Editar</button>
        <div className="professionals-card__menu-wrap" ref={menuRef}>
          <button type="button" className="professionals-card__more" ref={menuButtonRef} aria-label={`Mais ações para ${professional.nome}`} aria-expanded={menuOpen} onClick={() => setMenuOpen((value) => !value)}><MoreVertical size={19} aria-hidden="true" /></button>
          {menuOpen && <div className="professionals-card__menu" role="group" aria-label={`Ações de ${professional.nome}`}>
            <button type="button" onClick={() => action(onEdit)}>Editar profissional</button>
            <button type="button" onClick={() => action(onAgenda)}>Ver agenda</button>
            <button type="button" disabled={busyId === professional.id} onClick={() => action(onToggleStatus)}>{isActive ? 'Desativar profissional' : 'Ativar profissional'}</button>
            <button type="button" className="is-danger" disabled={busyId === professional.id} onClick={() => action(onDelete)}>Excluir profissional</button>
          </div>}
        </div>
      </div>
    </article>
  )
}

export function ProfessionalList({ professionals, onNew, onEdit, onAgenda, onToggleStatus, onDelete, busyId }: ProfessionalListProps) {
  return (
    <div className="professionals-grid">
      {professionals.map((professional) => (
        <ProfessionalCard
          key={professional.id}
          professional={professional}
          onEdit={onEdit}
          onAgenda={onAgenda}
          onToggleStatus={onToggleStatus}
          onDelete={onDelete}
          busyId={busyId}
        />
      ))}
      <div className="professionals-add-card">
        <UsersRound size={29} aria-hidden="true" />
        <strong>Adicionar novo profissional</strong>
        <p>Cadastre um novo membro para sua equipe.</p>
        <button type="button" onClick={onNew}><Plus size={17} aria-hidden="true" />Novo profissional</button>
      </div>
    </div>
  )
}
