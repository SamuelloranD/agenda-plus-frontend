import { spawn } from 'node:child_process'
import { mkdir, readFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const WIDTHS = Array.from({ length: Math.floor((2560 - 320) / 40) + 1 }, (_, index) => 320 + index * 40)
const ALL_WIDTHS = [...WIDTHS, 3840]
const HEIGHTS = [720, 900]
const SCREENSHOT_SIZES = [[3840, 2160], [2560, 1440], [1920, 1080], [1536, 864], [1440, 900], [1366, 768], [1280, 720], [1200, 800], [1097, 617], [1024, 768], [820, 1180], [390, 844]]
const ROUTES = ['/login', '/cadastro', '/painel', '/painel/agenda', '/painel/profissionais', '/painel/servicos', '/painel/agendamentos/novo', '/agendar', '/meus-agendamentos']
const COMPOSITION_ROUTES = ['/painel', '/painel/agenda', '/painel/profissionais', '/painel/servicos', '/painel/agendamentos/novo', '/agendar', '/meus-agendamentos']
const COMPOSITION_WIDTHS = [2560, 3840]
const COMPOSITION_GAP_LIMIT = 120
const COMPOSITION_PARITY_LIMIT = 0.03
const COMPOSITION_WIDTH_RATIO_MIN = 0.85
const BASELINE_SCREENSHOT = process.env.RESPONSIVE_BASELINE_SCREENSHOT ?? path.join(os.tmpdir(), 'agenda-plus-responsive-screenshots', 'baseline-master-2560x1440.png')

const services = [
  { id: 'service-1', nome: 'Corte de cabelo', duracaoMinutos: 45, preco: { valor: 85, moeda: 'BRL' } },
  { id: 'service-2', nome: 'Coloração completa', duracaoMinutos: 120, preco: { valor: 240, moeda: 'BRL' } },
  { id: 'service-3', nome: 'Hidratação profunda', duracaoMinutos: 60, preco: { valor: 110, moeda: 'BRL' } },
]
const professionals = [
  { id: 'professional-1', nome: 'João Silva', especialidade: 'Cabeleireiro', horariosTrabalho: [] },
  { id: 'professional-2', nome: 'Marina Costa', especialidade: 'Colorista', horariosTrabalho: [] },
]
const clients = [{ id: 'client-1', nome: 'Cliente Demo', email: 'cliente@example.com', role: 'CLIENTE' }]
const appointments = [{ id: 'appointment-1', inicio: '2026-09-23T10:00:00', fim: '2026-09-23T10:45:00', profissionalId: 'professional-1', clienteId: 'client-1', servicoId: 'service-1', status: 'CONFIRMADO' }]

function jsonResponse(body) {
  return { status: 200, contentType: 'application/json', body: JSON.stringify(body) }
}

async function mockApi(route) {
  const request = route.request()
  const url = new URL(request.url())
  const pathname = url.pathname.replace(/^\/api/, '')
  const token = request.headers().authorization ?? ''

  if (pathname === '/identity/me') {
    const isClient = token.includes('client-token')
    return route.fulfill(jsonResponse(isClient
      ? { id: 'client-1', nome: 'Cliente Demo', email: 'cliente@example.com', role: 'CLIENTE' }
      : { id: 'admin-1', nome: 'Admin Demo', email: 'admin@example.com', role: 'ADMIN' }))
  }

  if (pathname === '/servicos') return route.fulfill(jsonResponse(services))
  if (pathname === '/profissionais') return route.fulfill(jsonResponse(professionals))
  if (pathname === '/clientes') return route.fulfill(jsonResponse(clients))
  if (pathname.endsWith('/horarios-disponiveis')) {
    return route.fulfill(jsonResponse([
      { inicio: '2026-09-23T09:00:00', fim: '2026-09-23T09:45:00' },
      { inicio: '2026-09-23T10:00:00', fim: '2026-09-23T10:45:00' },
      { inicio: '2026-09-23T11:00:00', fim: '2026-09-23T11:45:00' },
    ]))
  }
  if (pathname === '/agendamentos' || pathname === '/agendamentos/meus') {
    return route.fulfill(jsonResponse({ conteudo: appointments, pagina: 0, tamanho: 20, totalElementos: appointments.length, totalPaginas: 1 }))
  }
  if (pathname === '/auth/login') return route.fulfill(jsonResponse({ token: 'admin-token', tokenType: 'Bearer', expiresIn: 3600 }))
  if (pathname.startsWith('/auth/cadastro')) return route.fulfill(jsonResponse({ id: 'client-1', nome: 'Cliente Demo', email: 'cliente@example.com', role: 'CLIENTE' }))
  if (request.method() === 'GET') return route.fulfill(jsonResponse([]))
  return route.fulfill(jsonResponse({ id: 'mocked-id' }))
}

function roleForRoute(route) {
  if (route === '/meus-agendamentos' || route === '/agendar') return 'CLIENTE'
  if (route.startsWith('/painel')) return 'ADMIN'
  return null
}

async function waitForServer(baseUrl) {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      const response = await fetch(baseUrl)
      if (response.ok) return
    } catch {
      // The Vite process may need another tick to bind its port.
    }
    await new Promise((resolve) => setTimeout(resolve, 250))
  }
  throw new Error(`Servidor não respondeu em ${baseUrl}`)
}

async function ensureServer() {
  const configured = process.env.RESPONSIVE_BASE_URL ?? 'http://127.0.0.1:4173'
  try {
    await waitForServer(configured)
    return { baseUrl: configured, process: null }
  } catch {
    const serverProcess = spawn(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'dev', '--', '--host', '127.0.0.1', '--port', '4173'], {
      cwd: ROOT,
      stdio: 'ignore',
      shell: process.platform === 'win32',
      windowsHide: true,
    })
    await waitForServer(configured)
    return { baseUrl: configured, process: serverProcess }
  }
}

function parseList(value, fallback) {
  if (!value) return fallback
  return value.split(',').map((item) => item.trim()).filter(Boolean)
}

function compositionSelector(routePath) {
  if (routePath === '/agendar') return '.booking-intro-layout'
  if (routePath === '/painel') return '.dashboard-page'
  if (routePath === '/painel/agenda') return '.weekly-page'
  if (routePath === '/painel/profissionais') return '.catalog-page'
  if (routePath === '/painel/servicos') return '.services-page'
  if (routePath === '/painel/agendamentos/novo') return '.new-appointment-page'
  if (routePath === '/meus-agendamentos') return '.client-appointments-page'
  return null
}

async function pixelDifferenceRatio(page, actualPath, baselinePath) {
  const [actual, baseline] = await Promise.all([readFile(actualPath), readFile(baselinePath)])
  return page.evaluate(async ({ actualData, baselineData }) => {
    const loadImage = (data) => new Promise((resolve, reject) => {
      const image = new Image()
      image.onload = () => resolve(image)
      image.onerror = reject
      image.src = `data:image/png;base64,${data}`
    })
    const [actualImage, baselineImage] = await Promise.all([loadImage(actualData), loadImage(baselineData)])
    if (actualImage.width !== baselineImage.width || actualImage.height !== baselineImage.height) {
      return { ratio: 1, differingPixels: actualImage.width * actualImage.height, diffBounds: null }
    }
    const canvas = document.createElement('canvas')
    canvas.width = actualImage.width
    canvas.height = actualImage.height
    const context = canvas.getContext('2d')
    if (!context) return { ratio: 1, differingPixels: canvas.width * canvas.height, diffBounds: null }
    context.drawImage(actualImage, 0, 0)
    const actualPixels = context.getImageData(0, 0, canvas.width, canvas.height).data
    context.clearRect(0, 0, canvas.width, canvas.height)
    context.drawImage(baselineImage, 0, 0)
    const baselinePixels = context.getImageData(0, 0, canvas.width, canvas.height).data
    let differingPixels = 0
    let minX = canvas.width
    let minY = canvas.height
    let maxX = -1
    let maxY = -1
    for (let index = 0; index < actualPixels.length; index += 4) {
      const difference = Math.max(
        Math.abs(actualPixels[index] - baselinePixels[index]),
        Math.abs(actualPixels[index + 1] - baselinePixels[index + 1]),
        Math.abs(actualPixels[index + 2] - baselinePixels[index + 2]),
      )
      if (difference <= 8) continue
      differingPixels += 1
      const pixel = index / 4
      const x = pixel % canvas.width
      const y = Math.floor(pixel / canvas.width)
      minX = Math.min(minX, x)
      minY = Math.min(minY, y)
      maxX = Math.max(maxX, x)
      maxY = Math.max(maxY, y)
    }
    return {
      ratio: differingPixels / (canvas.width * canvas.height),
      differingPixels,
      diffBounds: maxX < 0 ? null : { left: minX, top: minY, right: maxX, bottom: maxY },
    }
  }, { actualData: actual.toString('base64'), baselineData: baseline.toString('base64') })
}

async function inspectPage(page, routePath, width, height) {
  const contentSelector = compositionSelector(routePath)
  return page.evaluate(({ routePath, width, height, contentSelector, compositionGapLimit, compositionWidthRatioMin }) => {
    const failures = []
    const viewport = { width, height }
    const visible = (element) => {
      const style = getComputedStyle(element)
      const rect = element.getBoundingClientRect()
      return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) !== 0 && rect.width > 0 && rect.height > 0
    }
    const box = (element) => {
      const rect = element.getBoundingClientRect()
      return { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom, width: rect.width, height: rect.height }
    }
    const intersection = (a, b) => {
      const left = Math.max(a.left, b.left)
      const top = Math.max(a.top, b.top)
      const right = Math.min(a.right, b.right)
      const bottom = Math.min(a.bottom, b.bottom)
      return Math.max(0, right - left) * Math.max(0, bottom - top)
    }
    const ignoredOverflow = new Set(['calendar-scroll', 'booking-time-grid', 'ui-select__listbox', 'ui-date-picker__popover', 'admin-sidebar', 'client-sidebar', 'cancel-dialog'])
    const isInsideAllowedOverflow = (element) => [...element.classList].some((name) => ignoredOverflow.has(name)) || Boolean(element.closest([...ignoredOverflow].map((name) => `.${name}`).join(',')))
    const elements = [...document.querySelectorAll('body *')].filter(visible)

    const root = document.querySelector('#root')
    if (!root?.textContent?.trim()) failures.push(`aplicação sem conteúdo (${root?.innerHTML.slice(0, 160) ?? 'sem #root'})`)

    const pageScrollWidth = Math.max(document.documentElement.scrollWidth, document.body?.scrollWidth ?? 0)
    if (pageScrollWidth > viewport.width + 1) failures.push(`scroll horizontal da página: ${pageScrollWidth}px > ${viewport.width}px`)

    for (const element of elements) {
      if (isInsideAllowedOverflow(element)) continue
      if (element.matches('.auth-stamp, .admin-sidebar, .client-sidebar') || element.closest('.auth-stamp, .admin-sidebar, .client-sidebar')) continue
      const rect = box(element)
      if (rect.left < -1 || rect.right > viewport.width + 1) {
        failures.push(`overflow lateral em .${element.className || element.tagName.toLowerCase()} (${Math.round(rect.left)}..${Math.round(rect.right)})`)
        break
      }
    }

    for (const element of elements) {
      if (isInsideAllowedOverflow(element)) continue
      const style = getComputedStyle(element)
      if (element.matches('.auth-editorial') && element.querySelector('.auth-stamp') && element.scrollWidth - element.clientWidth <= 200) continue
      if (element.scrollWidth > element.clientWidth + 1 && ['hidden', 'clip'].includes(style.overflowX)) {
        failures.push(`conteúdo cortado horizontalmente em .${element.className || element.tagName.toLowerCase()}`)
        break
      }
      if (element.scrollHeight > element.clientHeight + 1 && ['hidden', 'clip'].includes(style.overflowY)) {
        failures.push(`conteúdo cortado verticalmente em .${element.className || element.tagName.toLowerCase()}`)
        break
      }
    }

    for (const heading of elements.filter((element) => element.matches('h1, h2'))) {
      const words = heading.textContent.trim().split(/\s+/).filter(Boolean)
      const fontSize = Number.parseFloat(getComputedStyle(heading).fontSize)
      if (words.length >= 3 && heading.getBoundingClientRect().width < Math.max(150, fontSize * 4.5)) {
        failures.push(`título estreito demais para o texto: ${heading.textContent.trim()}`)
      }
    }

    if (width <= 1024) {
      for (const control of elements.filter((element) => element.matches('button, a, input, select, textarea, [role="button"]'))) {
        if (control.matches('input[type="radio"], input[type="checkbox"]') && control.closest('label') && Math.ceil(control.closest('label').getBoundingClientRect().width) >= 44 && Math.ceil(control.closest('label').getBoundingClientRect().height) >= 44) continue
        const rect = control.getBoundingClientRect()
        if (Math.ceil(rect.width) < 44 || Math.ceil(rect.height) < 44) {
          failures.push(`alvo de toque menor que 44px: ${control.tagName.toLowerCase()} ${control.textContent.trim().slice(0, 32)}`)
          break
        }
      }
    }

    const bookingGrid = document.querySelector('.booking-card-grid')
    if (bookingGrid && visible(bookingGrid)) {
      const gridRect = bookingGrid.getBoundingClientRect()
      for (const card of bookingGrid.children) {
        if (card.getBoundingClientRect().width < (gridRect.width >= 440 ? 180 : 120)) {
          failures.push(`card do booking estreito demais: ${Math.round(card.getBoundingClientRect().width)}px`)
          break
        }
      }
    }

    const stepper = document.querySelector('.booking-stepper')
    const bookingTitle = document.querySelector('.booking-editorial h1')
    if (stepper && bookingTitle && intersection(box(stepper), box(bookingTitle)) > 0) failures.push('stepper sobreposto ao título do booking')

    if (routePath.includes('agendar') && document.querySelector('.booking-workspace') && document.querySelector('.booking-sidebar')) {
      const workspace = box(document.querySelector('.booking-workspace'))
      const sidebar = box(document.querySelector('.booking-sidebar'))
      if (intersection(workspace, sidebar) > 0) failures.push('workspace e resumo do booking sobrepostos')
    }

    let composition = null
    if (width >= 1180 && contentSelector) {
      const main = document.querySelector('.admin-main, .client-main')
      const heading = main?.querySelector('.admin-header h1')
      const content = document.querySelector(contentSelector)
      const metric = (element) => element ? box(element) : null
      const mainBox = metric(main)
      const headingBox = metric(heading)
      const contentBox = metric(content)
      const blocks = { main: mainBox, heading: headingBox, content: contentBox }
      if (mainBox && headingBox && contentBox) {
        if (Math.abs(headingBox.left - contentBox.left) > 2) {
          failures.push(`booking composition: borda esquerda do h1 e do conteúdo divergem ${Math.round(Math.abs(headingBox.left - contentBox.left))}px`)
        }
        const contentRatio = contentBox.width / mainBox.width
        if (contentRatio < compositionWidthRatioMin || contentRatio > 1) {
          failures.push(`booking composition: largura do conteúdo ocupa ${(contentRatio * 100).toFixed(1)}% do container`)
        }

        if (routePath === '/agendar') {
          const stepper = metric(document.querySelector('.booking-stepper'))
          const workspace = metric(document.querySelector('.booking-workspace'))
          const sidebar = metric(document.querySelector('.booking-sidebar'))
          blocks.stepper = stepper
          blocks.workspace = workspace
          blocks.sidebar = sidebar
          const token = Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--space-section')) || 32
          if (stepper && workspace) {
            const gap = workspace.top - stepper.bottom
            if (gap > token * 1.5 || gap > compositionGapLimit) failures.push(`booking composition: vão stepper -> card de ${Math.round(gap)}px`)
          }
          if (workspace && sidebar && Math.abs(workspace.top - sidebar.top) > 2) {
            failures.push(`booking composition: topo do card e do resumo divergem ${Math.round(Math.abs(workspace.top - sidebar.top))}px`)
          }
        } else {
          const children = [...content.children]
            .map((element) => metric(element))
            .filter((child) => child && child.width > 0 && child.height > 0)
            .sort((left, right) => left.top - right.top)
          const token = Number.parseFloat(getComputedStyle(content).gap) || Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--space-section')) || 32
          for (let index = 1; index < children.length; index += 1) {
            const previous = children[index - 1]
            const current = children[index]
            const horizontalOverlap = intersection(previous, current)
            const gap = current.top - previous.bottom
            if (horizontalOverlap > 0 && (gap > token * 1.5 || gap > compositionGapLimit)) {
              failures.push(`booking composition: vão entre blocos de ${Math.round(gap)}px em ${routePath}`)
              break
            }
          }
        }
      }
      composition = { routePath, width, main: mainBox, blocks }
    }

    return { failures, composition }
  }, { routePath, width, height, contentSelector, compositionGapLimit: COMPOSITION_GAP_LIMIT, compositionWidthRatioMin: COMPOSITION_WIDTH_RATIO_MIN })
}

async function main() {
  const { baseUrl, process: serverProcess } = await ensureServer()
  const browser = await chromium.launch({ channel: process.env.RESPONSIVE_BROWSER ?? 'chrome', headless: true })
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 })
  const page = await context.newPage()
  const runtimeErrors = []
  page.on('pageerror', (error) => runtimeErrors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') runtimeErrors.push(`console: ${message.text()} @ ${message.location().url}`)
  })
  page.on('requestfailed', (request) => runtimeErrors.push(`request: ${request.url()} ${request.failure()?.errorText ?? 'failed'}`))
  await page.route('**/api/**', (route) => {
    const pathname = new URL(route.request().url()).pathname
    return pathname.startsWith('/api/') ? mockApi(route) : route.continue()
  })
  const routes = parseList(process.env.RESPONSIVE_ROUTES, ROUTES)
  const widths = parseList(process.env.RESPONSIVE_WIDTHS, ALL_WIDTHS).map(Number)
  const heights = parseList(process.env.RESPONSIVE_HEIGHTS, HEIGHTS).map(Number)
  const failures = []
  const compositionByRoute = {}
  const screenshotComparisons = []
  const screenshotDirectory = process.env.RESPONSIVE_SCREENSHOT_DIR ?? path.join(os.tmpdir(), 'agenda-plus-responsive-screenshots')
  await mkdir(screenshotDirectory, { recursive: true })

  try {
    for (const routePath of routes) {
      const role = roleForRoute(routePath)
      for (const width of widths) {
        for (const height of heights) {
          await page.setViewportSize({ width, height })
          await context.addInitScript((token) => {
            if (token) localStorage.setItem('agenda-plus:auth-token', token)
            else localStorage.removeItem('agenda-plus:auth-token')
          }, role === 'CLIENTE' ? 'client-token' : role === 'ADMIN' ? 'admin-token' : null)
          await page.goto(`${baseUrl}${routePath}`, { waitUntil: 'domcontentloaded' })
          await page.waitForTimeout(150)
          if (compositionSelector(routePath) && width >= 1180) {
            await page.locator('.admin-main, .client-main').first().waitFor({ state: 'attached', timeout: 1500 }).catch(() => {})
          }
          const inspection = await inspectPage(page, routePath, width, height)
          for (const failure of inspection.failures) failures.push(`${routePath} @ ${width}x${height}: ${failure}`)
          if (inspection.composition && COMPOSITION_WIDTHS.includes(width)) {
            compositionByRoute[routePath] ??= {}
            compositionByRoute[routePath][width] = inspection.composition
          }
          for (const error of runtimeErrors.splice(0)) failures.push(`${routePath} @ ${width}x${height}: erro de runtime: ${error}`)
        }
      }
    }

    for (const routePath of COMPOSITION_ROUTES) {
      const at2560 = compositionByRoute[routePath]?.[2560]
      const at3840 = compositionByRoute[routePath]?.[3840]
      if (!at2560 || !at3840 || !at2560.main || !at3840.main) continue
      const blockNames = new Set([...Object.keys(at2560.blocks), ...Object.keys(at3840.blocks)])
      for (const blockName of blockNames) {
        const first = at2560.blocks[blockName]
        const second = at3840.blocks[blockName]
        if (!first || !second) continue
        const firstNormalized = [(first.left - at2560.main.left) / at2560.main.width, first.width / at2560.main.width]
        const secondNormalized = [(second.left - at3840.main.left) / at3840.main.width, second.width / at3840.main.width]
        const difference = Math.max(Math.abs(firstNormalized[0] - secondNormalized[0]), Math.abs(firstNormalized[1] - secondNormalized[1]))
        if (difference > COMPOSITION_PARITY_LIMIT) {
          failures.push(`booking composition: paridade 2560/3840 excedida em ${routePath} / ${blockName} (${(difference * 100).toFixed(1)}%)`)
        }
      }
    }

    for (const [width, height] of SCREENSHOT_SIZES) {
      await page.setViewportSize({ width, height })
      await context.addInitScript((token) => {
        if (token) localStorage.setItem('agenda-plus:auth-token', token)
        else localStorage.removeItem('agenda-plus:auth-token')
      }, 'client-token')
      await page.goto(`${baseUrl}/agendar`, { waitUntil: 'domcontentloaded' })
      await page.waitForTimeout(150)
      const screenshotPath = path.join(screenshotDirectory, `booking-${width}x${height}.png`)
      await page.screenshot({ path: screenshotPath, fullPage: false })
      if (width === 2560 && height === 1440) {
        try {
          const comparison = await pixelDifferenceRatio(page, screenshotPath, BASELINE_SCREENSHOT)
          screenshotComparisons.push({ baseline: BASELINE_SCREENSHOT, ...comparison })
          const maximumRatio = Number(process.env.RESPONSIVE_SCREENSHOT_DIFF_MAX ?? 0.08)
          if (comparison.ratio > maximumRatio) {
            failures.push(`booking composition: diferença visual 2560 acima da tolerância (${(comparison.ratio * 100).toFixed(2)}%, limite ${(maximumRatio * 100).toFixed(2)}%)`)
          }
        } catch (error) {
          screenshotComparisons.push({ baseline: BASELINE_SCREENSHOT, skipped: error.code === 'ENOENT' ? 'baseline ausente' : error.message })
        }
      }
    }
  } finally {
    await context.close()
    await browser.close()
    if (serverProcess) serverProcess.kill()
  }

  console.log(`Responsive sweep: ${routes.length} rotas x ${widths.length} larguras x ${heights.length} alturas`)
  console.log(`Screenshots: ${screenshotDirectory}`)
  for (const comparison of screenshotComparisons) {
    if (comparison.skipped) console.log(`Screenshot baseline: ignorado (${comparison.skipped})`)
    else console.log(`Screenshot baseline: ${(comparison.ratio * 100).toFixed(2)}% pixels diferentes; bounds ${JSON.stringify(comparison.diffBounds)}`)
  }
  if (failures.length > 0) {
    console.error(`Falhas encontradas: ${failures.length}`)
    for (const failure of failures.slice(0, 80)) console.error(`- ${failure}`)
    if (failures.length > 80) console.error(`- ... e mais ${failures.length - 80}`)
    process.exitCode = 1
  } else {
    console.log('Falhas encontradas: 0')
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
