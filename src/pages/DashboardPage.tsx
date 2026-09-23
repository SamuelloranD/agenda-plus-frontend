import { ErrorState } from '../components/ui/ErrorState'
import { LoadingState } from '../components/ui/LoadingState'
import { MetricCard } from '../features/dashboard/components/MetricCard'
import { TodayAppointments } from '../features/dashboard/components/TodayAppointments'
import { calculateExpectedBilling, deriveDashboardMetrics } from '../features/dashboard/utils/dashboardMetrics'
import { useAppointmentDirectory } from '../features/scheduling/hooks/useAppointmentDirectory'
import { useAgendamentos } from '../features/scheduling/hooks/useAgendamentos'

function dateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function DashboardPage() {
  const today = new Date()
  const key = dateKey(today)
  const appointmentsQuery = useAgendamentos({ dataInicio: key, dataFim: key, tamanho: 100 }, { allPages: true })
  const directoryQuery = useAppointmentDirectory()

  if (appointmentsQuery.isLoading || directoryQuery.isLoading) return <LoadingState message="Abrindo o caderno de hoje…" />
  if (appointmentsQuery.isError || directoryQuery.isError) return <ErrorState message="Não foi possível carregar o painel." onRetry={() => void Promise.all([appointmentsQuery.refetch(), directoryQuery.refetch()])} />

  const appointments = appointmentsQuery.data?.conteudo ?? []
  const metrics = deriveDashboardMetrics(appointments, today)
  const expectedBilling = calculateExpectedBilling(appointments, directoryQuery.directory.servicePrices)
  const formattedDate = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' }).format(today)
  const billingLabel = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(expectedBilling)

  return <section className="dashboard-page">
    <style>{dashboardStyles}</style><style>{dashboardOverrides}</style><style>{appointmentActionStyles}</style>
    <header className="dashboard-lead"><p className="section-label">{formattedDate} · caderno diário</p><h2>O ritmo do seu negócio, <em>em uma só&nbsp;folha.</em></h2></header>
    <div className="metric-grid" aria-label="Resumo dos agendamentos">
      <MetricCard label="Atendimentos hoje" value={metrics.todayCount} tone="terracotta" note="volume do dia" />
      <MetricCard label="Pendentes" value={metrics.pendingCount} tone="mustard" note="aguardam confirmação" />
      <MetricCard label="Confirmados" value={metrics.confirmedCount} tone="olive" note="agenda assegurada" />
      <MetricCard label="Cancelados" value={metrics.cancelledCount} tone="muted" note="registro do dia" />
      <MetricCard label="Faturamento previsto" value={billingLabel} tone="terracotta" note="pendentes, confirmados e concluídos" />
    </div>
    <section className="today-panel" aria-labelledby="today-heading"><div className="section-heading"><div><p className="section-label">Linha do tempo</p><h3 id="today-heading">Atendimentos de hoje</h3></div><span>{metrics.todayCount} registros</span></div><TodayAppointments appointments={metrics.todayAppointments} directory={directoryQuery.directory} /></section>
  </section>
}

const dashboardStyles = `
.dashboard-page{background-image:radial-gradient(#d9cfc0 .6px,transparent .6px);background-size:18px 18px;padding:2px 0 48px}.dashboard-lead{max-width:820px;margin-bottom:32px}.section-label{margin:0 0 9px;color:var(--terracotta);font-size:10px;font-weight:700;letter-spacing:.16em;text-transform:uppercase}.dashboard-lead h2{margin:0;font:400 clamp(34px,4vw,54px)/1.04 'Newsreader',Georgia,serif;letter-spacing:-.025em}.dashboard-lead h2 em{color:var(--terracotta);font-weight:400}.metric-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));border:1px solid var(--line);background:#f4efe6}.metric-card{min-height:180px;padding:24px;border-right:1px solid var(--line);background:rgb(251 249 245 / 72%)}.metric-card:last-child{border-right:0}.metric-card p{margin:0;font-size:10px;font-weight:700;letter-spacing:.12em;text-transform:uppercase}.metric-card strong{display:block;margin:20px 0 13px;font:500 42px/1 'Newsreader',Georgia,serif}.metric-card span{color:var(--muted-ink);font-size:12px}.metric-card--terracotta strong{color:var(--terracotta)}.metric-card--olive strong{color:var(--olive)}.metric-card--mustard strong{color:#97630d}.metric-card--muted strong{color:var(--muted-ink)}.today-panel{margin-top:32px;padding:28px;background:rgb(244 239 230 / 72%);border:1px solid var(--line)}.section-heading{display:flex;align-items:flex-end;justify-content:space-between;gap:20px;margin-bottom:20px}.section-heading h3{margin:0;font:500 29px/1.15 'Newsreader',Georgia,serif}.section-heading>span{color:var(--muted-ink);font-size:11px;letter-spacing:.08em;text-transform:uppercase}.today-list{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;margin:0;padding:0;list-style:none}.today-item{display:grid;grid-template-columns:minmax(0,1fr) auto;grid-template-rows:auto 1fr auto;align-items:start;gap:12px;padding:16px;background:var(--paper);border:1px solid var(--line);border-left:4px solid var(--line);box-shadow:0 6px 16px rgb(60 45 30 / 4%)}.today-item--pendente{border-left-color:var(--mustard)}.today-item--confirmado{border-left-color:var(--olive)}.today-item--cancelado{border-left-color:var(--terracotta)}.today-item time{grid-column:1;color:var(--terracotta);font:500 21px 'Newsreader',Georgia,serif}.today-item>div:not(.appointment-status-row){grid-column:1/-1;min-width:0}.today-item strong,.today-item span{display:block}.today-item strong{margin-bottom:4px}.today-item span{color:var(--muted-ink);font-size:12px;line-height:1.4}.today-item .appointment-status-row{grid-column:1/-1;display:flex;align-items:center;gap:8px;flex-wrap:wrap;min-width:0}.appointment-actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.appointment-action{padding:7px 10px;border:1px solid var(--line);border-radius:3px;background:var(--paper);color:var(--ink);cursor:pointer;font-size:11px;font-weight:700}.appointment-action--confirm{color:var(--olive);border-color:var(--olive)}.appointment-action--cancel{color:var(--terracotta);border-color:var(--terracotta)}.appointment-action:disabled{cursor:wait;opacity:.6}.appointment-action-error{flex-basis:100%;color:#a52720;font-size:11px}@media(max-width:1180px){.metric-grid{grid-template-columns:repeat(3,1fr)}.today-list{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:980px){.metric-grid{grid-template-columns:repeat(2,1fr)}}@media(max-width:600px){.metric-grid{grid-template-columns:1fr}.metric-card{min-height:130px;border-right:0;border-bottom:1px solid var(--line)}.today-panel{padding:18px}.section-heading{align-items:flex-start;flex-direction:column}.today-list{grid-template-columns:1fr}.today-item{grid-template-columns:minmax(0,1fr) auto}.today-item .appointment-status-row{grid-column:1/-1}.appointment-actions{grid-column:auto}}
@media(min-width:1024px){.dashboard-lead{max-width:none}}
`

const appointmentActionStyles = `.appointment-status-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap;grid-column:3}.appointment-actions{grid-column:auto;margin:0}@media(max-width:600px){.appointment-status-row{grid-column:2}.appointment-actions{grid-column:auto}}`

const dashboardOverrides = `.today-item{grid-template-columns:1fr;grid-template-rows:auto 1fr auto;min-height:164px}.today-item>div:not(.today-item__footer){grid-column:auto}.today-item__footer{display:flex;align-items:flex-end;justify-content:space-between;gap:10px;min-width:0;margin-top:auto}.today-item .appointment-status-row{display:flex;align-items:center;gap:8px;min-width:0;flex-wrap:wrap}.today-item__price{white-space:nowrap;font-weight:700}.today-item__footer .appointment-actions{grid-column:auto;justify-content:flex-end}@media(max-width:600px){.today-item{min-height:148px}.today-item__footer{align-items:flex-start;flex-direction:column}.today-item__footer .appointment-actions{justify-content:flex-start}}`
