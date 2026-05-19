export type SkillCategory = 'core' | 'marketing' | 'engineering' | 'design' | 'psychology' | 'business';

export type SkillTreeNode = {
  id: string;
  label: string;
  category: SkillCategory;
  x: number;
  y: number;
  size: number;
  xp: number;
  color: string;
  accent: string;
  icon: string;
  children: string[];
  premium?: boolean;
  maxOnly?: boolean;
  summary: string;
  lesson: string[];
};

export type SkillTopic = {
  id: string;
  title: string;
  category: SkillCategory;
  icon: string;
  color: string;
  readXp: number;
  quizXp: number;
  summary: string;
  body: string[];
  quiz: Array<{ question: string; options: string[]; answer: number }>;
};

export const SKILL_CATEGORIES: Array<{ id: SkillCategory | 'all'; label: string; icon: string; color: string }> = [
  { id: 'all',         label: 'Skill Tree',  icon: '✣',  color: '#8ee7ff' },
  { id: 'marketing',   label: 'Marketing',   icon: 'M',   color: '#f0a85f' },
  { id: 'engineering', label: 'Engineering', icon: 'E',   color: '#8ee7ff' },
  { id: 'design',      label: 'Design',      icon: 'D',   color: '#e7c477' },
  { id: 'psychology',  label: 'Psychology',  icon: 'P',   color: '#d98ec8' },
  { id: 'business',    label: 'Business',    icon: 'B',   color: '#8ed9b6' },
];

// ─── SKILL TREE NODES ───────────────────────────────────────────────────────
// Layout: STARTER at center (50,50). Marketing radiates UPWARD (y<50).
// Engineering radiates DOWNWARD (y>50). SVG coords = x*10, y*7 in 1000x700 space.

export const SKILL_TREE_NODES: SkillTreeNode[] = [

  // ── CORE ──────────────────────────────────────────────────────────────────
  {
    id: 'starter',
    label: 'Starter',
    category: 'core',
    x: 50, y: 50, size: 42, xp: 25,
    color: '#78f5df', accent: '#e7c477', icon: '✦',
    children: ['psychology', 'security-auditing'],
    summary: 'Begin your Growth Hacker & Dev-Engineer journey here.',
    lesson: [
      'Map your current strengths: are you more Marketing or Engineering?',
      'Complete prerequisite nodes before advancing deeper in each branch.',
      'Writing blogs earns XP — the fastest path to unlocking premium skills.',
    ],
  },

  // ── PSYCHOLOGY (bridge — left of starter, same row) ───────────────────────
  {
    id: 'psychology',
    label: 'Psychology',
    category: 'psychology',
    x: 27, y: 50, size: 30, xp: 40,
    color: '#d98ec8', accent: '#a78bfa', icon: '🧠',
    children: ['branding-positioning'],
    summary: 'Understand the cognitive and emotional drivers behind every human decision.',
    lesson: [
      'People decide emotionally first and justify rationally after.',
      'Loss aversion is twice as powerful as equivalent gain — design around it.',
      'Mapping the customer journey reveals hidden friction you can remove.',
    ],
  },

  // ── MARKETING BRANCH (radiates upward from branding) ─────────────────────

  {
    id: 'branding-positioning',
    label: 'Branding',
    category: 'marketing',
    x: 34, y: 37, size: 32, xp: 65,
    color: '#f0a85f', accent: '#e7c477', icon: 'BP',
    children: ['seo-strategy', 'ab-testing-automation', 'ux-narrative'],
    summary: 'Define your brand promise, visual identity, and market position.',
    lesson: [
      'A brand is a promise — define it in one sentence your audience can repeat.',
      'Positioning means owning a specific mental slot in the customer\'s mind.',
      'Consistent brand language across every touchpoint compounds trust over time.',
    ],
  },

  {
    id: 'seo-strategy',
    label: 'SEO Strategy',
    category: 'marketing',
    x: 20, y: 24, size: 28, xp: 80,
    color: '#68d391', accent: '#8ee7ff', icon: 'SEO',
    children: ['performance-marketing'],
    summary: 'Build long-term organic traffic through technical and content SEO mastery.',
    lesson: [
      'Technical SEO ensures search engines can crawl, index, and rank your pages.',
      'Keyword clustering groups related terms to dominate topic authority.',
      'Core Web Vitals (LCP, CLS, INP) are direct Google ranking signals.',
    ],
  },

  {
    id: 'performance-marketing',
    label: 'Perf. Marketing',
    category: 'marketing',
    x: 15, y: 37, size: 26, xp: 90, premium: true,
    color: '#fc8181', accent: '#f0a85f', icon: 'PM',
    children: [],
    summary: 'Run paid acquisition campaigns optimized for measurable, scalable ROI.',
    lesson: [
      'Performance marketing pays only for results: clicks, leads, or purchases.',
      'ROAS (Return on Ad Spend) is the primary efficiency metric to optimise.',
      'Creative fatigue is real — rotate ad creatives every 10-14 days minimum.',
    ],
  },

  {
    id: 'ab-testing-automation',
    label: 'A/B Testing',
    category: 'marketing',
    x: 44, y: 21, size: 28, xp: 70,
    color: '#8ee7ff', accent: '#63b3ed', icon: 'A/B',
    children: ['cro'],
    summary: 'Design, run, and automate experiments that reliably move key metrics.',
    lesson: [
      'A/B testing requires statistical significance before declaring a winner.',
      'Test one variable at a time to isolate true cause and effect.',
      'Automate experiment scheduling to reduce human error and oversight.',
    ],
  },

  {
    id: 'cro',
    label: 'CRO',
    category: 'marketing',
    x: 62, y: 21, size: 32, xp: 85,
    color: '#f6ad55', accent: '#f0a85f', icon: 'CRO',
    children: ['behavioral-data', 'advanced-content'],
    summary: 'Systematically increase the percentage of visitors who take desired actions.',
    lesson: [
      'The conversion funnel: Awareness → Interest → Desire → Action.',
      'Heatmaps and session recordings reveal real user friction invisible in analytics.',
      'A 1% CRO improvement can double revenue at scale — it compounds.',
    ],
  },

  {
    id: 'behavioral-data',
    label: 'Behavioral Data',
    category: 'marketing',
    x: 74, y: 29, size: 28, xp: 95,
    color: '#a78bfa', accent: '#d98ec8', icon: 'BD',
    children: ['social-media-hacking'],
    summary: 'Mine user behavior data to uncover hidden growth levers.',
    lesson: [
      'Behavioral analytics tracks what users DO — not just what they say.',
      'Cohort analysis reveals retention patterns and churn inflection points.',
      'Event tracking in GA4 or Mixpanel enables precise funnel visualization.',
    ],
  },

  {
    id: 'social-media-hacking',
    label: 'Social Media',
    category: 'marketing',
    x: 82, y: 21, size: 26, xp: 75,
    color: '#f472b6', accent: '#d98ec8', icon: 'SM',
    children: ['viral-loop'],
    summary: 'Hack organic reach by reverse-engineering platform algorithms.',
    lesson: [
      'Each platform rewards different content formats and posting cadences.',
      'Hook → Value → CTA structure maximizes engagement in short-form video.',
      'Shares and saves signal quality to algorithms far more than likes do.',
    ],
  },

  {
    id: 'viral-loop',
    label: 'Viral Loop',
    category: 'marketing',
    x: 84, y: 37, size: 26, xp: 100,
    color: '#f0a85f', accent: '#fc8181', icon: 'VL',
    children: ['narrative-viz'],
    summary: 'Engineer product mechanics that make users automatically invite other users.',
    lesson: [
      'A viral loop is complete when each new user generates at least one more.',
      'K-factor = invites sent × conversion rate — K > 1 means exponential growth.',
      'Incentive alignment: reward both the referrer and the person referred.',
    ],
  },

  {
    id: 'narrative-viz',
    label: 'Narrative Viz',
    category: 'design',
    x: 80, y: 48, size: 24, xp: 120, maxOnly: true,
    color: '#e7c477', accent: '#f0a85f', icon: 'NV',
    children: [],
    summary: 'Combine data storytelling and visualization for maximum persuasive impact.',
    lesson: [
      'Data storytelling transforms raw numbers into narratives that move people.',
      'Visual hierarchy guides the viewer\'s eye directly to the key insight.',
      'Interactive dashboards let stakeholders explore data on their own terms.',
    ],
  },

  {
    id: 'advanced-content',
    label: 'Content Engine',
    category: 'marketing',
    x: 67, y: 37, size: 28, xp: 85,
    color: '#68d391', accent: '#8ee7ff', icon: 'AC',
    children: [],
    summary: 'Build a systematic content machine that scales organic growth predictably.',
    lesson: [
      'A content engine produces, distributes, and repurposes at industrial scale.',
      'Content clusters (pillar + spokes) dominate topic authority in search.',
      'Distribution > creation: 80% effort on getting content seen, not just made.',
    ],
  },

  {
    id: 'ux-narrative',
    label: 'UX Narrative',
    category: 'design',
    x: 55, y: 37, size: 24, xp: 70, premium: true,
    color: '#e7c477', accent: '#a78bfa', icon: 'UX',
    children: [],
    summary: 'Design product stories that guide users to their "aha" moment.',
    lesson: [
      'UX narrative connects feature flows to the user\'s underlying goal.',
      'Onboarding is the most critical narrative — get it right or lose the user.',
      'Micro-copy and empty states are part of the story — every word counts.',
    ],
  },

  // ── ENGINEERING BRANCH (radiates downward from security-auditing) ─────────

  {
    id: 'security-auditing',
    label: 'Security Audit',
    category: 'engineering',
    x: 42, y: 63, size: 30, xp: 60,
    color: '#8ee7ff', accent: '#63b3ed', icon: 'SA',
    children: ['penetration-testing', 'mindset-ethics', 'system-architecture'],
    summary: 'Systematically evaluate systems for vulnerabilities before attackers do.',
    lesson: [
      'Security auditing uses both manual review and automated scanning tools.',
      'OWASP Top 10 covers the most critical web application security risks.',
      'Threat modeling before development saves 10× more cost than post-release fixes.',
    ],
  },

  {
    id: 'penetration-testing',
    label: 'Pen Testing',
    category: 'engineering',
    x: 28, y: 71, size: 28, xp: 80,
    color: '#fc8181', accent: '#8ee7ff', icon: 'PT',
    children: ['cicd', 'user-psychology-hack'],
    summary: 'Ethically simulate attacks to expose vulnerabilities before real attackers find them.',
    lesson: [
      'Penetration testing always requires written authorization from the system owner.',
      'Reconnaissance → Scanning → Exploitation → Reporting are the four phases.',
      'Document every finding with severity ratings and clear remediation steps.',
    ],
  },

  {
    id: 'cicd',
    label: 'CI/CD',
    category: 'engineering',
    x: 20, y: 65, size: 26, xp: 70,
    color: '#63b3ed', accent: '#8ee7ff', icon: 'CI',
    children: ['agile-methodology'],
    summary: 'Automate testing and deployment to ship faster with dramatically less risk.',
    lesson: [
      'CI tests every commit; CD automatically deploys when all tests pass.',
      'A fast pipeline under 5 minutes enables truly continuous integration.',
      'Blue/green and canary deployments reduce production risk to near zero.',
    ],
  },

  {
    id: 'agile-methodology',
    label: 'Agile',
    category: 'engineering',
    x: 17, y: 77, size: 24, xp: 55,
    color: '#8ed9b6', accent: '#68d391', icon: 'AG',
    children: [],
    summary: 'Deliver value in short iterations with continuous feedback and adaptation.',
    lesson: [
      'Agile replaces big-bang planning with iterative delivery and adaptation.',
      'Sprint retrospectives are the primary mechanism for continuous improvement.',
      'User stories keep the entire team focused on business value over features.',
    ],
  },

  {
    id: 'user-psychology-hack',
    label: 'User Psychology',
    category: 'psychology',
    x: 34, y: 79, size: 26, xp: 75,
    color: '#d98ec8', accent: '#a78bfa', icon: 'UP',
    children: ['lockeet'],
    summary: 'Apply behavioral science to increase product engagement and retention.',
    lesson: [
      'Variable reward schedules are the most powerful habit-formation mechanic.',
      'The Hook Model: Trigger → Action → Variable Reward → Investment.',
      'Understanding dark patterns protects both you and your users from harm.',
    ],
  },

  {
    id: 'lockeet',
    label: 'Exp. Design',
    category: 'design',
    x: 35, y: 88, size: 22, xp: 110, premium: true,
    color: '#e7c477', accent: '#d98ec8', icon: 'ED',
    children: [],
    summary: 'Create immersive experiences that users remember, return to, and share.',
    lesson: [
      'Experiential design bridges physical and digital touchpoints seamlessly.',
      'Peak-end rule: people remember the most intense moment and the ending.',
      'Delight is the gap between expected and actual experience quality.',
    ],
  },

  {
    id: 'mindset-ethics',
    label: 'Mindset & Ethics',
    category: 'engineering',
    x: 50, y: 71, size: 26, xp: 45,
    color: '#a78bfa', accent: '#d98ec8', icon: 'ME',
    children: ['data-engineering'],
    summary: 'Build the ethical foundation and growth mindset for sustainable hacking.',
    lesson: [
      'Growth mindset treats every failure as a data point, not a verdict.',
      'Ethical hacking means written permission exists before testing any system.',
      'Privacy by design integrates data protection from day one, not as an add-on.',
    ],
  },

  {
    id: 'data-engineering',
    label: 'Data Eng.',
    category: 'engineering',
    x: 52, y: 79, size: 24, xp: 90, premium: true,
    color: '#22d3ee', accent: '#8ee7ff', icon: 'DE',
    children: ['research-discovery'],
    summary: 'Build the data infrastructure that powers every data-driven decision.',
    lesson: [
      'Data pipelines (ELT) move data from sources to analysis-ready destinations.',
      'Data warehouses like BigQuery enable analytical queries across billions of rows.',
      'Data quality beats data volume — garbage in, garbage out, always.',
    ],
  },

  {
    id: 'research-discovery',
    label: 'Research',
    category: 'engineering',
    x: 58, y: 84, size: 22, xp: 80, premium: true,
    color: '#fbd38d', accent: '#f6ad55', icon: 'RD',
    children: [],
    summary: 'Design research programs that uncover real user needs before building.',
    lesson: [
      'Discovery research validates problem-solution fit before any code is written.',
      'Jobs-to-be-done focuses on the progress users seek, not features they request.',
      'Triangulate: combine qualitative interviews with quantitative behavioral data.',
    ],
  },

  {
    id: 'system-architecture',
    label: 'Sys. Architecture',
    category: 'engineering',
    x: 64, y: 67, size: 26, xp: 95, premium: true,
    color: '#8ee7ff', accent: '#63b3ed', icon: 'SYS',
    children: ['database-mgmt'],
    summary: 'Design scalable, resilient architectures that handle 100× growth.',
    lesson: [
      'Microservices decouple components for independent scaling and deployment.',
      'CAP theorem: choose at most 2 of Consistency, Availability, Partition tolerance.',
      'Design for failure — every component will eventually fail, plan accordingly.',
    ],
  },

  {
    id: 'database-mgmt',
    label: 'Database Mgmt',
    category: 'engineering',
    x: 72, y: 75, size: 24, xp: 85, premium: true,
    color: '#68d391', accent: '#22d3ee', icon: 'DB',
    children: ['cloud-deploy'],
    summary: 'Design and optimize databases for high-performance, high-scale applications.',
    lesson: [
      'Normalization reduces redundancy; denormalization improves read throughput.',
      'Indexes dramatically accelerate queries but slow down writes — balance matters.',
      'Connection pooling is essential for database scalability under concurrent load.',
    ],
  },

  {
    id: 'cloud-deploy',
    label: 'Cloud Deploy',
    category: 'engineering',
    x: 79, y: 75, size: 24, xp: 100, maxOnly: true,
    color: '#fb923c', accent: '#f6ad55', icon: 'CLD',
    children: ['aiml-modeling'],
    summary: 'Deploy and auto-scale applications on cloud platforms for global reach.',
    lesson: [
      'Infrastructure as Code (Terraform, Pulumi) makes environments reproducible.',
      'Kubernetes orchestrates containers for auto-scaling and self-healing clusters.',
      'Cloud cost optimisation through right-sizing can cut bills by 40–60%.',
    ],
  },

  {
    id: 'aiml-modeling',
    label: 'AI/ML Growth',
    category: 'engineering',
    x: 82, y: 65, size: 26, xp: 115, maxOnly: true,
    color: '#a78bfa', accent: '#d98ec8', icon: 'AI',
    children: [],
    summary: 'Apply machine learning to automate and amplify every growth process.',
    lesson: [
      'Predictive models identify high-value customers before they convert.',
      'NLP powers content analysis, sentiment tracking, and automated copywriting.',
      'Multi-armed bandits replace static A/B tests with real-time traffic optimization.',
    ],
  },

];

// ─── LOOKUP HELPERS ───────────────────────────────────────────────────────────
export function getSkillNode(id: string): SkillTreeNode | undefined {
  return SKILL_TREE_NODES.find(n => n.id === id);
}

export function getSkillTopic(id: string): SkillTopic | undefined {
  return SKILL_TOPICS.find(t => t.id === id);
}

export function getParentIds(nodeId: string): string[] {
  const parents: string[] = [];
  for (const node of SKILL_TREE_NODES) {
    if (node.children.includes(nodeId)) parents.push(node.id);
  }
  return parents;
}

// ─── SKILL TOPICS (modal lessons + quizzes) ───────────────────────────────────
export const SKILL_TOPICS: SkillTopic[] = [

  {
    id: 'content-marketing-101',
    title: 'Content Marketing Fundamentals',
    category: 'marketing',
    icon: '📝',
    color: '#f0a85f',
    readXp: 30,
    quizXp: 50,
    summary: 'Build a content system that attracts and converts your ideal audience.',
    body: [
      'Content marketing is the practice of creating and distributing valuable content to attract a clearly defined audience. Unlike advertising, it earns attention rather than buying it — making it the most sustainable long-term growth channel for digital businesses.',
      'The content pyramid organises your efforts: cornerstone content (long-form pillar posts, research, guides) sits at the top. Below it are cluster articles that support the pillar. At the base are social posts, newsletters, and short-form pieces that drive traffic back up the pyramid.',
      'Distribution amplifies creation. A single well-researched article can become a LinkedIn carousel, a Twitter thread, a newsletter edition, a podcast episode, and a YouTube video. This "content repurposing engine" multiplies reach without multiplying effort.',
      'Measuring content performance goes beyond page views. Track time-on-page (engagement quality), scroll depth (consumption rate), email sign-ups (intent signals), and downstream conversion attribution. GA4 enables all of these with proper event tracking setup.',
      'The 10× content principle: only publish if your content is at least 10× better than the current top result. This means more depth, better design, more current data, more actionable examples, or a unique perspective that no one else can replicate.',
    ],
    quiz: [
      {
        question: 'Content marketing primarily differs from advertising in that it:',
        options: ['Is always free to produce', 'Earns audience attention rather than buying it', 'Only works for B2B companies', 'Requires a minimum 6-month timeline'],
        answer: 1,
      },
      {
        question: 'In the content pyramid, what sits at the very top?',
        options: ['Daily social media posts', 'Email newsletters', 'Long-form cornerstone content like comprehensive guides', 'Paid promoted posts'],
        answer: 2,
      },
      {
        question: 'Which metric best indicates content engagement quality?',
        options: ['Total page views', 'Number of social shares', 'Time-on-page and scroll depth', 'Domain authority score'],
        answer: 2,
      },
    ],
  },

  {
    id: 'seo-technical-mastery',
    title: 'SEO Technical Mastery',
    category: 'marketing',
    icon: '🔍',
    color: '#68d391',
    readXp: 35,
    quizXp: 55,
    summary: 'Master the technical foundation that makes search engines love your site.',
    body: [
      'Technical SEO is the foundation beneath all content and link-building efforts. Without it, even the best content struggles to rank. Core areas include crawlability, indexability, site speed, mobile optimisation, structured data, and Core Web Vitals.',
      'Crawlability means search engine bots can access and navigate your site efficiently. Robots.txt controls which pages bots can access. XML sitemaps help bots discover all important pages. Canonical tags prevent duplicate content from diluting ranking signals.',
      'Core Web Vitals — Largest Contentful Paint (LCP), Cumulative Layout Shift (CLS), and Interaction to Next Paint (INP) — are Google ranking signals that measure real user experience. LCP should be under 2.5 s, CLS under 0.1, and INP under 200 ms.',
      'Structured data (schema markup) helps search engines understand your content\'s context, enabling rich snippets like star ratings, FAQs, and breadcrumbs in search results. JSON-LD format is Google\'s recommended implementation method.',
      'Technical SEO audit tools: Google Search Console (free, authoritative source of truth), Screaming Frog (comprehensive crawl analysis), Ahrefs and SEMrush (backlink and keyword data), and PageSpeed Insights (Core Web Vitals measurement).',
    ],
    quiz: [
      {
        question: 'What is the purpose of a robots.txt file?',
        options: ['To create a sitemap for search engines', 'To control which pages search bots can crawl', 'To implement structured data markup', 'To measure Core Web Vitals scores'],
        answer: 1,
      },
      {
        question: 'Which Core Web Vital measures visual stability during page load?',
        options: ['Largest Contentful Paint (LCP)', 'Interaction to Next Paint (INP)', 'Cumulative Layout Shift (CLS)', 'Time to First Byte (TTFB)'],
        answer: 2,
      },
      {
        question: "Google's recommended format for implementing structured data is:",
        options: ['Microdata in HTML tags', 'RDFa attributes', 'JSON-LD in script tags', 'Meta tags in the head section'],
        answer: 2,
      },
    ],
  },

  {
    id: 'growth-hacking-experiments',
    title: 'Growth Hacking Experiments',
    category: 'marketing',
    icon: '⚗️',
    color: '#f6ad55',
    readXp: 30,
    quizXp: 50,
    summary: 'Design rapid experiments that find scalable growth channels fast.',
    body: [
      'Growth hacking is a methodology for rapid experimentation across marketing, product, and engineering to find the most effective ways to grow. It treats every assumption as a hypothesis to be tested, replacing intuition with data.',
      'The AARRR pirate metrics framework breaks growth into five stages: Acquisition (how users find you), Activation (first value experience), Retention (users returning), Revenue (monetisation), and Referral (users inviting others). Each has specific optimisation levers.',
      'Experiment design follows the scientific method: form a hypothesis with a predicted direction and magnitude, define success criteria before running, use sufficient sample size, then analyse results and document learnings regardless of outcome.',
      'The ICE prioritisation framework (Impact × Confidence × Ease) scores experiments 1–10 on each dimension. Highest-scoring experiments run first. This maximises learning velocity and avoids the HIPPO problem (Highest Paid Person\'s Opinion).',
      'Common experiment pitfalls: ending tests before statistical significance, running too many simultaneous tests that contaminate results, ignoring seasonal effects, and — most costly — failing to document and share learnings across the team.',
    ],
    quiz: [
      {
        question: "In AARRR, 'Activation' means:",
        options: ["The user's first purchase", 'When users first register an account', "The user's first meaningful value experience", 'When users refer others to the product'],
        answer: 2,
      },
      {
        question: "In ICE scoring, 'C' stands for:",
        options: ['Cost', 'Confidence', 'Conversion', 'Channel'],
        answer: 1,
      },
      {
        question: 'The main risk of ending an A/B test too early is:',
        options: ['Increased experiment cost', 'Declaring a winner before reaching statistical significance', 'Over-optimising for mobile users', 'Creating too many variants'],
        answer: 1,
      },
    ],
  },

  {
    id: 'cro-fundamentals',
    title: 'Conversion Rate Optimisation',
    category: 'marketing',
    icon: '📈',
    color: '#a78bfa',
    readXp: 30,
    quizXp: 55,
    summary: 'Systematically improve conversion rates through data and disciplined testing.',
    body: [
      'Conversion Rate Optimisation (CRO) is the systematic process of increasing the percentage of visitors who take a desired action. A 1% improvement in conversion rate can double revenue at scale — making it one of the highest-ROI activities in any digital business.',
      'Start with research, not tests. Quantitative data (funnels, heatmaps, scroll maps) reveals WHERE users drop off. Qualitative research (user interviews, session recordings, on-site surveys) reveals WHY they drop off. Skip the research phase and you\'ll test the wrong things.',
      'Heatmaps show clicks, scrolls, and mouse movement patterns. Rage clicks indicate frustration with non-functional elements. Dead clicks reveal broken UI. Tools like Hotjar and Microsoft Clarity (free) capture this automatically on any site.',
      'The anatomy of a high-converting page: a headline focused on the visitor\'s primary goal, social proof (reviews, numbers, logos), a benefit-led value proposition, low-friction CTA, and trust signals (guarantees, security badges, money-back policies).',
      'Statistical rigour matters: tests need at minimum 100 conversions per variant and ideally 95% confidence before declaring a winner. Optimizely, VWO, and Google Optimize handle the statistics automatically. Never call a test early because a variant is "obviously" winning.',
    ],
    quiz: [
      {
        question: "Heatmap 'rage clicks' indicate:",
        options: ['High engagement with CTAs', 'User frustration with a non-functional element', 'Successful micro-conversions', 'A/B variant performance data'],
        answer: 1,
      },
      {
        question: 'Minimum conversions per variant recommended before analysing an A/B test:',
        options: ['10', '50', '100', '1000'],
        answer: 2,
      },
      {
        question: 'CRO research should always begin with:',
        options: ['Immediately launching A/B tests', 'Quantitative and qualitative analysis to find drop-off causes', 'A complete website redesign', 'Changing CTA button colours'],
        answer: 1,
      },
    ],
  },

  {
    id: 'social-media-algorithm-hacking',
    title: 'Social Media Algorithm Hacking',
    category: 'marketing',
    icon: '📱',
    color: '#f472b6',
    readXp: 25,
    quizXp: 45,
    summary: 'Reverse-engineer platform algorithms to maximise organic reach for free.',
    body: [
      'Social media algorithms decide which content reaches which people. Every platform rewards content generating meaningful engagement (saves, shares, comments) far more than passive engagement (likes, views). Understanding this distinction changes your entire content strategy.',
      "TikTok's For You algorithm is interest-graph based — it doesn't require followers to reach new audiences. Watch completion rate and shares are the primary signals. The first 2 seconds determine distribution. Optimising the hook is the single highest-leverage improvement.",
      'LinkedIn rewards professional conversations. Long-form text posts with spaced paragraphs and no external links perform best. First-hour engagement dramatically boosts organic reach. Engaging with others\' posts immediately before publishing primes the algorithm.',
      'Instagram has shifted its weight toward Reels for discovery. Shares beat likes as the primary quality signal. Carousels produce the highest average engagement rate of any Instagram format because each swipe registers as an additional engagement event.',
      'The content flywheel: create a signature format or series that audiences recognise and expect. Consistency in format, topic, and posting cadence trains both the algorithm and your audience to anticipate and engage with your content reliably.',
    ],
    quiz: [
      {
        question: "TikTok's For You algorithm is primarily based on:",
        options: ['Number of followers', 'Account verification status', 'Interest graph and watch completion rate', 'Posting frequency alone'],
        answer: 2,
      },
      {
        question: 'Which engagement type is most valued by social media algorithms?',
        options: ['Likes', 'Profile visits', 'Views', 'Saves and shares'],
        answer: 3,
      },
      {
        question: 'On Instagram, which format has the highest average engagement rate?',
        options: ['Static images', 'Stories', 'Carousels', 'Text-only captions'],
        answer: 2,
      },
    ],
  },

  {
    id: 'ethical-penetration-testing',
    title: 'Ethical Penetration Testing',
    category: 'engineering',
    icon: '🔐',
    color: '#fc8181',
    readXp: 35,
    quizXp: 60,
    summary: 'Think like an attacker to build defences that actually hold.',
    body: [
      'Penetration testing (pen testing) is the authorised simulation of a cyberattack to evaluate system security. Unlike malicious hacking, pen testing requires explicit written permission from the system owner and follows a precisely defined scope of work.',
      'The five phases: Reconnaissance (target information gathering), Scanning (identifying open ports and services), Gaining Access (exploiting vulnerabilities), Maintaining Access (simulating persistent threats), Reporting (documenting findings with remediation steps and severity ratings).',
      'OWASP Top 10 is the definitive list of critical web application security risks. Current leaders include Broken Access Control, Cryptographic Failures, SQL/XSS Injection, Insecure Design, and Security Misconfiguration. Every developer should know this list by heart.',
      'Core pen testing tools: Nmap (network scanning), Metasploit (exploitation framework), Burp Suite (web application proxy), Wireshark (network analysis), and Kali Linux (security OS bundling 600+ tools). Use any of these only on systems you are authorised to test.',
      'Bug bounty programmes pay researchers to find and responsibly disclose vulnerabilities. HackerOne, Bugcrowd, and Intigriti connect researchers with companies. Starting with programmes that have beginner-friendly scope and clear rules of engagement is the recommended entry path.',
    ],
    quiz: [
      {
        question: 'The first requirement before starting any penetration test is:',
        options: ['Installing Kali Linux', 'Obtaining written authorisation from the system owner', 'Running an initial Nmap scan', 'Setting up a VPN connection'],
        answer: 1,
      },
      {
        question: 'According to OWASP Top 10, the #1 web application security risk is:',
        options: ['SQL Injection', 'Cross-Site Scripting (XSS)', 'Broken Access Control', 'Security Misconfiguration'],
        answer: 2,
      },
      {
        question: "The 'Reconnaissance' phase of pen testing involves:",
        options: ['Exploiting identified vulnerabilities', 'Writing the final security report', 'Gathering information about the target', 'Scanning for open ports'],
        answer: 2,
      },
    ],
  },

  {
    id: 'cicd-best-practices',
    title: 'CI/CD Best Practices',
    category: 'engineering',
    icon: '⚙️',
    color: '#63b3ed',
    readXp: 30,
    quizXp: 50,
    summary: 'Automate your path from code commit to live production with confidence.',
    body: [
      'Continuous Integration (CI) automatically builds and tests code on every commit. Continuous Delivery/Deployment (CD) automatically releases those builds to production. Together they enable teams to ship smaller, safer changes at higher frequency.',
      'A well-designed pipeline catches bugs early and cheaply: unit tests first (fast, granular), then integration tests (broader coverage), then end-to-end tests (full-system validation). The fast-fail principle: surface problems as early as possible to minimise cost of correction.',
      'The twelve-factor app methodology provides principles for CI/CD-friendly applications: declarative setup, environment configs in environment variables, stateless processes, and disposable containers that start and stop cleanly on demand.',
      'Deployment strategies manage production risk: Blue/green deployment maintains two identical environments — blue runs live, green receives the new version. Canary releases send only a small traffic percentage to the new version first. Feature flags decouple code deployment from feature activation.',
      'The four DORA metrics measure DevOps performance: deployment frequency (how often you ship), lead time for changes (commit-to-production duration), change failure rate (% of deployments causing incidents), and mean time to recovery (how fast service is restored after failure).',
    ],
    quiz: [
      {
        question: "The 'fast fail' principle in CI/CD means:",
        options: ['Deploy as quickly as possible to production', 'Surface problems as early and cheaply as possible', 'Skip slow end-to-end tests', 'Reduce the number of automated tests'],
        answer: 1,
      },
      {
        question: 'A canary release sends:',
        options: ['All traffic to the new version immediately', 'Only internal team traffic to the new version', 'A small percentage of traffic to the new version first', 'Traffic only to mobile users'],
        answer: 2,
      },
      {
        question: 'Which DORA metric measures speed of recovery from a production incident?',
        options: ['Deployment frequency', 'Lead time for changes', 'Change failure rate', 'Mean time to recovery'],
        answer: 3,
      },
    ],
  },

  {
    id: 'data-pipeline-fundamentals',
    title: 'Data Pipeline Fundamentals',
    category: 'engineering',
    icon: '🔧',
    color: '#22d3ee',
    readXp: 35,
    quizXp: 60,
    summary: 'Build reliable data pipelines that power confident, data-driven decisions.',
    body: [
      'A data pipeline is a series of processing steps that move data from source systems to analytical destinations. Modern stacks follow the ELT pattern (Extract, Load, Transform) rather than older ETL, leveraging cheap cloud compute to transform data after loading.',
      'Common data sources: transactional databases (Postgres, MySQL), event tracking (Segment, Mixpanel), third-party APIs (Salesforce, Stripe, Google Ads), and file uploads. Each source has different update frequencies, schemas, and reliability characteristics.',
      'Cloud data warehouses like BigQuery, Snowflake, and Redshift use columnar storage optimised for analytical aggregations across billions of rows. They are not designed for high-throughput transactional writes — keep OLTP (operations) and OLAP (analytics) separate.',
      'dbt (data build tool) has become the standard transformation layer. It lets data teams write SQL transformations with software engineering practices: version control, automated testing, documentation, and modular reusable components. The analytics engineer role owns this layer.',
      'Data quality is often the biggest long-term challenge. Automated tests checking for nulls, duplicates, schema drift, and value-range anomalies should run on every pipeline execution. A freshness monitoring dashboard catches data staleness before it drives bad decisions.',
    ],
    quiz: [
      {
        question: 'What does ELT stand for in modern data engineering?',
        options: ['Export, Link, Transfer', 'Extract, Load, Transform', 'Evaluate, Log, Track', 'Encode, Layer, Test'],
        answer: 1,
      },
      {
        question: 'Data warehouses like BigQuery are optimised for:',
        options: ['High-throughput individual row lookups', 'Real-time transactional processing', 'Analytical aggregations across large datasets', 'Storing unstructured media files'],
        answer: 2,
      },
      {
        question: 'dbt is primarily used for:',
        options: ['Extracting data from source systems', 'Loading data into warehouses', 'SQL-based transformation with engineering best practices', 'Visualising data in dashboards'],
        answer: 2,
      },
    ],
  },

  {
    id: 'user-psychology-growth',
    title: 'User Psychology for Growth',
    category: 'psychology',
    icon: '🧠',
    color: '#d98ec8',
    readXp: 30,
    quizXp: 50,
    summary: "Apply behavioral science to build products users love and can't stop using.",
    body: [
      'Behavioral psychology reveals the real drivers of user decisions. Loss aversion is twice as powerful as equivalent gain — users work harder to avoid losing something than to gain something of equal value. Designing around what users already have is more compelling than promising future rewards.',
      "Nir Eyal's Hook Model describes habit-forming products: External trigger (notification, ad) → Internal trigger (emotion, thought) → Action (simplest behavior in anticipation of reward) → Variable reward (unpredictable positive outcome) → Investment (effort that makes the product more valuable over time).",
      'Cognitive load theory explains why simple onboarding outperforms comprehensive onboarding. Working memory holds roughly 7±2 information chunks at once. Every additional choice, field, or step in your product consumes cognitive resources and increases abandonment probability.',
      "Social proof is one of Cialdini's six core influence principles: expert endorsements, celebrity usage, user reviews/testimonials, wisdom of crowds ('10,000 customers trust us'), and wisdom of friends (showing what people in your network are doing). Each type works differently by context.",
      'Dark patterns are intentional deceptive UI designs: hidden subscriptions, roach motel (easy in, impossible out), misdirection, confirmshaming, and privacy zuckering. Understanding dark patterns is essential both to avoid implementing them and to recognise when you\'re being manipulated by them.',
    ],
    quiz: [
      {
        question: 'Loss aversion in behavioural psychology means:',
        options: ['Users prefer simpler products', 'Losses feel roughly twice as powerful as equivalent gains', 'Users avoid all decisions under uncertainty', 'FOMO drives all purchase decisions'],
        answer: 1,
      },
      {
        question: "In the Hook Model, 'Variable Reward' refers to:",
        options: ['A fixed bonus for returning users', 'The unpredictable positive outcome that reinforces behaviour', 'Personalised push notifications', 'The investment that makes the product more valuable'],
        answer: 1,
      },
      {
        question: 'Which social proof type shows what your network connections are doing?',
        options: ['Expert social proof', 'Celebrity social proof', 'Wisdom of crowds', 'Wisdom of friends'],
        answer: 3,
      },
    ],
  },

  {
    id: 'aiml-for-growth',
    title: 'AI/ML for Growth Hackers',
    category: 'engineering',
    icon: '🤖',
    color: '#a78bfa',
    readXp: 40,
    quizXp: 65,
    summary: 'Leverage AI and ML to automate and amplify every growth channel you use.',
    body: [
      'AI and ML are transforming growth by enabling personalisation at scale, predictive analytics, and automation of repetitive optimisation tasks. The growth practitioner who understands how these models work gains a structural advantage over those who only know which buttons to click.',
      'Predictive lead scoring uses ML to rank leads by conversion probability. Train a classifier on historical CRM data using features like engagement signals (email opens, page visits), firmographic data, and recency/frequency/monetary patterns. Gradient boosting models routinely achieve 80–90% AUC on this task.',
      'Large Language Models (LLMs) like Claude, GPT-4, and Gemini enable content generation at scale, customer support automation, SEO keyword research, and personalised outreach. Prompt engineering — communicating precisely with LLMs — is the highest-leverage skill for knowledge workers in 2025.',
      'Multi-armed bandit algorithms optimise A/B tests dynamically: instead of a fixed 50/50 split waiting for significance, bandits continuously shift traffic toward better-performing variants. Thompson Sampling and Upper Confidence Bound (UCB) are the two most widely deployed approaches.',
      'Practical principle: start with existing ML-powered platforms (Google Smart Bidding, Meta Advantage+, HubSpot AI) before building custom models. Pre-built AI tools capture 80% of the value at 20% of the cost. Build custom only when you have proprietary data and a clear, measurable ROI case.',
    ],
    quiz: [
      {
        question: 'Multi-armed bandit algorithms in A/B testing:',
        options: ['Run all variants simultaneously with equal traffic until significance', 'Dynamically shift traffic toward better-performing variants in real time', 'Require larger sample sizes than traditional A/B tests', 'Work only with binary conversion outcomes'],
        answer: 1,
      },
      {
        question: 'For predictive lead scoring, which ML model type typically performs best?',
        options: ['Linear regression', 'K-means clustering', 'Gradient boosting classifiers', 'Principal component analysis'],
        answer: 2,
      },
      {
        question: 'When should growth practitioners build custom ML models vs use pre-built AI platforms?',
        options: ['Always — custom models always outperform pre-built', 'Never — pre-built is always sufficient', 'When they have unique proprietary data and a clear ROI case', 'Only when they have 10+ data scientists on staff'],
        answer: 2,
      },
    ],
  },

];
