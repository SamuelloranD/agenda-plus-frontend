import type { ClienteResponse } from '../../../types/clients'
import type { ProfissionalResponse } from '../../../types/professionals'
import type { ServicoResponse } from '../../../types/services'

interface AppointmentDirectoryInput {
  clients: ClienteResponse[]
  professionals: ProfissionalResponse[]
  services: ServicoResponse[]
}

export interface AppointmentDirectory {
  clients: ReadonlyMap<string, string>
  professionals: ReadonlyMap<string, string>
  services: ReadonlyMap<string, string>
}

export interface AppointmentLabels {
  clientName: string
  serviceName: string
  professionalName: string
}

export function createAppointmentDirectory({ clients, professionals, services }: AppointmentDirectoryInput): AppointmentDirectory {
  return {
    clients: new Map(clients.map(({ id, nome }) => [id, nome])),
    professionals: new Map(professionals.map(({ id, nome }) => [id, nome])),
    services: new Map(services.map(({ id, nome }) => [id, nome])),
  }
}

function labelFor(map: ReadonlyMap<string, string>, id: string, fallback: string) {
  return map.get(id) ?? fallback
}

export function resolveAppointmentLabels(
  ids: { clienteId: string; servicoId: string; profissionalId: string },
  directory: AppointmentDirectory,
): AppointmentLabels {
  return {
    clientName: labelFor(directory.clients, ids.clienteId, 'Cliente não identificado'),
    serviceName: labelFor(directory.services, ids.servicoId, 'Serviço não identificado'),
    professionalName: labelFor(directory.professionals, ids.profissionalId, 'Profissional não identificado'),
  }
}
