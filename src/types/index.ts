export type PricingModel = 'free' | 'freemium' | 'free_trial' | 'subscription' | 'pay_per_use' | 'one_time' | 'enterprise'
export type ListingStatus = 'auto' | 'claimed' | 'verified' | 'pending' | 'rejected'
export type PromoType = 'trial' | 'coupon' | 'discount' | 'free_tier'

export interface Category {
  id: number
  slug: string
  name: string
  description?: string
  icon: string
  color: string
  count: number
}

export interface AiTool {
  id: string
  slug: string
  name: string
  tagline?: string
  description?: string
  website: string
  logo_url?: string
  cover_url?: string
  screenshots?: string[]
  category_id?: number
  category?: Category
  tags?: string[]
  pricing_model?: PricingModel
  starting_price?: string
  pricing_url?: string
  has_free_trial: boolean
  trial_duration?: string
  promo_code?: string
  promo_desc?: string
  has_api: boolean
  api_docs_url?: string
  no_code: boolean
  platforms?: string[]
  gdpr_compliant: boolean
  company_name?: string
  founded_year?: string
  hq_location?: string
  use_cases?: string
  alternatives?: string[]
  // Contact / social
  contact_email?: string
  support_url?: string
  twitter_url?: string
  linkedin_url?: string
  github_url?: string
  discord_url?: string
  youtube_url?: string

  status: ListingStatus
  is_featured: boolean
  is_sponsored: boolean
  owner_id?: string
  listing_free_until?: string
  listing_plan?: string
  view_count: number
  click_count: number
  upvotes: number
  rating_avg: number
  rating_count: number
  created_at: string
  updated_at: string
  promotions?: Promotion[]
}

export interface Promotion {
  id: string
  tool_id: string
  promo_type: PromoType
  title: string
  description?: string
  promo_code?: string
  discount_pct: number
  trial_days: number
  valid_from?: string
  valid_until?: string
  external_url?: string
  is_verified: boolean
  created_at: string
  tool?: Pick<AiTool, 'id' | 'name' | 'slug' | 'logo_url' | 'category'>
}

export interface Review {
  id: string
  tool_id: string
  user_id: string
  rating: number
  body?: string
  approved: boolean
  created_at: string
}

export interface SearchFilters {
  query?: string
  category?: string
  pricing?: PricingModel
  has_free_trial?: boolean
  has_api?: boolean
  platform?: string
  sort?: 'newest' | 'popular' | 'rating' | 'name'
}
