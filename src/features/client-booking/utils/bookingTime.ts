// The scheduling API uses LocalDateTime values against the backend's UTC clock.
// Treat those wall-clock values as UTC when deciding whether a slot is future.
export function apiSlotTimestamp(value: string) {
  return Date.parse(/(?:Z|[+-]\d{2}:\d{2})$/i.test(value) ? value : `${value}Z`)
}

export function utcDateKey(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`
}

export function todayKey() {
  return utcDateKey(new Date())
}

export function addCalendarDays(key: string, count: number) {
  const date = new Date(`${key}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + count)
  return utcDateKey(date)
}
