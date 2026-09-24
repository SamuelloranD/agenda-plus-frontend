import { useState } from 'react'
import { NewAppointmentForm } from '../features/scheduling/components/NewAppointmentForm'
import { NewAppointmentModal } from '../features/scheduling/components/NewAppointmentModal'

export function NewAppointmentPage() {
  const [created, setCreated] = useState(false)

  return (
    <section className="new-appointment-page">
      <div className="appointment-context"><p className="section-label">Protocolo de balcão</p><h2>Uma reserva, <em>com atenção minuciosa.</em></h2><p>Escolha os dados disponíveis no caderno para registrar um novo atendimento.</p></div>
      <NewAppointmentModal>
        <header className="appointment-folio__header"><div><p className="section-label">Novo agendamento</p><h2 id="new-appointment-title">Folha de atendimento</h2></div><span>registro manual</span></header>
        {created && <p className="success-notice appointment-folio__notice" role="status">Agendamento criado. A agenda semanal já pode ser atualizada.</p>}
        <NewAppointmentForm onSuccess={() => setCreated(true)} />
      </NewAppointmentModal>
    </section>
  )
}
