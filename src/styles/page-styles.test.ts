/// <reference types="node" />

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const pageStyles = readFileSync(resolve(process.cwd(), 'src/styles/pages.css'), 'utf8')

describe('shared page styles', () => {
  it('centralizes page and modal style rules outside rendered markup', () => {
    expect(pageStyles).toContain('.dashboard-page')
    expect(pageStyles).toContain('.new-appointment-page')
    expect(pageStyles).toContain('.cancel-dialog')
    expect(pageStyles).toContain('.weekly-page')
  })

  it('does not render inline style tags for page layout styles', () => {
    for (const file of [
      'src/pages/DashboardPage.tsx',
      'src/pages/ServicesPage.tsx',
      'src/pages/ProfessionalsPage.tsx',
      'src/pages/NewAppointmentPage.tsx',
      'src/pages/WeeklyAgendaPage.tsx',
      'src/pages/ClientAppointmentsPage.tsx',
      'src/features/client-booking/components/BookingStepper.tsx',
      'src/features/client-appointments/components/CancelAppointmentDialog.tsx',
    ]) {
      expect(readFileSync(resolve(process.cwd(), file), 'utf8')).not.toContain('<style>')
    }
  })
})
