import { useState } from 'react'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { LoadingState } from '../components/ui/LoadingState'
import { WeeklyCalendar } from '../features/scheduling/components/WeeklyCalendar'
import type { ReservationSlot } from '../features/scheduling/components/WeeklyCalendar'
import { NewAppointmentForm } from '../features/scheduling/components/NewAppointmentForm'
import { NewAppointmentModal } from '../features/scheduling/components/NewAppointmentModal'
import { useAppointmentDirectory } from '../features/scheduling/hooks/useAppointmentDirectory'
import { useAgendamentos } from '../features/scheduling/hooks/useAgendamentos'

function startOfWeek(date: Date) {
  const result = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12)
  const distanceFromMonday = (result.getDay() + 6) % 7
  result.setDate(result.getDate() - distanceFromMonday)
  return result
}

function addDays(date: Date, amount: number) { const result = new Date(date); result.setDate(result.getDate() + amount); return result }
function dateKey(date: Date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}` }

export function WeeklyAgendaPage() {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()))
  const [reservationSlot, setReservationSlot] = useState<ReservationSlot | null>(null)
  const weekEnd = addDays(weekStart, 6)
  const appointmentsQuery = useAgendamentos({ dataInicio: dateKey(weekStart), dataFim: dateKey(weekEnd), tamanho: 100 }, { allPages: true })
  const directoryQuery = useAppointmentDirectory()
  const rangeLabel = `${weekStart.getDate()} de ${new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(weekStart)} a ${weekEnd.getDate()} de ${new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(weekEnd)}`

  return <section className="weekly-page"><header className="weekly-toolbar"><div><p>Volume semanal · agenda</p><h2>Semana de {rangeLabel}</h2></div><div className="week-controls" aria-label="Navegação da semana"><button type="button" aria-label="Semana anterior" onClick={() => setWeekStart((current) => addDays(current, -7))}>‹</button><button type="button" onClick={() => setWeekStart(startOfWeek(new Date()))}>Hoje</button><button type="button" aria-label="Próxima semana" onClick={() => setWeekStart((current) => addDays(current, 7))}>›</button></div></header>
    {(appointmentsQuery.isLoading || directoryQuery.isLoading) && <LoadingState message="Preparando a agenda da semana…" />}
    {(appointmentsQuery.isError || directoryQuery.isError) && <ErrorState message="Não foi possível carregar a agenda semanal." onRetry={() => void Promise.all([appointmentsQuery.refetch(), directoryQuery.refetch()])} />}
    {!appointmentsQuery.isLoading && !directoryQuery.isLoading && !appointmentsQuery.isError && !directoryQuery.isError && appointmentsQuery.data && appointmentsQuery.data.conteudo.length === 0 && <EmptyState message="Nenhum agendamento nesta semana. A grade permanece disponível para novas reservas." />}
    {!appointmentsQuery.isLoading && !directoryQuery.isLoading && !appointmentsQuery.isError && !directoryQuery.isError && appointmentsQuery.data && <WeeklyCalendar weekStart={weekStart} appointments={appointmentsQuery.data.conteudo} directory={directoryQuery.directory} onReserve={setReservationSlot} />}
    {reservationSlot && <NewAppointmentModal isOpen onClose={() => setReservationSlot(null)}>
      <header className="appointment-folio__header"><div><p className="section-label">Novo agendamento</p><h2 id="new-appointment-title">Folha de atendimento</h2></div><span>reserva rápida</span></header>
      <NewAppointmentForm key={`${reservationSlot.date}-${reservationSlot.start}`} initialDate={reservationSlot.date} initialStart={reservationSlot.start} onSuccess={() => { setReservationSlot(null); void appointmentsQuery.refetch() }} />
    </NewAppointmentModal>}
  </section>
}
