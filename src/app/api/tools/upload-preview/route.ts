// Preview-image upload for tool listings.
//
// Sites behind a bot firewall can never be screenshotted automatically, so the
// admin or the listing's owner uploads a picture instead. Files land in a
// public Supabase Storage bucket and the returned URL is stored as cover_url.
//
// Writing here is gated: an admin session cookie, or a signed-in user who
// actually owns the listing. An open upload endpoint would be free file
// hosting for anyone who found the URL.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { randomUUID } from 'crypto'
import { isAdminRequest } from '@/lib/admin-auth'

export const BUCKET = 'tool-previews'

const MAX_BYTES = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
}

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function ownsTool(toolId: string): Promise<boolean> {
  const cookieStore = await cookies()
  const sbUser = createServerClient(
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

  const { data: { user } } = await sbUser.auth.getUser()
  if (!user) return false

  const { data: tool } = await admin
    .from('ai_tools')
    .select('claimed_by, submitted_by')
    .eq('id', toolId)
    .maybeSingle()

  if (!tool) return false
  return tool.claimed_by === user.id || tool.submitted_by === user.id
}

export async function POST(req: NextRequest) {
  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Expected a multipart upload' }, { status: 400 })
  }

  const toolId = String(form.get('tool_id') ?? '')
  const file = form.get('file')

  if (!toolId) {
    return NextResponse.json({ error: 'tool_id is required' }, { status: 400 })
  }
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file supplied' }, { status: 400 })
  }

  // Authorise before touching the file at all.
  if (!isAdminRequest(req) && !(await ownsTool(toolId))) {
    return NextResponse.json({ error: 'Not authorised to edit this listing' }, { status: 403 })
  }

  const extension = ALLOWED_TYPES[file.type]
  if (!extension) {
    return NextResponse.json(
      { error: 'Only PNG, JPG and WebP images are accepted' },
      { status: 400 }
    )
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: `Image is ${(file.size / 1024 / 1024).toFixed(1)}MB — the limit is 5MB` },
      { status: 400 }
    )
  }

  // A fresh name per upload, so a replacement is never masked by a cached copy
  // of the old file sitting at the same URL.
  const path = `${toolId}/${randomUUID()}.${extension}`

  const { error: uploadError } = await admin.storage
    .from(BUCKET)
    .upload(path, await file.arrayBuffer(), {
      contentType: file.type,
      cacheControl: '31536000',
      upsert: false,
    })

  if (uploadError) {
    const missingBucket = /bucket.*not found/i.test(uploadError.message)
    return NextResponse.json(
      {
        error: missingBucket
          ? `Storage bucket "${BUCKET}" does not exist yet — create it in Supabase first`
          : uploadError.message,
      },
      { status: missingBucket ? 503 : 500 }
    )
  }

  const { data: { publicUrl } } = admin.storage.from(BUCKET).getPublicUrl(path)
  return NextResponse.json({ url: publicUrl })
}
