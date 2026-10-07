import type { AgendamentoResponse } from '../../../types/scheduling'
import { AppointmentCard } from './AppointmentCard'
import type { AppointmentDirectory } from '../utils/appointmentDirectory'
import type { CSSProperties } from 'react'

interface WeeklyCalendarProps {
  weekStart: Date
  appointments: AgendamentoResponse[]
  directory: AppointmentDirectory
  onReserve: (slot: ReservationSlot) => void
}

export interface ReservationSlot {
  date: string
  start: string
}

const CALENDAR_START_MINUTES = 8 * 60
const CALENDAR_END_MINUTES = 20 * 60
const CALENDAR_SLOT_MINUTES = 30
const CALENDAR_ROW_HEIGHT = 96

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

function accessibleDayLabel(date: Date) {
  return new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }).format(date)
}

function clockMinutes(value: string) {
  const [hours = '0', minutes = '0'] = value.slice(11, 16).split(':')
  return Number(hours) * 60 + Number(minutes)
}

function formatTime(minutes: number) {
  const hours = String(Math.floor(minutes / 60)).padStart(2, '0')
  const remainder = String(minutes % 60).padStart(2, '0')
  return `${hours}:${remainder}`
}

function floorToSlot(minutes: number) {
  return Math.floor(minutes / CALENDAR_SLOT_MINUTES) * CALENDAR_SLOT_MINUTES
}

function ceilToSlot(minutes: number) {
  return Math.ceil(minutes / CALENDAR_SLOT_MINUTES) * CALENDAR_SLOT_MINUTES
}

function calendarTimes(appointments: AgendamentoResponse[]) {
  const starts = appointments.map(({ inicio }) => clockMinutes(inicio))
  const ends = appointments.map(({ fim }) => clockMinutes(fim))
  const start = Math.min(CALENDAR_START_MINUTES, ...starts.map(floorToSlot))
  const end = Math.max(CALENDAR_END_MINUTES, ...ends.map(ceilToSlot))
  return Array.from({ length: Math.floor((end - start) / CALENDAR_SLOT_MINUTES) + 1 }, (_, index) => formatTime(start + index * CALENDAR_SLOT_MINUTES))
}

function appointmentStyle(appointment: AgendamentoResponse, cellStart: number): CSSProperties {
  const start = clockMinutes(appointment.inicio)
  const end = clockMinutes(appointment.fim)
  const pixelsPerMinute = CALENDAR_ROW_HEIGHT / CALENDAR_SLOT_MINUTES
  return {
    top: `${(start - cellStart) * pixelsPerMinute}px`,
    height: `${Math.max(end - start, 1) * pixelsPerMinute}px`,
  }
}

export function WeeklyCalendar({ weekStart, appointments, directory, onReserve }: WeeklyCalendarProps) {
  const days = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index))
  const times = calendarTimes(appointments)
  const todayKey = dateKey(new Date())

  return (
    <div className="calendar-scroll" tabIndex={0} aria-label="Agenda semanal com rolagem horizontal">
      <div className="weekly-calendar" role="grid" aria-label="Agenda semanal" aria-colcount={days.length + 1} style={{ gridTemplateColumns: `86px repeat(${days.length}, minmax(150px, 1fr))` }}>
        <div className="calendar-header-row" role="row" style={{ gridTemplateColumns: `86px repeat(${days.length}, minmax(150px, 1fr))` }}>
          <div className="calendar-corner" role="columnheader">Horário</div>
          {days.map((day) => {
            const key = dateKey(day)
            return <header key={key} className={key === todayKey ? 'day-heading day-heading--today' : 'day-heading'} role="columnheader" aria-label={accessibleDayLabel(day)}><span>{new Intl.DateTimeFormat('pt-BR', { weekday: 'short' }).format(day)}</span><strong>{day.getDate()}</strong></header>
          })}
        </div>
        {times.map((time) => (
          <div className="calendar-row" key={time} role="row" style={{ gridTemplateColumns: `86px repeat(${days.length}, minmax(150px, 1fr))` }}>
            <time role="rowheader" aria-label={`Horário ${time}`}>{time}</time>
            {days.map((day) => {
              const key = dateKey(day)
              const cellStart = clockMinutes(`0000-00-00T${time}`)
              const cellAppointments = appointments.filter(({ inicio }) => {
                const start = clockMinutes(inicio)
                return inicio.slice(0, 10) === key && start >= cellStart && start < cellStart + CALENDAR_SLOT_MINUTES
              })
              const dayLabel = accessibleDayLabel(day)
              const cellLabel = `${dayLabel}, ${time} — ${cellAppointments.length > 0 ? `${cellAppointments.length} agendamento${cellAppointments.length === 1 ? '' : 's'}` : 'reservar'}`
              return <div className="calendar-cell" key={`${key}-${time}`} role="gridcell" aria-label={cellLabel}>{cellAppointments.length > 0 ? cellAppointments.map((appointment) => <AppointmentCard key={appointment.id} appointment={appointment} directory={directory} style={appointmentStyle(appointment, cellStart)} />) : <button type="button" className="calendar-reserve" onClick={() => onReserve({ date: key, start: time })}>+ Reservar</button>}</div>
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
