import { CalendarDays, ChevronLeft, ChevronRight, Plus, X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { useSearchParams } from 'react-router-dom'
import { DatePicker } from '../components/ui/DatePicker'
import { ErrorState } from '../components/ui/ErrorState'
import { LoadingState } from '../components/ui/LoadingState'
import { Select } from '../components/ui/Select'
import { NewAppointmentForm } from '../features/scheduling/components/NewAppointmentForm'
import { AppointmentActions } from '../features/scheduling/components/AppointmentActions'
import { useAppointmentDirectory } from '../features/scheduling/hooks/useAppointmentDirectory'
import { useAgendamentos } from '../features/scheduling/hooks/useAgendamentos'
import { useProfessionals } from '../features/professionals/hooks/useProfessionals'
import { resolveAppointmentLabels } from '../features/scheduling/utils/appointmentDirectory'
import { useAuthStore } from '../store/authStore'
import type { AgendamentoResponse, AgendamentoStatus } from '../types/scheduling'

type View = 'dia' | 'semana' | 'lista'
type Slot = { date: string; start?: string; professionalId?: string }
const weekdays = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']
const statusLabel: Record<AgendamentoStatus, string> = { PENDENTE: 'Aguardando confirmação', CONFIRMADO: 'Confirmado', CANCELADO: 'Cancelado', CONCLUIDO: 'Concluído' }
const dateKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const parseDate = (key: string) => { const [year, month, day] = key.split('-').map(Number); return new Date(year, month - 1, day, 12) }
const addDays = (key: string, days: number) => { const d = parseDate(key); d.setDate(d.getDate() + days); return dateKey(d) }
const weekStart = (key: string) => addDays(key, -((parseDate(key).getDay() + 6) % 7))
const minutes = (value: string) => Number(value.slice(11, 13)) * 60 + Number(value.slice(14, 16))
const timeText = (value: string) => value.slice(11, 16)
const dateText = (key: string, options: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('pt-BR', options).format(parseDate(key))
const formatRange = (start: string, end: string) => start === end ? dateText(start, { day: 'numeric', month: 'long', year: 'numeric' }) : `${dateText(start, { day: 'numeric', month: 'short' })} – ${dateText(end, { day: 'numeric', month: 'short', year: 'numeric' })}`
const statusClass = (status: AgendamentoStatus) => `agenda-status--${status.toLowerCase()}`

function overlaps(a: AgendamentoResponse, b: AgendamentoResponse) { return minutes(a.inicio) < minutes(b.fim) && minutes(b.inicio) < minutes(a.fim) }
function layout(items: AgendamentoResponse[]) {
  const ordered = [...items].sort((a, b) => a.inicio.localeCompare(b.inicio))
  const result = new Map<string, { lane: number; count: number }>()
  let cluster: AgendamentoResponse[] = []
  const flush = () => {
    const lanes: AgendamentoResponse[][] = []
    for (const item of cluster) { let lane = lanes.findIndex((events) => events.every((event) => !overlaps(event, item))); if (lane < 0) { lane = lanes.length; lanes.push([]) } lanes[lane].push(item); result.set(item.id, { lane, count: 0 }) }
    for (const item of cluster) result.set(item.id, { lane: result.get(item.id)!.lane, count: lanes.length })
    cluster = []
  }
  for (const item of ordered) { if (cluster.length && !cluster.some((event) => overlaps(event, item))) flush(); cluster.push(item) }
  flush()
  return result
}

export function WeeklyAgendaPage() {
  const [params, setParams] = useSearchParams()
  const userId = useAuthStore((state) => state.user?.id)
  const preferenceKey = `agenda-plus:agenda-view:${userId ?? 'anonymous'}`
  const selectedDate = /^\d{4}-\d{2}-\d{2}$/.test(params.get('data') ?? '') ? params.get('data')! : dateKey(new Date())
  const requestedView = params.get('visao')
  const professionalId = params.get('profissionalId') ?? ''
  const professionalsQuery = useProfessionals()
  const directoryQuery = useAppointmentDirectory()
  const professionals = (professionalsQuery.data ?? []).filter((item) => item.ativo !== false)
  const validProfessionalId = professionals.some((item) => item.id === professionalId) ? professionalId : ''
  const savedView = userId ? localStorage.getItem(preferenceKey) : null
  const view: View = requestedView === 'dia' || requestedView === 'semana' || requestedView === 'lista' ? requestedView : savedView === 'dia' || savedView === 'semana' || savedView === 'lista' ? savedView : professionals.length > 1 ? 'dia' : 'semana'
  const firstDate = view === 'dia' ? selectedDate : weekStart(selectedDate)
  const lastDate = view === 'dia' ? selectedDate : addDays(firstDate, 6)
  const appointmentsQuery = useAgendamentos({ dataInicio: firstDate, dataFim: lastDate, profissionalId: validProfessionalId || undefined, tamanho: 100 }, { allPages: true })
  const appointments = appointmentsQuery.data?.conteudo ?? []
  const [manualSlot, setSlot] = useState<Slot | null>(null)
  const newFromUrl = params.get('novo') === '1'
  const slot = manualSlot ?? (newFromUrl ? { date: selectedDate, professionalId: validProfessionalId || undefined } : null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [notice, setNotice] = useState('')
  const [now, setNow] = useState(() => new Date())
  const selected = appointments.find((item) => item.id === selectedId)
  const panelOpen = Boolean(slot || selectedId)
  const panelRef = useRef<HTMLElement>(null)
  const previousFocus = useRef<HTMLElement | null>(null)
  const today = dateKey(now)

  const changeParam = useCallback((key: string, value: string | null) => { setParams((old) => { const next = new URLSearchParams(old); if (value) next.set(key, value); else next.delete(key); return next }) }, [setParams])
  function setView(next: View) { if (userId) localStorage.setItem(preferenceKey, next); changeParam('visao', next) }
  const closePanel = useCallback(() => { setSlot(null); setSelectedId(null); changeParam('novo', null); previousFocus.current?.focus() }, [changeParam])
  function openCreate(next: Slot) { previousFocus.current = document.activeElement as HTMLElement; setSelectedId(null); setSlot(next) }
  function openDetails(id: string) { previousFocus.current = document.activeElement as HTMLElement; changeParam('novo', null); setSlot(null); setSelectedId(id) }

  useEffect(() => { const timer = window.setInterval(() => setNow(new Date()), 60_000); return () => window.clearInterval(timer) }, [])
  useEffect(() => { if (professionalId && professionalsQuery.isSuccess && !validProfessionalId) changeParam('profissionalId', null) }, [professionalId, professionalsQuery.isSuccess, validProfessionalId, changeParam])
  useEffect(() => {
    if (!panelOpen) return
    const prior = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    panelRef.current?.focus()
    function onKey(event: KeyboardEvent) {
      if (document.querySelector('.cancel-dialog-backdrop')) return
      if (event.key === 'Escape') closePanel()
      if (event.key === 'Tab' && panelRef.current) { const focusable = [...panelRef.current.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), [tabindex="0"]')]; const first = focusable[0]; const last = focusable.at(-1); if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() } else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() } }
    }
    document.addEventListener('keydown', onKey)
    return () => { document.body.style.overflow = prior; document.removeEventListener('keydown', onKey) }
  }, [panelOpen, closePanel])

  const visible = appointments.filter((item) => item.status !== 'CANCELADO')
  const dates = Array.from({ length: 7 }, (_, index) => addDays(weekStart(selectedDate), index))
  const selectedProfessional = professionals.find((item) => item.id === validProfessionalId)
  const dayColumns = validProfessionalId ? [selectedProfessional].filter((item) => item !== undefined) : professionals
  const columns = view === 'dia' ? dayColumns.map((item) => ({ id: item.id, date: selectedDate, label: item.nome, image: item.imagem, professionalId: item.id })) : dates.map((date) => ({ id: date, date, label: dateText(date, { weekday: 'short' }).toUpperCase(), image: null, professionalId: validProfessionalId }))
  const relevantHours = view === 'dia' ? dayColumns.flatMap((item) => item.horariosTrabalho.filter((hour) => hour.diaSemana === weekdays[parseDate(selectedDate).getDay()])) : selectedProfessional?.horariosTrabalho ?? professionals.flatMap((item) => item.horariosTrabalho)
  const startMinute = Math.floor(Math.min(8 * 60, ...visible.map((item) => minutes(item.inicio)), ...relevantHours.map((hour) => minutes(`0000-00-00T${hour.inicio}`))) / 30) * 30
  const endMinute = Math.ceil(Math.max(18 * 60, ...visible.map((item) => minutes(item.fim)), ...relevantHours.map((hour) => minutes(`0000-00-00T${hour.fim}`))) / 30) * 30
  const ticks = Array.from({ length: (endMinute - startMinute) / 30 + 1 }, (_, index) => startMinute + index * 30)
  const px = 1.3
  const formatMinute = (minute: number) => `${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}`
  const currentMinutes = now.getHours() * 60 + now.getMinutes()

  return <section className="weekly-page agenda-page">
    <button className="agenda-new" type="button" onClick={() => openCreate({ date: selectedDate, professionalId: validProfessionalId || undefined })}><Plus size={17} /> Novo agendamento</button>
    {notice && <p className="agenda-notice" role="status">{notice}</p>}
    <div className="agenda-controls">
      <div className="agenda-navigation"><button type="button" onClick={() => changeParam('data', today)}>Hoje</button><button type="button" aria-label="Período anterior" onClick={() => changeParam('data', addDays(selectedDate, view === 'dia' ? -1 : -7))}><ChevronLeft size={18} /></button><button type="button" aria-label="Próximo período" onClick={() => changeParam('data', addDays(selectedDate, view === 'dia' ? 1 : 7))}><ChevronRight size={18} /></button><div className="agenda-period"><CalendarDays size={17} /><span>{formatRange(firstDate, lastDate)}</span><DatePicker id="agenda-date" value={selectedDate} min="1900-01-01" label="Escolher data da agenda" onChange={(value) => changeParam('data', value)} /></div></div>
      <label className="agenda-filter">Profissional<Select id="agenda-professional" value={validProfessionalId} onChange={(value) => changeParam('profissionalId', value)} options={[{ value: '', label: 'Todos os profissionais' }, ...professionals.map((item) => ({ value: item.id, label: item.nome }))]} /></label>
      <div className="agenda-view-switch" role="group" aria-label="Visualização da agenda">{(['dia', 'semana', 'lista'] as const).map((item) => <button key={item} type="button" className={view === item ? 'active' : ''} aria-pressed={view === item} onClick={() => setView(item)}>{item[0].toUpperCase() + item.slice(1)}</button>)}</div>
    </div>
    {(appointmentsQuery.isLoading || directoryQuery.isLoading || professionalsQuery.isLoading) && <LoadingState message="Carregando agenda…" />}
    {(appointmentsQuery.isError || directoryQuery.isError || professionalsQuery.isError) && <ErrorState message="Não foi possível carregar a agenda." onRetry={() => void Promise.all([appointmentsQuery.refetch(), directoryQuery.refetch(), professionalsQuery.refetch()])} />}
    {!appointmentsQuery.isLoading && !appointmentsQuery.isError && !directoryQuery.isLoading && !directoryQuery.isError && (view === 'lista' ? <div className="agenda-list">{dates.filter((date) => date >= firstDate && date <= lastDate).map((date) => { const items = appointments.filter((item) => item.inicio.slice(0, 10) === date).sort((a, b) => a.inicio.localeCompare(b.inicio)); return <section key={date}><h2>{dateText(date, { weekday: 'long', day: 'numeric', month: 'long' })}</h2>{items.length ? items.map((item) => { const labels = resolveAppointmentLabels(item, directoryQuery.directory); return <button type="button" className={`agenda-list-item ${statusClass(item.status)}`} key={item.id} onClick={() => openDetails(item.id)}><time>{timeText(item.inicio)} – {timeText(item.fim)}</time><strong>{labels.clientName}</strong><span>{labels.serviceName}</span><span>{labels.professionalName}</span><span className="agenda-status-text">{statusLabel[item.status]}</span><span>Ver detalhes →</span></button> }) : <p>Nenhum agendamento nesta data.</p>}</section> })}</div> : <>
      <div className="agenda-grid-scroll" tabIndex={0} aria-label={`Agenda por ${view}`}><div className="agenda-grid" style={{ '--columns': columns.length } as CSSProperties}>
        <div className="agenda-grid-head"><div>Horário</div>{columns.map((column) => <div className={column.date === today ? 'agenda-heading today' : 'agenda-heading'} key={column.id}>{view === 'dia' ? <>{column.image ? <img src={column.image} alt="" /> : <span className="agenda-avatar">{column.label.slice(0, 1)}</span>}<strong>{column.label}</strong></> : <><span>{column.label}</span><strong>{dateText(column.date, { day: 'numeric', month: 'short' })}</strong>{column.date === today && <em>Hoje</em>}</>}</div>)}</div>
        <div className="agenda-times" style={{ height: (endMinute - startMinute) * px }}>{ticks.map((minute) => <time key={minute} style={{ top: (minute - startMinute) * px }}>{formatMinute(minute)}</time>)}</div>
        {columns.map((column) => { const items = visible.filter((item) => item.inicio.slice(0, 10) === column.date && (view !== 'dia' || item.profissionalId === column.professionalId)); const positions = layout(items); const professional = view === 'dia' ? professionals.find((item) => item.id === column.professionalId) : selectedProfessional; const work = professional?.horariosTrabalho.filter((hour) => hour.diaSemana === weekdays[parseDate(column.date).getDay()]) ?? []; return <div className="agenda-day-track" key={column.id} style={{ height: (endMinute - startMinute) * px }}>
          {ticks.slice(0, -1).map((minute) => { const available = !professional || work.some((hour) => minutes(`0000-00-00T${hour.inicio}`) <= minute && minutes(`0000-00-00T${hour.fim}`) >= minute + 30); return <button key={minute} type="button" className={available ? 'agenda-time-cell' : 'agenda-time-cell unavailable'} style={{ top: (minute - startMinute) * px, height: 30 * px }} title={available ? `Criar agendamento em ${column.date} às ${formatMinute(minute)}` : 'Fora do horário de atendimento'} disabled={!available || column.date < today} onClick={() => openCreate({ date: column.date, start: formatMinute(minute), professionalId: column.professionalId || undefined })} aria-label={`Criar agendamento em ${column.date} às ${formatMinute(minute)}${view === 'dia' ? ` com ${column.label}` : ''}`} /> })}
          {items.map((item) => { const labels = resolveAppointmentLabels(item, directoryQuery.directory); const position = positions.get(item.id)!; const height = Math.max(1, (minutes(item.fim) - minutes(item.inicio)) * px); const style = { top: (minutes(item.inicio) - startMinute) * px, height, left: `${position.lane / position.count * 100}%`, width: `${100 / position.count}%` }; return <button type="button" className={`agenda-event ${statusClass(item.status)}${height < 28 ? ' short' : ''}`} key={item.id} style={style} onClick={() => openDetails(item.id)} aria-label={`${timeText(item.inicio)} a ${timeText(item.fim)}, ${labels.clientName}, ${labels.serviceName}, ${labels.professionalName}, ${statusLabel[item.status]}`}><small>{timeText(item.inicio)} – {timeText(item.fim)}</small><strong>{labels.clientName}</strong>{height >= 35 && <span>{labels.serviceName}</span>}{height >= 62 && view === 'semana' && <span>{labels.professionalName}</span>}</button> })}
          {column.date === today && currentMinutes >= startMinute && currentMinutes <= endMinute && <div className="agenda-now" style={{ top: (currentMinutes - startMinute) * px }}><span>{formatMinute(currentMinutes)}</span></div>}
        </div> })}
      </div></div>
      <div className="agenda-mobile-list"><div className="agenda-mobile-days">{dates.map((date) => <button type="button" key={date} className={date === selectedDate ? 'active' : ''} onClick={() => changeParam('data', date)}>{dateText(date, { weekday: 'short' })}<strong>{parseDate(date).getDate()}</strong></button>)}</div>{appointments.filter((item) => item.inicio.slice(0, 10) === selectedDate).sort((a, b) => a.inicio.localeCompare(b.inicio)).map((item) => { const labels = resolveAppointmentLabels(item, directoryQuery.directory); return <button type="button" className={`agenda-mobile-event ${statusClass(item.status)}`} key={item.id} onClick={() => openDetails(item.id)}><time>{timeText(item.inicio)} – {timeText(item.fim)}</time><strong>{labels.clientName}</strong><span>{labels.serviceName} · {labels.professionalName}</span><small>{statusLabel[item.status]}</small></button> })}<button type="button" className="agenda-mobile-add" onClick={() => openCreate({ date: selectedDate, professionalId: validProfessionalId || undefined })}><Plus size={18} /> Novo agendamento</button></div>
      <div className="agenda-legend"><span className="agenda-status--confirmado">Confirmado</span><span className="agenda-status--pendente">Aguardando confirmação</span><span className="agenda-status--concluido">Concluído</span><span className="agenda-status--cancelado">Cancelado na lista</span><span className="agenda-unavailable">Fora do atendimento (profissional filtrado)</span></div>
    </>)}
    {(slot || selected) && <div className="agenda-panel-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) closePanel() }}><section ref={panelRef} tabIndex={-1} className="agenda-panel" role="dialog" aria-modal="true" aria-labelledby="agenda-panel-title"><button type="button" className="agenda-panel-close" aria-label="Fechar painel" onClick={closePanel}><X size={20} /></button>{slot ? <><h2 id="agenda-panel-title">Novo agendamento</h2><p>Preencha os dados para criar um novo atendimento.</p><div className="agenda-panel-context"><CalendarDays size={20} /><span>{dateText(slot.date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}{slot.start && <small>Início sugerido às {slot.start}</small>}</span></div><NewAppointmentForm key={`${slot.date}-${slot.start}-${slot.professionalId}`} initialDate={slot.date} initialStart={slot.start} initialProfessionalId={slot.professionalId} onSuccess={() => { closePanel(); setNotice('Agendamento criado — aguardando confirmação.'); void appointmentsQuery.refetch() }} /></> : selected && (() => { const labels = resolveAppointmentLabels(selected, directoryQuery.directory); return <><h2 id="agenda-panel-title">Detalhes do agendamento</h2><p className={`agenda-detail-status ${statusClass(selected.status)}`}>{statusLabel[selected.status]}</p><dl className="agenda-detail-list"><dt>Cliente</dt><dd>{labels.clientName}</dd><dt>Serviço</dt><dd>{labels.serviceName}</dd><dt>Profissional</dt><dd>{labels.professionalName}</dd><dt>Data</dt><dd>{dateText(selected.inicio.slice(0, 10), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</dd><dt>Horário</dt><dd>{timeText(selected.inicio)} – {timeText(selected.fim)}</dd><dt>Duração</dt><dd>{minutes(selected.fim) - minutes(selected.inicio)} minutos</dd><dt>Preço registrado</dt><dd>Não registrado</dd></dl><AppointmentActions appointment={selected} serviceName={labels.serviceName} professionalName={labels.professionalName} /></> })()}</section></div>}
  </section>
}
