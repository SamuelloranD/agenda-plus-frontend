/// <reference types="node" />

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function source(path: string) {
  return readFileSync(resolve(process.cwd(), path), 'utf8')
}

describe('responsive agenda and booking', () => {
  it('contains calendar overflow inside the calendar surface', () => {
    const pageStyles = source('src/styles/pages.css')
    expect(pageStyles).toContain('.calendar-scroll { max-width: 100%; overflow-x: auto; overscroll-behavior-x: contain;')
    expect(pageStyles).toContain('@media (max-width: 1023px)')
  })

  it('avoids desktop-only booking height locks on tablets', () => {
    const indexStyles = source('src/index.css').replaceAll('\r\n', '\n')
    expect(indexStyles).not.toContain('@media (min-width: 761px)')
    expect(indexStyles).not.toContain('@media (min-width: 981px)')
    expect(indexStyles).toContain('@container app-content (min-width: 1180px)')
    expect(indexStyles).toContain('grid-template-columns: minmax(clamp(280px, 20cqi, 380px), 1fr) minmax(520px, clamp(520px, 20.3vw, 580px)) minmax(300px, clamp(300px, 11.7cqi, 340px));')
    expect(indexStyles).not.toContain('.booking-layout {\n  height: 100%;')
    expect(indexStyles).not.toContain('.booking-layout {\n  transform: translateX(30px)')
  })

  it('gives client cards and dialogs safe mobile overflow rules', () => {
    const responsiveStyles = source('src/styles/responsive.css')
    const pageStyles = source('src/styles/pages.css')
    expect(pageStyles).toContain('.client-appointment-card__status')
    expect(responsiveStyles).toContain('.cancel-dialog')
    expect(responsiveStyles).toContain('var(--safe-block-end)')
  })

  it('models the wide booking copy as one two-row grid column', () => {
    const indexStyles = source('src/index.css').replaceAll('\r\n', '\n')
    const page = source('src/pages/ClientBookingPage.tsx')

    expect(page).toContain('booking-page-heading')
    expect(page).toContain('booking-copy')
    expect(indexStyles).toContain('grid-row: 1 / span 2;')
    expect(indexStyles).toContain('container-type: inline-size;')
    expect(indexStyles).toContain('align-self: start;')
  })

  it('keeps wide booking words intact and makes the time tile three-line', () => {
    const indexStyles = source('src/index.css')
    const shellsStyles = source('src/styles/shells.css')
    const timeStep = source('src/features/client-booking/components/TimeStep.tsx')

    expect(indexStyles).not.toContain('overflow-wrap: anywhere')
    expect(shellsStyles).not.toContain('overflow-wrap: anywhere')
    expect(indexStyles).not.toContain('word-break: break-all')
    expect(indexStyles).toContain("grid-template-areas: 'time' 'until' 'meta';")
    expect(indexStyles).toContain('min-height: clamp(80px, 8cqi, 96px)')
    expect(timeStep).toContain('slot.candidates.length === 1')
    expect(timeStep).not.toContain('slot.candidates.length > 1 &&')
  })

  it('keeps the summary at its intrinsic content height and composes public intro responsively', () => {
    const indexStyles = source('src/index.css').replaceAll('\r\n', '\n')

    expect(indexStyles).toContain('.booking-summary { align-self: start; height: fit-content; }')
    expect(indexStyles).toContain('.booking-sidebar {')
    expect(indexStyles).toContain('align-self: start;')
    expect(indexStyles).toContain('height: fit-content;')
    expect(indexStyles).toContain('.booking-page:not(.booking-page--embedded) .booking-editorial')
    expect(indexStyles).toContain('.booking-page:not(.booking-page--embedded) .booking-inline-brand')
    expect(indexStyles).toContain('grid-row: 3;')
  })

  it('gives the public booking page its own responsive container', () => {
    const indexStyles = source('src/index.css').replaceAll('\r\n', '\n')

    expect(indexStyles).toContain('container: booking-page / inline-size;')
    expect(indexStyles).toContain('@container booking-page (min-width: 720px)')
    expect(indexStyles).toContain('@container booking-page (max-width: 719px)')
  })

  it('calculates the public flow columns from the flow width', () => {
    const indexStyles = source('src/index.css').replaceAll('\r\n', '\n')

    expect(indexStyles).toContain('container: booking-flow / inline-size;')
    expect(indexStyles).toContain('minmax(300px, clamp(300px, 32cqi, 340px))')
  })

  it('shares the booking max width token with the large-screen layout', () => {
    const indexStyles = source('src/index.css').replaceAll('\r\n', '\n')

    expect(indexStyles).toContain('width: min(100%, var(--content-max-booking));')
  })

  it('keeps the shared date picker grid contained inside its popover', () => {
    const indexStyles = source('src/index.css').replaceAll('\r\n', '\n')

    expect(indexStyles).toContain('width: min(320px, calc(100vw - 32px));')
    expect(indexStyles).toContain('grid-template-columns: repeat(7, minmax(0, 1fr));')
    expect(indexStyles).toContain('width: 100%;\n  min-width: 0;')
  })
})
