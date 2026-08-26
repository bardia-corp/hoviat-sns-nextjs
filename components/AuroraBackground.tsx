/**
 * Static aurora background.
 *
 * Six blurred colour fields, a masked grid and a few white sparks.
 *
 * None of the blurred layers animate: a blurred layer that moves forces the
 * compositor to re-rasterise every frame, which is the single most expensive
 * thing you can do on a mid-range phone. The sparks are static.
 */
export default function AuroraBackground() {
  return (
    <div className="aurora" aria-hidden="true">
      <span className="aurora__blob aurora__blob--a" />
      <span className="aurora__blob aurora__blob--b" />
      <span className="aurora__blob aurora__blob--c" />
      <span className="aurora__blob aurora__blob--d" />
      <span className="aurora__blob aurora__blob--e" />
      <span className="aurora__blob aurora__blob--f" />
      <span className="aurora__grid" />
      <span className="aurora__spark" style={{ top: "18%", left: "78%" }} />
      <span className="aurora__spark" style={{ top: "31%", left: "12%" }} />
      <span className="aurora__spark" style={{ top: "44%", left: "88%" }} />
      <span className="aurora__spark" style={{ top: "52%", left: "32%" }} />
      <span className="aurora__spark" style={{ top: "63%", left: "70%" }} />
    </div>
  )
}
