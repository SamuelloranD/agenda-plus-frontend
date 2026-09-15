import { chromium } from 'playwright'

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
const baseUrl = process.env.VERIFY_BASE_URL ?? 'http://127.0.0.1:5173'
await page.goto(`${baseUrl}/login`)

const token = await page.evaluate(async () => {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin.visual.1789503090@example.com', senha: 'senha-segura' }),
  })
  return (await response.json()).token
})

await page.evaluate((value) => localStorage.setItem('agenda-plus:auth-token', value), token)
await page.goto(`${baseUrl}/painel`)
await page.getByRole('button', { name: 'Abrir navegação' }).click()
await page.waitForFunction(() => getComputedStyle(document.querySelector('.admin-sidebar')).transform === 'matrix(1, 0, 0, 1, 0, 0)')

const styles = await page.evaluate(() => {
  const getStyles = (element) => {
    const computed = getComputedStyle(element)
    return {
      position: computed.position,
      zIndex: computed.zIndex,
      backgroundColor: computed.backgroundColor,
      display: computed.display,
    }
  }
  return {
    viewportWidth: window.innerWidth,
    shellClass: document.querySelector('.admin-shell').className,
    sidebarTransform: getComputedStyle(document.querySelector('.admin-sidebar')).transform,
    sidebarRect: document.querySelector('.admin-sidebar').getBoundingClientRect().toJSON(),
    overlayRect: document.querySelector('.sidebar-overlay').getBoundingClientRect().toJSON(),
    sidebar: getStyles(document.querySelector('.admin-sidebar')),
    overlay: getStyles(document.querySelector('.sidebar-overlay')),
    toggle: getStyles(document.querySelector('.admin-menu-button')),
    toggleLabel: document.querySelector('.admin-menu-button').getAttribute('aria-label'),
    headerZIndex: getComputedStyle(document.querySelector('.admin-header')).zIndex,
    matchingSidebarRules: [...document.styleSheets].flatMap((sheet) => [...sheet.cssRules ?? []]).flatMap((rule) => rule.cssRules ? [...rule.cssRules] : [rule]).filter((rule) => rule.selectorText?.includes('admin-sidebar')).map((rule) => rule.cssText),
  }
})

await page.screenshot({ path: 'task-4-overlay-mobile.png', fullPage: true })
await page.locator('.admin-menu-button').click()
const closedByToggle = await page.locator('.sidebar-overlay').count() === 0

console.log(JSON.stringify({ viewport: '390x844', styles, closedByToggle }))
if (styles.sidebarRect.x !== 0 || styles.sidebarRect.width !== 250) throw new Error('Open sidebar geometry is incorrect')
if (styles.overlayRect.x !== 0 || styles.overlayRect.y !== 0 || styles.overlayRect.width !== 390 || styles.overlayRect.height !== 844) throw new Error('Overlay does not cover the viewport')
if (styles.sidebar.zIndex !== '3' || styles.overlay.zIndex !== '2' || styles.toggle.zIndex !== '4') throw new Error('Mobile layer order is incorrect')
if (styles.sidebar.backgroundColor !== 'rgb(251, 249, 245)') throw new Error('Sidebar is not opaque paper')
if (!closedByToggle) throw new Error('Toggle did not close the sidebar')
await browser.close()
