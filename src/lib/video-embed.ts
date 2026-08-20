// Turns a submitted video URL into an embed URL, but only if the video really
// plays.
//
// The ID pattern alone is not enough: a listing was submitted with the
// placeholder "youtube.com/watch?v=example_gpt", and "example_gpt" happens to
// be exactly the 11 characters a real YouTube ID has, so it passed validation
// and rendered "This video is unavailable" on the page. Asking the provider is
// the only reliable check, and it also catches videos that were deleted, made
// private, or had embedding disabled after submission.

export async function resolvePlayableEmbed(videoUrl: string | null | undefined): Promise<string | null> {
  if (!videoUrl) return null

  const yt = videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/)
  const vimeo = videoUrl.match(/vimeo\.com\/(\d+)/)

  const oembed = yt
    ? `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${yt[1]}&format=json`
    : vimeo
      ? `https://vimeo.com/api/oembed.json?url=https://vimeo.com/${vimeo[1]}`
      : null

  if (!oembed) return null

  try {
    const res = await fetch(oembed, {
      // One check per video per day; the answer rarely changes.
      next: { revalidate: 86400 },
      signal: AbortSignal.timeout(6_000),
    })
    if (!res.ok) return null
  } catch {
    // A timeout or network blip should not hide a video that is probably fine.
    // Fall through and let it render.
  }

  return yt
    ? `https://www.youtube-nocookie.com/embed/${yt[1]}`
    : `https://player.vimeo.com/video/${vimeo![1]}`
}
