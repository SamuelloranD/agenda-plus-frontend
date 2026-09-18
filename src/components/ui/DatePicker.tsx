import { useEffect, useRef, useState } from 'react'

interface DatePickerProps {
  id: string
  value: string
  min?: string
  label?: string
  disabled?: boolean
  onChange: (value: string) => void
}

const MONTHS = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
]
const WEEKDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

function parseDateKey(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function todayKey() {
  return dateKey(new Date())
}

function monthStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function monthValue(date: Date) {
  return date.getFullYear() * 12 + date.getMonth()
}

function formatDate(value: string) {
  const date = parseDateKey(value)
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`
}

export function DatePicker({ id, value, min = todayKey(), label = 'Data do atendimento', disabled = false, onChange }: DatePickerProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const initialDate = value ? parseDateKey(value) : parseDateKey(min)
  const [open, setOpen] = useState(false)
  const [visibleMonth, setVisibleMonth] = useState(monthStart(initialDate))

  useEffect(() => {
    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }

    document.addEventListener('pointerdown', closeOnOutsidePointer)
    return () => document.removeEventListener('pointerdown', closeOnOutsidePointer)
  }, [])

  const minimumDate = parseDateKey(min)
  const firstDay = monthStart(visibleMonth)
  const daysInMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 0).getDate()
  const leadingDays = firstDay.getDay()
  const cells = Array.from({ length: leadingDays + daysInMonth }, (_, index) => index < leadingDays ? null : index - leadingDays + 1)
  const monthLabel = `${MONTHS[visibleMonth.getMonth()]} de ${visibleMonth.getFullYear()}`
  const previousMonthDisabled = monthValue(visibleMonth) <= monthValue(minimumDate)

  function chooseDay(day: number) {
    const selectedDate = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), day)
    if (dateKey(selectedDate) < min) return
    onChange(dateKey(selectedDate))
    setOpen(false)
  }

  return (
    <div className="ui-date-picker" ref={rootRef}>
      <button
        className={value ? 'ui-date-picker__trigger' : 'ui-date-picker__trigger ui-date-picker__trigger--placeholder'}
        id={id}
        type="button"
        aria-label={label}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={`${id}-calendar`}
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
      >
        <span>{value ? formatDate(value) : 'Selecione uma data'}</span>
        <svg className="ui-date-picker__icon" viewBox="0 0 24 24" focusable="false" aria-hidden="true">
          <rect x="3.5" y="5.5" width="17" height="15" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <path d="M7 3.5v4M17 3.5v4M3.5 10h17" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
        </svg>
      </button>
      {open && (
        <div className="ui-date-picker__popover" id={`${id}-calendar`} role="dialog" aria-label={`Escolha ${label.toLowerCase()}`}>
          <div className="ui-date-picker__header">
            <button type="button" aria-label="Mês anterior" disabled={previousMonthDisabled} onClick={() => setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))}>‹</button>
            <strong>{monthLabel}</strong>
            <button type="button" aria-label="Próximo mês" onClick={() => setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))}>›</button>
          </div>
          <div className="ui-date-picker__weekdays" role="row">
            {WEEKDAYS.map((weekday, index) => <span key={`${weekday}-${index}`} role="columnheader">{weekday}</span>)}
          </div>
          <div className="ui-date-picker__days" role="grid" aria-label={monthLabel}>
            {cells.map((day, index) => day === null
              ? <span key={`empty-${index}`} aria-hidden="true" />
              : <button
                className={value === dateKey(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), day)) ? 'ui-date-picker__day ui-date-picker__day--selected' : 'ui-date-picker__day'}
                type="button"
                key={day}
                aria-label={`${day} de ${MONTHS[visibleMonth.getMonth()]} de ${visibleMonth.getFullYear()}`}
                aria-selected={value === dateKey(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), day))}
                disabled={dateKey(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), day)) < min}
                onClick={() => chooseDay(day)}
              >{day}</button>)}
          </div>
        </div>
      )}
    </div>
  )
}
