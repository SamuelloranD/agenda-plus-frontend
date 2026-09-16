import { describe, expect, it } from 'vitest'
import type { ProfissionalResponse } from '../../../types/professionals'
import type { ServicoResponse } from '../../../types/services'
import type { User } from '../../../types/auth'
import { createAppointmentDirectory, resolveAppointmentLabels } from './appointmentDirectory'

const professional: ProfissionalResponse = {
  id: 'professional-1',
  nome: 'João Silva',
  especialidade: 'Cabeleireiro',
  horariosTrabalho: [],
}

const service: ServicoResponse = {
  id: 'service-1',
  nome: 'Corte de Cabelo',
  duracaoMinutos: 45,
  preco: { valor: 80, moeda: 'BRL' },
}

const client: User = {
  id: 'client-1',
  nome: 'Maria Souza',
  email: 'maria@example.com',
  role: 'CLIENTE',
}

describe('appointment directory', () => {
  it('resolves client, service, and professional names by appointment IDs', () => {
    const directory = createAppointmentDirectory({
      clients: [client],
      professionals: [professional],
      services: [service],
    })

    expect(resolveAppointmentLabels({ clienteId: client.id, servicoId: service.id, profissionalId: professional.id }, directory)).toEqual({
      clientName: 'Maria Souza',
      serviceName: 'Corte de Cabelo',
      professionalName: 'João Silva',
    })
  })

  it('uses friendly labels when a catalog entry is unavailable', () => {
    const directory = createAppointmentDirectory({ clients: [], professionals: [], services: [] })

    expect(resolveAppointmentLabels({ clienteId: 'missing-client', servicoId: 'missing-service', profissionalId: 'missing-professional' }, directory)).toEqual({
      clientName: 'Cliente não identificado',
      serviceName: 'Serviço não identificado',
      professionalName: 'Profissional não identificado',
    })
  })
})
