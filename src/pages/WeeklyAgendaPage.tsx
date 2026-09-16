import { useState } from 'react'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { LoadingState } from '../components/ui/LoadingState'
import { WeeklyCalendar } from '../features/scheduling/components/WeeklyCalendar'
import { useAgendamentos } from '../features/scheduling/hooks/useAgendamentos'

function startOfWeek(date: Date) {
  const result = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12)
  const distanceFromMonday = (result.getDay() + 6) % 7
  result.setDate(result.getDate() - distanceFromMonday)
  return result
}

function addDays(date: Date, amount: number) {
  const result = new Date(date)
  result.setDate(result.getDate() + amount)
  return result
}

function dateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function WeeklyAgendaPage() {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()))
  const weekEnd = addDays(weekStart, 6)
  const appointmentsQuery = useAgendamentos({ dataInicio: dateKey(weekStart), dataFim: dateKey(weekEnd), tamanho: 100 }, { allPages: true })
  const rangeLabel = `${weekStart.getDate()} de ${new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(weekStart)} a ${weekEnd.getDate()} de ${new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(weekEnd)}`

  return (
    <section className="weekly-page">
      <style>{weeklyStyles}</style>
      <header className="weekly-toolbar">
        <div><p>Volume semanal · agenda do ateliê</p><h2>Semana de {rangeLabel}</h2></div>
        <div className="week-controls" aria-label="Navegação da semana">
          <button type="button" aria-label="Semana anterior" onClick={() => setWeekStart((current) => addDays(current, -7))}>‹</button>
          <button type="button" onClick={() => setWeekStart(startOfWeek(new Date()))}>Hoje</button>
          <button type="button" aria-label="Próxima semana" onClick={() => setWeekStart((current) => addDays(current, 7))}>›</button>
        </div>
      </header>
      {appointmentsQuery.isLoading && <LoadingState message="Preparando a agenda da semana…" />}
      {appointmentsQuery.isError && <ErrorState message="Não foi possível carregar a agenda semanal." onRetry={() => void appointmentsQuery.refetch()} />}
      {appointmentsQuery.data && appointmentsQuery.data.conteudo.length === 0 && <EmptyState message="Nenhum agendamento nesta semana. A grade permanece disponível para novas reservas." />}
      {appointmentsQuery.data && <WeeklyCalendar weekStart={weekStart} appointments={appointmentsQuery.data.conteudo} />}
    </section>
  )
}

const weeklyStyles = `
.weekly-page{padding:2px 0 48px}.weekly-toolbar{display:flex;align-items:flex-end;justify-content:space-between;gap:24px;margin-bottom:28px}.weekly-toolbar p{margin:0 0 8px;color:var(--terracotta);font-size:10px;font-weight:700;letter-spacing:.16em;text-transform:uppercase}.weekly-toolbar h2{max-width:820px;margin:0;font:400 clamp(32px,4vw,50px)/1.05 'Newsreader',Georgia,serif;letter-spacing:-.025em}.week-controls{display:flex;border:1px solid var(--line);background:#f4efe6}.week-controls button{min-width:46px;min-height:46px;padding:0 14px;color:var(--ink);background:transparent;border:0;border-right:1px solid var(--line);cursor:pointer}.week-controls button:last-child{border-right:0}.week-controls button:hover{background:#efe8dc}.calendar-scroll{overflow-x:auto;border:1px solid var(--line);background:#f4efe6;outline-offset:4px}.weekly-calendar{min-width:1160px;display:grid}.calendar-header-row{display:grid;grid-column:1/-1}.calendar-corner,.day-heading{position:sticky;top:0;z-index:1;min-height:86px;padding:16px;background:#efeae3;border-right:1px solid var(--line);border-bottom:1px solid var(--line)}.calendar-corner{left:0;z-index:2;display:flex;align-items:flex-end;color:var(--muted-ink);font-size:10px;letter-spacing:.12em;text-transform:uppercase}.day-heading span,.day-heading strong{display:block}.day-heading span{font-size:10px;letter-spacing:.12em;text-transform:uppercase}.day-heading strong{margin-top:8px;font:500 27px 'Newsreader',Georgia,serif}.day-heading--today{color:var(--paper);background:var(--terracotta)}.calendar-row{display:grid;grid-column:1/-1}.calendar-row>time{position:sticky;left:0;z-index:1;min-height:96px;padding:18px 14px;color:var(--muted-ink);background:#f4efe6;border-right:1px solid var(--line);border-bottom:1px solid var(--line);font-size:12px}.calendar-cell{min-height:96px;padding:8px;background:rgb(251 249 245 / 78%);border-right:1px solid var(--line);border-bottom:1px solid var(--line)}.calendar-cell>span{color:#aaa198;font-size:11px;letter-spacing:.04em}.appointment-card{display:grid;gap:5px;padding:10px;background:var(--paper);border:1px solid var(--line);border-left:4px solid var(--line)}.appointment-card--terracotta{border-left-color:var(--terracotta)}.appointment-card--olive{border-left-color:var(--olive)}.appointment-card--mustard{border-left-color:var(--mustard)}.appointment-card time{color:var(--terracotta);font-size:10px;font-weight:700}.appointment-card strong{font-size:13px}.appointment-card span,.appointment-card small{color:var(--muted-ink);font-size:10px}.appointment-card .status-badge{width:max-content;margin-top:3px;padding:2px 6px!important;font-size:8px!important}@media(max-width:760px){.weekly-toolbar{align-items:flex-start;flex-direction:column}.week-controls{width:100%}.week-controls button{flex:1}.weekly-toolbar h2{font-size:34px}}
`
