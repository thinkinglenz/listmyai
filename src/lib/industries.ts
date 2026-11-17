/**
 * Industry profiles, used to build one page per agent per industry.
 *
 * The whole point of this file is that the pages it produces are NOT the same
 * page with a word swapped. Hundreds of near-identical pages is the textbook
 * doorway pattern, and since the scaled-content-abuse policy it is the fastest
 * way to get a whole domain demoted rather than just those URLs.
 *
 * So each profile carries things that are actually, specifically true of that
 * trade: what they call the person they serve, where that person contacts
 * them, which software they already run, when they are busy, and what it costs
 * them when the job is done badly. A page composed from a rich profile and a
 * rich agent definition says something particular. A page composed from a name
 * and an adjective does not.
 *
 * If you add an industry, fill every field with something concrete. A generic
 * profile is worse than no page at all.
 */

export interface Industry {
  slug: string
  /** Plain name, as it appears in a heading: "Dental clinics". */
  name: string
  /**
   * The name mid-sentence. Written out rather than produced with
   * toLowerCase(), which turns "SaaS and software" into "saas and software"
   * and makes every page for that trade look careless.
   */
  lower: string
  /** Singular, with an article, for mid-sentence use: "a dental clinic". */
  one: string
  /** What this trade calls the person it serves: patients, guests, clients. */
  audience: string
  /** Where that person actually gets in touch, most common first. */
  channels: string[]
  /** Software this trade tends to already run. */
  systems: string[]
  /** Specific, recognisable problems. Not "efficiency" — actual situations. */
  pains: string[]
  /** When the work piles up. Used to explain why out-of-hours matters. */
  rhythm: string
  /** What a mistake costs here. This differs enormously by trade. */
  stakes: string
}

export const INDUSTRIES: Industry[] = [
  {
    slug: 'ecommerce',
    name: 'E-commerce',
    lower: 'e-commerce',
    one: 'an online shop',
    audience: 'shoppers',
    channels: ['Website chat', 'Email', 'Instagram DMs', 'WhatsApp'],
    systems: ['Shopify', 'WooCommerce', 'Klaviyo', 'Gorgias'],
    pains: [
      '"where is my order" arrives more than every other question combined',
      'returns and exchanges each take several messages to resolve',
      'a product question goes unanswered overnight and the sale goes elsewhere',
    ],
    rhythm: 'evenings and weekends, when nobody is staffing the inbox',
    stakes: 'a slow reply is a cancelled order, and an angry one becomes a public review',
  },
  {
    slug: 'travel-agencies',
    name: 'Travel agencies',
    lower: 'travel agencies',
    one: 'a travel agency',
    audience: 'travellers',
    channels: ['WhatsApp', 'Phone', 'Email', 'Instagram'],
    systems: ['Amadeus', 'Google Sheets', 'WhatsApp Business', 'Email'],
    pains: [
      'the same visa and baggage questions are answered dozens of times a week',
      'an enquiry arrives with no dates, no budget and no passenger count',
      'quotes are rebuilt from scratch because nobody recorded the last one',
    ],
    rhythm: 'evenings and the days either side of a public holiday',
    stakes: 'a traveller who waits a day for a quote has already booked elsewhere',
  },
  {
    slug: 'clinics',
    name: 'Clinics and dental practices',
    lower: 'clinics and dental practices',
    one: 'a clinic',
    audience: 'patients',
    channels: ['Phone', 'WhatsApp', 'Website form', 'Walk-in'],
    systems: ['Practice management software', 'Google Calendar', 'Email'],
    pains: [
      'reception is on the phone, so the next caller goes to voicemail',
      'no-shows leave expensive chair time empty with no chance to refill it',
      'insurance and pricing questions pull clinical staff away from patients',
    ],
    rhythm: 'early morning and the hour after closing',
    stakes: 'a missed appointment is unrecoverable revenue, and patient data is regulated',
  },
  {
    slug: 'real-estate',
    name: 'Real estate',
    lower: 'real estate',
    one: 'an estate agency',
    audience: 'buyers and tenants',
    channels: ['Portal enquiries', 'WhatsApp', 'Phone', 'Email'],
    systems: ['CRM', 'Property portals', 'Google Sheets', 'Email'],
    pains: [
      'portal enquiries arrive in bulk and most are not serious',
      'the genuine buyer is answered third because nobody sorted the list',
      'viewings are arranged across four messages and still get missed',
    ],
    rhythm: 'evenings and weekends, which is when people browse listings',
    stakes: 'whoever replies first usually gets the viewing, and the viewing gets the deal',
  },
  {
    slug: 'restaurants',
    name: 'Restaurants and hospitality',
    lower: 'restaurants and hospitality',
    one: 'a restaurant',
    audience: 'guests',
    channels: ['Phone', 'Instagram DMs', 'Website', 'Walk-in'],
    systems: ['Booking system', 'POS', 'Google Business Profile', 'Instagram'],
    pains: [
      'the phone rings during service, when nobody can answer it properly',
      'allergy and group-booking questions need a careful, consistent answer',
      'reviews build up unanswered across several platforms',
    ],
    rhythm: 'the hours around service, which is exactly when staff are busiest',
    stakes: 'an unanswered booking goes to the restaurant next door',
  },
  {
    slug: 'agencies',
    name: 'Agencies and consultancies',
    lower: 'agencies and consultancies',
    one: 'an agency',
    audience: 'clients',
    channels: ['Email', 'Website form', 'LinkedIn', 'Referral'],
    systems: ['Google Workspace', 'Slack', 'HubSpot', 'Notion'],
    pains: [
      'the shared inbox mixes new business with invoices and job applications',
      'scoping calls repeat the same ten questions every time',
      'good enquiries sit unanswered while the team is delivering',
    ],
    rhythm: 'whenever delivery is busiest, which is when new business arrives',
    stakes: 'a slow response to a serious enquiry costs a whole engagement',
  },
  {
    slug: 'logistics',
    name: 'Logistics and freight',
    lower: 'logistics and freight',
    one: 'a freight company',
    audience: 'shippers',
    channels: ['Email', 'Phone', 'WhatsApp', 'EDI'],
    systems: ['TMS', 'Excel', 'Email', 'Customer portals'],
    pains: [
      'rate requests and status chasers arrive in the same inbox as invoices',
      'delivery notes and invoices are retyped by hand from PDFs and photos',
      'an exception is spotted hours after it should have been escalated',
    ],
    rhythm: 'early morning, and whenever something goes wrong',
    stakes: 'a missed exception becomes a demurrage charge or a lost customer',
  },
  {
    slug: 'construction',
    name: 'Construction and trades',
    lower: 'construction and trades',
    one: 'a contractor',
    audience: 'clients',
    channels: ['Phone', 'WhatsApp', 'Email', 'Website form'],
    systems: ['Excel', 'WhatsApp', 'Accounting software', 'Email'],
    pains: [
      'enquiries arrive while the team is on site and cannot answer',
      'supplier invoices pile up as photographs taken on a phone',
      'contract terms are signed without anyone reading page nine',
    ],
    rhythm: 'during working hours, when everyone is on a job',
    stakes: 'a missed quote request is a job lost, and a missed clause is a dispute',
  },
  {
    slug: 'education',
    name: 'Education and training',
    lower: 'education and training',
    one: 'a training provider',
    audience: 'students and parents',
    channels: ['Website form', 'WhatsApp', 'Email', 'Phone'],
    systems: ['LMS', 'Google Workspace', 'CRM', 'Email'],
    pains: [
      'the same admissions questions repeat every intake cycle',
      'enquiries spike at enrolment and nobody can keep up',
      'applications arrive in several formats and get assessed inconsistently',
    ],
    rhythm: 'enrolment windows, when volume multiplies for a few weeks',
    stakes: 'a slow answer during enrolment loses a student for a whole year',
  },
  {
    slug: 'saas',
    name: 'SaaS and software',
    lower: 'SaaS and software',
    one: 'a software company',
    audience: 'users',
    channels: ['In-app chat', 'Email', 'Community forum', 'Docs'],
    systems: ['Intercom', 'Zendesk', 'Linear', 'HubSpot'],
    pains: [
      'support answers the same onboarding questions the docs already cover',
      'trial users with real intent are not separated from tyre-kickers',
      'feature requests are buried in tickets and never reach the roadmap',
    ],
    rhythm: 'continuously, across every timezone the product is sold in',
    stakes: 'a slow first response during a trial is a trial that does not convert',
  },
  {
    slug: 'retail',
    name: 'Retail',
    lower: 'retail',
    one: 'a retailer',
    audience: 'customers',
    channels: ['In-store', 'Phone', 'Website', 'WhatsApp'],
    systems: ['POS', 'Inventory software', 'Excel', 'Google Business Profile'],
    pains: [
      'stock decisions are made from memory rather than from what actually sold',
      'the fast movers run out exactly when demand peaks',
      'reviews across locations are never answered consistently',
    ],
    rhythm: 'weekends and seasonal peaks',
    stakes: 'an empty shelf is a sale lost to whoever has it in stock',
  },
  {
    slug: 'professional-services',
    name: 'Accounting and professional services',
    lower: 'accounting and professional services',
    one: 'a professional firm',
    audience: 'clients',
    channels: ['Email', 'Phone', 'Client portal', 'Referral'],
    systems: ['Xero', 'QuickBooks', 'Practice software', 'Google Workspace'],
    pains: [
      'client documents arrive as attachments and are retyped by hand',
      'engagement letters and contracts are reviewed under time pressure',
      'deadline periods create a volume nobody can absorb',
    ],
    rhythm: 'filing and year-end deadlines, where the load is wildly uneven',
    stakes: 'an error in a figure or a missed clause carries professional liability',
  },
  {
    slug: 'fitness',
    name: 'Gyms and fitness studios',
    lower: 'gyms and fitness studios',
    one: 'a studio',
    audience: 'members',
    channels: ['Instagram DMs', 'WhatsApp', 'Phone', 'Website'],
    systems: ['Booking software', 'Instagram', 'Payment provider', 'Email'],
    pains: [
      'class and membership questions arrive constantly through social DMs',
      'no-shows leave classes half full with a waiting list unused',
      'trial enquiries go cold because nobody followed up',
    ],
    rhythm: 'early morning, evenings and every January',
    stakes: 'a trial enquiry that is not answered the same day rarely comes back',
  },
  {
    slug: 'automotive',
    name: 'Automotive and workshops',
    lower: 'automotive and workshops',
    one: 'a workshop',
    audience: 'customers',
    channels: ['Phone', 'WhatsApp', 'Walk-in', 'Website form'],
    systems: ['Workshop software', 'Excel', 'Parts suppliers', 'Google Business Profile'],
    pains: [
      'the phone rings while technicians are under a vehicle',
      'quote requests need details the customer never provides first time',
      'parts invoices arrive as paper and get entered late',
    ],
    rhythm: 'mornings, when everyone wants their car looked at today',
    stakes: 'an unanswered call is a booking that goes to the next workshop',
  },
  {
    slug: 'legal',
    name: 'Law firms',
    lower: 'law firms',
    one: 'a law firm',
    audience: 'clients',
    channels: ['Email', 'Phone', 'Referral', 'Website form'],
    systems: ['Practice management software', 'Document management', 'Outlook', 'Billing software'],
    pains: [
      'matter enquiries arrive mixed with court correspondence and invoices',
      'first-pass contract review eats hours that are hard to bill for',
      'conflict checks and intake details are gathered over several emails',
    ],
    rhythm: 'around filing deadlines and court dates',
    stakes: 'a missed clause or a missed deadline is a professional negligence exposure',
  },
  {
    slug: 'insurance',
    name: 'Insurance brokers',
    lower: 'insurance brokers',
    one: 'an insurance broker',
    audience: 'policyholders',
    channels: ['Phone', 'Email', 'WhatsApp', 'Website form'],
    systems: ['Broker software', 'Excel', 'Insurer portals', 'Email'],
    pains: [
      'renewal questions and claims arrive through the same channel',
      'quote requests are missing the details needed to price anything',
      'claim documents arrive as photographs and are keyed in by hand',
    ],
    rhythm: 'renewal season and immediately after any major weather event',
    stakes: 'a slow quote loses the renewal, and a mis-keyed figure is a liability',
  },
  {
    slug: 'manufacturing',
    name: 'Manufacturing',
    lower: 'manufacturing',
    one: 'a manufacturer',
    audience: 'buyers',
    channels: ['Email', 'Phone', 'Trade enquiries', 'Distributor portals'],
    systems: ['ERP', 'Excel', 'Email', 'Accounting software'],
    pains: [
      'RFQs arrive by email and sit until someone has time to price them',
      'supplier invoices and delivery notes are entered manually',
      'raw material reordering is based on habit rather than consumption',
    ],
    rhythm: 'around production runs and shipping cut-offs',
    stakes: 'a late RFQ response loses the order to a faster supplier',
  },
  {
    slug: 'salons',
    name: 'Salons and spas',
    lower: 'salons and spas',
    one: 'a salon',
    audience: 'clients',
    channels: ['Instagram DMs', 'WhatsApp', 'Phone', 'Walk-in'],
    systems: ['Booking software', 'Instagram', 'Payment provider', 'WhatsApp'],
    pains: [
      'booking requests arrive by DM while every stylist is with a client',
      'no-shows leave chairs empty at the busiest times of the week',
      'the same questions about services and prices repeat all day',
    ],
    rhythm: 'late afternoons, weekends and the run-up to every holiday',
    stakes: 'an empty chair at peak time cannot be recovered later',
  },
  {
    slug: 'events',
    name: 'Events and venues',
    lower: 'events and venues',
    one: 'an events company',
    audience: 'organisers',
    channels: ['Email', 'Website form', 'Phone', 'Instagram'],
    systems: ['CRM', 'Google Workspace', 'Booking software', 'Excel'],
    pains: [
      'enquiries arrive without dates, headcount or budget',
      'the same venue and catering questions are answered repeatedly',
      'supplier contracts are signed quickly under event pressure',
    ],
    rhythm: 'peak season, when enquiries and delivery collide',
    stakes: 'a date held for an unqualified enquiry is a date that could have been sold',
  },
  {
    slug: 'pharmacy',
    name: 'Pharmacies',
    lower: 'pharmacies',
    one: 'a pharmacy',
    audience: 'customers',
    channels: ['Phone', 'Walk-in', 'WhatsApp', 'Website'],
    systems: ['Dispensing software', 'Inventory software', 'Supplier portals', 'POS'],
    pains: [
      'stock questions and prescription queries tie up the counter',
      'fast-moving lines run out between supplier deliveries',
      'supplier invoices arrive daily and are reconciled late',
    ],
    rhythm: 'mornings and the start of every flu season',
    stakes: 'an out-of-stock line sends a regular customer to another pharmacy',
  },
]

export function getIndustry(slug: string): Industry | undefined {
  return INDUSTRIES.find(i => i.slug === slug)
}
