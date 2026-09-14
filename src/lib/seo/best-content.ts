// Hand-written editorial for /best pages. A page combines one topic with an
// optional audience, so 14 topics and 14 audiences cover 240 pages while every
// sentence here was written for its subject rather than templated per page.

export interface TopicProfile {
  label: string          // "AI writing tools"
  singular: string       // "AI writing tool"
  /** Lower-case fragments matched against tool taglines and descriptions. */
  terms: string[]
  /** A tagline containing any of these belongs to a neighbouring topic. */
  exclude?: string[]
  what: string
  criteria: string[]
  /** Closest hand-written use-case page, for internal linking. */
  useCase?: string
}

export interface AudienceProfile {
  label: string          // "students"
  title: string          // "Students"
  terms: string[]
  needs: string
  priorities: string[]
}

export const TOPICS: Record<string, TopicProfile> = {
  'ai-tools': {
    label: 'AI tools', singular: 'AI tool', terms: [],
    what: 'AI tools now cover almost every kind of work — drafting text, writing code, making images and video, answering questions and running repetitive tasks for you.',
    criteria: [
      'Start from the job you need done, not the brand: a specialist tool usually beats a general chatbot at one task.',
      'Check what the free plan actually allows — many cap usage per day or watermark the output.',
      'Look at where your data goes, especially if you paste in client or company material.',
    ],
  },
  'ai-writing-tools': {
    label: 'AI writing tools', singular: 'AI writing tool', useCase: 'writing',
    terms: ['writ', 'copywrit', 'content', 'blog', 'essay', 'article', 'paraphras', 'grammar'],
    what: 'AI writing tools draft, rewrite and polish text — blog posts, emails, ad copy, essays and product descriptions — from a short brief.',
    criteria: [
      'Test it on your own topic: output quality varies far more by subject than by brand.',
      'Check whether it can match a tone or brand voice you give it, rather than producing generic copy.',
      'Look for plagiarism or originality checks if the text will be published.',
    ],
  },
  'ai-coding-tools': {
    label: 'AI coding tools', singular: 'AI coding tool', useCase: 'coding',
    terms: ['code', 'coding', 'program', 'developer', 'debug', 'github', 'ide', 'software engineer'],
    what: 'AI coding tools autocomplete code, explain unfamiliar codebases, write tests and fix bugs, either inside your editor or as a separate assistant.',
    criteria: [
      'Confirm it supports your languages and editor (VS Code, JetBrains, terminal).',
      'Check how much of your repository it can read at once — context size decides how useful answers are.',
      'Read the data policy before pointing it at private or client code.',
    ],
  },
  'ai-chatbots': {
    label: 'AI chatbots', singular: 'AI chatbot', useCase: 'chatbots',
    terms: ['chatbot', 'chat', 'assistant', 'conversation', 'gpt', 'llm'],
    what: 'AI chatbots answer questions, brainstorm, summarise documents and help with everyday tasks in a conversation — the category ChatGPT made mainstream.',
    criteria: [
      'Compare answers on questions you already know the answer to — accuracy differs between models.',
      'Check whether it can search the web and cite sources, or only answers from training data.',
      'See if it accepts files, images and long documents on the free plan.',
    ],
  },
  'ai-agents': {
    label: 'AI agents', singular: 'AI agent',
    terms: ['agent', 'autonomous', 'workflow', 'automat', 'copilot'],
    what: 'AI agents go beyond answering — they take actions across apps, such as researching, filling in forms, sending messages or completing multi-step tasks with little supervision.',
    criteria: [
      'Start with a narrow, low-risk task and check every action it takes before trusting it more.',
      'Check which apps it can connect to and what permissions it asks for.',
      'Look for a clear log of what the agent did, so mistakes can be traced.',
    ],
  },
  'ai-image-generators': {
    label: 'AI image generators', singular: 'AI image generator', useCase: 'image-generation',
    terms: ['image', 'photo', 'ai art', 'artwork', 'picture', 'illustrat', 'logo', 'text to image', 'text-to-image'],
    exclude: ['video', 'animation'],
    what: 'AI image generators turn a text description into pictures, illustrations, logos and product shots, and many can also edit or upscale existing photos.',
    criteria: [
      'Check the licence: some free plans do not allow commercial use of what you generate.',
      'Look at resolution and watermarks on the free tier before relying on it.',
      'Try a prompt with text in the image — handling lettering is still a weak spot for many.',
    ],
  },
  'ai-search-engines': {
    label: 'AI search engines', singular: 'AI search engine', useCase: 'research',
    terms: ['search', 'research', 'answer engine', 'citation', 'knowledge'],
    what: 'AI search engines answer a question directly with a written summary and links to their sources, instead of a page of blue links.',
    criteria: [
      'Always open the cited sources — summaries can misread them.',
      'Check how recent the results are for fast-moving topics.',
      'Look for follow-up questions and the ability to narrow to academic or news sources.',
    ],
  },
  'ai-audio-tools': {
    label: 'AI audio tools', singular: 'AI audio tool', useCase: 'music-audio',
    terms: ['audio', 'voice', 'speech', 'music', 'podcast', 'sound', 'transcri', 'text to speech'],
    what: 'AI audio tools generate natural voiceovers, clone voices, transcribe recordings, clean up background noise and even compose music.',
    criteria: [
      'Listen to samples in your own language and accent before choosing.',
      'Check the rules on voice cloning and commercial use of generated audio.',
      'For transcription, test with a real recording including crosstalk and noise.',
    ],
  },
  'ai-marketing-tools': {
    label: 'AI marketing tools', singular: 'AI marketing tool', useCase: 'marketing',
    terms: ['marketing', 'social media', 'ad copy', 'ad creative', 'campaign', 'seo', 'email marketing', 'growth marketing', 'lead generation'],
    what: 'AI marketing tools write ad and social copy, plan content calendars, generate creatives and analyse which campaigns are working.',
    criteria: [
      'Prefer tools that connect to the channels you already use rather than exporting copy by hand.',
      'Check it can learn your brand voice so output does not sound like everyone else’s.',
      'Look for reporting that ties content back to clicks or sales.',
    ],
  },
  'ai-seo-tools': {
    label: 'AI SEO tools', singular: 'AI SEO tool', useCase: 'marketing',
    terms: ['seo', 'keyword', 'rank', 'search engine', 'backlink', 'serp'],
    what: 'AI SEO tools research keywords, audit pages, suggest improvements and draft search-optimised content based on what already ranks.',
    criteria: [
      'Check where keyword data comes from — estimates vary widely between tools.',
      'Favour tools that suggest improvements to existing pages, not only new content.',
      'Be wary of bulk-generated articles; search engines penalise low-value content at scale.',
    ],
  },
  'ai-video-tools': {
    label: 'AI video tools', singular: 'AI video tool', useCase: 'video-creation',
    terms: ['video', 'film', 'animation', 'clip', 'avatar', 'subtitle', 'reel'],
    what: 'AI video tools generate clips from text, create talking avatars, cut long recordings into short social videos and add subtitles automatically.',
    criteria: [
      'Check export length, resolution and watermarks on the free plan.',
      'Look at how natural the avatars and voices are in your language.',
      'For editing tools, test with your own footage rather than the demo.',
    ],
  },
  'ai-productivity-tools': {
    label: 'AI productivity tools', singular: 'AI productivity tool', useCase: 'productivity',
    terms: ['productiv', 'task', 'note', 'meeting', 'calendar', 'schedul', 'email', 'summar', 'workflow'],
    what: 'AI productivity tools take meeting notes, summarise long threads, organise tasks and draft replies so less of the day goes on admin.',
    criteria: [
      'Choose tools that plug into the apps you already live in — calendar, email, docs.',
      'Check privacy settings before connecting work email or meeting recordings.',
      'Measure it for a week: a tool you forget to open saves nothing.',
    ],
  },
  'ai-education-tools': {
    label: 'AI education tools', singular: 'AI education tool', useCase: 'education',
    terms: ['learn', 'study', 'tutor', 'education', 'student', 'teach', 'course', 'quiz', 'flashcard', 'homework'],
    what: 'AI education tools explain topics step by step, generate quizzes and flashcards, give feedback on writing and help teachers prepare lessons.',
    criteria: [
      'Prefer tools that explain their reasoning rather than just giving answers.',
      'Check your school’s or institution’s policy on AI use first.',
      'Look for age-appropriate settings and clear data policies for young users.',
    ],
  },
  'ai-presentation-tools': {
    label: 'AI presentation tools', singular: 'AI presentation tool', useCase: 'presentation',
    terms: ['presentation', 'slide', 'deck', 'pitch', 'powerpoint'],
    what: 'AI presentation tools turn an outline or document into a designed slide deck, then let you restyle and edit it.',
    criteria: [
      'Check export to PowerPoint or Google Slides so you are not locked in.',
      'See how well it handles charts and your own data, not just text slides.',
      'Look for brand templates if the deck represents a company.',
    ],
  },
  'ai-automation-tools': {
    label: 'AI automation tools', singular: 'AI automation tool', useCase: 'productivity',
    terms: ['automat', 'workflow', 'integration', 'zapier', 'no-code', 'no code', 'agent'],
    what: 'AI automation tools connect your apps and let AI handle the steps between them — sorting emails, updating spreadsheets or routing leads.',
    criteria: [
      'Count the integrations you need before comparing prices.',
      'Check how usage is billed — per task or per run can get expensive at scale.',
      'Make sure failed runs alert you rather than failing silently.',
    ],
  },
}

export const AUDIENCES: Record<string, AudienceProfile> = {
  'business': {
    label: 'business', title: 'Business', terms: ['business', 'enterprise', 'crm', 'sales team', 'b2b'],
    needs: 'For a business, the question is less "is it clever" and more "does it save paid hours, and is our data safe". Team accounts, admin controls and predictable pricing matter as much as output quality.',
    priorities: ['Team plans with shared workspaces and admin controls.', 'A clear policy that your data is not used to train models.'],
  },
  'small-business': {
    label: 'small businesses', title: 'Small Businesses', terms: ['small business', 'smb', 'local business', 'solopreneur', 'bookkeeping'],
    needs: 'Small businesses usually have no specialist for marketing, design or admin, so the best AI tools act as that missing person — at a monthly price that makes sense for a small team.',
    priorities: ['Low or free entry pricing that scales with you.', 'Tools that work out of the box without setup or training.'],
  },
  'freelancers': {
    label: 'freelancers', title: 'Freelancers', terms: ['freelanc', 'solopreneur', 'upwork', 'fiverr', 'gig work', 'independent professional'],
    needs: 'Freelancers are paid for output, so AI tools earn their place by taking on the unbilled work — proposals, admin, first drafts — and by letting one person deliver what used to take a small team.',
    priorities: ['Pay-as-you-go or free tiers that match uneven income.', 'Commercial-use rights, since the work goes to clients.'],
  },
  'students': {
    label: 'students', title: 'Students', terms: ['student', 'study', 'studying', 'homework', 'essay', 'exam', 'flashcard', 'lecture', 'revision', 'tutor', 'school', 'college', 'universit', 'academic', 'quiz', 'language learning'],
    needs: 'Students need AI tools that help them understand material, organise notes and research, and improve their own writing — ideally for free, and without breaking their school’s academic integrity rules.',
    priorities: ['Genuinely useful free plans or student discounts.', 'Explanations and feedback rather than finished answers to copy.'],
  },
  'startups': {
    label: 'startups', title: 'Startups', terms: ['startup', 'founder', 'pitch deck', 'mvp', 'investor'],
    needs: 'Startups use AI to move faster than their headcount — building product, producing marketing and handling support before they can hire for each role.',
    priorities: ['Startup credits or free tiers while you are pre-revenue.', 'APIs and integrations that grow with the product.'],
  },
  'ecommerce': {
    label: 'ecommerce', title: 'Ecommerce', terms: ['ecommerce', 'e-commerce', 'shopify', 'woocommerce', 'product description', 'online store', 'amazon seller', 'product photo', 'dropshipping'],
    needs: 'Online stores apply AI where volume hurts most: writing hundreds of product descriptions, producing product photos, answering customer questions and personalising offers.',
    priorities: ['Integrations with Shopify, WooCommerce or Amazon.', 'Bulk generation so work scales across a whole catalogue.'],
  },
  'agencies': {
    label: 'agencies', title: 'Agencies', terms: ['agency', 'agencies', 'white label', 'white-label', 'client management', 'client report'],
    needs: 'Agencies run many clients at once, so the AI tools that pay off handle multiple brand voices, collaborate across a team and produce work that can go straight into client reports.',
    priorities: ['Multiple workspaces or brand profiles per client.', 'White-label or client-ready exports.'],
  },
  'professionals': {
    label: 'professionals', title: 'Professionals', terms: ['professionals', 'consultant', 'lawyer', 'attorney', 'accountant', 'linkedin', 'executive'],
    needs: 'Professionals use AI to get through documents, meetings and correspondence faster, where accuracy and confidentiality are non-negotiable.',
    priorities: ['Strong privacy and data-retention controls.', 'Accurate summaries of long documents and meetings.'],
  },
  'teachers': {
    label: 'teachers', title: 'Teachers', terms: ['teacher', 'lesson', 'classroom', 'quiz', 'grading', 'curriculum', 'educator'],
    needs: 'Teachers use AI to cut preparation time — drafting lesson plans, building quizzes and differentiated worksheets, and giving faster feedback on student work.',
    priorities: ['Education pricing or free plans for teachers.', 'Student-safe settings and clear data policies.'],
  },
  'beginners': {
    label: 'beginners', title: 'Beginners', terms: ['beginner', 'no-code', 'no code', 'no experience', 'non-technical', 'no coding'],
    needs: 'If you are new to AI, the best starting tools are the ones that need no setup and no technical knowledge — you type what you want in plain language and see a result straight away.',
    priorities: ['A free plan so you can experiment without paying.', 'A simple interface with templates or examples to start from.'],
  },
  'developers': {
    label: 'developers', title: 'Developers', terms: ['developer', 'api', 'sdk', 'code', 'github', 'open source', 'cli'],
    needs: 'Developers want AI that fits into their existing workflow — editor, terminal and CI — with APIs they can build on and control over which models are used.',
    priorities: ['A documented API or SDK.', 'Self-hosting or open-source options where data control matters.'],
  },
  'marketers': {
    label: 'marketers', title: 'Marketers', terms: ['marketer', 'marketing', 'campaign', 'social media', 'ad copy', 'seo'],
    needs: 'Marketers use AI across the whole funnel — research, copy, creatives, scheduling and reporting — so tools that connect to their channels save the most time.',
    priorities: ['Brand-voice controls so output stays on message.', 'Direct publishing or integrations with ad and social platforms.'],
  },
  'creators': {
    label: 'creators', title: 'Creators', terms: ['creator', 'youtube', 'tiktok', 'instagram', 'podcast', 'thumbnail', 'influencer', 'reel'],
    needs: 'Creators need to publish often across several platforms, so AI tools that script, edit, caption and repurpose content help them keep up without burning out.',
    priorities: ['Repurposing one video or post into many formats.', 'Commercial-use rights for monetised content.'],
  },
  'entrepreneurs': {
    label: 'entrepreneurs', title: 'Entrepreneurs', terms: ['entrepreneur', 'founder', 'business plan', 'startup', 'solopreneur'],
    needs: 'Entrepreneurs wear every hat, and AI tools let one person validate ideas, write the business plan, build the website and run marketing before the first hire.',
    priorities: ['Tools that cover several jobs in one subscription.', 'Free tiers to test ideas before committing money.'],
  },
}
