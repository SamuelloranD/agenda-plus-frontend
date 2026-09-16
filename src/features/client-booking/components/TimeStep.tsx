import { ErrorState } from '../../../components/ui/ErrorState'
import { LoadingState } from '../../../components/ui/LoadingState'
import type { AggregatedAvailabilitySlot, SelectedAvailabilitySlot } from '../types'

interface TimeStepProps {
  date: string
  slots: AggregatedAvailabilitySlot[]
  selectedSlot: SelectedAvailabilitySlot | null
  isLoading: boolean
  isError: boolean
  onRetry: () => void
  onDateChange: (date: string) => void
  onSelect: (slot: AggregatedAvailabilitySlot) => void
}

function todayKey() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

function timeLabel(isoDate: string) {
  return isoDate.slice(11, 16)
}

export function TimeStep({ date, slots, selectedSlot, isLoading, isError, onRetry, onDateChange, onSelect }: TimeStepProps) {
  return (
    <section className="booking-step" aria-labelledby="time-step-title">
      <header className="booking-step__header">
        <p className="eyebrow">MOMENTO CERTO</p>
        <h2 id="time-step-title">Escolha a data e o horário</h2>
        <p>Os horários abaixo refletem a disponibilidade atual da equipe.</p>
      </header>
      <label className="booking-date-field">
        <span>DATA DO ATENDIMENTO</span>
        <input type="date" min={todayKey()} value={date} onChange={(event) => onDateChange(event.target.value)} />
      </label>
      {isLoading && <LoadingState message="Consultando as agendas…" />}
      {isError && <ErrorState message="Não foi possível consultar todos os horários." onRetry={onRetry} />}
      {!isLoading && !isError && slots.length === 0 && (
        <p className="booking-empty-slots">Não há horários livres nesta data. Experimente outro dia.</p>
      )}
      {!isLoading && !isError && slots.length > 0 && (
        <div className="booking-time-grid" aria-label="Horários disponíveis">
          {slots.map((slot) => (
            <button
              className={selectedSlot?.key === slot.key ? 'booking-time booking-time--selected' : 'booking-time'}
              type="button"
              key={slot.key}
              onClick={() => onSelect(slot)}
              aria-pressed={selectedSlot?.key === slot.key}
            >
              <strong>{timeLabel(slot.inicio)}</strong>
              <span>até {timeLabel(slot.fim)}</span>
              {slot.candidates.length > 1 && <small>{slot.candidates.length} profissionais livres</small>}
            </button>
          ))}
        </div>
      )}
    </section>
  )
}
