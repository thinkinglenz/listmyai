// Media upload for people filling in a listing.
//
// Separate from /api/tools/upload-preview, which needs an existing tool to
// attach to — during submission the listing does not exist yet. Requires a
// signed-in user, since an open upload endpoint is free file hosting for
// anyone who finds it.
//
// Reuses the tool-previews bucket under a submissions/ prefix rather than
// introducing a second bucket to provision.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { randomUUID } from 'crypto'

const BUCKET = 'tool-previews'
const MAX_BYTES = 5 * 1024 * 1024
const ALLOWED: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
}

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const cookieStore = await cookies()
  const sb = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(c: { name: string; value: string; options?: Record<string, unknown> }[]) {
          c.forEach(({ name, value, options }) => {
            try { cookieStore.set(name, value, options) } catch {}
          })
        },
      },
    }
  )

  const { data: { user } } = await sb.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Please sign in to upload' }, { status: 401 })

  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Expected a file upload' }, { status: 400 })
  }

  const file = form.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file supplied' }, { status: 400 })
  }

  const ext = ALLOWED[file.type]
  if (!ext) {
    return NextResponse.json({ error: 'Only PNG, JPG and WebP images are accepted' }, { status: 400 })
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: `That image is ${(file.size / 1024 / 1024).toFixed(1)}MB — the limit is 5MB` },
      { status: 400 }
    )
  }

  // Namespaced by uploader, so one person's files are traceable and a filename
  // can never collide with someone else's.
  const path = `submissions/${user.id}/${randomUUID()}.${ext}`

  const { error } = await admin.storage
    .from(BUCKET)
    .upload(path, await file.arrayBuffer(), {
      contentType: file.type,
      cacheControl: '31536000',
      upsert: false,
    })

  if (error) {
    const missing = /bucket.*not found/i.test(error.message)
    return NextResponse.json(
      { error: missing ? `Storage bucket "${BUCKET}" does not exist yet` : error.message },
      { status: missing ? 503 : 500 }
    )
  }

  const { data: { publicUrl } } = admin.storage.from(BUCKET).getPublicUrl(path)
  return NextResponse.json({ url: publicUrl })
}
