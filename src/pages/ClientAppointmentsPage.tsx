import { useMemo, useState } from 'react'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { LoadingState } from '../components/ui/LoadingState'
import { ClientAppointmentCard } from '../features/client-appointments/components/ClientAppointmentCard'
import {
  buildAppointmentNameMaps,
  resolveClientAppointmentNames,
  splitClientAppointments,
} from '../features/client-appointments/utils/appointmentPresentation'
import { useProfessionals } from '../features/professionals/hooks/useProfessionals'
import { useAgendamentos } from '../features/scheduling/hooks/useAgendamentos'
import { useServices } from '../features/services/hooks/useServices'
import { useAuthStore } from '../store/authStore'
import type { AgendamentoResponse } from '../types/scheduling'


export function ClientAppointmentsPage() {
  const user = useAuthStore((state) => state.user)
  const [page, setPage] = useState(0)
  const appointments = useAgendamentos({ clienteId: user?.id, escopo: 'cliente', pagina: page, tamanho: 20 })
  const professionals = useProfessionals()
  const services = useServices()

  const names = useMemo(
    () => buildAppointmentNameMaps(professionals.data ?? [], services.data ?? []),
    [professionals.data, services.data],
  )
  const servicePrices = useMemo(
    () => new Map((services.data ?? []).map(({ id, preco }) => [id, preco.valor])),
    [services.data],
  )
  const groupedAppointments = useMemo(
    () => splitClientAppointments(appointments.data?.conteudo ?? []),
    [appointments.data?.conteudo],
  )
  const isLoading = appointments.isLoading || professionals.isLoading || services.isLoading
  const isError = appointments.isError || professionals.isError || services.isError

  const retryQueries = () => void Promise.all([
    appointments.refetch(),
    professionals.refetch(),
    services.refetch(),
  ])

  return (
    <section className="client-appointments-page" aria-label="Meus agendamentos" tabIndex={-1}>
      {isLoading && <LoadingState message="Preparando seus agendamentos…" />}
      {!isLoading && isError && <ErrorState message="Não foi possível carregar seus agendamentos." onRetry={retryQueries} />}
      {!isLoading && !isError && appointments.data?.conteudo.length === 0 && <EmptyState message="Você ainda não possui agendamentos." />}
      {!isLoading && !isError && appointments.data && appointments.data.conteudo.length > 0 && (
        <div className="client-appointments-sections">
          <AppointmentSection
            title="Próximos agendamentos"
            subtitle="Seus próximos horários confirmados ou aguardando confirmação."
            appointments={groupedAppointments.upcoming}
            emptyMessage="Nenhum próximo agendamento."
            names={names}
            servicePrices={servicePrices}
          />
          <AppointmentSection
            title="Histórico"
            subtitle="Atendimentos concluídos, cancelados ou que já passaram."
            appointments={groupedAppointments.history}
            emptyMessage="Seu histórico ainda está vazio."
            names={names}
            servicePrices={servicePrices}
          />
          {appointments.data.totalPaginas > 1 && (
            <nav className="client-appointments-pagination" aria-label="Paginação dos agendamentos">
              <button type="button" aria-label="Página anterior" disabled={page === 0} onClick={() => setPage((current) => Math.max(0, current - 1))}>Anterior</button>
              <span aria-live="polite">Página {page + 1} de {appointments.data.totalPaginas}</span>
              <button type="button" aria-label="Próxima página" disabled={page >= appointments.data.totalPaginas - 1} onClick={() => setPage((current) => Math.min(appointments.data!.totalPaginas - 1, current + 1))}>Próxima</button>
            </nav>
          )}
        </div>
      )}
    </section>
  )
}

interface AppointmentSectionProps {
  title: string
  subtitle: string
  appointments: AgendamentoResponse[]
  emptyMessage: string
  names: ReturnType<typeof buildAppointmentNameMaps>
  servicePrices: ReadonlyMap<string, number>
}

function AppointmentSection({ title, subtitle, appointments, emptyMessage, names, servicePrices }: AppointmentSectionProps) {
  const sectionId = `section-${title.replaceAll(' ', '-').toLowerCase()}`
  return (
    <section className="client-appointments-section" aria-labelledby={sectionId}>
      <header>
        <div>
          <h2 id={sectionId}>{title}</h2>
          <p>{subtitle}</p>
        </div>
        <span>{appointments.length.toString().padStart(2, '0')}</span>
      </header>
      {appointments.length === 0 ? <p className="client-appointments-section__empty">{emptyMessage}</p> : (
        <div className="client-appointments-list">
          {appointments.map((appointment) => (
            <ClientAppointmentCard
              key={appointment.id}
              appointment={appointment}
              names={resolveClientAppointmentNames(appointment, names)}
              price={servicePrices.get(appointment.servicoId)}
            />
          ))}
        </div>
      )}
    </section>
  )
}
