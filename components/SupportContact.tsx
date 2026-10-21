"use client"

import { useEffect, useId, useRef, useState } from "react"
import UIIcon from "./UIIcon"
import { supportContacts } from "@/lib/support-contacts"
import "./support-contact.css"

export default function SupportContact() {
  const dialog = useRef<HTMLDialogElement>(null)
  const [open, setOpen] = useState(false)
  const titleId = useId()
  useEffect(() => {
    if (!open || !dialog.current) return
    const element = dialog.current
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    element.showModal()
    return () => { element.close(); document.body.style.overflow = previousOverflow }
  }, [open])

  return <>
    <button type="button" className="support-trigger" onClick={() => setOpen(true)}><UIIcon name="mail" size={19} />تماس با پشتیبانی</button>
    <dialog ref={dialog} className="support-dialog" aria-labelledby={titleId} onCancel={() => setOpen(false)} onClose={() => setOpen(false)} onClick={(event) => {
      if (event.target === event.currentTarget) {
        const box = event.currentTarget.getBoundingClientRect()
        if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) setOpen(false)
      }
    }}>
      <div className="support-dialog__head"><span className="support-dialog__icon"><UIIcon name="store" size={28} /></span><button type="button" aria-label="بستن" className="support-dialog__close" onClick={() => setOpen(false)} autoFocus><UIIcon name="close" /></button></div>
      <h2 id={titleId}>کسب‌وکارتان را معرفی کنید</h2>
      <p>نام کسب‌وکار، شهر و یک راه ارتباطی را برای تیم پشتیبانی بفرستید تا برای اضافه شدن به هویت راهنمایی‌تان کنیم.</p>
      <ul className="support-contacts" aria-label="راه‌های ارتباط با پشتیبانی">{supportContacts.map((contact) => {
        const content = <><UIIcon name={contact.icon} size={23} /><span><strong>{contact.title}</strong><bdi dir="ltr">{contact.value}</bdi>{!contact.href && <small>نمونه · هنوز فعال نیست</small>}</span></>
        return <li key={contact.id}>{contact.href ? <a className="support-contact" href={contact.href} target={contact.id === "telegram" ? "_blank" : undefined} rel={contact.id === "telegram" ? "noopener noreferrer" : undefined}>{content}</a> : <div className="support-contact support-contact--placeholder">{content}</div>}</li>
      })}</ul>
    </dialog>
  </>
}
