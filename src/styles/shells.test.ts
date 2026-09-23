/// <reference types="node" />

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const stylesheet = readFileSync(resolve(process.cwd(), 'src/styles/shells.css'), 'utf8')

describe('responsive shells', () => {
  it('switches both sidebars to drawers below the tablet breakpoint', () => {
    expect(stylesheet).toContain('@media (max-width: 1023px)')
    expect(stylesheet).toContain('.admin-sidebar')
    expect(stylesheet).toContain('.client-sidebar')
    expect(stylesheet).toContain('transform: translateX(-100%)')
    expect(stylesheet).toContain('transform: translateX(0)')
  })

  it('keeps the menu hit area and shell scrolling available', () => {
    expect(stylesheet).toContain('min-width: var(--touch-target)')
    expect(stylesheet).toContain('min-height: var(--touch-target)')
    expect(stylesheet).toContain('overflow-y: auto')
    expect(stylesheet).toContain('min-height: 100svh')
  })
})
