import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

// Called by n8n after scraping/publishing to rebuild ISR pages
export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-revalidate-secret') || (await req.json().catch(() => ({}))).secret
  if (secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  revalidatePath('/', 'layout')
  revalidatePath('/directory')
  revalidatePath('/blog')
  revalidatePath('/tools/[slug]', 'page')
  revalidatePath('/blog/[slug]', 'page')

  return NextResponse.json({ revalidated: true, timestamp: new Date().toISOString() })
}
