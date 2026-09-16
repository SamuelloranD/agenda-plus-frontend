import type { AgendamentoResponse } from '../../../types/scheduling'
import { AppointmentCard } from './AppointmentCard'

interface WeeklyCalendarProps {
  weekStart: Date
  appointments: AgendamentoResponse[]
}

function addDays(date: Date, amount: number) {
  const result = new Date(date)
  result.setDate(result.getDate() + amount)
  return result
}

function dateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function WeeklyCalendar({ weekStart, appointments }: WeeklyCalendarProps) {
  const days = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index))
  const defaultTimes = ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00']
  const times = [...new Set([...defaultTimes, ...appointments.map(({ inicio }) => inicio.slice(11, 16))])].toSorted()
  const todayKey = dateKey(new Date())

  return (
    <div className="calendar-scroll" tabIndex={0} aria-label="Agenda semanal com rolagem horizontal">
      <div className="weekly-calendar" style={{ gridTemplateColumns: `86px repeat(${days.length}, minmax(150px, 1fr))` }}>
        <div className="calendar-corner">Horário</div>
        {days.map((day) => {
          const key = dateKey(day)
          return <header key={key} className={key === todayKey ? 'day-heading day-heading--today' : 'day-heading'}><span>{new Intl.DateTimeFormat('pt-BR', { weekday: 'short' }).format(day)}</span><strong>{day.getDate()}</strong></header>
        })}
        {times.map((time) => (
          <div className="calendar-row" key={time}>
            <time>{time}</time>
            {days.map((day) => {
              const key = dateKey(day)
              const cellAppointments = appointments.filter(({ inicio }) => inicio.slice(0, 10) === key && inicio.slice(11, 16) === time)
              return <div className="calendar-cell" key={`${key}-${time}`}>{cellAppointments.length > 0 ? cellAppointments.map((appointment) => <AppointmentCard key={appointment.id} appointment={appointment} />) : <span>+ Reservar</span>}</div>
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
