// The IndexNow ownership file.
//
// IndexNow proves ownership by having the key readable somewhere on the
// domain. The default is /<key>.txt at the root, which would need a catch-all
// route and would sit in front of every other path. The protocol allows the
// file to live anywhere as long as the submission names its location, so it
// lives here and the submitter sends `keyLocation`.
export const dynamic = 'force-static'
export const revalidate = 86400

export function GET() {
  const key = process.env.INDEXNOW_KEY
  // No key configured means ownership is not proven, and a 200 with an empty
  // body would have Bing reject every submission with no explanation.
  if (!key) return new Response('Not configured', { status: 404 })
  return new Response(key, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=86400' },
  })
}
