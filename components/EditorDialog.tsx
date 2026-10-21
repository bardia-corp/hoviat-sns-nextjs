"use client"

import { useEffect, useId, useRef, type FormEvent, type ReactNode } from "react"
import UIIcon from "./UIIcon"
import "./editor-dialog.css"

export default function EditorDialog({ title, description, children, busy, error, onClose, onSubmit, saveLabel = "ذخیره تغییرات", saveDisabled = false }: {
  title: string; description?: string; children: ReactNode; busy: boolean; error?: string
  onClose: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void; saveLabel?: string; saveDisabled?: boolean
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const busyRef = useRef(busy)
  const closeRef = useRef(onClose)
  busyRef.current = busy
  closeRef.current = onClose
  const titleId = useId()
  const descriptionId = useId()
  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    const trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const overflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    dialog.showModal()
    dialog.querySelector<HTMLElement>("[data-editor-focus]")?.focus()
    const cancel = (event: Event) => { event.preventDefault(); if (!busyRef.current) closeRef.current() }
    dialog.addEventListener("cancel", cancel)
    return () => {
      dialog.removeEventListener("cancel", cancel)
      dialog.close()
      document.body.style.overflow = overflow
      if (trigger?.isConnected) trigger.focus({ preventScroll: true })
    }
  }, [])
  return <dialog ref={ref} className="editor-dialog" aria-labelledby={titleId} aria-describedby={description ? descriptionId : undefined} onClick={(event) => { if (event.target === event.currentTarget && !busy) onClose() }}>
    <form className="editor-dialog__form" onSubmit={onSubmit}>
      <header className="editor-dialog__header"><div><h2 id={titleId}>{title}</h2>{description && <p id={descriptionId}>{description}</p>}</div><button type="button" disabled={busy} onClick={onClose} aria-label="بستن بدون ذخیره"><UIIcon name="close" size={22} /></button></header>
      <div className="editor-dialog__body"><fieldset disabled={busy}>{children}</fieldset>{error && <p role="alert" className="editor-dialog__error">{error}</p>}</div>
      <footer className="editor-dialog__footer"><button type="submit" className="editor-dialog__save" disabled={busy || saveDisabled}>{busy ? "در حال ذخیره…" : saveLabel}</button><button type="button" disabled={busy} onClick={onClose}>انصراف</button></footer>
    </form>
  </dialog>
}
