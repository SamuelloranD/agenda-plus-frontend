import { useMemo, useRef, useState } from 'react'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { LoadingState } from '../components/ui/LoadingState'
import { CancelAppointmentDialog } from '../features/client-appointments/components/CancelAppointmentDialog'
import { ClientAppointmentCard } from '../features/client-appointments/components/ClientAppointmentCard'
import {
  buildAppointmentNameMaps,
  resolveClientAppointmentNames,
  splitClientAppointments,
} from '../features/client-appointments/utils/appointmentPresentation'
import { useProfessionals } from '../features/professionals/hooks/useProfessionals'
import { useCancelAgendamento } from '../features/scheduling/hooks/useCancelAgendamento'
import { useAgendamentos } from '../features/scheduling/hooks/useAgendamentos'
import { useServices } from '../features/services/hooks/useServices'
import { useAuthStore } from '../store/authStore'
import type { AgendamentoResponse } from '../types/scheduling'

function cancellationErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) return error.message
  if (typeof error === 'object' && error && 'message' in error && typeof error.message === 'string' && error.message.trim()) {
    return error.message
  }
  return 'Não foi possível cancelar agora. Verifique a janela de cancelamento e tente novamente.'
}

export function ClientAppointmentsPage() {
  const sectionRef = useRef<HTMLElement>(null)
  const user = useAuthStore((state) => state.user)
  const [page, setPage] = useState(0)
  const appointments = useAgendamentos({ clienteId: user?.id, escopo: 'cliente', pagina: page, tamanho: 20 })
  const professionals = useProfessionals()
  const services = useServices()
  const cancel = useCancelAgendamento()
  const [selectedAppointment, setSelectedAppointment] = useState<AgendamentoResponse | null>(null)
  const [cancelError, setCancelError] = useState<string | null>(null)

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
  const selectedNames = selectedAppointment ? resolveClientAppointmentNames(selectedAppointment, names) : null
  const isLoading = appointments.isLoading || professionals.isLoading || services.isLoading
  const isError = appointments.isError || professionals.isError || services.isError

  function openCancelDialog(appointment: AgendamentoResponse) {
    setCancelError(null)
    setSelectedAppointment(appointment)
  }

  function closeCancelDialog() {
    if (cancel.isPending) return
    setCancelError(null)
    setSelectedAppointment(null)
  }

  async function confirmCancellation() {
    if (!selectedAppointment) return
    setCancelError(null)
    try {
      await cancel.mutateAsync(selectedAppointment.id)
      setSelectedAppointment(null)
    } catch (error) {
      setCancelError(cancellationErrorMessage(error))
    }
  }

  const retryQueries = () => void Promise.all([
    appointments.refetch(),
    professionals.refetch(),
    services.refetch(),
  ])

  return (
    <section ref={sectionRef} className="client-appointments-page" aria-label="Meus agendamentos" tabIndex={-1}>
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
            onCancel={openCancelDialog}
          />
          <AppointmentSection
            title="Histórico"
            subtitle="Atendimentos concluídos, cancelados ou que já passaram."
            appointments={groupedAppointments.history}
            emptyMessage="Seu histórico ainda está vazio."
            names={names}
            servicePrices={servicePrices}
            onCancel={openCancelDialog}
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
      {selectedAppointment && selectedNames && (
        <CancelAppointmentDialog
          focusFallbackRef={sectionRef}
          appointment={selectedAppointment}
          names={selectedNames}
          isPending={cancel.isPending}
          errorMessage={cancelError}
          onClose={closeCancelDialog}
          onConfirm={() => void confirmCancellation()}
        />
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
  onCancel: (appointment: AgendamentoResponse) => void
}

function AppointmentSection({ title, subtitle, appointments, emptyMessage, names, servicePrices, onCancel }: AppointmentSectionProps) {
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
              onCancel={() => onCancel(appointment)}
            />
          ))}
        </div>
      )}
    </section>
  )
}
