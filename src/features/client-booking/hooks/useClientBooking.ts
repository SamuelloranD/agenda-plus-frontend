import { useEffect, useMemo, useState } from 'react'
import { useQueries } from '@tanstack/react-query'
import { schedulingApi } from '../../../services/api/scheduling'
import type { ServicoResponse } from '../../../types/services'
import { useSession } from '../../auth/hooks/useSession'
import { useProfessionals } from '../../professionals/hooks/useProfessionals'
import { useCreateAgendamento } from '../../scheduling/hooks/useCreateAgendamento'
import { useServices } from '../../services/hooks/useServices'
import {
  ANY_PROFESSIONAL_ID,
  type AggregatedAvailabilitySlot,
  type BookingStep,
  type ClientBookingSelection,
  type ConfirmedClientBooking,
} from '../types'
import { aggregateAvailability } from '../utils/aggregateAvailability'

const DRAFT_STORAGE_KEY = 'agenda-plus:client-booking-draft'

function todayKey() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

function emptySelection(): ClientBookingSelection {
  return { service: null, professionalChoice: null, date: todayKey(), slot: null }
}

function readDraft(): ClientBookingSelection {
  if (typeof sessionStorage === 'undefined') return emptySelection()

  try {
    const draft = JSON.parse(sessionStorage.getItem(DRAFT_STORAGE_KEY) ?? '') as ClientBookingSelection
    if (!draft || typeof draft.date !== 'string') return emptySelection()
    return draft
  } catch {
    return emptySelection()
  }
}

function initialStep(selection: ClientBookingSelection): BookingStep {
  if (!selection.service) return 'service'
  if (!selection.professionalChoice) return 'professional'
  return 'time'
}

export function useClientBooking() {
  const [selection, setSelection] = useState<ClientBookingSelection>(readDraft)
  const [step, setStep] = useState<BookingStep>(() => initialStep(readDraft()))
  const [confirmation, setConfirmation] = useState<ConfirmedClientBooking | null>(null)
  const servicesQuery = useServices()
  const professionalsQuery = useProfessionals()
  const createAppointment = useCreateAgendamento()
  const session = useSession()
  const professionals = useMemo(() => professionalsQuery.data ?? [], [professionalsQuery.data])

  useEffect(() => {
    sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(selection))
  }, [selection])

  const availabilityProfessionals = useMemo(() => {
    if (!selection.service || !selection.professionalChoice) return []
    if (selection.professionalChoice === ANY_PROFESSIONAL_ID) return professionals
    return professionals.filter(({ id }) => id === selection.professionalChoice)
  }, [professionals, selection.professionalChoice, selection.service])

  const availabilityQueries = useQueries({
    queries: availabilityProfessionals.map((professional) => ({
      queryKey: ['horarios-disponiveis', professional.id, selection.date, selection.service?.id ?? null],
      queryFn: () => schedulingApi.availableTimes({
        profissionalId: professional.id,
        data: selection.date,
        servicoId: selection.service!.id,
      }),
      enabled: Boolean(selection.date && selection.service),
    })),
  })

  const slots = useMemo(() => aggregateAvailability(
    availabilityProfessionals,
    Object.fromEntries(availabilityProfessionals.map((professional, index) => [
      professional.id,
      availabilityQueries[index]?.data,
    ])),
  ), [availabilityProfessionals, availabilityQueries])

  function selectService(service: ServicoResponse) {
    setSelection((current) => ({ ...current, service, professionalChoice: null, slot: null }))
    setStep('professional')
  }

  function selectProfessional(professionalChoice: string) {
    setSelection((current) => ({ ...current, professionalChoice, slot: null }))
    setStep('time')
  }

  function selectDate(date: string) {
    setSelection((current) => ({ ...current, date, slot: null }))
  }

  function selectSlot(slot: AggregatedAvailabilitySlot) {
    const assignedProfessional = slot.candidates[0]
    if (!assignedProfessional) return
    setSelection((current) => ({
      ...current,
      slot: { ...slot, profissionalId: assignedProfessional.id },
    }))
  }

  function goToStep(nextStep: BookingStep) {
    if (nextStep === 'professional' && !selection.service) return
    if (nextStep === 'time' && !selection.professionalChoice) return
    setStep(nextStep)
  }

  async function confirmBooking() {
    const { service, slot } = selection
    const user = session.user
    if (!service || !slot || !user || user.role !== 'CLIENTE') return null

    const assignedProfessional = slot.candidates.find(({ id }) => id === slot.profissionalId)
      ?? professionals.find(({ id }) => id === slot.profissionalId)
    if (!assignedProfessional) return null

    const appointment = await createAppointment.mutateAsync({
      inicio: slot.inicio,
      fim: slot.fim,
      profissionalId: slot.profissionalId,
      clienteId: user.id,
      servicoId: service.id,
    })
    const confirmed = { appointment, service, professional: assignedProfessional }
    setConfirmation(confirmed)
    sessionStorage.removeItem(DRAFT_STORAGE_KEY)
    return confirmed
  }

  return {
    step,
    selection,
    confirmation,
    servicesQuery,
    professionalsQuery,
    professionals,
    slots,
    availability: {
      isLoading: availabilityQueries.some((query) => query.isPending),
      isError: availabilityQueries.some((query) => query.isError),
      refetch: () => Promise.all(availabilityQueries.map((query) => query.refetch())),
    },
    session,
    createAppointment,
    selectService,
    selectProfessional,
    selectDate,
    selectSlot,
    goToStep,
    confirmBooking,
  }
}
