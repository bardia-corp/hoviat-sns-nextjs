import { CardListSkeleton, RouteProgress } from "@/components/Skeleton"

/* Shown while a server component is still rendering. Next swaps this for the
   real page automatically once the server responds. */
export default function Loading() {
  return (
    <>
      <RouteProgress />
      <main className="screen">
        <header className="hero">
          <div className="skeleton" style={{ height: 13, width: 90 }} />
          <div className="skeleton skeleton--title" style={{ marginTop: 12 }} />
          <div className="skeleton skeleton--line" style={{ width: "76%" }} />
        </header>
        <div className="skeleton skeleton--bar" />
        <div className="skeleton-row">
          <div className="skeleton skeleton--pill" />
          <div className="skeleton skeleton--pill" />
          <div className="skeleton skeleton--pill" />
        </div>
        <CardListSkeleton count={4} />
      </main>
    </>
  )
}
