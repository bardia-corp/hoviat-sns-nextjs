/* Shape-matched placeholders used by every route-level loading.tsx.
   Server rendering means a real wait before the new page paints, so the user
   needs to see the shape of what is coming rather than a stalled screen. */

export function RouteProgress() {
  return (
    <div className="route-progress" role="status" aria-label="در حال بارگزاری">
      <div className="route-progress__bar" />
    </div>
  )
}

export function CardSkeleton() {
  return (
    <li className="card glass">
      <div className="skeleton skeleton--avatar" />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="skeleton" style={{ height: 15, width: "58%" }} />
        <div className="skeleton skeleton--line" style={{ width: "40%" }} />
        <div className="skeleton skeleton--line" style={{ width: "72%" }} />
      </div>
      <div className="skeleton skeleton--btn" />
    </li>
  )
}

export function CardListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <ul className="cards" aria-hidden="true">
      {Array.from({ length: count }).map((_, index) => (
        <CardSkeleton key={index} />
      ))}
    </ul>
  )
}

/* The profile screen loads its account over the network after mount, so it
   needs a placeholder of its own: header block, then two panels. */
export function ProfileSkeleton() {
  return (
    <div aria-hidden="true">
      <div className="profile-head">
        <div className="skeleton skeleton--avatar" style={{ width: 72, height: 72 }} />
        <div className="skeleton" style={{ height: 17, width: "46%", marginTop: 12 }} />
        <div className="skeleton skeleton--line" style={{ width: "30%" }} />
        <div className="skeleton skeleton--line" style={{ width: "24%" }} />
      </div>

      {[0, 1].map((panel) => (
        <div className="panel glass" style={{ marginTop: 14 }} key={panel}>
          <div className="skeleton" style={{ height: 15, width: "38%" }} />
          <div className="skeleton skeleton--line" style={{ width: "92%" }} />
          <div className="skeleton skeleton--line" style={{ width: "78%" }} />
          <div className="skeleton skeleton--line" style={{ width: "84%" }} />
        </div>
      ))}
    </div>
  )
}
