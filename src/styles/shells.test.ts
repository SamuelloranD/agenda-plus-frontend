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

  it('measures shell content with its own inline-size container', () => {
    expect(stylesheet).toContain('container: admin-shell / inline-size')
    expect(stylesheet).toContain('container: client-shell / inline-size')
    expect(stylesheet).toContain('container-type: inline-size')
  })

  it('scales the page title above 3840px without changing smaller widths', () => {
    expect(stylesheet).toContain('@media (min-width: 3840px)')
    expect(stylesheet).toContain('font-size: clamp(64px, 2.8cqi, 84px)')
  })
})
