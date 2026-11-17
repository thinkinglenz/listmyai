/**
 * The agent catalogue.
 *
 * These are products we offer to build, not listings someone submitted. They
 * are kept in code rather than the database on purpose: there are twelve of
 * them, they change rarely, and they need to render even when Supabase is
 * unreachable — an enquiry page that 500s earns nothing.
 *
 * THREE RULES, AND THEY ARE NOT STYLE PREFERENCES:
 *
 *   1. No price, anywhere. Not a number, not a range, not "from", not
 *      "starting at". Scope is established in the enquiry, and a figure on a
 *      public page becomes the ceiling for every conversation that follows.
 *   2. No delivery date. No "in two weeks", no "ships in days". Same reason.
 *   3. Nothing about who builds them. No names, no locations, no phone
 *      numbers, no company history. The reply address is the only contact
 *      route, and the voice is always "we".
 *
 * `worksWith` names third-party products as destinations an integration could
 * target. It is not a claim of partnership, endorsement, or certification, and
 * the footer disclaimer carries that for every page.
 */

export interface Agent {
  slug: string
  /** The brand. Short, ownable, and never a real company's name. */
  name: string
  /**
   * The job-keyed heading. This is what people actually type into a search
   * box, so it carries the page's H1 and title while `name` carries the brand.
   */
  job: string
  tagline: string
  /** The pain, in the reader's words. Two sentences at most. */
  problem: string
  /** What is different after it runs. One sentence, concrete. */
  outcome: string
  features: string[]
  worksWith: string[]
  /**
   * Search phrasings that mean this same agent. Each becomes a job-keyed
   * landing page pointing back here, which is how one product covers many
   * queries without twelve thin duplicates of the same copy.
   */
  jobKeys: string[]
  industries: string[]
  /**
   * What the enquiry has to establish before a reply is worth writing. The
   * intake model reads these and keeps asking until it has them, which is the
   * whole point of the form: no back-and-forth afterwards.
   */
  intakeFocus: string[]
  accent: string
  icon: string
}

export const AGENTS: Agent[] = [
  {
    slug: 'relay',
    name: 'Relay',
    job: 'AI Customer Support Agent',
    tagline: 'Answers the questions you have already answered a thousand times.',
    problem:
      'Most support queues are the same forty questions wearing different clothes. Your team retypes answers that already exist in your help docs, and the genuinely hard tickets wait behind them.',
    outcome: 'Repeat questions get answered instantly; your team only sees the ones that need a person.',
    features: [
      'Answers only from your own help docs, past tickets and policies — never from guesswork',
      'Says "I do not know" and hands over rather than inventing an answer',
      'Passes the full conversation to the human, so the customer never repeats themselves',
      'Flags every question it could not answer, which becomes your documentation backlog',
      'Works in the languages your customers actually write in',
    ],
    worksWith: ['Email', 'WhatsApp', 'Website chat', 'Zendesk', 'Freshdesk', 'Intercom'],
    jobKeys: [
      'ai customer support agent',
      'ai support ticket deflection',
      'ai helpdesk agent',
      'automate customer support replies',
      'ai chatbot trained on help docs',
      'reduce support ticket volume with ai',
    ],
    industries: ['SaaS', 'E-commerce', 'Travel', 'Education', 'Healthcare'],
    intakeFocus: [
      'Where support arrives today and roughly what volume',
      'Whether documented answers exist, and where they live',
      'Which questions must always reach a human',
      'Languages customers write in',
      'What currently happens outside working hours',
    ],
    accent: '#3b82f6',
    icon: 'Headphones',
  },
  {
    slug: 'sift',
    name: 'Sift',
    job: 'AI Lead Qualification Agent',
    tagline: 'Separates the buyers from the browsers before anyone picks up the phone.',
    problem:
      'Every enquiry looks identical in an inbox. Your team spends its best hours on people who were never going to buy, while a genuine buyer waits a day for a reply.',
    outcome: 'Real buyers are identified and answered first, with the context already gathered.',
    features: [
      'Asks the qualifying questions your team would ask, in conversation rather than a form',
      'Scores each enquiry against the criteria you set, not a generic template',
      'Routes hot enquiries to a person immediately and parks the rest politely',
      'Writes a short brief for whoever picks it up, so no one starts cold',
      'Captures why a lead was rated low, which tells you what your marketing is attracting',
    ],
    worksWith: ['Website forms', 'WhatsApp', 'Email', 'HubSpot', 'Pipedrive', 'Google Sheets'],
    jobKeys: [
      'ai lead qualification agent',
      'ai lead scoring agent',
      'qualify inbound leads automatically',
      'ai sdr agent',
      'ai agent for inbound enquiries',
      'speed to lead automation',
    ],
    industries: ['Real estate', 'Travel', 'Agencies', 'B2B services', 'Education'],
    intakeFocus: [
      'What makes a lead good or bad in your business, specifically',
      'Where enquiries arrive and how many per week',
      'What happens to an enquiry today, step by step',
      'Who should be interrupted for a hot lead, and how',
      'Whether a CRM is already in use',
    ],
    accent: '#e94560',
    icon: 'Filter',
  },
  {
    slug: 'booked',
    name: 'Booked',
    job: 'AI Appointment Booking Agent',
    tagline: 'Fills the calendar and chases the no-shows.',
    problem:
      'Booking is a conversation that takes six messages and always happens when nobody is free to answer. Then a quarter of the bookings simply do not turn up.',
    outcome: 'Appointments get booked without a human in the loop, and fewer of them are wasted.',
    features: [
      'Offers only genuinely free slots, read live from your calendar',
      'Handles the reschedule and the cancellation, not just the first booking',
      'Sends reminders on the channel the customer actually reads',
      'Asks for anything you need before the appointment so the slot is not wasted',
      'Reports which slots, days and sources produce the most no-shows',
    ],
    worksWith: ['Google Calendar', 'Outlook', 'WhatsApp', 'SMS', 'Calendly'],
    jobKeys: [
      'ai appointment booking agent',
      'ai scheduling assistant',
      'reduce appointment no shows with ai',
      'ai receptionist agent',
      'automated booking agent whatsapp',
      'ai agent for clinic bookings',
    ],
    industries: ['Clinics', 'Salons', 'Trades', 'Consultants', 'Fitness'],
    intakeFocus: [
      'Which calendar holds the truth, and who owns it',
      'Rules a booking must respect: buffers, staff, locations, durations',
      'Where customers currently ask to book',
      'What you need to know before a customer arrives',
      'How cancellations are handled today',
    ],
    accent: '#10b981',
    icon: 'CalendarCheck',
  },
  {
    slug: 'triage',
    name: 'Triage',
    job: 'AI Inbox Triage Agent',
    tagline: 'Reads the shared inbox so your team does not have to.',
    problem:
      'A shared inbox is a pile. Invoices, job applications, suppliers, spam and actual customers all land in the same place, and someone senior spends their morning sorting it.',
    outcome: 'Everything is sorted, routed and summarised before anyone opens the inbox.',
    features: [
      'Sorts mail into the categories your business actually uses, not generic labels',
      'Routes each one to the right person or address, with attachments intact',
      'Summarises long threads to the decision that is actually needed',
      'Drafts the obvious replies and leaves them for a human to send',
      'Never deletes anything — sorting is reversible, deletion is not',
    ],
    worksWith: ['Gmail', 'Outlook', 'Google Workspace', 'Microsoft 365', 'Slack'],
    jobKeys: [
      'ai inbox triage agent',
      'ai email sorting agent',
      'automate shared inbox routing',
      'ai email assistant for business',
      'ai agent to categorise emails',
      'shared inbox automation',
    ],
    industries: ['Agencies', 'Logistics', 'Professional services', 'Retail', 'Property'],
    intakeFocus: [
      'Which inbox, and who has access to it today',
      'The categories mail genuinely falls into for you',
      'Where each category should end up',
      'What must never be auto-handled',
      'Rough daily volume',
    ],
    accent: '#8b5cf6',
    icon: 'Inbox',
  },
  {
    slug: 'ledger',
    name: 'Ledger',
    job: 'AI Invoice & Document Extraction Agent',
    tagline: 'Turns the attachments into rows you can actually use.',
    problem:
      'Invoices, receipts and delivery notes arrive as PDFs and phone photos. Someone retypes them into a spreadsheet, and the errors only surface at month end.',
    outcome: 'Documents become structured, checked data the moment they arrive.',
    features: [
      'Reads PDFs, scans and photographs, including the badly lit ones',
      'Pulls the fields you care about, not a fixed template',
      'Flags anything it is unsure of for review instead of guessing a number',
      'Catches duplicates and totals that do not add up',
      'Writes straight into your sheet or accounting system',
    ],
    worksWith: ['Google Sheets', 'Excel', 'Xero', 'QuickBooks', 'Zoho Books', 'Email'],
    jobKeys: [
      'ai invoice extraction agent',
      'ai document data extraction',
      'automate invoice data entry',
      'ai receipt scanning agent',
      'ocr invoice automation ai',
      'ai agent for accounts payable',
    ],
    industries: ['Accounting', 'Logistics', 'Retail', 'Construction', 'Hospitality'],
    intakeFocus: [
      'Which documents, and how they arrive',
      'The exact fields you need out of them',
      'Where the data has to end up',
      'What a wrong number would cost, and who should check it',
      'Roughly how many arrive per month',
    ],
    accent: '#f59e0b',
    icon: 'FileText',
  },
  {
    slug: 'echo',
    name: 'Echo',
    job: 'AI Content Repurposing Agent',
    tagline: 'One piece of work becomes a week of posts.',
    problem:
      'You already made the thing — the webinar, the article, the call recording. Turning it into posts is a separate job nobody has time for, so it is published once and forgotten.',
    outcome: 'Everything you produce gets used more than once, in your own voice.',
    features: [
      'Works from what you already made: video, audio, articles, decks',
      'Writes for each platform properly rather than reposting the same text',
      'Learns your voice from your existing posts, not a generic brand tone',
      'Everything lands as a draft for approval — nothing publishes itself',
      'Keeps a record of what has been used, so you do not repeat yourself',
    ],
    worksWith: ['Instagram', 'LinkedIn', 'YouTube', 'Facebook', 'Buffer', 'Google Drive'],
    jobKeys: [
      'ai content repurposing agent',
      'ai social media content agent',
      'turn video into social posts ai',
      'ai agent for content marketing',
      'repurpose blog into social posts',
      'ai agent writes in my brand voice',
    ],
    industries: ['Agencies', 'Coaches', 'Media', 'E-commerce', 'Education'],
    intakeFocus: [
      'What source material exists and where it lives',
      'Which platforms matter and which do not',
      'Examples of posts that sound like you',
      'Who approves before anything goes out',
      'Topics or claims that are off limits',
    ],
    accent: '#ec4899',
    icon: 'Repeat',
  },
  {
    slug: 'prospect',
    name: 'Prospect',
    job: 'AI Sales Outreach Agent',
    tagline: 'Researches each prospect properly, then writes like a person did.',
    problem:
      'Mass outreach stopped working because it reads like mass outreach. Writing genuinely personal emails takes twenty minutes each, so nobody sends enough of them.',
    outcome: 'Outreach that is actually researched, at a volume one person could never reach.',
    features: [
      'Researches each prospect before writing a word about them',
      'References something real and specific, not a merged first name',
      'Follows up on a schedule and stops the moment someone replies',
      'Honours unsubscribes and suppression lists as a hard rule',
      'Shows you what was sent and what it earned, per message',
    ],
    worksWith: ['Gmail', 'Outlook', 'HubSpot', 'Pipedrive', 'Google Sheets'],
    jobKeys: [
      'ai sales outreach agent',
      'ai cold email agent',
      'personalised cold email automation',
      'ai prospecting agent',
      'ai agent for b2b outreach',
      'ai follow up email agent',
    ],
    industries: ['B2B services', 'Agencies', 'SaaS', 'Manufacturing', 'Logistics'],
    intakeFocus: [
      'Who you sell to, defined tightly enough to be useful',
      'What you are actually offering them',
      'Which mailbox or domain sends, and its current reputation',
      'What a reply should trigger',
      'Claims you are not permitted to make',
    ],
    accent: '#06b6d4',
    icon: 'Send',
  },
  {
    slug: 'pulse',
    name: 'Pulse',
    job: 'AI Review & Reputation Agent',
    tagline: 'Watches what people say about you, and answers.',
    problem:
      'Reviews arrive across half a dozen platforms. The angry one sits unanswered for a week because nobody was looking at that platform that day.',
    outcome: 'Every review is seen quickly and answered in your voice, not ignored.',
    features: [
      'Watches the platforms your customers actually use',
      'Drafts a reply to each one, matched to the tone it deserves',
      'Escalates anything serious to a person immediately rather than replying',
      'Asks happy customers for a review at the right moment',
      'Shows what people complain about repeatedly, which is usually fixable',
    ],
    worksWith: ['Google Business Profile', 'Facebook', 'Trustpilot', 'TripAdvisor', 'Email'],
    jobKeys: [
      'ai review management agent',
      'ai reputation management agent',
      'automate google review replies',
      'ai agent to request reviews',
      'respond to reviews automatically ai',
      'ai agent for online reputation',
    ],
    industries: ['Hospitality', 'Clinics', 'Retail', 'Travel', 'Trades'],
    intakeFocus: [
      'Which platforms and which locations',
      'Who may reply publicly on your behalf',
      'What counts as serious enough to escalate',
      'Whether replies go out automatically or after approval',
      'How you ask for reviews today',
    ],
    accent: '#eab308',
    icon: 'Star',
  },
  {
    slug: 'clause',
    name: 'Clause',
    job: 'AI Contract Review Agent',
    tagline: 'Reads the contract and tells you what changed.',
    problem:
      'Contracts arrive as long PDFs that look like the last one. The clause that matters is on page nine, and finding it reliably takes a careful hour.',
    outcome: 'The risky clauses surface in minutes, with the reason stated.',
    features: [
      'Compares each contract against your own standard positions',
      'Points to the exact clause, not a vague summary of the document',
      'Flags what is missing, which is usually more dangerous than what is present',
      'Produces a plain-language summary for people who are not lawyers',
      'States plainly that it is a first pass, never a legal opinion',
    ],
    worksWith: ['Google Drive', 'SharePoint', 'Email', 'Dropbox'],
    jobKeys: [
      'ai contract review agent',
      'ai contract analysis agent',
      'review contracts with ai',
      'ai agent to check contract clauses',
      'ai legal document review',
      'ai nda review agent',
    ],
    industries: ['Professional services', 'Construction', 'Property', 'Logistics', 'Agencies'],
    intakeFocus: [
      'Which contract types, and how often they arrive',
      'Your standard positions, if they are written down anywhere',
      'What has gone wrong in a contract before',
      'Who reviews today and what they look for',
      'Whether legal sign-off stays mandatory',
    ],
    accent: '#64748b',
    icon: 'Scale',
  },
  {
    slug: 'restock',
    name: 'Restock',
    job: 'AI Inventory Forecast Agent',
    tagline: 'Tells you what to order before you run out.',
    problem:
      'Stock decisions get made from memory and a spreadsheet. The fast movers run out at the worst possible moment, and cash sits in the slow ones.',
    outcome: 'Reorder decisions are based on what actually sold, not on recollection.',
    features: [
      'Forecasts from your real sales history, including the seasonal pattern',
      'Accounts for how long each supplier actually takes, not what they promise',
      'Warns before a stockout rather than reporting it afterwards',
      'Identifies the stock that is quietly holding your cash',
      'Produces an order list you can check and send',
    ],
    worksWith: ['Shopify', 'WooCommerce', 'Google Sheets', 'Excel', 'Zoho Inventory'],
    jobKeys: [
      'ai inventory forecasting agent',
      'ai demand forecasting agent',
      'ai agent for stock reordering',
      'prevent stockouts with ai',
      'ai agent for purchase orders',
      'ai inventory management small business',
    ],
    industries: ['Retail', 'E-commerce', 'Wholesale', 'Hospitality', 'Pharmacy'],
    intakeFocus: [
      'Where sales history lives and how far back it goes',
      'How many SKUs are in play',
      'Real supplier lead times, including the unreliable ones',
      'Whether ordering stays a human decision',
      'Seasonality that a model would not guess',
    ],
    accent: '#14b8a6',
    icon: 'Package',
  },
  {
    slug: 'screen',
    name: 'Screen',
    job: 'AI CV Screening Agent',
    tagline: 'Reads every application properly, including the late ones.',
    problem:
      'A job post brings three hundred CVs. Realistically the first forty get read carefully and the rest get skimmed, which means good people are missed for no reason.',
    outcome: 'Every applicant is assessed against the same criteria, in the same depth.',
    features: [
      'Scores against the requirements you set for this specific role',
      'Gives a reason for every score, so a decision can be defended',
      'Can be configured to ignore name, age, gender and photograph',
      'Writes the shortlist with the questions worth asking each candidate',
      'Replies to everyone, including the people you are not taking forward',
    ],
    worksWith: ['Gmail', 'Outlook', 'Google Drive', 'Google Sheets', 'LinkedIn'],
    jobKeys: [
      'ai cv screening agent',
      'ai resume screening agent',
      'ai recruitment agent',
      'shortlist candidates with ai',
      'ai agent for hiring',
      'automated candidate screening',
    ],
    industries: ['Agencies', 'Hospitality', 'Healthcare', 'Logistics', 'Retail'],
    intakeFocus: [
      'The role, and what genuinely makes someone good at it',
      'Where applications arrive',
      'Which attributes must be excluded from scoring',
      'Who makes the final call',
      'Typical volume per opening',
    ],
    accent: '#a855f7',
    icon: 'UserSearch',
  },
  {
    slug: 'brief',
    name: 'Brief',
    job: 'AI Business Reporting Agent',
    tagline: 'The weekly numbers, with the explanation attached.',
    problem:
      'The data exists in five systems. Pulling it together is a job someone does on a Monday, and by the time it is ready, the week has already started.',
    outcome: 'The numbers arrive on their own, with the movements already explained.',
    features: [
      'Pulls from the systems you already run, without a new dashboard to learn',
      'Explains what moved and why, rather than listing figures',
      'Flags anything outside its normal range before you have to notice',
      'Arrives where you already read things, on a schedule you set',
      'Says plainly when a source was unavailable instead of quietly dropping it',
    ],
    worksWith: ['Google Analytics', 'Google Sheets', 'Shopify', 'Stripe', 'Slack', 'Email'],
    jobKeys: [
      'ai business reporting agent',
      'ai weekly report agent',
      'automated business dashboard ai',
      'ai agent for kpi reporting',
      'ai data analysis agent for business',
      'ai agent that explains metrics',
    ],
    industries: ['E-commerce', 'Agencies', 'SaaS', 'Retail', 'Hospitality'],
    intakeFocus: [
      'Which numbers actually drive a decision for you',
      'Which systems hold them and who can grant access',
      'Who reads the report and what they do with it',
      'How often it is genuinely useful',
      'What counts as abnormal and worth an alert',
    ],
    accent: '#0ea5e9',
    icon: 'BarChart3',
  },
]

export function getAgent(slug: string): Agent | undefined {
  return AGENTS.find(a => a.slug === slug)
}

export function agentSlugs(): string[] {
  return AGENTS.map(a => a.slug)
}

/**
 * Every job key across the catalogue, paired with the agent it belongs to.
 * This is the job-keyed page map: one page per phrase, each pointing at the
 * product that answers it.
 */
export function jobKeyMap(): { key: string; slug: string }[] {
  return AGENTS.flatMap(a => a.jobKeys.map(key => ({ key, slug: a.slug })))
}

/** URL-safe form of a job key: "ai customer support agent" -> "ai-customer-support-agent". */
export function jobKeySlug(key: string): string {
  return key.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

/**
 * The job phrase for use mid-sentence: "AI customer support agent".
 *
 * Not `job.toLowerCase()`, which would give "ai customer support agent" and
 * look like a typo on every page. The leading acronym is preserved and only
 * the words after it are lowered.
 *
 * This exists because the pages used to lead with the brand name — "Relay" as
 * the card heading, "RELAY" as the eyebrow, "What Relay does about it" as an
 * H2. Nobody searches for an invented product name, so every one of those was
 * a heading spent on a word with no demand behind it. The job phrase goes
 * there instead.
 */
export function jobPhrase(agent: Agent): string {
  const [first, ...rest] = agent.job.split(' ')
  return rest.length ? `${first} ${rest.join(' ').toLowerCase()}` : first
}
