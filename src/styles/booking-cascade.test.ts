/// <reference types="node" />

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function source(path: string) {
  return readFileSync(resolve(process.cwd(), path), 'utf8')
}

describe('booking cascade', () => {
  it('keeps the booking layout mobile-first without specificity escapes', () => {
    const indexStyles = source('src/index.css')
    const responsiveStyles = source('src/styles/responsive.css')

    expect(indexStyles).not.toContain('.booking-flow .booking-layout {\n  width: 100%;\n  grid-template-columns: minmax(0, 1fr) minmax(260px, 320px);')
    expect(indexStyles).not.toContain('min-height: max(520px, calc(100dvh - 320px));')
    expect(indexStyles).not.toContain('\n    height: 0;\n')
    expect(indexStyles).not.toContain('transform: translateY(clamp(-88px, -8dvh, -56px));')
    expect(responsiveStyles).not.toContain('booking-layout { grid-template-columns: minmax(0, 1fr) !important;')
    expect(responsiveStyles).not.toContain('booking-card-grid { grid-template-columns: minmax(0, 1fr) !important;')
  })

  it('separates tablet and desktop booking columns', () => {
    const indexStyles = source('src/index.css')

    expect(indexStyles).toContain('grid-template-columns: repeat(3, minmax(0, 1fr));')
    expect(indexStyles).toContain('@container (min-width: 720px)')
    expect(indexStyles).toContain('grid-template-columns: minmax(0, 1fr) minmax(300px, 32cqi);')
    expect(indexStyles).toContain('@container (max-width: 719px)')
    expect(indexStyles).toContain('grid-template-columns: 1fr;')
  })

  it('uses the real booking container instead of viewport width for composition', () => {
    const indexStyles = source('src/index.css').replaceAll('\r\n', '\n')

    expect(indexStyles).toContain('@container (min-width: 720px)')
    expect(indexStyles).toContain('@container app-content (min-width: 1180px)')
    expect(indexStyles).toContain('minmax(clamp(280px, 20cqi, 380px), 1fr) minmax(520px, clamp(520px, 20.3vw, 580px)) minmax(300px, clamp(300px, 11.7cqi, 340px))')
    expect(indexStyles).toContain('grid-column: 2;')
    expect(indexStyles).toContain('grid-row: 2;')
    expect(indexStyles).toContain('max-width: 580px')
    expect(indexStyles).toContain('max-width: clamp(300px, 11.7cqi, 340px)')
    expect(indexStyles).toContain("font: 500 clamp(2rem, 4.5cqi, 3.5rem)")
  })

  it('places the client title and booking flow in one compact wide grid', () => {
    const indexStyles = source('src/index.css').replaceAll('\r\n', '\n')

    expect(indexStyles).toContain('display: contents;')
    expect(indexStyles).toContain('grid-template-columns: minmax(clamp(280px, 20cqi, 380px), 1fr) minmax(520px, clamp(520px, 20.3vw, 580px)) minmax(300px, clamp(300px, 11.7cqi, 340px));')
    expect(indexStyles).toContain('grid-column: 2;')
    expect(indexStyles).toContain('grid-column: 3;')
    expect(indexStyles).toContain('max-width: 580px')
  })

  it('keeps booking cards and time slots compact at every width', () => {
    const indexStyles = source('src/index.css').replaceAll('\r\n', '\n')

    expect(indexStyles).toContain('grid-template-columns: repeat(2, minmax(0, 1fr));')
    expect(indexStyles).toContain('max-height: min(55dvh, 38rem)')
    expect(indexStyles).toContain('min-height: clamp(80px, 8cqi, 96px)')
  })

  it('lets booking cards grow intrinsically and keeps the stepper compact on narrow screens', () => {
    const indexStyles = source('src/index.css')

    expect(indexStyles).toContain('repeat(2, minmax(0, 1fr))')
    expect(indexStyles).toContain('.booking-stepper__label')
    expect(indexStyles).toContain('.booking-stepper__item:not(:has(button[aria-current=\'step\'])) .booking-stepper__label')
    expect(indexStyles).not.toContain('min-height: max(520px, calc(100dvh - 320px));')
    expect(indexStyles).not.toMatch(/\n\s+height: 0;/)
    expect(indexStyles).not.toContain('transform: translateY(clamp(-88px, -8dvh, -56px));')
  })

  it('keeps page styles consolidated instead of relying on load order', () => {
    const indexStyles = source('src/index.css')
    const pageStyles = source('src/styles/pages.css')

    expect(pageStyles).not.toContain('.booking-editorial h1 { font-size:')
    expect(indexStyles).not.toContain('.booking-hero')
    expect(indexStyles).not.toContain('/* Ajustes da grade de atendimentos:')
    expect(indexStyles).not.toContain('/* O portal do cliente usa a mesma densidade')
    expect(indexStyles).not.toContain('.today-item')
    expect(indexStyles).not.toContain('.client-appointment-card')
    expect(pageStyles).not.toContain('.form-error {')
  })
})
