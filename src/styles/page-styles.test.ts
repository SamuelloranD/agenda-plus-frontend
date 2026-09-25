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

  it('composes the admin new appointment title beside the appointment folio on wide screens', () => {
    const shellStyles = readFileSync(resolve(process.cwd(), 'src/styles/shells.css'), 'utf8').replaceAll('\r\n', '\n')
    const pageStyles = readFileSync(resolve(process.cwd(), 'src/styles/pages.css'), 'utf8').replaceAll('\r\n', '\n')

    expect(shellStyles).toContain('.admin-main:has(.new-appointment-page)')
    expect(pageStyles).toContain('@media (min-width: 1180px)')
    expect(pageStyles).toContain('.admin-main:has(.new-appointment-page) > .admin-header')
    expect(pageStyles).toContain('.admin-main:has(.new-appointment-page) > .new-appointment-page')
    expect(pageStyles).toContain('position: absolute;')
    expect(pageStyles).toContain('inset-inline-start: calc(var(--admin-new-left)')
  })

  it('defines rounded shared actions and status-colored weekly cards', () => {
    expect(pageStyles).toContain('.primary-action, .quiet-action, .danger-action')
    expect(pageStyles).toContain('border-radius: 999px')
    expect(pageStyles).toContain('.appointment-card--confirmed')
    expect(pageStyles).toContain('background: #5cff8d')
    expect(pageStyles).toContain('background: #fdb563')
    expect(pageStyles).toContain('background: #ffb0b0')
    expect(pageStyles).toContain('height: 132px')
    expect(pageStyles).not.toContain('.appointment-card .status-badge')
  })

  it('keeps preset appointment date and time fields compact', () => {
    expect(pageStyles).toContain('.appointment-fixed-field { display: flex; align-items: center; height: 38px; min-height: 0; box-sizing: border-box; padding: 7px 10px;')
    expect(pageStyles).toContain('font-size: 14px;')
  })

  it('keeps the quick appointment modal opaque, closes with a plain red icon, and uses narrow preset fields', () => {
    expect(pageStyles).toContain('.appointment-fixed-fields .form-field--date, .appointment-fixed-fields .form-field--time { width: min(100%, 110px); }')
    expect(pageStyles).toContain('.appointment-fixed-fields { display: grid; grid-template-columns: repeat(2, minmax(0, 110px));')
    expect(pageStyles).toContain('background: rgb(251 249 245 / 58%); backdrop-filter: blur(10px);')
    expect(pageStyles).toContain('-webkit-backdrop-filter: blur(10px);')
    expect(pageStyles).toContain('background: var(--paper);')
    expect(pageStyles).toContain('color: #a52720; background: transparent; border: 0; border-radius: 0;')
  })

  it('aligns both fixed appointment fields with identical dimensions', () => {
    expect(pageStyles).toContain('.appointment-fixed-fields .form-field { grid-template-rows: 24px 38px; }')
    expect(pageStyles).toContain('height: 38px; min-height: 0; box-sizing: border-box;')
  })

  it('gives professional work-hour pickers a custom rounded popover', () => {
    expect(pageStyles).toContain('.time-picker__popover')
    expect(pageStyles).toContain('border-radius: 8px;')
    expect(pageStyles).toContain('.time-picker__option')
  })
})
