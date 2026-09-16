import type { ReactNode } from 'react'

interface NewAppointmentModalProps {
  children: ReactNode
}

export function NewAppointmentModal({ children }: NewAppointmentModalProps) {
  return <section className="appointment-folio" aria-labelledby="new-appointment-title">{children}</section>
}
