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
