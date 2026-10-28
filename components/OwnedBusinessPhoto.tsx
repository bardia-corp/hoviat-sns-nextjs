"use client"

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react"
import type { OwnedBusiness } from "@/lib/api/owned-business-types"
import { apiFetch } from "@/lib/client-session"
import BusinessCover from "./BusinessCover"
import EditorDialog from "./EditorDialog"
import UIIcon from "./UIIcon"
import "./owned-business-photo.css"

const MAX_FILE_BYTES = 5 * 1024 * 1024

export default function OwnedBusinessPhoto({ business, stale, onUpdated, onConflict, onMissing }: {
  business: OwnedBusiness; stale: boolean
  onUpdated: (business: OwnedBusiness) => void
  onConflict: () => void; onMissing: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [removing, setRemoving] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const input = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!file) { setPreview(null); return }
    const url = URL.createObjectURL(file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  function close() {
    if (busy) return
    setEditing(false); setFile(null); setRemoving(false); setError("")
  }

  function choose(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.currentTarget.files?.[0]
    event.currentTarget.value = ""
    if (!selected) return
    if (!["image/jpeg", "image/png", "image/webp"].includes(selected.type)) {
      setError("عکس باید JPEG، PNG یا WebP باشد."); return
    }
    if (!selected.size || selected.size > MAX_FILE_BYTES) {
      setError("یک عکس با حجم حداکثر ۵ مگابایت انتخاب کنید."); return
    }
    setError(""); setRemoving(false); setFile(selected)
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy || stale || (!file && !removing)) return
    setBusy(true); setError("")
    const path = `/api/my-businesses/${business.id}/cover-image`
    let body: FormData | undefined
    if (file && !removing) {
      body = new FormData()
      body.append("file", file)
      body.append("expected_updated_at", business.updated_at)
    }
    try {
      const response = await apiFetch<OwnedBusiness>(removing ? `${path}?${new URLSearchParams({ expected_updated_at: business.updated_at })}` : path, {
        method: removing ? "DELETE" : "POST", body,
      })
      if (response.ok && response.data) {
        onUpdated(response.data)
        setEditing(false); setFile(null); setRemoving(false)
      } else {
        if (response.status === 409) { onConflict(); setEditing(false); setFile(null); setRemoving(false) }
        if (response.status === 404) onMissing()
        setError(response.message ?? "عکس ذخیره نشد. دوباره تلاش کنید.")
      }
    } catch { setError("ارتباط برقرار نشد. دوباره تلاش کنید.") }
    finally { setBusy(false) }
  }

  return <section className="owner-panel owner-photo-panel">
    <div className="owner-section-heading"><h2><UIIcon name="image" size={23} />عکس کسب‌وکار</h2><button type="button" className="owner-edit-pill" disabled={stale} onClick={() => { setError(""); setEditing(true) }}><UIIcon name="camera" size={17} />{business.cover_image_url ? "تغییر عکس" : "افزودن عکس"}</button></div>
    <div className="owner-photo-current"><BusinessCover url={business.cover_image_url} /></div>
    {editing && <EditorDialog title="عکس کسب‌وکار" busy={busy} error={error} onClose={close} onSubmit={save} saveDisabled={stale || (!file && !removing)}>
      <div className="owner-photo-preview" aria-label={removing ? "عکس حذف خواهد شد" : "پیش‌نمایش عکس کسب‌وکار"}>
        {preview && !removing ? <img src={preview} alt="پیش‌نمایش عکس انتخاب‌شده" onError={() => { setFile(null); setError("این عکس قابل نمایش نیست. عکس دیگری انتخاب کنید.") }} /> : <BusinessCover url={removing ? null : business.cover_image_url} />}
      </div>
      <input ref={input} className="owner-photo-input" type="file" accept="image/jpeg,image/png,image/webp" onChange={choose} aria-label="انتخاب عکس کسب‌وکار" />
      <div className="owner-photo-actions">
        <button data-editor-focus type="button" className="owner-secondary" onClick={() => input.current?.click()}><UIIcon name="camera" size={18} />انتخاب عکس</button>
        {(business.cover_image_url || file) && !removing && <button type="button" className="owner-secondary" onClick={() => { setFile(null); setRemoving(Boolean(business.cover_image_url)); setError("") }}>حذف عکس</button>}
        {removing && <button type="button" className="owner-secondary" onClick={() => setRemoving(false)}>لغو حذف</button>}
      </div>
      <p className="editor-help">JPEG، PNG یا WebP · حداکثر ۵ مگابایت</p>
      {removing && <p className="editor-help" role="status">پس از ذخیره، عکس کسب‌وکار حذف می‌شود.</p>}
    </EditorDialog>}
  </section>
}
