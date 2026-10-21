"use client"

import { useId, useMemo, useState, useTransition, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import type { BusinessCategory, BusinessLocation } from "@/lib/api/business-types"
import { businessSearchHref, RELEVANCE_FIELDS, type BusinessQuery } from "@/lib/business-search"
import { flattenCategories, GERMAN_STATES, normaliseGermanState, searchText } from "@/lib/search-filter-options"
import { faDigits } from "@/lib/date"
import SearchFilterDialog from "./SearchFilterDialog"
import UIIcon from "./UIIcon"

type Chooser = "location" | "category" | "advanced" | "sort" | null
const SORTS = [
  { value: "", label: "پیش‌فرض (مرتبط‌ترین برای جستجو)" }, { value: "relevance", label: "مرتبط‌ترین" },
  { value: "newest", label: "تازه‌ترین" }, { value: "recently_updated", label: "آخرین به‌روزرسانی" },
  { value: "name_asc", label: "نام، از ابتدا" }, { value: "name_desc", label: "نام، از انتها" }, { value: "oldest", label: "قدیمی‌ترین" },
]
const countryLabel = (code: string) => code === "DE" ? "آلمان" : code === "all" ? "همهٔ کشورها" : code

export default function BusinessFilters({ query, locations, categories }: {
  query: BusinessQuery; locations: BusinessLocation[]; categories: BusinessCategory[]
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const inputId = useId()
  const [text, setText] = useState(query.q ?? "")
  const [chooser, setChooser] = useState<Chooser>(null)
  const [draft, setDraft] = useState<BusinessQuery>({ ...query, state: query.state ? normaliseGermanState(query.state) : undefined, category: [...query.category] })
  const [locationStep, setLocationStep] = useState<"state" | "city">("state")
  const [filterText, setFilterText] = useState("")
  const [categoryTrail, setCategoryTrail] = useState<BusinessCategory[]>([])
  const allCategories = useMemo(() => flattenCategories(categories), [categories])
  const countryOptions = [...new Set(["DE", ...(draft.country_code === "all" ? [] : [draft.country_code]), ...locations.map((item) => item.country_code).filter((code): code is string => Boolean(code))])]
  const regions = locations.filter((item) => draft.country_code === "all" || item.country_code === draft.country_code).flatMap((item) => item.states)
  const stateNames = [...new Set([
    ...(draft.country_code === "DE" ? GERMAN_STATES.map((state) => state.name) : []),
    ...regions.map((item) => item.state).filter((name): name is string => Boolean(name)),
    ...(draft.state ? [draft.state] : []),
  ])].sort((a, b) => a.localeCompare(b, "de"))
  const cities = [...new Set(regions.filter((region) => !draft.state || searchText(normaliseGermanState(region.state ?? "")) === searchText(normaliseGermanState(draft.state))).flatMap((region) => region.cities.map((city) => city.city)))].sort((a, b) => a.localeCompare(b, "de"))
  const visibleStates = stateNames.filter((name) => searchText(name + " " + (GERMAN_STATES.find((entry) => entry.name === name)?.aliases.join(" ") ?? "")).includes(searchText(filterText)))
  const visibleCities = cities.filter((name) => searchText(name).includes(searchText(filterText)))
  const branch = categoryTrail.length ? categoryTrail[categoryTrail.length - 1].children : categories
  const categoryResults = branch.filter((category) => searchText(category.name + " " + (categoryTrail.length ? "" : category.children.map((child) => child.name).join(" "))).includes(searchText(filterText)))
  const relevanceCount = RELEVANCE_FIELDS.filter(({ key }) => query[key]).length
  const categoryName = (id: number) => allCategories.find((entry) => entry.category.id === id)?.category.name ?? "دستهٔ " + faDigits(id)
  const locationLabel = query.city ?? query.state ?? (query.country_code !== "DE" ? countryLabel(query.country_code) : "انتخاب شهر")
  const categoryLabel = query.category.length === 1 ? categoryName(query.category[0]) : query.category.length > 1 ? faDigits(query.category.length) + " دسته‌بندی" : "انتخاب حرفه"
  const allCitiesLabel = draft.state ? "همهٔ شهرهای " + draft.state : draft.country_code === "all" ? "همهٔ شهرها" : "همهٔ شهرهای " + countryLabel(draft.country_code)
  const hasFilters = Boolean(query.state || query.city || query.category.length || relevanceCount || query.country_code !== "DE" || query.q || query.sort)

  function open(next: Exclude<Chooser, null>) {
    setDraft({ ...query, state: query.state ? normaliseGermanState(query.state) : undefined, category: [...query.category] })
    setFilterText("")
    setCategoryTrail([])
    setLocationStep(query.state || query.city ? "city" : "state")
    setChooser(next)
  }

  function navigate(next: BusinessQuery) {
    setChooser(null)
    startTransition(() => router.push(businessSearchHref({ ...next, q: text.trim() || undefined, page: 1 })))
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    navigate(query)
  }

  function toggleCategory(id: number) {
    setDraft((previous) => ({ ...previous, category: previous.category.includes(id) ? previous.category.filter((entry) => entry !== id) : [...previous.category, id] }))
  }

  function chooseState(state?: string) {
    setDraft((previous) => ({ ...previous, state, city: undefined }))
    setFilterText("")
    setLocationStep("city")
  }

  return <section className="search-workbench" aria-label="جستجو و فیلتر کسب‌وکارها" aria-busy={pending}>
    <form action="/discover" method="get" className="search-bar" onSubmit={submitSearch}>
      <UIIcon name="search" size={22} className="search-bar__icon" />
      <label className="sr-only" htmlFor={inputId}>چه خدمتی نیاز دارید؟</label>
      <input id={inputId} type="search" name="q" value={text} onChange={(event) => setText(event.target.value)} placeholder="چه خدمتی نیاز دارید؟" maxLength={500} autoComplete="off" />
      <input type="hidden" name="country_code" value={query.country_code} />
      {query.state && <input type="hidden" name="state" value={query.state} />}
      {query.city && <input type="hidden" name="city" value={query.city} />}
      {query.category.map((id) => <input key={id} type="hidden" name="category" value={id} />)}
      {RELEVANCE_FIELDS.map(({ key }) => query[key] && <input key={key} type="hidden" name={key} value={query[key]} />)}
      {query.sort && <input type="hidden" name="sort" value={query.sort} />}
      <button type="submit" className="search-bar__submit" disabled={pending}><UIIcon name="search" size={19} /><span>{pending ? "جستجو…" : "جستجو"}</span></button>
    </form>

    <div className="search-selectors">
      <button type="button" className={query.city || query.state ? "search-selector search-selector--selected" : "search-selector"} aria-haspopup="dialog" aria-expanded={chooser === "location"} onClick={() => open("location")} disabled={pending}>
        <UIIcon name="map" size={22} /><span>{locationLabel}</span><UIIcon name="chevron" size={16} className="search-chevron-down" />
      </button>
      <button type="button" className={query.category.length ? "search-selector search-selector--selected" : "search-selector"} aria-haspopup="dialog" aria-expanded={chooser === "category"} onClick={() => open("category")} disabled={pending}>
        <UIIcon name="briefcase" size={22} /><span>{categoryLabel}</span><UIIcon name="chevron" size={16} className="search-chevron-down" />
      </button>
    </div>

    <div className="search-tools">
      <button type="button" className="search-tool" onClick={() => open("advanced")} aria-haspopup="dialog" aria-expanded={chooser === "advanced"} disabled={pending}><UIIcon name="filter" size={17} />فیلترهای بیشتر{relevanceCount > 0 && <span className="search-tool__count">{faDigits(relevanceCount)}</span>}</button>
      <button type="button" className="search-tool" onClick={() => open("sort")} aria-haspopup="dialog" aria-expanded={chooser === "sort"} disabled={pending}><UIIcon name="sort" size={17} /><span>{SORTS.find((sort) => sort.value === query.sort)?.label ?? (query.q ? "مرتبط‌ترین" : "تازه‌ترین")}</span></button>
      {hasFilters && <a className="search-reset" href="/discover">پاک کردن</a>}
    </div>

    {chooser === "location" && <SearchFilterDialog title={locationStep === "state" ? "انتخاب ایالت" : "انتخاب شهر"} onDismiss={() => setChooser(null)} onApply={() => navigate(draft)} applyLabel={draft.city ? `تأیید ${draft.city}` : draft.state ? `جستجو در ${draft.state}` : "جستجو در همهٔ شهرها"}>
      <label className={countryOptions.length > 1 && locationStep === "state" ? "search-country-label" : "sr-only"}>کشور<select disabled={countryOptions.length === 1 || locationStep !== "state"} value={draft.country_code} onChange={(event) => { setDraft((previous) => ({ ...previous, country_code: event.target.value, state: undefined, city: undefined })); setLocationStep("state"); setFilterText("") }}>
        {countryOptions.map((code) => <option key={code} value={code}>{countryLabel(code)}</option>)}<option value="all">همهٔ کشورها</option>
      </select></label>
      {locationStep === "city" && <button type="button" className="search-picker-back" onClick={() => { setLocationStep("state"); setFilterText("") }}><UIIcon name="arrow" size={18} />بازگشت</button>}
      <label className="search-dialog-search"><UIIcon name="search" size={18} /><span className="sr-only">{locationStep === "state" ? "جستجوی ایالت" : "جستجوی شهر"}</span><input data-autofocus value={filterText} onChange={(event) => setFilterText(event.target.value)} placeholder={locationStep === "state" ? "جستجوی ایالت…" : "جستجوی شهر…"} /></label>
      <div className="search-options">
        {locationStep === "state" ? <>
          <button type="button" className="search-option search-option--all" onClick={() => chooseState()}><span className="search-option__icon"><UIIcon name="globe" size={20} /></span><span>{draft.country_code === "all" ? "همهٔ شهرها" : "همهٔ شهرهای " + countryLabel(draft.country_code)}</span><UIIcon name="chevron" size={16} className="search-chevron-next" /></button>
          {visibleStates.map((name) => <button type="button" key={name} className={draft.state === name ? "search-option is-selected" : "search-option"} onClick={() => chooseState(name)}><span className="search-option__icon"><UIIcon name="map" size={20} /></span><bdi dir="auto">{name}</bdi><UIIcon name="chevron" size={16} className="search-chevron-next" /></button>)}
          {visibleStates.length === 0 && <p className="search-empty">ایالتی با این نام در پیشنهادها نیست. می‌توانید همهٔ شهرها را انتخاب کنید.</p>}
        </> : <>
          <button type="button" className={!draft.city ? "search-option search-option--all is-selected" : "search-option search-option--all"} aria-pressed={!draft.city} onClick={() => setDraft((previous) => ({ ...previous, city: undefined }))}><span className="search-option__icon"><UIIcon name="home" size={20} /></span><span>{allCitiesLabel}</span>{!draft.city && <UIIcon name="check" size={17} />}</button>
          {visibleCities.map((city) => <button type="button" key={city} className={draft.city === city ? "search-option is-selected" : "search-option"} aria-pressed={draft.city === city} onClick={() => setDraft((previous) => ({ ...previous, city }))}><span className="search-option__icon"><UIIcon name="map" size={20} /></span><bdi dir="auto">{city}</bdi>{draft.city === city && <UIIcon name="check" size={17} />}</button>)}
          {visibleCities.length === 0 && <p className="search-empty">{cities.length ? "شهری با این نام پیدا نشد." : "هنوز کسب‌وکاری در شهرهای این ایالت منتشر نشده است."}</p>}
        </>}
      </div>
    </SearchFilterDialog>}

    {chooser === "category" && <SearchFilterDialog title={categoryTrail.length ? categoryTrail[0].name : "انتخاب حرفه"} onDismiss={() => setChooser(null)} onApply={() => navigate(draft)} applyLabel={draft.category.length ? `تأیید ${faDigits(draft.category.length)} حرفه` : "همهٔ حرفه‌ها"}>
      {categoryTrail.length > 0 && <button type="button" className="search-picker-back" onClick={() => { setCategoryTrail([]); setFilterText("") }}><UIIcon name="arrow" size={18} />بازگشت</button>}
      <label className="search-dialog-search"><UIIcon name="search" size={18} /><span className="sr-only">جستجوی دسته‌بندی</span><input data-autofocus value={filterText} onChange={(event) => setFilterText(event.target.value)} placeholder="جستجوی حرفه یا خدمات…" /></label>
      {draft.category.length > 0 && <div className="search-selected-categories" aria-label="دسته‌های انتخاب‌شده">{draft.category.map((id) => <button type="button" key={id} onClick={() => toggleCategory(id)} aria-label={"حذف دستهٔ " + categoryName(id)}>{categoryName(id)}<UIIcon name="close" size={13} /></button>)}</div>}
      <div className="search-options">
        {!categoryTrail.length && <button type="button" className="search-option search-option--all" onClick={() => setDraft((previous) => ({ ...previous, category: [] }))}><span className="search-option__icon"><UIIcon name="briefcase" size={20} /></span><span>همهٔ حرفه‌ها</span>{draft.category.length === 0 && <UIIcon name="check" size={17} />}</button>}
        {categoryResults.map((category) => categories.some((root) => root.id === category.id)
          ? <button type="button" key={category.id} className="search-option" onClick={() => { setCategoryTrail([category]); setFilterText("") }} aria-label={"نمایش زیرمجموعه‌های " + category.name}><span className="search-option__icon"><UIIcon name="briefcase" size={20} /></span><span>{category.name}</span><UIIcon name="chevron" size={17} className="search-chevron-next" /></button>
          : <label key={category.id} className={draft.category.includes(category.id) ? "search-category-row is-selected" : "search-category-row"}><input type="checkbox" checked={draft.category.includes(category.id)} onChange={() => toggleCategory(category.id)} /><span>{category.name}</span></label>)}
        {categoryResults.length === 0 && <p className="search-empty">{filterText ? "دسته‌ای با این نام پیدا نشد." : "هنوز زیرمجموعه‌ای در این دسته ثبت نشده است."}</p>}
      </div>
    </SearchFilterDialog>}

    {chooser === "advanced" && <SearchFilterDialog title="فیلترهای بیشتر" onDismiss={() => setChooser(null)} onApply={() => navigate(draft)} applyLabel="اعمال فیلترها">
      <p className="search-dialog-hint">این چهار ویژگی مستقل‌اند؛ هر کدام را جداگانه انتخاب کنید.</p>
      <div className="search-relevance-fields">{RELEVANCE_FIELDS.map(({ key, label }) => <label key={key}><span>{label}</span><select value={draft[key] ?? ""} onChange={(event) => setDraft((previous) => ({ ...previous, [key]: event.target.value || undefined }))}><option value="">بدون محدودیت</option><option value="yes">بله</option><option value="no">خیر</option><option value="unknown">بررسی نشده</option></select></label>)}</div>
      <button type="button" className="search-clear-draft" onClick={() => setDraft((previous) => ({ ...previous, persian_owned: undefined, persian_provider: undefined, persian_language: undefined, persian_service: undefined }))}>پاک کردن این فیلترها</button>
    </SearchFilterDialog>}

    {chooser === "sort" && <SearchFilterDialog title="مرتب‌سازی نتایج" onDismiss={() => setChooser(null)} onApply={() => navigate(draft)} applyLabel="اعمال ترتیب">
      <fieldset className="search-sort-options"><legend className="sr-only">ترتیب نمایش کسب‌وکارها</legend>{SORTS.map((sort) => <label key={sort.value} className={(draft.sort ?? "") === sort.value ? "is-selected" : ""}><input type="radio" name="business-sort-draft" value={sort.value} checked={(draft.sort ?? "") === sort.value} onChange={() => setDraft((previous) => ({ ...previous, sort: sort.value || undefined }))} /><span>{sort.label}</span>{(draft.sort ?? "") === sort.value && <UIIcon name="check" size={18} />}</label>)}</fieldset>
    </SearchFilterDialog>}
  </section>
}
