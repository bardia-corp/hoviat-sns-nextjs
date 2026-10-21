import { MyBusinessList } from "@/components/BusinessEditor"
import "./owner.css"

export const metadata = { title: "کسب‌وکارهای من | هویت" }

export default async function MyBusinessesPage({ searchParams }: {
  searchParams: Promise<{ page?: string }>
}) {
  const query = await searchParams
  const page = Number(query.page ?? 1)
  return <MyBusinessList page={Number.isSafeInteger(page) && page > 0 ? page : 1} />
}
