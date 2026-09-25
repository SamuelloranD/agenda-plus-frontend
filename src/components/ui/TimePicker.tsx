import { Clock } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

interface TimePickerProps {
  id: string
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  invalid?: boolean
}

const hours = Array.from({ length: 24 }, (_, index) => String(index).padStart(2, '0'))
const minutes = Array.from({ length: 60 }, (_, index) => String(index).padStart(2, '0'))

function splitTime(value: string) {
  const [hour = '09', minute = '00'] = value.split(':')
  return {
    hour: hours.includes(hour) ? hour : '09',
    minute: minutes.includes(minute) ? minute : '00',
  }
}

export function TimePicker({ id, value, onChange, onBlur, invalid = false }: TimePickerProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const selected = splitTime(value)
  const displayValue = `${selected.hour}:${selected.minute}`

  useEffect(() => {
    if (!open) return

    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
        onBlur?.()
      }
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
        onBlur?.()
      }
    }

    document.addEventListener('pointerdown', closeOnOutsidePointer)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsidePointer)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [onBlur, open])

  function selectPart(part: 'hour' | 'minute', nextValue: string) {
    onChange(part === 'hour' ? `${nextValue}:${selected.minute}` : `${selected.hour}:${nextValue}`)
  }

  return (
    <div className="time-picker" ref={rootRef}>
      <button
        className="time-picker__trigger"
        id={id}
        type="button"
        aria-label={`Horário ${displayValue}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-invalid={invalid || undefined}
        onClick={() => setOpen((current) => !current)}
      >
        <span>{displayValue}</span>
        <Clock className="time-picker__icon" size={17} strokeWidth={1.8} aria-hidden="true" />
      </button>
      {open && (
        <div className="time-picker__popover" role="dialog" aria-label="Selecionar horário">
          <div className="time-picker__columns">
            <div className="time-picker__list" role="listbox" aria-label="Horas">
              {hours.map((hour) => <button className={hour === selected.hour ? 'time-picker__option time-picker__option--selected' : 'time-picker__option'} type="button" role="option" aria-selected={hour === selected.hour} key={hour} onClick={() => selectPart('hour', hour)}>{hour}</button>)}
            </div>
            <div className="time-picker__list" role="listbox" aria-label="Minutos">
              {minutes.map((minute) => <button className={minute === selected.minute ? 'time-picker__option time-picker__option--selected' : 'time-picker__option'} type="button" role="option" aria-selected={minute === selected.minute} key={minute} onClick={() => selectPart('minute', minute)}>{minute}</button>)}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
