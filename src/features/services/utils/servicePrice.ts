export function formatBrazilianPriceInput(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 15)
  if (!digits) return ''
  const padded = digits.padStart(3, '0')
  const whole = padded.slice(0, -2).replace(/^0+(?=\d)/, '')
  return `${whole.replace(/\B(?=(\d{3})+(?!\d))/g, '.')},${padded.slice(-2)}`
}

export function parseBrazilianPrice(value: string) {
  const text = value.trim()
  if (!/^(?:0|[1-9]\d*|[1-9]\d{0,2}(?:\.\d{3})+)(?:,\d{1,2})?$/.test(text)) return Number.NaN
  const [whole, fraction = ''] = text.replaceAll('.', '').split(',')
  const cents = BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0') || '0')
  return cents <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(cents) / 100 : Number.NaN
}
