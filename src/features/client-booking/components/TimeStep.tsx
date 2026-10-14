import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, ChevronLeft, ChevronRight, Moon, Sun, Zap } from 'lucide-react'
import { ErrorState } from '../../../components/ui/ErrorState'
import { LoadingState } from '../../../components/ui/LoadingState'
import { DatePicker } from '../../../components/ui/DatePicker'
import type { AggregatedAvailabilitySlot, SelectedAvailabilitySlot } from '../types'
import { addCalendarDays, apiSlotTimestamp, utcDateKey } from '../utils/bookingTime'

export type ShiftFilter = 'all' | 'morning' | 'afternoon'

interface TimeStepProps {
  date: string
  slots: AggregatedAvailabilitySlot[]
  selectedSlot: SelectedAvailabilitySlot | null
  isLoading: boolean
  isError: boolean
  isPartialError?: boolean
  onRetry: () => void
  onDateChange: (date: string) => void
  onSelect: (slot: AggregatedAvailabilitySlot) => void
  onFindNext?: (shift: ShiftFilter) => Promise<void>
  nextSearchPending?: boolean
  nextSearchMessage?: string | null
}

function dateFromKey(value: string) {
  return new Date(`${value}T00:00:00Z`)
}

function shiftOf(slot: AggregatedAvailabilitySlot): 'morning' | 'afternoon' | 'evening' {
  const hour = Number(slot.inicio.slice(11, 13))
  return hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening'
}

const groups = [
  { id: 'morning', label: 'Manhã', Icon: Sun },
  { id: 'afternoon', label: 'Tarde', Icon: Sun },
  { id: 'evening', label: 'Noite', Icon: Moon },
] as const

function dayLabel(value: string) { return `${value.slice(8, 10)}/${value.slice(5, 7)}` }

export function TimeStep({ date, slots, selectedSlot, isLoading, isError, isPartialError = false, onRetry, onDateChange, onSelect, onFindNext, nextSearchPending = false, nextSearchMessage }: TimeStepProps) {
  const [shift, setShift] = useState<ShiftFilter>('all')
  const [quickWindow, setQuickWindow] = useState({ anchor: date, start: date })
  const [now, setNow] = useState(() => Date.now())
  const today = utcDateKey(new Date(now))
  const firstVisibleDate = quickWindow.anchor === date ? quickWindow.start : date
  const days = Array.from({ length: 5 }, (_, index) => addCalendarDays(firstVisibleDate, index))
  const futureSlots = useMemo(() => slots.filter((slot) => apiSlotTimestamp(slot.inicio) > now).sort((a, b) => a.inicio.localeCompare(b.inicio)), [slots, now])
  const visibleGroups = groups.filter((group) => shift === 'all' || group.id === shift)
  const shownCount = visibleGroups.reduce((count, group) => count + futureSlots.filter((slot) => shiftOf(slot) === group.id).length, 0)
  const firstSlot = futureSlots.find((slot) => shift === 'all' || shiftOf(slot) === shift)

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000)
    return () => window.clearInterval(timer)
  }, [])

  return (
    <section className="booking-step booking-time-step" aria-labelledby="time-step-title">
      <header className="booking-step__header">
        <p className="eyebrow">PASSO 3 DE 4</p>
        <h2 id="time-step-title">Escolha a data e o horário</h2>
        <p>Os horários abaixo refletem a disponibilidade atual da equipe.</p>
      </header>
      <div className="booking-date-row">
        <div className="booking-date-field">
          <label htmlFor="booking-date">Data do atendimento</label>
          <DatePicker id="booking-date" value={date} min={today} onChange={onDateChange} />
        </div>
        <div className="booking-quick-dates" role="group" aria-label="Próximos dias">
          <button className="booking-quick-prev" type="button" aria-label="Mostrar dias anteriores" disabled={firstVisibleDate <= today} onClick={() => {
            const previous = addCalendarDays(firstVisibleDate, -5)
            setQuickWindow({ anchor: date, start: previous < today ? today : previous })
          }}><ChevronLeft size={20} aria-hidden="true" /></button>
          <div className="booking-quick-days">
            {days.map((day) => {
              const weekday = new Intl.DateTimeFormat('pt-BR', { weekday: 'short', timeZone: 'UTC' }).format(dateFromKey(day)).replace('.', '')
              return <button key={day} type="button" className={`booking-quick-date${day === date ? ' booking-quick-date--selected' : ''}`} disabled={day < today} aria-pressed={day === date} aria-label={`${weekday} ${dayLabel(day)}`} onClick={() => onDateChange(day)}><span>{weekday}</span><strong>{dayLabel(day)}</strong></button>
            })}
          </div>
          <button className="booking-quick-next" type="button" aria-label="Mostrar próximos dias" onClick={() => setQuickWindow({ anchor: date, start: addCalendarDays(firstVisibleDate, 5) })}><ChevronRight size={20} aria-hidden="true" /></button>
        </div>
      </div>
      <div className="booking-time-toolbar">
        <div className="booking-filters">
          <span>Filtrar horários</span>
          <div className="booking-filter-options" role="group" aria-label="Filtrar horários por turno">
            {([['all', 'Todos'], ['morning', 'Manhã'], ['afternoon', 'Tarde']] as const).map(([value, label]) => <button key={value} type="button" aria-pressed={shift === value} className={shift === value ? 'booking-filter booking-filter--selected' : 'booking-filter'} onClick={() => setShift(value)}>{label}</button>)}
          </div>
        </div>
        <button className="booking-next-available" type="button" disabled={!onFindNext || nextSearchPending} onClick={() => void onFindNext?.(shift)}>
          <Zap size={19} aria-hidden="true" />
          <span><strong>Próximo horário disponível</strong><small>{nextSearchPending ? 'Procurando horários…' : date === today && firstSlot ? `Hoje às ${firstSlot.inicio.slice(11, 16)}` : 'Buscar a partir de hoje'}</small></span>
          <ArrowRight size={16} aria-hidden="true" />
        </button>
      </div>
      {nextSearchMessage && <p className="booking-next-message" role="status">{nextSearchMessage}</p>}
      {selectedSlot && shift !== 'all' && shiftOf(selectedSlot) !== shift && <p className="booking-filter-notice">Seu horário selecionado está em outro turno. <button type="button" onClick={() => setShift('all')}>Mostrar todos</button></p>}
      <div aria-live="polite">
        {isLoading && <LoadingState message="Consultando as agendas…" />}
        {isError && <ErrorState message="Não foi possível consultar os horários desta data." onRetry={onRetry} />}
        {!isLoading && !isError && isPartialError && <p className="booking-partial-error" role="status">Algumas agendas não puderam ser consultadas. <button type="button" onClick={onRetry}>Tentar novamente</button></p>}
        {!isLoading && !isError && futureSlots.length === 0 && <p className="booking-empty-slots">{isPartialError ? 'Nenhum horário encontrado nas agendas consultadas. Tente novamente para verificar as demais.' : 'Não há horários livres nesta data. Escolha outro dia ou busque a próxima disponibilidade.'}</p>}
        {!isLoading && !isError && futureSlots.length > 0 && shownCount === 0 && <p className="booking-empty-slots">Não há horários neste turno. <button type="button" onClick={() => setShift('all')}>Ver todos os horários</button></p>}
        {!isLoading && !isError && shownCount > 0 && visibleGroups.map(({ id, label, Icon }) => {
          const groupSlots = futureSlots.filter((slot) => shiftOf(slot) === id)
          if (!groupSlots.length) return null
          return <section className="booking-slot-group" key={id} aria-label={`Horários da ${label.toLowerCase()}`}>
            <div className="booking-slot-group__heading"><Icon size={24} strokeWidth={1.8} aria-hidden="true" /><strong>{label}</strong><span className="booking-slot-group__rule" /><small>{groupSlots.length} horário{groupSlots.length === 1 ? '' : 's'} disponíve{groupSlots.length === 1 ? 'l' : 'is'}</small></div>
            <div className="booking-time-grid" aria-label={`Horários disponíveis: ${label}`}>
              {groupSlots.map((slot) => <button className={selectedSlot?.key === slot.key ? 'booking-time booking-time--selected' : 'booking-time'} type="button" key={slot.key} onClick={() => onSelect(slot)} aria-pressed={selectedSlot?.key === slot.key} aria-label={`${slot.inicio.slice(11, 16)}, ${slot.candidates.length} profissional${slot.candidates.length === 1 ? '' : 'is'} livre${slot.candidates.length === 1 ? '' : 's'}`}><strong>{slot.inicio.slice(11, 16)}</strong><small>{slot.candidates.length} profissional{slot.candidates.length === 1 ? '' : 'is'} livre{slot.candidates.length === 1 ? '' : 's'}</small></button>)}
            </div>
          </section>
        })}
      </div>
    </section>
  )
}
