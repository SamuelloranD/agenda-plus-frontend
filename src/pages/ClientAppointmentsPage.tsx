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
      <style>{clientAppointmentsStyles}</style>
      {isLoading && <LoadingState message="Preparando seus agendamentos…" />}
      {!isLoading && isError && (
        <ErrorState message="Não foi possível carregar seus agendamentos." onRetry={retryQueries} />
      )}
      {!isLoading && !isError && appointments.data?.conteudo.length === 0 && (
        <EmptyState message="Você ainda não possui agendamentos." />
      )}
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
              <button
                type="button"
                aria-label="Página anterior"
                disabled={page === 0}
                onClick={() => setPage((current) => Math.max(0, current - 1))}
              >
                Anterior
              </button>
              <span aria-live="polite">Página {page + 1} de {appointments.data.totalPaginas}</span>
              <button
                type="button"
                aria-label="Próxima página"
                disabled={page >= appointments.data.totalPaginas - 1}
                onClick={() => setPage((current) => Math.min(appointments.data!.totalPaginas - 1, current + 1))}
              >
                Próxima
              </button>
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
  return (
    <section className="client-appointments-section" aria-labelledby={`section-${title.replaceAll(' ', '-').toLowerCase()}`}>
      <header>
        <div>
          <h2 id={`section-${title.replaceAll(' ', '-').toLowerCase()}`}>{title}</h2>
          <p>{subtitle}</p>
        </div>
        <span>{appointments.length.toString().padStart(2, '0')}</span>
      </header>
      {appointments.length === 0 ? (
        <p className="client-appointments-section__empty">{emptyMessage}</p>
      ) : (
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

const clientAppointmentsStyles = `
.client-appointments-page{padding:0 0 52px}.client-appointments-sections{display:grid;gap:48px}.client-appointments-section>header{display:flex;align-items:end;justify-content:space-between;gap:24px;padding-bottom:16px;border-bottom:1px solid var(--line)}.client-appointments-section>header h2{margin:0;font:500 clamp(27px,3vw,36px)/1.1 'Newsreader',Georgia,serif}.client-appointments-section>header p{margin:8px 0 0;color:var(--muted-ink);font-size:13px}.client-appointments-section>header>span{color:var(--terracotta);font:italic 500 26px 'Newsreader',Georgia,serif}.client-appointments-list{display:grid;gap:12px;margin-top:18px}.client-appointments-section__empty{margin:18px 0 0;padding:25px;color:var(--muted-ink);background:#f8f3ea;border:1px dashed var(--line);font-size:13px}.client-appointments-pagination{display:flex;align-items:center;justify-content:center;gap:16px;margin-top:-18px}.client-appointments-pagination span{color:var(--muted-ink);font-size:12px}.client-appointments-pagination button{min-width:100px;padding:10px 14px;color:var(--terracotta);background:transparent;border:1px solid var(--terracotta);border-radius:3px;cursor:pointer;font-size:12px;font-weight:700}.client-appointments-pagination button:hover:not(:disabled){color:#fff;background:var(--terracotta)}.client-appointments-pagination button:disabled{cursor:not-allowed;opacity:.45}.client-appointment-card{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:24px;padding:22px 24px;background:#fffdf9;border:1px solid var(--line);border-left:4px solid var(--olive);box-shadow:0 8px 22px rgb(60 45 30 / 5%)}.client-appointment-card__main{min-width:0}.client-appointment-card__heading{display:flex;align-items:flex-start;justify-content:space-between;gap:16px}.client-appointment-card__date{margin:0 0 7px;color:var(--terracotta);font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:capitalize}.client-appointment-card h3{margin:0;font:600 23px/1.2 'Newsreader',Georgia,serif}.client-appointment-card__details{display:flex;flex-wrap:wrap;gap:18px 34px;margin:20px 0 0}.client-appointment-card__details div{display:grid;gap:4px}.client-appointment-card__details dt{color:var(--muted-ink);font-size:9px;font-weight:700;letter-spacing:.12em;text-transform:uppercase}.client-appointment-card__details dd{margin:0;font-size:13px}.client-appointment-card__cancel{min-width:112px;padding:11px 15px;color:var(--terracotta);background:transparent;border:1px solid var(--terracotta);border-radius:3px;cursor:pointer;font-size:12px;font-weight:700}.client-appointment-card__cancel:hover{color:#fff;background:var(--terracotta)}.cancel-dialog-backdrop{position:fixed;inset:0;z-index:20;display:grid;place-items:center;padding:20px;background:rgb(31 31 30 / 68%)}.cancel-dialog{width:min(100%,520px);max-height:calc(100svh - 40px);overflow:auto;padding:clamp(26px,5vw,42px);background:var(--paper);border:1px solid var(--line);box-shadow:0 24px 70px rgb(31 31 30 / 32%)}.cancel-dialog h2{margin:8px 0 0;font:500 36px/1.1 'Newsreader',Georgia,serif}.cancel-dialog>p:not(.section-label,.cancel-dialog__error){margin:14px 0 0;color:var(--muted-ink);font-size:13px;line-height:1.65}.cancel-dialog dl{margin:26px 0}.cancel-dialog dl div{display:grid;grid-template-columns:100px 1fr;gap:15px;padding:11px 0;border-bottom:1px solid var(--line)}.cancel-dialog dt{color:var(--muted-ink);font-size:9px;font-weight:700;letter-spacing:.1em;text-transform:uppercase}.cancel-dialog dd{margin:0;font-size:13px;font-weight:600}.cancel-dialog__error{margin:0 0 18px;padding:11px 13px;color:#8f2f21;background:#fff2ed;border-left:3px solid var(--terracotta);font-size:12px;line-height:1.5}.cancel-dialog footer{display:flex;justify-content:flex-end;gap:10px}.cancel-dialog footer button:disabled{cursor:wait;opacity:.65}@media(max-width:620px){.client-appointment-card{grid-template-columns:1fr;padding:19px}.client-appointment-card__heading{align-items:flex-start}.client-appointment-card__cancel{width:100%}.client-appointments-pagination{flex-wrap:wrap}.cancel-dialog footer{display:grid}.cancel-dialog footer button{width:100%}}
`
