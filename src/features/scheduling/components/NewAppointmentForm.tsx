import { useState, type FormEvent } from 'react'
import { DatePicker } from '../../../components/ui/DatePicker'
import { ErrorState } from '../../../components/ui/ErrorState'
import { LoadingState } from '../../../components/ui/LoadingState'
import { Select } from '../../../components/ui/Select'
import { useClients } from '../../clients/hooks/useClients'
import { useProfessionals } from '../../professionals/hooks/useProfessionals'
import { useServices } from '../../services/hooks/useServices'
import { useCreateAgendamento } from '../hooks/useCreateAgendamento'
import { useHorariosDisponiveis } from '../hooks/useHorariosDisponiveis'

interface Props { onSuccess: () => void; initialDate?: string; initialStart?: string; initialProfessionalId?: string }
const todayKey = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` }
const money = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

export function NewAppointmentForm({ onSuccess, initialDate, initialStart, initialProfessionalId }: Props) {
  const [date, setDate] = useState(initialDate ?? todayKey)
  const [time, setTime] = useState(initialStart ?? '')
  const [clientId, setClientId] = useState('')
  const [serviceId, setServiceId] = useState('')
  const [professionalId, setProfessionalId] = useState(initialProfessionalId ?? '')
  const [error, setError] = useState('')
  const clients = useClients()
  const services = useServices()
  const professionals = useProfessionals()
  const create = useCreateAgendamento()
  const availability = useHorariosDisponiveis({ profissionalId: professionalId, servicoId: serviceId, data: date })
  const service = services.data?.find((item) => item.id === serviceId)
  const slot = availability.data?.find((item) => item.inicio.slice(11, 16) === time)
  const eligibleClients = (clients.data ?? []).filter((client) => client.role === 'CLIENTE')

  if (clients.isLoading || services.isLoading || professionals.isLoading) return <LoadingState message="Carregando dados do agendamento…" />
  if (clients.isError || services.isError || professionals.isError) return <ErrorState message="Não foi possível carregar os dados para criar o agendamento." onRetry={() => void Promise.all([clients.refetch(), services.refetch(), professionals.refetch()])} />

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    if (!clientId || !serviceId || !professionalId || !slot) { setError('Selecione cliente, serviço, profissional e um horário disponível.'); return }
    try {
      await create.mutateAsync({ clienteId: clientId, servicoId: serviceId, profissionalId: professionalId, inicio: slot.inicio, fim: slot.fim })
      onSuccess()
    } catch (cause) {
      const response = cause as { status?: number; message?: string }
      setError(response.status === 409 ? 'Este horário acabou de ser reservado. Escolha outro.' : response.message ?? 'Não foi possível criar o agendamento.')
      void availability.refetch()
    }
  }

  return <form className="agenda-create-form" onSubmit={(event) => void submit(event)}>
    <label>Cliente <span aria-hidden="true">*</span><Select id="appointment-client" value={clientId} onChange={setClientId} searchable options={eligibleClients.map((client) => ({ value: client.id, label: `${client.nome} · ${client.email}` }))} placeholder="Buscar cliente por nome ou e-mail" /></label>
    {eligibleClients.length === 0 && <p role="status">Cadastre um cliente antes de criar o agendamento.</p>}
    <label>Serviço <span aria-hidden="true">*</span><Select id="appointment-service" value={serviceId} onChange={setServiceId} options={(services.data ?? []).filter((item) => item.ativo !== false).map((item) => ({ value: item.id, label: `${item.nome} · ${item.duracaoMinutos} min · ${money(item.preco.valor)}` }))} placeholder="Selecione o serviço" /></label>
    <label>Profissional <span aria-hidden="true">*</span><Select id="appointment-professional" value={professionalId} onChange={setProfessionalId} options={(professionals.data ?? []).filter((item) => item.ativo !== false).map((item) => ({ value: item.id, label: item.nome }))} placeholder="Selecione o profissional" /></label>
    <div className="agenda-form-row"><label>Data <span aria-hidden="true">*</span><DatePicker id="appointment-date" value={date} min={todayKey()} onChange={setDate} /></label><label>Início <span aria-hidden="true">*</span><Select id="appointment-time" value={slot ? time : ''} onChange={setTime} options={(availability.data ?? []).map((item) => ({ value: item.inicio.slice(11, 16), label: `${item.inicio.slice(11, 16)} – ${item.fim.slice(11, 16)}` }))} placeholder="Selecione um horário" disabled={!serviceId || !professionalId || availability.isLoading} /></label></div>
    {availability.isLoading && <p role="status">Consultando horários disponíveis…</p>}
    {availability.isError && <p role="alert">Não foi possível consultar a disponibilidade. Altere a data ou tente novamente.</p>}
    {availability.data?.length === 0 && <p role="status">Não há horários disponíveis nesta data.</p>}
    {time && !slot && !availability.isLoading && <p role="alert">O horário selecionado não está disponível. Escolha outro.</p>}
    <div className="agenda-form-summary"><span>Duração <strong>{service ? `${service.duracaoMinutos} min` : '—'}</strong></span><span>Término <strong>{slot ? slot.fim.slice(11, 16) : '—'}</strong></span><span>Valor atual <strong>{service ? money(service.preco.valor) : '—'}</strong></span></div>
    <p className="agenda-form-note">O agendamento será criado como pendente. O valor exibido é o preço atual do serviço; o sistema não registra um preço histórico no agendamento.</p>
    {error && <p className="form-error" role="alert">{error}</p>}
    <button className="primary-action" type="submit" disabled={create.isPending || !slot || !clientId || !serviceId || !professionalId}>{create.isPending ? 'Criando…' : 'Criar agendamento'}</button>
  </form>
}
