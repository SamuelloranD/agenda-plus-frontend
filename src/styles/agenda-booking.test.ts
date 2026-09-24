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
    const indexStyles = source('src/index.css')
    expect(indexStyles).not.toContain('@media (min-width: 761px)')
    expect(indexStyles).not.toContain('@media (min-width: 981px)')
    expect(indexStyles).toContain('@media (min-width: 1024px)')
    expect(indexStyles).toContain('overflow: visible;')
  })

  it('gives client cards and dialogs safe mobile overflow rules', () => {
    const responsiveStyles = source('src/styles/responsive.css')
    expect(responsiveStyles).toContain('.client-appointment-card__status')
    expect(responsiveStyles).toContain('.cancel-dialog')
    expect(responsiveStyles).toContain('var(--safe-block-end)')
  })
})
