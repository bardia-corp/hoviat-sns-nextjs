import { RouteProgress } from "@/components/Skeleton"

/* Matches the centered profile header, so the real page does not jump when it
   arrives. */
export default function Loading() {
  return (
    <>
      <RouteProgress />
      <main className="screen">
        <div className="profile-head">
          <div
            className="skeleton"
            style={{ width: 96, height: 96, borderRadius: "50%" }}
          />
          <div
            className="skeleton"
            style={{ height: 20, width: 170, marginTop: 14 }}
          />
          <div className="skeleton skeleton--line" style={{ width: 120 }} />
          <div className="skeleton skeleton--line" style={{ width: 90 }} />
        </div>
        <div
          className="skeleton"
          style={{ height: 84, marginTop: 18, borderRadius: 16 }}
        />
        <div
          className="skeleton"
          style={{ height: 220, marginTop: 16, borderRadius: 20 }}
        />
      </main>
    </>
  )
}
