// What a tool maker can buy, in one place. The checkout, the delivery and the
// pricing page all read this, so a price or a promise can only be changed once.
//
// Everything listed here is something the site already does automatically:
// featured placement, the social blast (Facebook + Instagram + both Stories +
// X + Threads), the homepage spotlight and a written blog post. Nothing here
// promises traffic or audience numbers.

export type PackageId =
  | 'spotlight_day' | 'launch_boost' | 'pro_launch' | 'sponsored_review'
  | 'stay_featured' | 'category_sponsor' | 'deal_feature'

export interface Package {
  id: PackageId
  name: string
  priceCents: number
  /** Shown as "$39 once" or "$19/month". */
  recurring: boolean
  summary: string
  includes: string[]
  /** How long the Featured badge lasts, in days. 0 = not featured. */
  featuredDays: number
  /** Book the 24h homepage spotlight on delivery. */
  spotlight: boolean
  /** Write and publish a blog post about the tool. */
  blogPost: boolean
  /** Post to every social network on delivery. */
  socialBlast: boolean
  /** A hands-on review article, written by us and labelled as sponsored. */
  review?: boolean
  /** Top of a category page for the month. */
  categorySponsor?: boolean
  /** Promo code shown on the Deals page. */
  dealFeature?: boolean
  /** Lemon Squeezy variant, from the store. */
  variantEnv: string
}

export const PACKAGES: Record<PackageId, Package> = {
  launch_boost: {
    id: 'launch_boost',
    name: 'Launch Boost',
    priceCents: 3900,
    recurring: false,
    summary: 'A full launch push across every channel we run.',
    includes: [
      'Featured for 7 days',
      'Posted to Facebook, Instagram, X and Threads, plus both Stories',
      'Custom-designed post artwork built from your site or video',
      '24 hours in the homepage spotlight',
      'A link from a page Google indexes (marked sponsored, per Google\u2019s rules)',
      'A report with a link to every post we published',
    ],
    featuredDays: 7,
    spotlight: true,
    blogPost: false,
    socialBlast: true,
    variantEnv: 'LEMONSQUEEZY_VARIANT_LAUNCH_BOOST',
  },
  pro_launch: {
    id: 'pro_launch',
    name: 'Pro Launch',
    priceCents: 9900,
    recurring: false,
    summary: 'Launch Boost, plus an article about your tool.',
    includes: [
      'Everything in Launch Boost',
      'A written article about your tool, published on our blog',
      'The article submitted to search engines the moment it goes live',
      'Featured for 30 days instead of 7',
    ],
    featuredDays: 30,
    spotlight: true,
    blogPost: true,
    socialBlast: true,
    variantEnv: 'LEMONSQUEEZY_VARIANT_PRO_LAUNCH',
  },
  sponsored_review: {
    id: 'sponsored_review',
    name: 'Sponsored Review',
    priceCents: 14900,
    recurring: false,
    summary: 'We use your tool and write an honest, labelled review.',
    includes: [
      'A hands-on review article: what it does well, who it suits, what it costs',
      'Clearly labelled "Sponsored review" — we write what we find, you approve nothing',
      'Published on our blog and submitted to search engines immediately',
      'The review posted across all our social channels',
      'Featured for 30 days and 24 hours in the homepage spotlight',
    ],
    featuredDays: 30,
    spotlight: true,
    blogPost: false,
    review: true,
    socialBlast: true,
    variantEnv: 'LEMONSQUEEZY_VARIANT_SPONSORED_REVIEW',
  },
  category_sponsor: {
    id: 'category_sponsor',
    name: 'Category Sponsor',
    priceCents: 4900,
    recurring: true,
    summary: 'Own the top slot of one category for a month.',
    includes: [
      'Top position on your category page, above every other listing',
      'A "Sponsor" badge on your listing everywhere it appears',
      'Re-posted to our social channels once a month',
      'Cancel any time',
    ],
    featuredDays: 31,
    spotlight: false,
    blogPost: false,
    categorySponsor: true,
    socialBlast: false,
    variantEnv: 'LEMONSQUEEZY_VARIANT_CATEGORY_SPONSOR',
  },
  deal_feature: {
    id: 'deal_feature',
    name: 'Deal Feature',
    priceCents: 2900,
    recurring: false,
    summary: 'Put your promo code in front of buyers for 30 days.',
    includes: [
      'Your promo code on the Deals page for 30 days',
      'A deal post across our social channels',
      'The code shown on your listing with a copy button',
    ],
    featuredDays: 0,
    spotlight: false,
    blogPost: false,
    dealFeature: true,
    socialBlast: true,
    variantEnv: 'LEMONSQUEEZY_VARIANT_DEAL_FEATURE',
  },
  stay_featured: {
    id: 'stay_featured',
    name: 'Stay Featured',
    priceCents: 1900,
    recurring: true,
    summary: 'Keep your listing at the top of its category.',
    includes: [
      'Featured badge and top-of-category placement, renewed monthly',
      'Re-posted to our social channels once a month',
      'Cancel any time',
    ],
    featuredDays: 31,
    spotlight: false,
    blogPost: false,
    socialBlast: false,
    variantEnv: 'LEMONSQUEEZY_VARIANT_STAY_FEATURED',
  },
  spotlight_day: {
    id: 'spotlight_day',
    name: 'Homepage Spotlight',
    priceCents: 100,
    recurring: false,
    summary: '24 hours in the box at the top of the homepage.',
    includes: ['24 hours in the homepage spotlight', 'Impressions and clicks reported in your dashboard'],
    featuredDays: 0,
    spotlight: true,
    blogPost: false,
    socialBlast: false,
    variantEnv: 'LEMONSQUEEZY_VARIANT_SPOTLIGHT_DAY',
  },
}

export const PACKAGE_ORDER: PackageId[] = [
  'spotlight_day', 'deal_feature', 'launch_boost', 'pro_launch',
  'sponsored_review', 'category_sponsor', 'stay_featured',
]

export function priceLabel(p: Package): string {
  const amount = p.priceCents % 100 === 0 ? `$${p.priceCents / 100}` : `$${(p.priceCents / 100).toFixed(2)}`
  return p.recurring ? `${amount}/month` : `${amount} once`
}
