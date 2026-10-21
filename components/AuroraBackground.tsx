/**
 * Static aurora background.
 *
 * Six blurred colour fields, a masked grid and two glitter layers.
 *
 * None of the blurred layers animate: a blurred layer that moves forces the
 * compositor to re-rasterise every frame, which is the single most expensive
 * thing you can do on a mid-range phone. The glitter layers are not blurred
 * and only animate opacity, which the compositor handles on its own.
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
      <span className="aurora__glitter" />
      <span className="aurora__glitter aurora__glitter--2" />
    </div>
  )
}
