/// <reference types="node" />

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const packageJson = JSON.parse(readFileSync(resolve(process.cwd(), 'package.json'), 'utf8')) as { scripts?: Record<string, string> }
const script = readFileSync(resolve(process.cwd(), 'scripts/responsive-check.mjs'), 'utf8')

describe('responsive browser checker', () => {
  it('is wired to npm and covers the requested viewport sweep', () => {
    expect(packageJson.scripts?.['check:responsive']).toBe('node scripts/responsive-check.mjs')
    expect(script).toContain("const WIDTHS = Array.from({ length: Math.floor((2560 - 320) / 40) + 1 }, (_, index) => 320 + index * 40)")
    expect(script).toContain('3840')
    expect(script).toContain('2560, 1440')
    expect(script).toContain("page.route('**/api/**'")
    expect(script).toContain("channel: process.env.RESPONSIVE_BROWSER ?? 'chrome'")
    expect(script).toContain('shell: process.platform === \'win32\'')
    expect(script).toContain('page.setViewportSize({ width, height })')
    expect(script).not.toContain('context.setViewportSize({ width, height })')
    expect(script).toContain('Math.ceil(rect.width) < 44 || Math.ceil(rect.height) < 44')
    expect(script).toContain('booking composition')
    expect(script).toContain('1.5')
    expect(script).toContain('0.85')
    expect(script).toContain('RESPONSIVE_BASELINE_SCREENSHOT')
    expect(script).toContain("path.join(ROOT, 'scripts', 'baselines', 'booking-2560x1440.png')")
  })

  it('checks every application route instead of only the booking page', () => {
    expect(script).toContain("'/login'")
    expect(script).toContain("'/cadastro'")
    expect(script).toContain("'/painel'")
    expect(script).toContain("'/painel/agenda'")
    expect(script).toContain("'/painel/profissionais'")
    expect(script).toContain("'/painel/servicos'")
    expect(script).toContain("'/painel/agendamentos/novo'")
    expect(script).toContain("'/agendar'")
    expect(script).toContain("'/meus-agendamentos'")
    expect(script).toContain('aplicação sem conteúdo')
  })
  it('checks wide-layout composition and 2560px visual parity', () => {
    expect(script).toContain('booking-workspace')
    expect(script).toContain('booking-sidebar')
    expect(script).toContain('compositionByRoute')
    expect(script).toContain('pixelDifferenceRatio')
    expect(script).toContain('`booking-${width}x${height}.png`')
  })

  it('checks shell centering and compact booking composition', () => {
    expect(script).toContain('shellContainer')
    expect(script).toContain('margem esquerda e direita')
    expect(script).toContain('bookingTitle')
    expect(script).toContain('bookingCardWidth')
    expect(script).toContain('620')
    expect(script).toContain('booking-time-grid')
    expect(script).toContain('colunas de horÃ¡rios')
    expect(script).toContain('scroll interno')
    expect(script).toContain('getClientRects')
    expect(script).toContain('booking-page-heading')
    expect(script).toContain('altura do stepper')
    expect(script).toContain('profissionais livres')
    expect(script).toContain('valores do resumo')
    expect(script).toContain('EXACT_BOOKING_VIEWPORTS')
    expect(script).toContain('inspectBookingTimeState')
    expect(script).toContain('RESPONSIVE_BOOKING_PUBLIC')
  })
})
