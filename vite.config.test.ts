import { describe, expect, it } from 'vitest'
import config from './vite.config'

describe('Vite development API proxy', () => {
  it('forwards /api requests to the backend without the /api prefix', () => {
    expect(config).toMatchObject({
      server: {
        proxy: {
          '/api': {
            target: 'http://localhost:8080',
            changeOrigin: true,
          },
        },
      },
    })

    const proxy = typeof config === 'object' ? config.server?.proxy?.['/api'] : undefined
    expect(typeof proxy === 'object' && proxy.rewrite?.('/api/auth/login')).toBe('/auth/login')
  })
})
