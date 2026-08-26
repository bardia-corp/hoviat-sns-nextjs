"use client"

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { createPortal } from "react-dom"
import { CheckIcon, ChevronDownIcon, SearchIcon } from "./Icons"

type PickerProps = {
  label: string
  value: string
  options: string[]
  placeholder: string
  onChange: (next: string) => void
  /** Adds a filter box inside the panel. Worth it past roughly ten options. */
  searchable?: boolean
  /**
   * Lets someone commit a value that is not in the list.
   *
   * This exists because country and occupation are free text in the backend
   * with no controlled vocabulary, so our list is a convenience, not the truth.
   * Blocking anything unlisted would make a value that really is stored on
   * profiles unsearchable.
   */
  allowCustom?: boolean
  /**
   * Custom match test, so a Persian option can be found by typing its Latin
   * or misspelled variant. Defaults to a plain contains.
   */
  matchOption?: (option: string, term: string) => boolean
  /** Shown under the filter box: the exact-match caveat, usually. */
  hint?: string
}

type Position = { top: number; left: number; width: number; maxHeight: number }

const PANEL_GAP = 8
const VIEWPORT_MARGIN = 12
const MAX_PANEL_HEIGHT = 260

/* A styled listbox replacing the native select.

   Two problems solved here.

   First, the native control cannot be themed: its popup punched a grey system
   menu through the glass with no transition at all.

   Second, and the reason for the portal: an absolutely positioned panel is
   still part of the dialog's layout and scroll box, so opening a long list
   grew the dialog and made it scroll. Rendering the panel into <body> with
   position: fixed takes it out of that box entirely, so it floats over the
   dialog the way a menu should. The cost is that fixed elements do not follow
   their trigger, so the position is measured from the trigger's rect and
   recomputed on scroll and resize. */
export function Picker({
  label,
  value,
  options,
  placeholder,
  onChange,
  searchable = false,
  allowCustom = false,
  matchOption,
  hint,
}: PickerProps) {
  const [open, setOpen] = useState(false)
  const [term, setTerm] = useState("")
  const searchRef = useRef<HTMLInputElement>(null)
  const [position, setPosition] = useState<Position | null>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  const measure = useCallback(() => {
    const trigger = buttonRef.current
    if (!trigger) return

    const rect = trigger.getBoundingClientRect()
    const below = window.innerHeight - rect.bottom - VIEWPORT_MARGIN
    const above = rect.top - VIEWPORT_MARGIN

    /* Prefer opening downward, but flip up when there is more room there.
       Inside a dialog the trigger is often near the bottom of the screen. */
    const openUp = below < 180 && above > below
    const available = Math.min(MAX_PANEL_HEIGHT, openUp ? above : below)

    setPosition({
      top: openUp ? rect.top - PANEL_GAP - available : rect.bottom + PANEL_GAP,
      left: rect.left,
      width: rect.width,
      maxHeight: Math.max(120, available),
    })
  }, [])

  /* Measure before paint, so the panel never appears in the wrong place. */
  useLayoutEffect(() => {
    if (open) measure()
  }, [open, measure])

  /* Reset and focus on open: reopening should not resume someone else's
     half-typed filter, and a filter box nobody can type into is furniture. */
  useEffect(() => {
    if (!open) return
    setTerm("")
    if (searchable) {
      const id = window.setTimeout(() => searchRef.current?.focus(), 20)
      return () => window.clearTimeout(id)
    }
  }, [open, searchable])

  useEffect(() => {
    if (!open) return

    function onPointerDown(event: MouseEvent) {
      const target = event.target as Node
      if (
        !buttonRef.current?.contains(target) &&
        !panelRef.current?.contains(target)
      ) {
        setOpen(false)
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        /* Stop the dialog behind this from closing too: the first Escape
           should dismiss the menu, the second the dialog. */
        event.stopPropagation()
        setOpen(false)
      }
    }

    function onReflow() {
      measure()
    }

    document.addEventListener("mousedown", onPointerDown)
    document.addEventListener("keydown", onKeyDown)
    /* Capture phase, so scrolling inside any container is caught, not just
       the window. */
    window.addEventListener("scroll", onReflow, true)
    window.addEventListener("resize", onReflow)

    return () => {
      document.removeEventListener("mousedown", onPointerDown)
      document.removeEventListener("keydown", onKeyDown)
      window.removeEventListener("scroll", onReflow, true)
      window.removeEventListener("resize", onReflow)
    }
  }, [open, measure])

  const visible = useMemo(() => {
    const query = term.trim()
    if (!query) return options
    const test =
      matchOption ??
      ((option: string, needle: string) =>
        option.toLowerCase().includes(needle.toLowerCase()))
    return options.filter((option) => test(option, query))
  }, [options, term, matchOption])

  /* Only offered when what was typed is not already an option, so the list
     never shows the same value twice. */
  const custom =
    allowCustom &&
    term.trim().length > 0 &&
    !options.some((option) => option === term.trim())
      ? term.trim()
      : null

  function choose(next: string) {
    onChange(next)
    setTerm("")
    setOpen(false)
  }

  const optionRow = (option: string, optionLabel: string) => {
    const selected = value === option
    return (
      <button
        key={option || "__any"}
        type="button"
        role="option"
        aria-selected={selected}
        className={
          selected
            ? "picker__option picker__option--selected"
            : "picker__option"
        }
        onClick={() => choose(option)}
      >
        <span>{optionLabel}</span>
        {selected ? (
          <span className="picker__check">
            <CheckIcon size={15} />
          </span>
        ) : null}
      </button>
    )
  }

  return (
    <div className="picker">
      <button
        ref={buttonRef}
        type="button"
        className={
          open ? "picker__button picker__button--open" : "picker__button"
        }
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
      >
        <span
          className={
            value ? "picker__value" : "picker__value picker__value--placeholder"
          }
        >
          {value || placeholder}
        </span>
        <span
          className={
            open ? "picker__chevron picker__chevron--open" : "picker__chevron"
          }
        >
          <ChevronDownIcon size={17} />
        </span>
      </button>

      {open && position
        ? createPortal(
            <div
              ref={panelRef}
              className="picker__panel picker__panel--floating"
              role="listbox"
              aria-label={label}
              style={{
                top: position.top,
                left: position.left,
                width: position.width,
                maxHeight: position.maxHeight,
              }}
            >
              {searchable ? (
                <div className="picker__search">
                  <span className="picker__search-icon" aria-hidden="true">
                    <SearchIcon size={15} />
                  </span>
                  <input
                    ref={searchRef}
                    className="picker__search-input"
                    type="text"
                    inputMode="search"
                    autoComplete="off"
                    placeholder={"جستجو در " + label}
                    value={term}
                    onChange={(event) => setTerm(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key !== "Enter") return
                      event.preventDefault()
                      /* Enter takes the first match, or the typed value when
                         nothing matched and free text is allowed. */
                      if (visible.length > 0) choose(visible[0])
                      else if (custom) choose(custom)
                    }}
                  />
                </div>
              ) : null}

              {hint && searchable ? (
                <p className="picker__hint">{hint}</p>
              ) : null}

              <div className="picker__list">
                {term.trim() === "" ? optionRow("", placeholder) : null}
                {visible.map((option) => optionRow(option, option))}

                {custom ? (
                  <button
                    type="button"
                    role="option"
                    aria-selected={false}
                    className="picker__option picker__option--custom"
                    onClick={() => choose(custom)}
                  >
                    <span>
                      {"جستجوی «" + custom + "»"}
                    </span>
                  </button>
                ) : null}

                {visible.length === 0 && !custom ? (
                  <p className="picker__empty">
                    {"چیزی پیدا نشد."}
                  </p>
                ) : null}
              </div>
            </div>,
            document.body
          )
        : null}
    </div>
  )
}
