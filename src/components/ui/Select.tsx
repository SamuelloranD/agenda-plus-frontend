import { useEffect, useId, useRef, useState, type FocusEvent, type KeyboardEvent } from 'react'

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

interface SelectProps {
  id: string
  name?: string
  value: string
  options: SelectOption[]
  placeholder?: string
  disabled?: boolean
  invalid?: boolean
  searchable?: boolean
  onChange: (value: string) => void
  onBlur?: (event: FocusEvent<HTMLButtonElement>) => void
}

export function Select({ id, name, value, options, placeholder = 'Selecione uma opção', disabled = false, invalid = false, searchable = false, onChange, onBlur }: SelectProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [activeIndex, setActiveIndex] = useState(() => Math.max(0, options.findIndex((option) => option.value === value)))
  const listboxId = `${id}-listbox-${useId().replaceAll(':', '')}`
  const selectedOption = options.find((option) => option.value === value)
  const normalizedSearch = search.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  const visibleOptions = searchable && normalizedSearch ? options.filter((option) => option.label.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().includes(normalizedSearch)) : options

  useEffect(() => {
    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }

    document.addEventListener('pointerdown', closeOnOutsidePointer)
    return () => document.removeEventListener('pointerdown', closeOnOutsidePointer)
  }, [])
  useEffect(() => { if (open && searchable) searchRef.current?.focus() }, [open, searchable])

  const choose = (option: SelectOption) => {
    if (option.disabled) return
    setActiveIndex(options.findIndex((candidate) => candidate.value === option.value))
    onChange(option.value)
    setOpen(false)
    setSearch('')
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return
    const enabledOptions = options.filter((option) => !option.disabled)
    if (event.key === 'Escape') {
      setOpen(false)
      return
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      setOpen(true)
      const direction = event.key === 'ArrowDown' ? 1 : -1
      const current = enabledOptions.findIndex((option) => option.value === options[activeIndex]?.value)
      const next = (current + direction + enabledOptions.length) % enabledOptions.length
      setActiveIndex(options.findIndex((option) => option.value === enabledOptions[next]?.value))
      return
    }
    if ((event.key === 'Enter' || event.key === ' ') && open) {
      event.preventDefault()
      const option = options[activeIndex]
      if (option) choose(option)
    }
  }

  return (
    <div className="ui-select" ref={rootRef}>
      <button
        className={selectedOption ? 'ui-select__trigger' : 'ui-select__trigger ui-select__trigger--placeholder'}
        id={id}
        name={name}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-activedescendant={open && options[activeIndex] ? `${listboxId}-option-${activeIndex}` : undefined}
        aria-invalid={invalid || undefined}
        disabled={disabled}
        onBlur={onBlur}
        onClick={() => setOpen((current) => {
          if (!current) setActiveIndex(Math.max(0, options.findIndex((option) => option.value === value)))
          return !current
        })}
        onKeyDown={handleKeyDown}
      >
        <span>{selectedOption?.label ?? placeholder}</span>
        <span className="ui-select__chevron" aria-hidden="true">
          <svg viewBox="0 0 20 20" focusable="false" aria-hidden="true">
            <path d="m5 8.5 5 5 5-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" />
          </svg>
        </span>
      </button>
      {open && (
        <div className="ui-select__listbox">
          {searchable && <input ref={searchRef} className="ui-select__search" type="search" aria-label={placeholder.startsWith('Buscar') ? placeholder : `Buscar ${placeholder.toLowerCase()}`} value={search} onChange={(event) => setSearch(event.target.value)} onKeyDown={(event) => { if (event.key === 'Escape') { setOpen(false); setSearch('') } }} />}
          <div id={listboxId} role="listbox" aria-label={selectedOption?.label ?? placeholder}>
          {visibleOptions.map((option) => {
            const index = options.findIndex((candidate) => candidate.value === option.value)
            return (
            <div
              className={option.value === value ? 'ui-select__option ui-select__option--selected' : 'ui-select__option'}
              id={`${listboxId}-option-${index}`}
              key={option.value}
              role="option"
              aria-selected={option.value === value}
              aria-disabled={option.disabled || undefined}
              onPointerDown={(event) => {
                event.preventDefault()
                choose(option)
              }}
              onClick={(event) => {
                if (event.detail === 0) choose(option)
              }}
            >
              {option.label}
            </div>
          )})}
          {visibleOptions.length === 0 && <p className="ui-select__empty">Nenhum resultado encontrado.</p>}
          </div>
        </div>
      )}
    </div>
  )
}
