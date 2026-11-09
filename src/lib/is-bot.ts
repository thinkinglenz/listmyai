// Does this user agent belong to a crawler?
//
// Used in two places for two different reasons. In the browser it stops the
// view-tracking request being made at all, which is the point: every listing
// view fired a POST to /api/tools/track, so a crawler walking the catalogue
// doubled the number of functions Vercel had to run. On the server it stops a
// crawler that slipped through from inflating the view count, which keeps the
// numbers honest — the same reason the double-counting was removed in
// September.
//
// Deliberately loose. A missed bot costs a function call; a false positive
// costs one uncounted view. The second is much cheaper than the first.
const BOT = /bot|crawl|spider|slurp|scan|fetch|headless|lighthouse|pagespeed|gtmetrix|facebookexternalhit|embedly|preview|monitor|scrape|wget|curl|python-requests|axios/i

export function isBotAgent(ua: string | null | undefined): boolean {
  if (!ua) return true // no user agent at all is not a browser
  return BOT.test(ua)
}
