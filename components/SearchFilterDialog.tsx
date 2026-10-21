"use client"

import { useEffect, useId, useRef, type ReactNode } from "react"
import UIIcon from "./UIIcon"

/** Native modal gives the page an inert background and keeps focus in the chooser. */
export default function SearchFilterDialog({ title, children, onDismiss, onApply, applyLabel = "تأیید انتخاب" }: {
  title: string
  children: ReactNode
  onDismiss: () => void
  onApply: () => void
  applyLabel?: string
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const dismiss = useRef(onDismiss)
  dismiss.current = onDismiss

  useEffect(() => {
    const element = dialog.current
    if (!element) return
    const trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    element.showModal()
    element.querySelector<HTMLElement>("[data-autofocus]")?.focus()
    const onCancel = (event: Event) => { event.preventDefault(); dismiss.current() }
    element.addEventListener("cancel", onCancel)
    return () => {
      element.removeEventListener("cancel", onCancel)
      element.close()
      document.body.style.overflow = previousOverflow
      if (trigger?.isConnected) trigger.focus({ preventScroll: true })
    }
  }, [])

  return <dialog ref={dialog} className="search-dialog" aria-labelledby={titleId}
    onClick={(event) => { if (event.target === event.currentTarget) onDismiss() }}
    onKeyDown={(event) => {
      if (event.key !== "Tab") return
      const controls = Array.from(dialog.current?.querySelectorAll<HTMLElement>("button:not(:disabled), input:not(:disabled), select:not(:disabled), a[href], [tabindex='0']") ?? []).filter((element) => element.getClientRects().length > 0)
      const first = controls[0]
      const last = controls[controls.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
    }}>
    <div className="search-dialog__surface">
      <header className="search-dialog__header"><h2 id={titleId}>{title}</h2><button type="button" className="search-icon-button" onClick={onDismiss} aria-label="بستن بدون اعمال تغییرات"><UIIcon name="close" size={20} /></button></header>
      <div className="search-dialog__body">{children}</div>
      <footer className="search-dialog__footer"><button type="button" className="search-confirm" onClick={onApply}>{applyLabel}</button><button type="button" className="search-cancel" onClick={onDismiss}>انصراف</button></footer>
    </div>
  </dialog>
}
