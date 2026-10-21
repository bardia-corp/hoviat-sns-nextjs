"use client"

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react"
import type { Account } from "@/lib/api/types"
import { removeAvatar, saveAvatar, saveContactLinks, savePrivacy, saveProfile, signOutAction } from "@/app/actions/account"
import { CONTACT_TEMPLATES, EMPTY_CONTACTS, contactUrl, readSocialContacts, validateContacts, writeSocialContacts, type ContactValues } from "@/lib/guided-contacts"
import RequireAuth from "@/components/RequireAuth"
import { ProfileSkeleton } from "@/components/Skeleton"
import { useAuth } from "@/components/AuthProvider"
import { apiFetch } from "@/lib/client-session"
import EditorDialog from "@/components/EditorDialog"
import GuidedContactFields from "@/components/GuidedContactFields"
import UIIcon from "@/components/UIIcon"
import "@/app/profile-redesign.css"

type Editor = "profile" | "contacts" | "privacy" | null

export default function ProfilePage() {
  return <main className="screen profile-page">
    <header className="hero"><p className="hero__eyebrow">حساب شخصی</p><h1 className="hero__title hero__title--sm">پروفایل من</h1><p className="hero__sub">خودتان را معرفی کنید و انتخاب کنید دیگران پروفایلتان را ببینند یا نه.</p></header>
    <RequireAuth title="برای تنظیم پروفایل وارد شوید" text="اطلاعات شخصی و حریم خصوصی شما به حساب کاربری‌تان تعلق دارد."><ProfileBody /></RequireAuth>
  </main>
}

function ProfileBody() {
  const { expire, signOut } = useAuth()
  const [account, setAccount] = useState<Account | null>(null)
  const [loadError, setLoadError] = useState("")
  const [notice, setNotice] = useState("")
  const [editor, setEditor] = useState<Editor>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [draft, setDraft] = useState({ nickname: "", bio: "" })
  const [contactDraft, setContactDraft] = useState<ContactValues>({ ...EMPTY_CONTACTS })
  const [privateDraft, setPrivateDraft] = useState(true)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [removePhoto, setRemovePhoto] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [failedAvatar, setFailedAvatar] = useState<string | null>(null)
  const photoInput = useRef<HTMLInputElement>(null)

  const load = useCallback(async () => {
    const result = await apiFetch<Account>("/api/account")
    if (!result.signedIn) return null
    if (!result.ok || !result.data) { setLoadError(result.message ?? "پروفایل دریافت نشد."); return null }
    setAccount(result.data); setLoadError(""); return result.data
  }, [])
  useEffect(() => { load() }, [load])
  useEffect(() => {
    if (!avatarFile) { setPreview(null); return }
    const url = URL.createObjectURL(avatarFile)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [avatarFile])

  if (!account) return loadError ? <div className="empty glass profile-load-error"><p role="alert">{loadError}</p><button className="btn-add" onClick={load}>تلاش دوباره</button></div> : <ProfileSkeleton />
  const savedName = account.nickname?.trim() || [account.first_name?.trim(), account.last_name?.trim()].filter(Boolean).join(" ")
  const name = savedName || "پروفایل من"
  const initials = savedName.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => Array.from(part)[0]).join("")
  const contacts = readSocialContacts(account.social_links ?? [])
  const isPrivate = !account.privacy.is_profile_discoverable

  function open(next: Exclude<Editor, null>) {
    if (!account) return
    // Never promote legacy personal names into the public name draft.
    setDraft({ nickname: account.nickname ?? "", bio: account.bio ?? "" })
    setContactDraft(readSocialContacts(account.social_links ?? []).values)
    setPrivateDraft(!account.privacy.is_profile_discoverable)
    setAvatarFile(null); setRemovePhoto(false); setError(""); setEditor(next)
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!account || busy) return
    setError(""); setBusy(true)
    try {
      if (editor === "profile") {
        // Only these fields are sent: hidden legacy occupation/country/etc stay.
        const nameChanged = draft.nickname !== (account.nickname ?? "")
        const nickname = draft.nickname.trim()
        if (nameChanged && (!nickname || nickname.length > 200)) { setError("نام شما باید بین ۱ تا ۲۰۰ نویسه باشد."); return }
        const result = await saveProfile({ bio: draft.bio, ...(nameChanged ? { nickname } : {}) })
        if (!result.ok) { if (result.reason === "auth") expire(); setError(result.message ?? "اطلاعات ذخیره نشد."); return }
        if (avatarFile || removePhoto) {
          const form = new FormData()
          if (avatarFile) form.append("file", avatarFile)
          const photo = avatarFile ? await saveAvatar(form) : await removeAvatar()
          if (!photo.ok) {
            if (photo.reason === "auth") expire()
            await load()
            setError("اطلاعات ذخیره شد؛ عکس تغییر نکرد. " + (photo.message ?? "دوباره تلاش کنید.")); return
          }
        }
      } else if (editor === "contacts") {
        const checked = validateContacts(contactDraft)
        if (checked.error) { setError(checked.error); return }
        const result = await saveContactLinks(writeSocialContacts(account.social_links ?? [], checked.values))
        if (!result.ok) { if (result.reason === "auth") expire(); setError(result.message ?? "راه‌های تماس ذخیره نشد."); return }
      } else if (editor === "privacy") {
        // A policy change is explicit. Reading a profile or editing its name
        // never republishes fields hidden by earlier granular privacy settings.
        const scope = privateDraft ? "private" : "public"
        const result = await savePrivacy({
          is_profile_discoverable: !privateDraft, nickname_visibility: scope, first_name_visibility: scope,
          last_name_visibility: scope, bio_visibility: scope,
          profile_picture_visibility: scope, social_links_visibility: scope,
        })
        if (!result.ok) { if (result.reason === "auth") expire(); setError(result.message ?? "حریم خصوصی ذخیره نشد."); return }
      }
      setEditor(null)
      setNotice("تغییرات ذخیره شد.")
      await load()
    } catch { setError("ارتباط برقرار نشد. دوباره تلاش کنید.") }
    finally { setBusy(false) }
  }

  const modalPhoto = removePhoto ? null : preview ?? account.profile_url
  return <>
    <section className="profile-hero glass" aria-label="پروفایل شخصی شما"><div className="profile-hero__avatar">{account.profile_url && failedAvatar !== account.profile_url ? <img src={account.profile_url} alt="" width={132} height={132} onError={() => setFailedAvatar(account.profile_url)} /> : <span className="profile-hero__initials">{initials || <UIIcon name="user" size={53} />}</span>}</div><h2 className="profile-hero__name" dir="auto">{name}</h2><p className="profile-hero__membership">پروفایل شخصی</p>{account.bio && <p className="profile-hero__bio">{account.bio}</p>}<div className="profile-hero__actions"><button className="profile-action profile-action--primary" type="button" onClick={() => open("profile")}><UIIcon name="edit" size={21} />ویرایش پروفایل</button><button className="profile-action profile-action--secondary" type="button" onClick={() => open("profile")}><UIIcon name="camera" size={22} />تغییر عکس</button></div></section>
    {notice && <p className="profile-notice" role="status"><UIIcon name="check" size={18} />{notice}</p>}
    {loadError && <p className="profile-notice" role="alert">{loadError}<button type="button" onClick={load}>تلاش دوباره</button></p>}
    <section className="panel glass profile-section"><div className="panel__head"><h2 className="panel__title"><span className="profile-section__icon"><UIIcon name="user" size={23} /></span>اطلاعات من</h2><button className="btn-edit" type="button" onClick={() => open("profile")}><UIIcon name="edit" size={17} />ویرایش</button></div><dl className="profile-simple-info"><div><dt>نام شما</dt><dd dir="auto">{savedName || "ثبت نشده"}</dd></div><div><dt>معرفی</dt><dd>{account.bio || "چند جمله درباره خودتان بنویسید."}</dd></div></dl></section>
    <section className="panel glass profile-section"><div className="panel__head"><h2 className="panel__title"><span className="profile-section__icon"><UIIcon name="phone" size={23} /></span>راه‌های تماس</h2><button className="btn-edit" type="button" onClick={() => open("contacts")}><UIIcon name="edit" size={17} />ویرایش</button></div><div className="profile-contact-list">{CONTACT_TEMPLATES.filter(({ key }) => contacts.values[key]).map(({ key, label }) => <a key={key} href={contactUrl(key, contacts.values[key])} target={key === "phone" ? undefined : "_blank"} rel="noopener noreferrer"><span>{label}</span><bdi>{key === "phone" || key === "whatsapp" ? "+" : key === "telegram" ? "@" : ""}{contacts.values[key]}</bdi><UIIcon name="external" size={16} /></a>)}</div>{!Object.values(contacts.values).some(Boolean) && <p className="panel__hint">تلگرام، واتس‌اپ، شماره تماس یا لینکدین خود را اضافه کنید.</p>}</section>
    <section className="panel glass profile-section profile-private-card"><div><h2 className="panel__title"><span className="profile-section__icon"><UIIcon name="user" size={23} /></span>پروفایل خصوصی</h2><p>{isPrivate ? "پروفایل شما برای دیگران نمایش داده نمی‌شود." : "پروفایل شما امکان نمایش عمومی دارد."}</p></div><button type="button" className="btn-edit" onClick={() => open("privacy")}>{isPrivate ? "روشن" : "خاموش"}<UIIcon name="edit" size={16} /></button></section>
    <button className="profile-signout" type="button" onClick={async () => { try { await signOutAction() } finally { await signOut() } }}>خروج از حساب</button>
    {editor && <EditorDialog title={editor === "profile" ? "ویرایش پروفایل" : editor === "contacts" ? "راه‌های تماس" : "حریم خصوصی پروفایل"} description={editor === "contacts" ? "شناسه یا شماره را وارد کنید؛ نشانی ارتباطی خودکار ساخته می‌شود." : undefined} busy={busy} error={error} onClose={() => setEditor(null)} onSubmit={submit} saveLabel={editor === "privacy" ? "ذخیره حریم خصوصی" : "ذخیره تغییرات"}>
      {editor === "profile" && <><div className="profile-photo-editor"><div className="profile-photo-editor__preview">{modalPhoto ? <img src={modalPhoto} alt="پیش‌نمایش عکس پروفایل" /> : <UIIcon name="user" size={38} />}</div><div><button type="button" className="profile-photo-choice" onClick={() => photoInput.current?.click()}><UIIcon name="camera" size={18} />انتخاب عکس</button><input ref={photoInput} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" tabIndex={-1} aria-label="انتخاب عکس پروفایل" onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ""; if (file) { setAvatarFile(file); setRemovePhoto(false) } }} />{(avatarFile || account.profile_url) && !removePhoto && <button className="profile-photo-remove" type="button" onClick={() => { setAvatarFile(null); setRemovePhoto(Boolean(account.profile_url)) }}>حذف عکس</button>}<p className="editor-help">JPG، PNG یا WebP؛ حداکثر ۵ مگابایت. تغییر عکس پس از ذخیره اعمال می‌شود.</p></div></div><label>نام شما<input data-editor-focus autoComplete="name" maxLength={200} value={draft.nickname} onChange={(event) => setDraft({ ...draft, nickname: event.target.value })} placeholder="نامی که دیگران می‌بینند" /></label><label>معرفی<textarea rows={5} value={draft.bio} onChange={(event) => setDraft({ ...draft, bio: event.target.value })} placeholder="درباره خودتان بنویسید…" /></label></>}
      {editor === "contacts" && <><GuidedContactFields values={contactDraft} onChange={(kind, value) => setContactDraft((previous) => ({ ...previous, [kind]: value }))} />{contacts.preservedCount > 0 && <p className="editor-help">راه‌های ارتباطی دیگری که از قبل ثبت کرده‌اید، با این فرم تغییری نمی‌کنند.</p>}</>}
      {editor === "privacy" && <><label className="editor-check profile-private-choice"><input data-editor-focus type="checkbox" checked={privateDraft} onChange={(event) => setPrivateDraft(event.target.checked)} /><span>پروفایل خصوصی</span></label><p className="editor-help">وقتی این گزینه روشن است، پروفایل شخصی شما به دیگران نمایش داده نمی‌شود؛ حتی در بخش فرد مرتبط کسب‌وکارها.</p><p className="editor-help">با خاموش‌کردن و ذخیره، نام شما، معرفی، عکس و راه‌های تماس این پروفایل را برای نمایش عمومی مجاز می‌کنید.</p><p className="editor-help">تغییر این گزینه فقط پس از زدن «ذخیره حریم خصوصی» اعمال می‌شود.</p></>}
    </EditorDialog>}
  </>
}
