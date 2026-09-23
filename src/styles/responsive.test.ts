/// <reference types="node" />

import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const stylesheetPath = resolve(process.cwd(), 'src/styles/responsive.css')

describe('responsive foundation', () => {
  it('defines the canonical viewport and layout contracts', () => {
    expect(existsSync(stylesheetPath)).toBe(true)
    const stylesheet = readFileSync(stylesheetPath, 'utf8')

    expect(stylesheet).toContain('--touch-target: 44px')
    expect(stylesheet).toContain('--safe-inline-start: env(safe-area-inset-left)')
    expect(stylesheet).toContain('@media (max-width: 1023px)')
    expect(stylesheet).toContain('@media (min-width: 2560px)')
    expect(stylesheet).toContain('@media (max-height: 800px)')
    expect(stylesheet).toContain('overflow-x: clip')
    expect(stylesheet).toContain('min-height: 100svh')
  })
})
