import { useEffect, useMemo, useRef, useState } from 'react'
import { CalendarDays, Check, ChevronDown, Search } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ErrorState } from '../components/ui/ErrorState'
import { LoadingState } from '../components/ui/LoadingState'
import { ClientAppointmentCard } from '../features/client-appointments/components/ClientAppointmentCard'
import { ClientAppointmentHistoryRow } from '../features/client-appointments/components/ClientAppointmentHistoryRow'
import {
  buildAppointmentNameMaps,
  formatAppointmentDate,
  resolveClientAppointmentNames,
  splitClientAppointments,
} from '../features/client-appointments/utils/appointmentPresentation'
import { useProfessionals } from '../features/professionals/hooks/useProfessionals'
import { useAgendamentos } from '../features/scheduling/hooks/useAgendamentos'
import { useServices } from '../features/services/hooks/useServices'
import { useAuthStore } from '../store/authStore'
import type { AgendamentoResponse, AgendamentoStatus } from '../types/scheduling'

type StatusFilter = 'TODOS' | Extract<AgendamentoStatus, 'PENDENTE' | 'CONFIRMADO' | 'CANCELADO'>
type PeriodFilter = 'all' | 'next7' | 'next30' | 'past30'

const statusFilters: { value: StatusFilter; label: string }[] = [
  { value: 'TODOS', label: 'Todos' },
  { value: 'PENDENTE', label: 'Pendentes' },
  { value: 'CONFIRMADO', label: 'Confirmados' },
  { value: 'CANCELADO', label: 'Cancelados' },
]
const periodOptions: { value: PeriodFilter; label: string }[] = [
  { value: 'all', label: 'Todos os períodos' },
  { value: 'next7', label: 'Próximos 7 dias' },
  { value: 'next30', label: 'Próximos 30 dias' },
  { value: 'past30', label: 'Últimos 30 dias' },
]
const noAppointments: AgendamentoResponse[] = []

function PeriodFilterControl({ value, onChange }: { value: PeriodFilter; onChange: (value: PeriodFilter) => void }) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const closeOutside = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', closeOutside)
    return () => document.removeEventListener('pointerdown', closeOutside)
  }, [open])

  const selectedLabel = value === 'all' ? 'Filtrar por período' : periodOptions.find((option) => option.value === value)?.label

  return (
    <div
      className={`client-appointments-period${open ? ' is-open' : ''}`}
      ref={containerRef}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && open) {
          event.preventDefault()
          setOpen(false)
          triggerRef.current?.focus()
        }
      }}
    >
      <button
        type="button"
        className="client-appointments-period__trigger"
        ref={triggerRef}
        aria-label="Filtrar por período"
        aria-expanded={open}
        aria-controls={open ? 'client-appointments-period-options' : undefined}
        onClick={() => setOpen((current) => !current)}
      >
        <CalendarDays size={18} aria-hidden="true" />
        <span>{selectedLabel}</span>
        <ChevronDown size={15} aria-hidden="true" />
      </button>
      {open && (
        <div className="client-appointments-period__menu" id="client-appointments-period-options" role="group" aria-label="Opções de período">
          {periodOptions.map((option) => (
            <button
              type="button"
              key={option.value}
              className={value === option.value ? 'is-selected' : ''}
              aria-pressed={value === option.value}
              onClick={() => {
                onChange(option.value)
                setOpen(false)
                triggerRef.current?.focus()
              }}
            >
              <span>{option.label}</span>
              {value === option.value && <Check size={16} aria-hidden="true" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function normalise(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR')
}

function matchesPeriod(appointment: AgendamentoResponse, period: PeriodFilter, now: Date) {
  if (period === 'all') return true
  const date = new Date(`${appointment.inicio.slice(0, 10)}T00:00:00Z`).getTime()
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
  const days = Math.floor((date - today) / 86_400_000)
  if (period === 'next7') return days >= 0 && days <= 7
  if (period === 'next30') return days >= 0 && days <= 30
  return days < 0 && days >= -30
}

export function ClientAppointmentsPage() {
  const user = useAuthStore((state) => state.user)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('TODOS')
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('all')
  const [search, setSearch] = useState('')
  const appointments = useAgendamentos({ clienteId: user?.id, escopo: 'cliente', tamanho: 100 }, { allPages: true })
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
  const allAppointments = appointments.data?.conteudo ?? noAppointments
  const counts = useMemo(() => ({
    TODOS: allAppointments.length,
    PENDENTE: allAppointments.filter(({ status }) => status === 'PENDENTE').length,
    CONFIRMADO: allAppointments.filter(({ status }) => status === 'CONFIRMADO').length,
    CANCELADO: allAppointments.filter(({ status }) => status === 'CANCELADO').length,
  }), [allAppointments])
  const filteredAppointments = useMemo(() => {
    const query = normalise(search.trim())
    const now = new Date()
    return allAppointments.filter((appointment) => {
      if (statusFilter !== 'TODOS' && appointment.status !== statusFilter) return false
      if (!matchesPeriod(appointment, periodFilter, now)) return false
      if (!query) return true
      const resolved = resolveClientAppointmentNames(appointment, names)
      const date = formatAppointmentDate(appointment.inicio)
      const shortDate = `${appointment.inicio.slice(8, 10)}/${appointment.inicio.slice(5, 7)}/${appointment.inicio.slice(0, 4)}`
      return normalise(`${resolved.serviceName} ${resolved.professionalName} ${date} ${shortDate}`).includes(query)
    })
  }, [allAppointments, statusFilter, periodFilter, search, names])
  const groupedAppointments = useMemo(() => splitClientAppointments(filteredAppointments), [filteredAppointments])
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
      {!isLoading && !isError && (
        <>
          {allAppointments.length > 0 && (
            <div className="client-appointments-toolbar">
              <div className="client-appointments-tabs" role="group" aria-label="Filtrar por status">
                {statusFilters.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    className={statusFilter === value ? 'is-active' : ''}
                    aria-pressed={statusFilter === value}
                    onClick={() => setStatusFilter(value)}
                  >{label} ({counts[value]})</button>
                ))}
              </div>
              <div className="client-appointments-controls">
                <label className="client-appointments-search">
                  <Search size={18} aria-hidden="true" />
                  <input type="search" aria-label="Buscar agendamentos" placeholder="Buscar por serviço, profissional ou data..." value={search} onChange={(event) => setSearch(event.target.value)} />
                </label>
                <PeriodFilterControl value={periodFilter} onChange={setPeriodFilter} />
              </div>
            </div>
          )}
          {allAppointments.length === 0 ? (
            <AppointmentsEmptyState />
          ) : filteredAppointments.length === 0 ? (
            <div className="client-appointments-no-results" role="status">Nenhum agendamento encontrado para os filtros selecionados.</div>
          ) : (
            <div className="client-appointments-sections">
              <AppointmentSection
                title="Próximos agendamentos"
                subtitle="Seus próximos horários confirmados ou aguardando confirmação."
                appointments={groupedAppointments.upcoming}
                emptyMessage="Nenhum próximo agendamento."
                names={names}
                servicePrices={servicePrices}
                view="upcoming"
              />
              <AppointmentSection
                title="Histórico"
                subtitle="Atendimentos concluídos, cancelados ou que já passaram."
                appointments={groupedAppointments.history}
                emptyMessage="Seu histórico ainda está vazio."
                names={names}
                servicePrices={servicePrices}
                view="history"
              />
            </div>
          )}
        </>
      )}
    </section>
  )
}

function AppointmentsEmptyState() {
  return (
    <div className="client-appointments-empty">
      <span className="client-appointments-empty__icon"><CalendarDays size={23} aria-hidden="true" /></span>
      <div>
        <strong>Você ainda não tem agendamentos.</strong>
        <p>Que tal agendar um horário agora?</p>
        <Link to="/agendar">Novo agendamento</Link>
      </div>
    </div>
  )
}

interface AppointmentSectionProps {
  title: string
  subtitle: string
  appointments: AgendamentoResponse[]
  emptyMessage: string
  names: ReturnType<typeof buildAppointmentNameMaps>
  servicePrices: ReadonlyMap<string, number>
  view: 'upcoming' | 'history'
}

function AppointmentSection({ title, subtitle, appointments, emptyMessage, names, servicePrices, view }: AppointmentSectionProps) {
  const sectionId = view === 'history' ? 'client-history' : 'client-upcoming'
  return (
    <section className={`client-appointments-section client-appointments-section--${view}`} aria-labelledby={sectionId}>
      <header>
        <div>
          <h2 id={sectionId}>{title}</h2>
          <p>{subtitle}</p>
        </div>
        <span>{appointments.length} {appointments.length === 1 ? 'agendamento' : 'agendamentos'}</span>
      </header>
      {appointments.length === 0 ? <p className="client-appointments-section__empty">{emptyMessage}</p> : (
        <div className="client-appointments-list">
          {appointments.map((appointment) => view === 'upcoming' ? (
            <ClientAppointmentCard
              key={appointment.id}
              appointment={appointment}
              names={resolveClientAppointmentNames(appointment, names)}
              price={servicePrices.get(appointment.servicoId)}
            />
          ) : (
            <ClientAppointmentHistoryRow
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
