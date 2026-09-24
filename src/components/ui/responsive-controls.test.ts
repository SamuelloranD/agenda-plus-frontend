/// <reference types="node" />

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const stylesheet = readFileSync(resolve(process.cwd(), 'src/index.css'), 'utf8')

describe('responsive controls CSS', () => {
  it('keeps popovers inside small viewports and makes options touch-friendly', () => {
    expect(stylesheet).toContain('width: min(320px, calc(100vw - 32px))')
    expect(stylesheet).toContain('min-width: 0')
    expect(stylesheet).toContain('min-height: 44px')
  })

  it('uses a zoom-safe text size for form controls', () => {
    expect(stylesheet).toContain('.auth-field input')
    expect(stylesheet).toContain('font-size: 16px')
    expect(stylesheet).toContain('.service-form > label input')
    expect(stylesheet).toContain('.catalog-field input')
    expect(stylesheet).toContain('.form-field input')
  })
})
