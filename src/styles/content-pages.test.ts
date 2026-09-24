/// <reference types="node" />

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function source(path: string) {
  return readFileSync(resolve(process.cwd(), path), 'utf8')
}

describe('responsive content pages', () => {
  it('allows editorial page titles to wrap at tablet widths', () => {
    expect(source('src/pages/DashboardPage.tsx')).not.toContain('.dashboard-lead h2{white-space:nowrap}')
    expect(source('src/pages/ServicesPage.tsx')).not.toContain('.catalog-page__lead h2{white-space:nowrap}')
    expect(source('src/pages/ProfessionalsPage.tsx')).not.toContain('.catalog-page__lead h2{white-space:nowrap}')
  })

  it('keeps forms readable and expandable on low-height screens', () => {
    const responsiveStyles = source('src/styles/responsive.css')
    const globalStyles = source('src/index.css')
    const normalizedGlobalStyles = globalStyles.replaceAll('\r\n', '\n')

    expect(responsiveStyles).toContain('.auth-page')
    expect(responsiveStyles).toContain('.auth-shell')
    expect(globalStyles).toContain('.auth-field input')
    expect(globalStyles).toContain('font-size: 16px')
    expect(normalizedGlobalStyles).toContain('.auth-switch a {\n  display: inline-flex;')
  })
})
