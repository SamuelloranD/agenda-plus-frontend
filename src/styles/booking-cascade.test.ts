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
    expect(indexStyles).toContain('grid-template-columns: minmax(0, 1fr) minmax(220px, 32cqi);')
    expect(indexStyles).toContain('@container (max-width: 719px)')
    expect(indexStyles).toContain('grid-template-columns: 1fr;')
  })

  it('uses the real booking container instead of viewport width for composition', () => {
    const indexStyles = source('src/index.css').replaceAll('\r\n', '\n')

    expect(indexStyles).toContain('@container (min-width: 720px)')
    expect(indexStyles).toContain('@container (min-width: 1180px)')
    expect(indexStyles).toContain('minmax(320px, .9fr) minmax(480px, 2fr) minmax(280px, clamp(280px, 15.2cqi, 460px))')
    expect(indexStyles).toContain('grid-column: 2 / -1;')
    expect(indexStyles).toContain('grid-row: 2;')
    expect(indexStyles).toContain('width: 100%;\n    max-width: none;')
    expect(indexStyles).toContain('max-width: clamp(280px, 15.2cqi, 460px)')
    expect(indexStyles).toContain("font: 500 clamp(2rem, 4.5cqi, 3.5rem)")
  })

  it('lets booking cards grow intrinsically and keeps the stepper compact on narrow screens', () => {
    const indexStyles = source('src/index.css')

    expect(indexStyles).toContain('repeat(auto-fill, minmax(min(100%, 220px), 1fr))')
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
