"use client"

/**
 * Filter dialog: country, occupation, registration status.
 *
 * A centered floating dialog, not a bottom drawer. Edits are held in local
 * draft state and only committed on Apply, so dismissing the dialog never
 * changes the results behind it.
 *
 * Country leads with a list rather than a bare text input on purpose: the
 * backend compares country with case-sensitive equality, so a free-text box
 * silently returns nothing for a near miss. The list holds one canonical
 * spelling per country, and both pickers can also be searched by Latin or
 * misspelled variants - typing "germany" or "alman" finds آلمان - because
 * only the canonical value is ever sent.
 *
 * Free text is still accepted, since these columns have no controlled
 * vocabulary in the backend and refusing an unlisted value would hide profiles
 * that really do store it.
 *
 * Both lists use the custom Picker, which renders its panel through a portal
 * so a long list floats over this dialog instead of stretching it into a
 * scrolling box.
 */

import { useCallback, useEffect, useRef, useState } from "react"
import {
  COUNTRIES,
  COUNTRY_SUGGESTIONS,
  OCCUPATIONS,
  OCCUPATION_SUGGESTIONS,
  suggestionMatches,
} from "@/lib/vocab"
import { CloseIcon } from "./Icons"
import { Picker } from "./Picker"

export type Draft = {
  country?: string
  occupation?: string
  is_registered?: boolean
}

type FilterModalProps = {
  open: boolean
  value: Draft
  onClose: () => void
  onApply: (draft: Draft) => void
}

const STATUS_OPTIONS: Array<{ label: string; value: boolean | undefined }> = [
  { label: "همه", value: undefined },
  { label: "ثبت‌نام شده", value: true },
  { label: "ثبت‌نام نشده", value: false },
]

export default function FilterModal({
  open,
  value,
  onClose,
  onApply,
}: FilterModalProps) {
  const [draft, setDraft] = useState<Draft>(value)
  const dialogRef = useRef<HTMLDivElement>(null)

  // Re-seed the draft each time the dialog opens so it always reflects the
  // filters currently applied to the page.
  useEffect(() => {
    if (open) setDraft(value)
  }, [open, value])

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
    },
    [onClose]
  )

  useEffect(() => {
    if (!open) return

    document.addEventListener("keydown", handleKeyDown)

    // Lock background scrolling while the dialog is up.
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    dialogRef.current?.focus()

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [open, handleKeyDown])

  if (!open) return null

  return (
    <div
      className="modal-overlay"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="filter-modal-title"
        tabIndex={-1}
        ref={dialogRef}
      >
        <div className="modal__head">
          <h2 className="modal__title" id="filter-modal-title">
            فیلترها
          </h2>
          <button
            type="button"
            className="modal__close"
            onClick={onClose}
            aria-label="بستن فیلترها"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="modal__group">
          <p className="modal__label">کشور</p>
          <Picker
            label="کشور"
            placeholder="همه کشورها"
            searchable
            allowCustom
            hint="کشور دقیقاً مقایسه می‌شود؛ از فهرست انتخاب کنید."
            matchOption={(option, needle) => {
              const suggestion = COUNTRY_SUGGESTIONS.find(
                (item) => item.value === option,
              )
              return suggestion
                ? suggestionMatches(suggestion, needle)
                : option.includes(needle)
            }}
            options={COUNTRIES}
            value={draft.country ?? ""}
            onChange={(next) =>
              setDraft((current) => ({
                ...current,
                country: next || undefined,
              }))
            }
          />
        </div>

        <div className="modal__group">
          <p className="modal__label">شغل</p>
          <Picker
            searchable
            allowCustom
            matchOption={(option, needle) => {
              const suggestion = OCCUPATION_SUGGESTIONS.find(
                (item) => item.value === option,
              )
              return suggestion
                ? suggestionMatches(suggestion, needle)
                : option.includes(needle)
            }}
            label="شغل"
            placeholder="همه شغل‌ها"
            options={OCCUPATIONS}
            value={draft.occupation ?? ""}
            onChange={(next) =>
              setDraft((current) => ({
                ...current,
                occupation: next || undefined,
              }))
            }
          />
        </div>

        <div className="modal__group">
          <p className="modal__label">وضعیت ثبت‌نام</p>
          <div className="chips">
            {STATUS_OPTIONS.map((option) => {
              const active = draft.is_registered === option.value
              return (
                <button
                  key={option.label}
                  type="button"
                  className={active ? "chip chip--active" : "chip"}
                  aria-pressed={active}
                  onClick={() =>
                    setDraft((current) => ({
                      ...current,
                      is_registered: option.value,
                    }))
                  }
                >
                  {option.label}
                </button>
              )
            })}
          </div>
        </div>

        <div className="modal__actions">
          <button
            type="button"
            className="modal__btn modal__btn--ghost"
            onClick={() => setDraft({})}
          >
            پاک کردن
          </button>
          <button
            type="button"
            className="modal__btn modal__btn--primary"
            onClick={() => onApply(draft)}
          >
            اعمال فیلتر
          </button>
        </div>
      </div>
    </div>
  )
}
