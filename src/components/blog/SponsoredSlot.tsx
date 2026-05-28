// Server component — renders inline sponsored content or a placeholder.
interface Sponsorship {
  name: string
  logo_url?: string
  cta_url?: string
  blurb?: string
  image_url?: string
  video_url?: string
}

export default function SponsoredSlot({ sponsorship }: { sponsorship: Sponsorship | null }) {
  if (!sponsorship) {
    // Editorial placeholder — only visible on localhost/admin
    return null
  }

  return (
    <aside
      className="my-10 overflow-hidden rounded-2xl border"
      style={{ borderColor: 'rgba(233,69,96,0.2)', background: 'rgba(233,69,96,0.04)' }}
      aria-label="Sponsored content"
    >
      {/* Label */}
      <div className="flex items-center gap-2 border-b px-5 py-2.5" style={{ borderColor: 'rgba(233,69,96,0.15)' }}>
        <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-400">
          Sponsored
        </span>
        {sponsorship.name && (
          <span className="text-xs text-slate-500">by {sponsorship.name}</span>
        )}
      </div>

      <div className="p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          {/* Logo */}
          {sponsorship.logo_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={sponsorship.logo_url}
              alt={`${sponsorship.name} logo`}
              className="h-12 w-12 flex-shrink-0 rounded-xl object-contain"
            />
          )}

          <div className="flex-1 min-w-0">
            {/* Name */}
            <p className="font-bold text-white">{sponsorship.name}</p>

            {/* Blurb */}
            {sponsorship.blurb && (
              <p className="mt-1 text-sm leading-relaxed text-slate-400">{sponsorship.blurb}</p>
            )}

            {/* CTA */}
            {sponsorship.cta_url && (
              <a
                href={sponsorship.cta_url}
                target="_blank"
                rel="noopener noreferrer nofollow sponsored"
                className="mt-3 inline-flex items-center rounded-lg px-4 py-2 text-xs font-bold text-white transition hover:opacity-85"
                style={{ background: '#e94560' }}
              >
                Learn more →
              </a>
            )}
          </div>
        </div>

        {/* Sponsored image */}
        {sponsorship.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={sponsorship.image_url}
            alt={`${sponsorship.name} — sponsored`}
            className="mt-4 w-full rounded-xl object-cover"
            style={{ maxHeight: 280 }}
          />
        )}

        {/* Sponsored video embed */}
        {sponsorship.video_url && (
          <div className="mt-4 aspect-video overflow-hidden rounded-xl bg-black">
            <iframe
              src={sponsorship.video_url}
              title={`${sponsorship.name} video`}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        )}
      </div>
    </aside>
  )
}

// Empty placeholder shown only in admin preview (exported separately)
export function SponsoredPlaceholder() {
  return (
    <div
      className="my-10 rounded-2xl border-2 border-dashed p-6 text-center"
      style={{ borderColor: '#1e2a3a' }}
    >
      <p className="text-xs font-bold uppercase tracking-wider text-slate-600">Sponsored Content Slot</p>
      <p className="mt-1 text-xs text-slate-700">
        Supports: logo · image · video · CTA link · blurb. Contact{' '}
        <a href="mailto:listmyai@gmail.com" className="underline" style={{ color: '#e94560' }}>
          listmyai@gmail.com
        </a>
      </p>
    </div>
  )
}
