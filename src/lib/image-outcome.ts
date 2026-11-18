/**
 * Did an <img> already finish before React could listen?
 *
 * This bug has now appeared twice. An image that is in the server-rendered
 * HTML starts loading before hydration, so `onLoad` and `onError` are attached
 * after the fact. If the image finished in that window — which is exactly what
 * happens on a SECOND visit, when it comes from cache — neither handler ever
 * fires and a "Loading…" placeholder stays on screen for ever. The first visit
 * looks fine because the request is slow enough to still be in flight.
 *
 * A cached 404 behaves the same way: it settles instantly, and the error
 * handler that was meant to show the fallback never runs.
 *
 * The browser tells us both things without any event: `complete` means it has
 * settled, and a settled image with no intrinsic width is one that failed.
 */

export type ImageOutcome = 'pending' | 'loaded' | 'failed'

/** The subset of HTMLImageElement this needs, so it is testable without a DOM. */
export interface SettledImage {
  complete: boolean
  naturalWidth: number
}

export function imageOutcome(el: SettledImage | null | undefined): ImageOutcome {
  // No element yet (first render, or the ref has not attached): nothing known.
  if (!el) return 'pending'
  if (!el.complete) return 'pending'
  // Settled. Zero intrinsic width is the only signal that it failed; a
  // broken image and a 404 both land here.
  return el.naturalWidth > 0 ? 'loaded' : 'failed'
}
