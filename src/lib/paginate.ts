/**
 * Page maths for server-side paging.
 *
 * Small enough to inline, kept separate because the failure mode is silent:
 * a range that is off by one drops a row from every page and nothing errors.
 * A table that quietly omits a paying customer's placement is worse than one
 * that is slow.
 */

export interface PageSpec {
  /** 1-based, clamped into range. */
  page: number
  perPage: number
  /** Inclusive bounds for a Supabase .range() call. */
  from: number
  to: number
  totalPages: number
}

export const DEFAULT_PER_PAGE = 25
export const MAX_PER_PAGE = 100

/**
 * `total` is the row count the query reported. When it is unknown (null, as
 * Supabase returns when a count was not requested), the page is trusted as
 * given and totalPages is reported as 1 — the caller then has a page of rows
 * and no navigation, which is honest rather than a guessed page count.
 */
export function pageSpec(
  rawPage: unknown,
  rawPerPage: unknown,
  total: number | null,
): PageSpec {
  const perPage = clampInt(rawPerPage, DEFAULT_PER_PAGE, 1, MAX_PER_PAGE)

  if (total === null || !Number.isFinite(total)) {
    const page = clampInt(rawPage, 1, 1, Number.MAX_SAFE_INTEGER)
    const from = (page - 1) * perPage
    return { page, perPage, from, to: from + perPage - 1, totalPages: 1 }
  }

  // An empty table still has one page, so the UI shows "1 of 1" and an empty
  // body rather than "1 of 0".
  const totalPages = Math.max(1, Math.ceil(total / perPage))
  const page = clampInt(rawPage, 1, 1, totalPages)
  const from = (page - 1) * perPage
  return { page, perPage, from, to: from + perPage - 1, totalPages }
}

function clampInt(value: unknown, fallback: number, min: number, max: number): number {
  const n = typeof value === 'number' ? value : parseInt(String(value ?? ''), 10)
  if (!Number.isFinite(n) || Number.isNaN(n)) return fallback
  return Math.min(max, Math.max(min, Math.trunc(n)))
}

/** The slice of an already-loaded array matching a spec. */
export function pageSlice<T>(rows: T[], spec: PageSpec): T[] {
  return rows.slice(spec.from, spec.from + spec.perPage)
}
