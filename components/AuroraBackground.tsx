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
// Background experiment switch: "original" restores the previous right-blue
// backdrop exactly; "left-blue" uses the approved mirrored, clearer-grid style.
const BACKGROUND_VARIANT: "original" | "left-blue" = "left-blue"

export default function AuroraBackground() {
  return (
    <div className="aurora" data-variant={BACKGROUND_VARIANT} aria-hidden="true">
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
