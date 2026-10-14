import { CalendarDays, Check, Clock3, DollarSign } from "lucide-react";
import { ErrorState } from "../components/ui/ErrorState";
import { LoadingState } from "../components/ui/LoadingState";
import { MetricCard } from "../features/dashboard/components/MetricCard";
import { DashboardAppointmentTable } from "../features/dashboard/components/DashboardAppointmentTable";
import { PendingAppointments } from "../features/dashboard/components/PendingAppointments";
import { BusinessSummary } from "../features/dashboard/components/BusinessSummary";
import {
  calculateExpectedBilling,
  deriveDashboardMetrics,
} from "../features/dashboard/utils/dashboardMetrics";
import { useAppointmentDirectory } from "../features/scheduling/hooks/useAppointmentDirectory";
import { useAgendamentos } from "../features/scheduling/hooks/useAgendamentos";

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function DashboardPage() {
  const today = new Date();
  const key = dateKey(today);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const appointmentsQuery = useAgendamentos(
    { dataInicio: key, dataFim: key, tamanho: 100 },
    { allPages: true },
  );
  const futureAppointmentsQuery = useAgendamentos(
    { dataInicio: dateKey(tomorrow), tamanho: 100 },
    { allPages: true },
  );
  const directoryQuery = useAppointmentDirectory();

  if (futureAppointmentsQuery.isLoading)
    return <LoadingState message="Abrindo a agenda futura..." />;
  if (futureAppointmentsQuery.isError)
    return (
      <ErrorState
        message="Não foi possível carregar os atendimentos futuros."
        onRetry={() => void futureAppointmentsQuery.refetch()}
      />
    );
  if (appointmentsQuery.isLoading || directoryQuery.isLoading)
    return <LoadingState message="Abrindo o painel..." />;
  if (appointmentsQuery.isError || directoryQuery.isError)
    return (
      <ErrorState
        message="Não foi possível carregar o painel."
        onRetry={() =>
          void Promise.all([
            appointmentsQuery.refetch(),
            directoryQuery.refetch(),
          ])
        }
      />
    );

  const appointments = appointmentsQuery.data?.conteudo ?? [];
  const futureAppointments = futureAppointmentsQuery.data?.conteudo ?? [];
  const allAppointments = [...appointments, ...futureAppointments];
  const metrics = deriveDashboardMetrics(appointments, today);
  const expectedBilling = calculateExpectedBilling(
    appointments,
    directoryQuery.directory.servicePrices,
  );
  const formattedBilling = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(expectedBilling);
  const pendingAppointments = allAppointments
    .filter(({ status }) => status === "PENDENTE")
    .toSorted((a, b) => a.inicio.localeCompare(b.inicio));
  const completedToday = appointments.filter(
    ({ status }) => status === "CONCLUIDO",
  ).length;
  const upcoming = futureAppointments.toSorted((a, b) =>
    a.inicio.localeCompare(b.inicio),
  );

  return (
    <section className="dashboard-page">
      <div className="dashboard-metrics" aria-label="Resumo do dia">
        <MetricCard
          label="Agendamentos de hoje"
          value={metrics.todayCount}
          tone="terracotta"
          note="+ 1 em relação a ontem"
          icon={<CalendarDays />}
          action="Ver agenda de hoje"
        />
        <MetricCard
          label="Concluídos hoje"
          value={completedToday}
          tone="olive"
          note={`de ${metrics.todayCount} agendamentos`}
          icon={<Check />}
          action="Ver detalhes"
        />
        <MetricCard
          label="Valor agendado hoje"
          value={formattedBilling}
          tone="neutral"
          note="Confirmados e concluídos"
          icon={<DollarSign />}
          action="Ver relatórios"
        />
        <MetricCard
          label="Aguardando confirmação"
          value={pendingAppointments.length}
          tone="mustard"
          note="Solicitações para hoje e próximos dias"
          icon={<Clock3 />}
          action="Ver solicitações"
        />
      </div>
      <div className="dashboard-layout">
        <div className="dashboard-layout__main">
          <section className="dashboard-panel" aria-labelledby="today-heading">
            <header className="dashboard-panel__header">
              <span className="dashboard-panel__heading-icon dashboard-panel__heading-icon--terracotta">
                <CalendarDays size={24} />
              </span>
              <div>
                <h2 id="today-heading">Atendimentos de hoje</h2>
                <p>
                  {new Intl.DateTimeFormat("pt-BR", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  }).format(today)}
                </p>
              </div>
              <a href="/painel/agenda">Ver agenda completa</a>
            </header>
            <DashboardAppointmentTable
              appointments={metrics.todayAppointments}
              directory={directoryQuery.directory}
            />
          </section>
          <section
            className="dashboard-panel"
            aria-labelledby="upcoming-heading"
          >
            <header className="dashboard-panel__header">
              <span className="dashboard-panel__heading-icon dashboard-panel__heading-icon--terracotta">
                <CalendarDays size={24} />
              </span>
              <div>
                <h2 id="upcoming-heading">Próximos agendamentos</h2>
                <p>A partir de amanhã · {upcoming.length} registros</p>
              </div>
              <a href="/painel/agenda">Ver agenda completa</a>
            </header>
            <DashboardAppointmentTable
              appointments={upcoming.slice(0, 5)}
              directory={directoryQuery.directory}
              showDate
            />
          </section>
        </div>
        <aside className="dashboard-layout__aside">
          <section
            className="dashboard-panel"
            aria-labelledby="pending-heading"
          >
            <header className="dashboard-panel__header">
              <span className="dashboard-panel__heading-icon dashboard-panel__heading-icon--mustard">
                <Clock3 size={24} />
              </span>
              <div>
                <h2 id="pending-heading">Aguardando confirmação</h2>
                <p>{pendingAppointments.length} solicitações pendentes</p>
              </div>
              <a href="/painel/agenda">Ver todas</a>
            </header>
            <PendingAppointments
              appointments={pendingAppointments}
              directory={directoryQuery.directory}
            />
          </section>
          <BusinessSummary
            appointments={allAppointments}
            directory={directoryQuery.directory}
          />
        </aside>
      </div>
    </section>
  );
}
