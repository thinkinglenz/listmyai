// Reads the category name off a row that embedded `categories(...)`.
//
// PostgREST hands this codebase an embedded to-one relation as an ARRAY, so a
// row carries `categories: [{ name }]`, not `categories: { name }`. Reading
// `row.categories?.name` straight off it is always `undefined`, and a fallback
// like `?? 'Other'` then prints a real category name for a category we simply
// failed to read. That is how the owner dashboard came to tell every listing
// owner their tool sat in "Other" while the public page had it filed correctly.
//
// Eleven call sites in this repo unwrap the array by hand; four forgot. Hence
// one helper instead of a twelfth copy of the same ternary.
//
// Returns `undefined` when there is genuinely no readable name. Callers must
// render nothing in that case: never substitute a label that is itself a valid
// category, because a wrong-but-plausible answer is worse than a blank.

type CategoryLike = { name?: string | null } | null | undefined

export function categoryName(categories: CategoryLike | CategoryLike[]): string | undefined {
  const first = Array.isArray(categories) ? categories[0] : categories
  const name = first?.name
  return typeof name === 'string' && name.trim() !== '' ? name : undefined
}
