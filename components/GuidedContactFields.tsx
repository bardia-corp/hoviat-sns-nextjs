"use client"

import { useId, useState } from "react"
import { CONTACT_TEMPLATES, BUSINESS_CONTACT_TEMPLATES, type ContactKind, type ContactValues } from "@/lib/guided-contacts"

export default function GuidedContactFields({ values, onChange, visibility, onVisibility, business = false }: {
  values: ContactValues; onChange: (kind: ContactKind, value: string) => void
  visibility?: Record<ContactKind, boolean>; onVisibility?: (kind: ContactKind, visible: boolean) => void
  business?: boolean
}) {
  const prefix = useId()
  const templates = business ? BUSINESS_CONTACT_TEMPLATES : CONTACT_TEMPLATES
  const [added, setAdded] = useState<ContactKind[]>(() => templates.filter((template) => Boolean(values[template.key])).map((template) => template.key))
  const [choosing, setChoosing] = useState(false)
  const active = templates.filter((template) => Boolean(values[template.key]) || added.includes(template.key))
  const available = templates.filter((template) => !active.some((entry) => entry.key === template.key))
  return <div className="guided-contacts">{active.map((template, index) => <div className="contact-field" key={template.key}>
    <div className="contact-field__heading"><label htmlFor={`${prefix}-${template.key}`}>{template.label}</label><button type="button" className="contact-remove" aria-label={`حذف ${template.label}`} onClick={() => { onChange(template.key, ""); setAdded((previous) => previous.filter((key) => key !== template.key)) }}>حذف</button></div>
    <div className="contact-field__input"><span className="contact-field__prefix">{template.prefix}</span><input id={`${prefix}-${template.key}`} data-editor-focus={index === 0 ? true : undefined} dir="ltr" inputMode={template.inputMode} autoComplete="off" autoCapitalize="none" spellCheck={false} value={values[template.key]} placeholder={template.placeholder} onChange={(event) => onChange(template.key, event.target.value)} aria-describedby={`${prefix}-${template.key}-hint`} /></div>
    <p className="contact-field__hint" id={`${prefix}-${template.key}-hint`}>{template.hint}</p>
    {visibility && onVisibility && <label className="editor-check"><input type="checkbox" checked={visibility[template.key]} onChange={(event) => onVisibility(template.key, event.target.checked)} />نمایش عمومی این راه ارتباطی</label>}
  </div>)}
    {!active.length && <p className="editor-help">راه ارتباطی دلخواهتان را اضافه کنید.</p>}
    {available.length > 0 && <button type="button" className="contact-add" aria-expanded={choosing} onClick={() => setChoosing((previous) => !previous)}>{choosing ? "بستن انتخاب‌ها" : "+ افزودن راه ارتباطی"}</button>}
    {choosing && available.length > 0 && <div className="contact-type-choices" aria-label="نوع راه ارتباطی">{available.map((template) => <button type="button" key={template.key} onClick={() => {
      setAdded((previous) => [...previous, template.key]); onVisibility?.(template.key, true); setChoosing(false)
      requestAnimationFrame(() => document.getElementById(`${prefix}-${template.key}`)?.focus())
    }}>{template.label}</button>)}</div>}
  </div>
}
