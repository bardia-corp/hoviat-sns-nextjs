import { CardListSkeleton, RouteProgress } from "@/components/Skeleton"

export default function Loading() {
  return (
    <>
      <RouteProgress />
      <main className="screen">
        <header className="hero">
          <div className="skeleton" style={{ height: 13, width: 76 }} />
          <div className="skeleton skeleton--title" style={{ marginTop: 12 }} />
          <div className="skeleton skeleton--line" style={{ width: "70%" }} />
        </header>
        <CardListSkeleton count={5} />
      </main>
    </>
  )
}
