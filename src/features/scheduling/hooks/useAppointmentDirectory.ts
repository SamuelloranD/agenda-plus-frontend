import { useClients } from '../../clients/hooks/useClients'
import { useProfessionals } from '../../professionals/hooks/useProfessionals'
import { useServices } from '../../services/hooks/useServices'
import { createAppointmentDirectory } from '../utils/appointmentDirectory'

export function useAppointmentDirectory() {
  const clientsQuery = useClients()
  const professionalsQuery = useProfessionals()
  const servicesQuery = useServices()

  const isLoading = clientsQuery.isLoading || professionalsQuery.isLoading || servicesQuery.isLoading
  const isError = clientsQuery.isError || professionalsQuery.isError || servicesQuery.isError

  return {
    directory: createAppointmentDirectory({
      clients: clientsQuery.data ?? [],
      professionals: professionalsQuery.data ?? [],
      services: servicesQuery.data ?? [],
    }),
    isLoading,
    isError,
    refetch: async () => {
      await Promise.all([clientsQuery.refetch(), professionalsQuery.refetch(), servicesQuery.refetch()])
    },
  }
}
