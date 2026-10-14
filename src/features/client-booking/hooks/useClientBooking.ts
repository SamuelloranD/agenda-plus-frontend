import { useEffect, useMemo, useRef, useState } from 'react'
import { useQueries, useQueryClient } from '@tanstack/react-query'
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
import { addCalendarDays, apiSlotTimestamp, todayKey } from '../utils/bookingTime'
import type { ShiftFilter } from '../components/TimeStep'

const DRAFT_STORAGE_KEY = 'agenda-plus:client-booking-draft'
const NEXT_AVAILABILITY_DAYS = 30

function emptySelection(): ClientBookingSelection {
  return { service: null, professionalChoice: null, date: todayKey(), slot: null }
}

function readDraft(): ClientBookingSelection {
  if (typeof sessionStorage === 'undefined') return emptySelection()

  try {
    const draft = JSON.parse(sessionStorage.getItem(DRAFT_STORAGE_KEY) ?? '') as ClientBookingSelection
    if (!draft || typeof draft.date !== 'string') return emptySelection()
    if (draft.date < todayKey()) return { ...draft, date: todayKey(), slot: null }
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
  const queryClient = useQueryClient()
  const [selection, setSelection] = useState<ClientBookingSelection>(readDraft)
  const [step, setStep] = useState<BookingStep>(() => initialStep(readDraft()))
  const [confirmation, setConfirmation] = useState<ConfirmedClientBooking | null>(null)
  const [bookingError, setBookingError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [nextSearchPending, setNextSearchPending] = useState(false)
  const [nextSearchMessage, setNextSearchMessage] = useState<string | null>(null)
  const searchVersion = useRef(0)
  const submitting = useRef(false)
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

  function cancelSearch() {
    searchVersion.current += 1
    setNextSearchPending(false)
    setNextSearchMessage(null)
  }

  function selectService(service: ServicoResponse) {
    if (submitting.current) return
    cancelSearch()
    setBookingError(null)
    createAppointment.reset?.()
    setSelection((current) => ({
      ...current,
      service,
      slot: current.service?.id === service.id && current.service.duracaoMinutos === service.duracaoMinutos ? current.slot : null,
    }))
  }

  function selectProfessional(professionalChoice: string) {
    if (submitting.current) return
    cancelSearch()
    setBookingError(null)
    createAppointment.reset?.()
    setSelection((current) => ({ ...current, professionalChoice, slot: current.professionalChoice === professionalChoice ? current.slot : null }))
  }

  function startOver() {
    if (submitting.current) return
    cancelSearch()
    createAppointment.reset?.()
    setBookingError(null)
    setConfirmation(null)
    setSelection(emptySelection())
    setStep('service')
  }

  function selectDate(date: string) {
    if (submitting.current || date < todayKey()) return
    cancelSearch()
    setBookingError(null)
    createAppointment.reset?.()
    setSelection((current) => ({ ...current, date, slot: null }))
  }

  function selectSlot(slot: AggregatedAvailabilitySlot) {
    if (submitting.current) return
    const assignedProfessional = slot.candidates[0]
    if (!assignedProfessional) return
    cancelSearch()
    setBookingError(null)
    createAppointment.reset?.()
    setSelection((current) => ({
      ...current,
      slot: { ...slot, profissionalId: assignedProfessional.id },
    }))
  }

  function goToStep(nextStep: BookingStep) {
    if (submitting.current) return
    if (nextStep === 'professional' && !selection.service) return
    if (nextStep === 'time' && !selection.professionalChoice) return
    setStep(nextStep)
  }

  async function findNextAvailable(shift: ShiftFilter) {
    if (submitting.current || !selection.service || !availabilityProfessionals.length || nextSearchPending) return
    const version = ++searchVersion.current
    setNextSearchPending(true)
    setNextSearchMessage(null)
    const start = todayKey()
    try {
      let hadPartialError = false
      for (let offset = 0; offset < NEXT_AVAILABILITY_DAYS; offset += 1) {
        const date = addCalendarDays(start, offset)
        const responses = await Promise.allSettled(availabilityProfessionals.map((professional) => queryClient.fetchQuery({
          queryKey: ['horarios-disponiveis', professional.id, date, selection.service!.id],
          queryFn: () => schedulingApi.availableTimes({ profissionalId: professional.id, data: date, servicoId: selection.service!.id }),
          staleTime: 30_000,
        })))
        if (version !== searchVersion.current) return
        const failedCount = responses.filter((response) => response.status === 'rejected').length
        if (failedCount === responses.length) throw new Error('Nenhuma agenda pôde ser consultada')
        hadPartialError ||= failedCount > 0
        const successfulResponses = Object.fromEntries(availabilityProfessionals.flatMap((professional, index) => {
          const response = responses[index]
          return response.status === 'fulfilled' ? [[professional.id, response.value]] : []
        }))
        const candidates = aggregateAvailability(availabilityProfessionals, successfulResponses)
          .filter((slot) => apiSlotTimestamp(slot.inicio) > Date.now())
          .filter((slot) => shift === 'all' || (shift === 'morning' ? Number(slot.inicio.slice(11, 13)) < 12 : Number(slot.inicio.slice(11, 13)) >= 12 && Number(slot.inicio.slice(11, 13)) < 18))
          .sort((a, b) => a.inicio.localeCompare(b.inicio))
        if (candidates[0]) {
          const slot = candidates[0]
          setSelection((current) => ({ ...current, date, slot: { ...slot, profissionalId: slot.candidates[0].id } }))
          setNextSearchMessage(`Selecionado ${date.slice(8, 10)}/${date.slice(5, 7)} às ${slot.inicio.slice(11, 16)}.${hadPartialError ? ' Algumas agendas não puderam ser consultadas.' : ''}`)
          return
        }
      }
      setNextSearchMessage(`Nenhum horário encontrado nos próximos ${NEXT_AVAILABILITY_DAYS} dias${hadPartialError ? ' nas agendas consultadas' : ''}. Escolha outra data no calendário.`)
    } catch {
      if (version === searchVersion.current) setNextSearchMessage('Não foi possível procurar o próximo horário. Tente novamente.')
    } finally {
      if (version === searchVersion.current) setNextSearchPending(false)
    }
  }

  async function confirmBooking() {
    const { service, slot } = selection
    const user = session.user
    if (!service || !slot || !user || user.role !== 'CLIENTE' || submitting.current) return null

    const assignedProfessional = slot.candidates.find(({ id }) => id === slot.profissionalId)
      ?? professionals.find(({ id }) => id === slot.profissionalId)
    if (!assignedProfessional) return null
    submitting.current = true
    cancelSearch()
    setIsSubmitting(true)
    setBookingError(null)
    try {
      const currentTimes = await schedulingApi.availableTimes({ profissionalId: slot.profissionalId, data: selection.date, servicoId: service.id })
      if (!currentTimes.some((time) => time.inicio === slot.inicio && time.fim === slot.fim) || apiSlotTimestamp(slot.inicio) <= Date.now()) {
        setSelection((current) => ({ ...current, slot: null }))
        setBookingError('Este horário não está mais disponível. Escolha outra opção.')
        await Promise.all(availabilityQueries.map((query) => query.refetch()))
        return null
      }
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
    } catch (error) {
      const response = error as { status?: number; message?: string }
      if (response.status === 409) {
        setSelection((current) => ({ ...current, slot: null }))
        setBookingError('Este horário não está mais disponível. Escolha outra opção.')
        await Promise.all(availabilityQueries.map((query) => query.refetch()))
      } else setBookingError(response.message ?? 'Não foi possível enviar a solicitação. Tente novamente.')
      return null
    } finally {
      submitting.current = false
      setIsSubmitting(false)
    }
  }

  return {
    step,
    selection,
    confirmation,
    bookingError,
    isSubmitting,
    nextSearchPending,
    nextSearchMessage,
    servicesQuery,
    professionalsQuery,
    professionals,
    slots,
    availability: {
      isLoading: availabilityQueries.some((query) => query.isPending),
      isError: availabilityQueries.length > 0 && availabilityQueries.every((query) => query.isError),
      isPartialError: availabilityQueries.some((query) => query.isError) && availabilityQueries.some((query) => query.isSuccess),
      refetch: () => Promise.all(availabilityQueries.map((query) => query.refetch())),
    },
    session,
    createAppointment,
    selectService,
    selectProfessional,
    startOver,
    selectDate,
    selectSlot,
    goToStep,
    findNextAvailable,
    confirmBooking,
  }
}
