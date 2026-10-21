import type { BusinessCategory } from "./api/business-types"

/** Vocabulary only: city choices and business counts always come from published data. */
export const GERMAN_STATES = [
  { name: "Baden-Württemberg", aliases: ["بادن وورتمبرگ", "Baden-Wuerttemberg", "BadenWuerttemberg", "BW"] },
  { name: "Bayern", aliases: ["بایرن", "باواریا", "Bavaria", "BY"] },
  { name: "Berlin", aliases: ["برلین", "BE"] },
  { name: "Brandenburg", aliases: ["براندنبورگ", "BB"] },
  { name: "Bremen", aliases: ["برمن", "HB"] },
  { name: "Hamburg", aliases: ["هامبورگ", "HH"] },
  { name: "Hessen", aliases: ["هسن", "Hesse", "HE"] },
  { name: "Mecklenburg-Vorpommern", aliases: ["مکلنبورگ فورپومرن", "Mecklenburg Western Pomerania", "MV"] },
  { name: "Niedersachsen", aliases: ["نیدرزاکسن", "Lower Saxony", "NI"] },
  { name: "Nordrhein-Westfalen", aliases: ["نورد راین وستفالن", "North Rhine Westphalia", "North Rhine-Westphalia", "NRW", "NW"] },
  { name: "Rheinland-Pfalz", aliases: ["راینلاند فالتس", "Rhineland-Palatinate", "Rhineland Palatinate", "RP"] },
  { name: "Saarland", aliases: ["زارلاند", "SL"] },
  { name: "Sachsen", aliases: ["زاکسن", "Saxony", "SN"] },
  { name: "Sachsen-Anhalt", aliases: ["زاکسن آنهالت", "Saxony-Anhalt", "Saxony Anhalt", "ST"] },
  { name: "Schleswig-Holstein", aliases: ["اشلسویگ هولشتاین", "Schleswig Holstein", "SH"] },
  { name: "Thüringen", aliases: ["تورینگن", "Thuringia", "Thueringen", "TH"] },
]

export function searchText(value: string): string {
  return value.normalize("NFKD").replace(/[\u0300-\u036f\u064b-\u065f]/g, "").replace(/ي/g, "ی").replace(/ك/g, "ک").toLocaleLowerCase().trim()
}

export function normaliseGermanState(value: string): string {
  const key = searchText(value)
  return GERMAN_STATES.find((state) => [state.name, ...state.aliases].some((name) => searchText(name) === key))?.name ?? value.trim()
}

export function flattenCategories(nodes: BusinessCategory[], trail: string[] = []): { category: BusinessCategory; path: string }[] {
  const unique = new Map<number, { category: BusinessCategory; paths: string[] }>()
  function walk(branch: BusinessCategory[], parents: string[]) {
    for (const category of branch) {
      const path = [...parents, category.name].join(" / ")
      const entry = unique.get(category.id)
      if (entry) { if (!entry.paths.includes(path)) entry.paths.push(path) }
      else unique.set(category.id, { category, paths: [path] })
      walk(category.children, [...parents, category.name])
    }
  }
  walk(nodes, trail)
  // Search every placement, but render/select the shared child only once.
  return [...unique.values()].map(({ category, paths }) => ({ category, path: paths.join(" · ") }))
}
