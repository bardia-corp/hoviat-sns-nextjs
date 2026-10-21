import BusinessEditor from "@/components/BusinessEditor"
import "../owner.css"

export const metadata = { title: "ویرایش کسب‌وکار | هویت" }

export default async function EditBusinessPage({ params }: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <BusinessEditor id={id} />
}
