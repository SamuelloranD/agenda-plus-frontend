import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { CalendarDays, Copy, Plus, Trash2, UserRound } from 'lucide-react'
import type { AgendamentoResponse } from '../../../types/scheduling'
import type { ApiError } from '../../../types/api'
import type { ProfissionalResponse } from '../../../types/professionals'
import { ProfessionalConfirmDialog } from './ProfessionalConfirmDialog'
import { useCreateProfessional, useUpdateProfessional } from '../hooks/useProfessionals'
import { professionalSchema, weekdays, type ProfessionalFormValues } from '../schemas/professionalSchema'

type Day = (typeof weekdays)[number]
type Period = { inicio: string; fim: string }
type DayDraft = { enabled: boolean; periods: Period[] }
type WeekDraft = Record<Day, DayDraft>
type Draft = { nome: string; especialidade: string; imagem: string | null; ativo: boolean; week: WeekDraft }

const dayLabels: Record<Day, string> = {
  MONDAY: 'Segunda-feira', TUESDAY: 'Terça-feira', WEDNESDAY: 'Quarta-feira',
  THURSDAY: 'Quinta-feira', FRIDAY: 'Sexta-feira', SATURDAY: 'Sábado', SUNDAY: 'Domingo',
}
const imageTypes = ['image/jpeg', 'image/png', 'image/webp']
const maxImageBytes = 2 * 1024 * 1024

function initialDraft(professional?: ProfissionalResponse | null): Draft {
  const week = Object.fromEntries(weekdays.map((day) => [day, { enabled: false, periods: [] as Period[] }])) as WeekDraft
  professional?.horariosTrabalho.forEach(({ diaSemana, inicio, fim }) => {
    if (!week[diaSemana as Day]) return
    week[diaSemana as Day].enabled = true
    week[diaSemana as Day].periods.push({ inicio: inicio.slice(0, 5), fim: fim.slice(0, 5) })
  })
  weekdays.forEach((day) => week[day].periods.sort((left, right) => left.inicio.localeCompare(right.inicio)))
  return {
    nome: professional?.nome ?? '',
    especialidade: professional?.especialidade ?? '',
    imagem: professional?.imagem ?? null,
    ativo: professional?.ativo !== false,
    week,
  }
}

function toPayload(draft: Draft): ProfessionalFormValues {
  return {
    nome: draft.nome,
    especialidade: draft.especialidade,
    imagem: draft.imagem,
    ativo: draft.ativo,
    horariosTrabalho: weekdays.flatMap((day) => draft.week[day].enabled
      ? draft.week[day].periods.map(({ inicio, fim }) => ({ diaSemana: day, inicio, fim }))
      : []),
  }
}

function hasValidPeriods(day: DayDraft) {
  return day.enabled && day.periods.length > 0
    && day.periods.every(({ inicio, fim }) => /^\d{2}:\d{2}$/.test(inicio) && /^\d{2}:\d{2}$/.test(fim) && fim > inicio)
}

function incompatibleBookings(appointments: AgendamentoResponse[], payload: ProfessionalFormValues) {
  return appointments.filter((appointment) => {
    if (!['PENDENTE', 'CONFIRMADO'].includes(appointment.status) || new Date(appointment.inicio) < new Date()) return false
    const starts = new Date(appointment.inicio)
    const day = weekdays[(starts.getDay() + 6) % 7]
    const startTime = appointment.inicio.slice(11, 16)
    const endTime = appointment.fim.slice(11, 16)
    return !payload.horariosTrabalho.some((interval) => interval.diaSemana === day
      && appointment.inicio.slice(0, 10) === appointment.fim.slice(0, 10)
      && interval.inicio <= startTime && interval.fim >= endTime)
  })
}

interface ProfessionalFormProps {
  professional?: ProfissionalResponse | null
  appointments?: AgendamentoResponse[]
  appointmentsLoading?: boolean
  appointmentsError?: boolean
  onDone: () => void
  onCancel: () => void
  onDirtyChange?: (dirty: boolean) => void
}

export function ProfessionalForm({ professional, appointments = [], appointmentsLoading = false, appointmentsError = false, onDone, onCancel, onDirtyChange }: ProfessionalFormProps) {
  const original = useMemo(() => initialDraft(professional), [professional])
  const [draft, setDraft] = useState<Draft>(original)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [photoError, setPhotoError] = useState<string | null>(null)
  const [photoFailed, setPhotoFailed] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [copyOpen, setCopyOpen] = useState(false)
  const [sourceDay, setSourceDay] = useState<Day>('MONDAY')
  const [targetDays, setTargetDays] = useState<Day[]>([])
  const [replaceAcknowledged, setReplaceAcknowledged] = useState(false)
  const [pendingPayload, setPendingPayload] = useState<ProfessionalFormValues | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const submitting = useRef(false)
  const createProfessional = useCreateProfessional()
  const updateProfessional = useUpdateProfessional()
  const dirty = JSON.stringify(draft) !== JSON.stringify(original)
  const isPending = createProfessional.isPending || updateProfessional.isPending
  const validSourceDays = weekdays.filter((day) => hasValidPeriods(draft.week[day]))
  const selectedSource = validSourceDays.includes(sourceDay) ? sourceDay : validSourceDays[0]
  const replacements = targetDays.filter((day) => draft.week[day].enabled && draft.week[day].periods.some(({ inicio, fim }) => inicio || fim))
  const enabling = targetDays.filter((day) => !draft.week[day].enabled)

  useEffect(() => onDirtyChange?.(dirty), [dirty, onDirtyChange])

  function updateDay(day: Day, transform: (current: DayDraft) => DayDraft) {
    setDraft((current) => ({ ...current, week: { ...current.week, [day]: transform(current.week[day]) } }))
    setSaveError(null)
  }

  function toggleDay(day: Day) {
    updateDay(day, (current) => ({
      enabled: !current.enabled,
      periods: !current.enabled && current.periods.length === 0 ? [{ inicio: '', fim: '' }] : current.periods,
    }))
  }

  function updatePeriod(day: Day, index: number, key: keyof Period, value: string) {
    updateDay(day, (current) => ({
      ...current,
      periods: current.periods.map((period, currentIndex) => currentIndex === index ? { ...period, [key]: value } : period),
    }))
    setErrors((current) => ({ ...current, [`${day}-${index}-${key}`]: '' }))
  }

  function removePeriod(day: Day, index: number) {
    updateDay(day, (current) => ({
      ...current,
      periods: current.periods.length === 1 ? [{ inicio: '', fim: '' }] : current.periods.filter((_, currentIndex) => currentIndex !== index),
    }))
  }

  function changePhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!imageTypes.includes(file.type)) { setPhotoError('Selecione uma imagem JPG, PNG ou WebP.'); return }
    if (file.size > maxImageBytes) { setPhotoError('A imagem deve ter no máximo 2 MiB.'); return }
    setPhotoError(null)
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result !== 'string') { setPhotoError('Não foi possível ler a imagem.'); return }
      setPhotoFailed(false)
      setDraft((current) => ({ ...current, imagem: reader.result as string }))
    }
    reader.onerror = () => setPhotoError('Não foi possível ler a imagem.')
    reader.readAsDataURL(file)
  }

  function openCopy() {
    if (!selectedSource) return
    setSourceDay(selectedSource)
    setTargetDays([])
    setReplaceAcknowledged(false)
    setCopyOpen(true)
  }

  function applyCopy() {
    if (!selectedSource || targetDays.length === 0 || (replacements.length > 0 && !replaceAcknowledged)) return
    const periods = draft.week[selectedSource].periods.map((period) => ({ ...period }))
    setDraft((current) => ({
      ...current,
      week: {
        ...current.week,
        ...Object.fromEntries(targetDays.map((day) => [day, { enabled: true, periods: periods.map((period) => ({ ...period })) }])),
      },
    }))
    setCopyOpen(false)
  }

  async function persist(payload: ProfessionalFormValues) {
    if (submitting.current) return
    submitting.current = true
    setSaveError(null)
    try {
      if (professional) await updateProfessional.mutateAsync({ id: professional.id, input: payload })
      else await createProfessional.mutateAsync(payload)
      onDone()
    } catch (error) {
      setSaveError((error as ApiError).message || 'Não foi possível salvar o profissional. Tente novamente.')
    } finally {
      submitting.current = false
      setPendingPayload(null)
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting.current) return
    const payload = toPayload(draft)
    const parsed = professionalSchema.safeParse(payload)
    if (!parsed.success) {
      const nextErrors: Record<string, string> = {}
      const refs = weekdays.flatMap((day) => draft.week[day].enabled ? draft.week[day].periods.map((_, index) => ({ day, index })) : [])
      parsed.error.issues.forEach((issue) => {
        const [field, index, part] = issue.path
        if (field === 'horariosTrabalho' && typeof index === 'number') {
          const ref = refs[index]
          if (ref) nextErrors[`${ref.day}-${ref.index}-${String(part)}`] = issue.message
        } else if (typeof field === 'string') nextErrors[field] = issue.message
      })
      setErrors(nextErrors)
      return
    }
    setErrors({})
    const scheduleChanged = JSON.stringify(payload.horariosTrabalho) !== JSON.stringify(toPayload(original).horariosTrabalho)
    const affected = incompatibleBookings(appointments, payload)
    if (professional && (scheduleChanged || !payload.ativo) && (affected.length > 0 || appointmentsError || appointmentsLoading)) {
      setPendingPayload(payload)
      return
    }
    void persist(payload)
  }

  return (
    <form className="professional-editor-form" onSubmit={submit} noValidate>
      <div className="professional-editor-layout">
        <section className="professional-editor-card professional-editor-card--details" aria-labelledby="professional-details-title">
          <h2 id="professional-details-title">Dados do profissional</h2>
          <div className="professional-photo-field">
            {draft.imagem && !photoFailed
              ? <img src={draft.imagem} alt="" onError={() => setPhotoFailed(true)} />
              : <span aria-hidden="true"><UserRound size={32} /></span>}
            <div>
              <input ref={fileRef} type="file" accept={imageTypes.join(',')} aria-label="Foto do profissional" onChange={changePhoto} />
              <button type="button" onClick={() => fileRef.current?.click()}>{draft.imagem ? 'Trocar foto' : 'Adicionar foto'}</button>
              {draft.imagem && <button type="button" className="is-remove" onClick={() => { setDraft((current) => ({ ...current, imagem: null })); setPhotoFailed(false) }}>Remover</button>}
            </div>
          </div>
          <p className="professional-photo-help">JPG, PNG ou WebP (máx. 2 MiB)</p>
          {photoError && <p className="professional-field-error" role="alert">{photoError}</p>}
          <label className="professional-field">Nome <span aria-hidden="true">*</span>
            <input value={draft.nome} onChange={(event) => { setDraft((current) => ({ ...current, nome: event.target.value })); setErrors((current) => ({ ...current, nome: '' })) }} aria-invalid={Boolean(errors.nome)} />
            {errors.nome && <small role="alert">{errors.nome}</small>}
          </label>
          <label className="professional-field">Especialidade <span aria-hidden="true">*</span>
            <input value={draft.especialidade} onChange={(event) => { setDraft((current) => ({ ...current, especialidade: event.target.value })); setErrors((current) => ({ ...current, especialidade: '' })) }} aria-invalid={Boolean(errors.especialidade)} />
            {errors.especialidade && <small role="alert">{errors.especialidade}</small>}
          </label>
          <p className="professional-field-hint">Essa informação será exibida no agendamento.</p>
          <div className="professional-status-field">
            <strong>Status</strong>
            <label><input type="checkbox" role="switch" checked={draft.ativo} onChange={(event) => setDraft((current) => ({ ...current, ativo: event.target.checked }))} /><span>{draft.ativo ? 'Ativo' : 'Inativo'}</span></label>
            <p>{draft.ativo ? 'Profissional disponível para receber novos agendamentos conforme seus horários.' : 'O profissional não receberá novos agendamentos.'}</p>
          </div>
        </section>
        <section className="professional-editor-card professional-editor-card--hours" aria-labelledby="professional-hours-title">
          <div className="professional-hours-heading">
            <div><h2 id="professional-hours-title">Horários de atendimento</h2><p>Defina os horários que se repetem toda semana.</p></div>
            <button type="button" onClick={openCopy} disabled={validSourceDays.length === 0}><Copy size={17} aria-hidden="true" />Copiar semana</button>
          </div>
          <div className="professional-days">
            {weekdays.map((day) => (
              <div className="professional-day" key={day}>
                <div className="professional-day__heading">
                  <strong>{dayLabels[day]}</strong>
                  <label className="professional-day__switch">
                    <input type="checkbox" role="switch" aria-label={`Atendimento na ${dayLabels[day].toLowerCase()}`} checked={draft.week[day].enabled} onChange={() => toggleDay(day)} />
                  </label>
                </div>
                <div className="professional-day__body">
                  {!draft.week[day].enabled ? <span className="professional-day__off">Sem atendimento</span> : (
                    <>
                      {draft.week[day].periods.map((period, index) => (
                        <div className="professional-period" key={index}>
                          <div><label htmlFor={`${day}-${index}-inicio`}>Início<span className="visually-hidden"> da {dayLabels[day].toLowerCase()}, período {index + 1}</span></label>
                            <input id={`${day}-${index}-inicio`} type="time" value={period.inicio} onChange={(event) => updatePeriod(day, index, 'inicio', event.target.value)} aria-invalid={Boolean(errors[`${day}-${index}-inicio`])} />
                            {errors[`${day}-${index}-inicio`] && <small role="alert">{errors[`${day}-${index}-inicio`]}</small>}
                          </div>
                          <span aria-hidden="true">–</span>
                          <div><label htmlFor={`${day}-${index}-fim`}>Fim<span className="visually-hidden"> da {dayLabels[day].toLowerCase()}, período {index + 1}</span></label>
                            <input id={`${day}-${index}-fim`} type="time" value={period.fim} onChange={(event) => updatePeriod(day, index, 'fim', event.target.value)} aria-invalid={Boolean(errors[`${day}-${index}-fim`])} />
                            {errors[`${day}-${index}-fim`] && <small role="alert">{errors[`${day}-${index}-fim`]}</small>}
                          </div>
                          <button type="button" className="professional-period__remove" aria-label={`Remover período ${index + 1} da ${dayLabels[day].toLowerCase()}`} onClick={() => removePeriod(day, index)}><Trash2 size={17} aria-hidden="true" /></button>
                        </div>
                      ))}
                      <button type="button" className="professional-day__add" aria-label={`Adicionar período de atendimento à ${dayLabels[day].toLowerCase()}`} onClick={() => updateDay(day, (current) => ({ ...current, periods: [...current.periods, { inicio: '', fim: '' }] }))}><Plus size={18} aria-hidden="true" /><span>Adicionar período</span></button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="professional-hours-tip"><CalendarDays size={18} aria-hidden="true" />Você pode adicionar mais de um período por dia, caso haja intervalos.</div>
          {copyOpen && selectedSource && (
            <div className="professional-copy-panel" role="group" aria-label="Copiar horários para outros dias">
              <div className="professional-copy-panel__heading"><h3>Copiar horários para outros dias</h3><button type="button" onClick={() => setCopyOpen(false)} aria-label="Fechar cópia de horários">×</button></div>
              <label>Dia de origem
                <select value={selectedSource} onChange={(event) => { setSourceDay(event.target.value as Day); setTargetDays([]); setReplaceAcknowledged(false) }}>
                  {validSourceDays.map((day) => <option key={day} value={day}>{dayLabels[day]}</option>)}
                </select>
              </label>
              <p>Períodos: {draft.week[selectedSource].periods.map(({ inicio, fim }) => `${inicio}–${fim}`).join(' e ')}</p>
              <fieldset><legend>Copiar para</legend>{weekdays.filter((day) => day !== selectedSource).map((day) => <label key={day}><input type="checkbox" checked={targetDays.includes(day)} onChange={(event) => { setTargetDays((current) => event.target.checked ? [...current, day] : current.filter((entry) => entry !== day)); setReplaceAcknowledged(false) }} />{dayLabels[day]}</label>)}</fieldset>
              {replacements.length > 0 && <label className="professional-copy-warning"><input type="checkbox" checked={replaceAcknowledged} onChange={(event) => setReplaceAcknowledged(event.target.checked)} />Os horários existentes em {replacements.map((day) => dayLabels[day]).join(', ')} serão substituídos.</label>}
              {enabling.length > 0 && <p>Os dias sem atendimento selecionados serão habilitados.</p>}
              <button type="button" className="professional-copy-panel__apply" disabled={targetDays.length === 0 || (replacements.length > 0 && !replaceAcknowledged)} onClick={applyCopy}>Copiar horários</button>
            </div>
          )}
        </section>
      </div>
      {saveError && <p className="professionals-feedback is-error" role="alert">{saveError}</p>}
      <div className="professional-editor-actions">
        <button type="button" onClick={onCancel}>Cancelar</button>
        <button type="submit" disabled={isPending || appointmentsLoading}>{isPending ? 'Salvando…' : professional ? 'Salvar alterações' : 'Cadastrar profissional'}</button>
      </div>
      {pendingPayload && <ProfessionalConfirmDialog
        title="Revisar impacto nos agendamentos"
        description={appointmentsLoading || appointmentsError
          ? 'Não foi possível verificar todos os agendamentos futuros agora. As reservas existentes não serão canceladas nem remarcadas automaticamente.'
          : `${incompatibleBookings(appointments, pendingPayload).length} agendamento(s) futuro(s) ativo(s) ficam fora dos novos horários. Eles serão mantidos e precisarão de revisão manual.`}
        confirmLabel="Salvar mesmo assim"
        cancelLabel="Revisar horários"
        busy={isPending}
        onCancel={() => setPendingPayload(null)}
        onConfirm={() => void persist(pendingPayload)}
      />}
    </form>
  )
}
