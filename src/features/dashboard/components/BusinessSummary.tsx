import { BarChart3, Clock3, Scissors, UsersRound } from 'lucide-react'
import type { AgendamentoResponse } from '../../../types/scheduling'
import type { AppointmentDirectory } from '../../scheduling/utils/appointmentDirectory'

export function BusinessSummary({ appointments, directory }: { appointments: AgendamentoResponse[]; directory: AppointmentDirectory }) {
  const available = Math.max(directory.professionals.size * 8, 8)
  const occupancy = Math.min(100, Math.round((appointments.filter(({ status }) => status !== 'CANCELADO').length / available) * 100))
  const serviceCounts = new Map<string, number>()
  const professionalCounts = new Map<string, number>()
  appointments.forEach((appointment) => {
    if (appointment.status === 'CANCELADO') return
    serviceCounts.set(appointment.servicoId, (serviceCounts.get(appointment.servicoId) ?? 0) + 1)
    professionalCounts.set(appointment.profissionalId, (professionalCounts.get(appointment.profissionalId) ?? 0) + 1)
  })
  const topService = [...serviceCounts.entries()].sort((a, b) => b[1] - a[1])[0]
  const topProfessional = [...professionalCounts.entries()].sort((a, b) => b[1] - a[1])[0]
  const next = appointments.filter(({ status }) => status !== 'CANCELADO').toSorted((a, b) => a.inicio.localeCompare(b.inicio))[0]
  return <section className="dashboard-panel business-summary" aria-labelledby="business-heading"><header className="dashboard-panel__header"><span className="dashboard-panel__heading-icon dashboard-panel__heading-icon--mustard"><BarChart3 size={24} aria-hidden="true" /></span><div><h2 id="business-heading">Seu negócio hoje</h2></div></header><div className="business-summary__items">
    <div className="business-summary__item"><span className="business-summary__icon"><Clock3 size={20} /></span><div><strong>Taxa de ocupação <b>{occupancy}%</b></strong><span>{appointments.length} de {available} horários disponíveis</span><i><em style={{ width: `${occupancy}%` }} /></i></div></div>
    <div className="business-summary__item"><span className="business-summary__icon"><Scissors size={20} /></span><div><strong>Serviços mais agendados</strong><span>{topService ? `${directory.services.get(topService[0]) ?? 'Serviço'} (${topService[1]})` : 'Nenhum serviço agendado'}</span></div></div>
    <div className="business-summary__item"><span className="business-summary__icon"><UsersRound size={20} /></span><div><strong>Profissional mais demandado</strong><span>{topProfessional ? `${directory.professionals.get(topProfessional[0]) ?? 'Profissional'} (${topProfessional[1]} agendamentos)` : 'Nenhum profissional'}</span></div></div>
    <div className="business-summary__item"><span className="business-summary__icon"><Clock3 size={20} /></span><div><strong>Próximo atendimento</strong><span>{next ? `${new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long' }).format(new Date(next.inicio))} às ${next.inicio.slice(11, 16)}` : 'Nenhum próximo atendimento'}</span>{next && <small>{directory.clients.get(next.clienteId) ?? 'Cliente'} · {directory.services.get(next.servicoId) ?? 'Serviço'} com {directory.professionals.get(next.profissionalId) ?? 'profissional'}</small>}</div></div>
  </div></section>
}
