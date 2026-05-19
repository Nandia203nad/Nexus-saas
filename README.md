# NEXUS — Everything Connects

> Content SaaS Platform · Next.js 14 · TypeScript · Prisma 5 · Supabase PostgreSQL · Stripe · Anthropic Claude

Монгол хэл дээрх блогийн платформ. Хэрэглэгчид блог бичиж XP цуглуулах, Skill Tree нээх, AI Agent ашиглах, дагагчтайгаа харилцах боломжтой.

---

## Хурдан эхлүүлэх

```bash
git clone <repo-url> && cd nexus-saas
npm install
cp .env .env.local          # .env.local-д утгуудаа нэм
npx prisma db push
npm run db:seed             # Test user нэмэх
npm run dev                 # → http://localhost:3000
```

---

## Tech Stack

| Давхарга | Технологи |
|----------|-----------|
| Framework | Next.js 14 (App Router, Turbopack) |
| Language | TypeScript 5 |
| Database | Supabase PostgreSQL (connection pooling via PgBouncer) |
| ORM | Prisma 5 |
| Auth | JWT (jsonwebtoken) + Google OAuth |
| AI | Anthropic Claude SDK (`claude-sonnet-4-6`) + HuggingFace DeepSeek-R1 |
| Payments | Stripe Checkout (test mode) |
| Validation | Zod |
| Styling | Inline styles + Tailwind CSS |
| Deploy | Vercel (санал болгосон) |

---

## Онцлог функцүүд

### Хэрэглэгч
- Email/нууц үгтэй бүртгэл болон нэвтрэлт
- Google OAuth (callback flow)
- JWT token (localStorage + httpOnly cookie)
- Follow / Unfollow систем
- Personalized feed (дагасан хүмүүсийн нийтлэл)
- Profile хуудас + Portfolio файлуудын хадгалалт

### Блог
- CRUD (бичих, засах, устгах, нийтлэх)
- Like, Bookmark, Comment
- Plan-д суурилсан хандалт (FREE / PREMIUM / MAX)
- SEO score, read time, category шошго
- Cover image (Supabase URL эсвэл Unsplash)

### Skill Tree
- 26 node — Marketing болон Engineering гэсэн 2 мөчир
- 6 категори: Core · Marketing · Engineering · Design · Psychology · Business
- XP-д суурилсан нээлт (prerequisite дараалал)
- 10 дэлгэрэнгүй хичээл + quiz (70% хариулна XP авна)
- Premium / MAX-д зориулсан онцгой node-ууд

### AI Agent
| Action | Тайлбар |
|--------|---------|
| `chat` | Ерөнхий асуулт-хариулт (Claude) |
| `analyze_image` | Зураг шинжлэлт (base64) |
| `analyze_video` | Видео/thumbnail шинжлэлт |
| `generate_draft` | Блог ноорог үүсгэх |
| `recommend` | Level-д суурилсан сэдэв санал |
| `analyze` | Текстийн SEO + sentiment шинжлэлт |
| `deepseek` | DeepSeek-R1 via HuggingFace |

### Dashboard
- XP, level, streak статистик
- Блогийн views, likes, comments chart
- Achievement дэвшил
- Skill tree нийт явц

### Багц / Үнэ

| Plan | Үнэ | AI Credit | Онцлог |
|------|-----|-----------|--------|
| FREE | $0 | 5/сар | Үндсэн блог, Skill Tree |
| PREMIUM | $3/сар | 50/сар | Premium нийтлэл, бүх skill нээлт |
| MAX | $7/сар | 200/сар | Дээрх бүгд + MAX skill node |

---

## Folder бүтэц

```
nexus-saas/
├── app/
│   ├── page.tsx                      # Landing (зөвхөн зочин)
│   ├── home/page.tsx                 # Blog feed (нэвтэрсэн)
│   ├── blogs/
│   │   ├── page.tsx                  # Бүх нийтлэл
│   │   └── [id]/page.tsx             # Нийтлэл дэлгэрэнгүй
│   ├── skill-tree/page.tsx           # Skill Tree (26 node, SVG)
│   ├── dashboard/page.tsx            # Аналитик + Chart.js
│   ├── profile/page.tsx              # Профайл + Portfolio
│   ├── ai/page.tsx                   # AI Agent terminal
│   ├── feed/page.tsx                 # Персонал feed
│   ├── videos/page.tsx               # YouTube видео
│   ├── auth/
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   ├── forgot-password/page.tsx
│   │   └── oauth-success/page.tsx
│   └── api/
│       ├── auth/
│       │   ├── login/route.ts
│       │   ├── register/route.ts
│       │   ├── logout/route.ts
│       │   ├── me/route.ts
│       │   ├── session/route.ts
│       │   └── google/{start,callback,config}/route.ts
│       ├── blogs/route.ts
│       ├── blogs/[id]/{route,like,bookmark}.ts
│       ├── comments/route.ts
│       ├── comments/[id]/route.ts
│       ├── ai/route.ts               # NexusAI + DeepSeek
│       ├── skill-tree/route.ts
│       ├── skill-tree/topics/route.ts
│       ├── dashboard/route.ts
│       ├── feed/route.ts
│       ├── follow/route.ts
│       ├── suggestions/route.ts
│       ├── badges/route.ts
│       ├── portfolio/route.ts
│       ├── subscription/route.ts
│       ├── admin/route.ts
│       ├── videos/route.ts
│       ├── reports/blog-analysis/route.ts
│       └── stripe/{checkout,success,webhook}/route.ts
├── components/
│   ├── Navbar.tsx
│   ├── BlogCard.tsx
│   └── FollowSuggestions.tsx
├── lib/
│   ├── auth.ts                       # JWT signToken / verifyToken
│   ├── db.ts                         # Prisma singleton
│   ├── hf.ts                         # HuggingFace DeepSeek-R1
│   ├── skill-tree-data.ts            # 26 node + 10 topic + quiz
│   ├── video-data.ts
│   ├── errors/index.ts               # AppError + handleError
│   ├── schemas/index.ts              # Zod schemas
│   └── services/
│       ├── auth.service.ts
│       ├── blog.service.ts
│       ├── comment.service.ts
│       └── subscription.service.ts
├── prisma/
│   ├── schema.prisma
│   └── seed.ts                       # 10 test user + blogs
├── middleware.ts                     # Edge security + rate limiting
└── public/
    ├── nexus-logo.jpg
    ├── hero-bg.jpg
    └── logins.jpg
```

---

## Demo Дансууд

`npm run db:seed` ажиллуулсны дараа:

| Имэйл | Нууц үг | Plan | Үүрэг |
|-------|---------|------|-------|
| admin@nexus.mn | admin123! | MAX | ADMIN (12000 XP) |
| batbold@nexus.mn | premium123 | PREMIUM | USER (5420 XP) |
| sarnai@nexus.mn | premium123 | PREMIUM | USER (6100 XP) |
| munkhbayar@nexus.mn | premium123 | PREMIUM | USER (5800 XP) |
| enkhtuyaa@nexus.mn | premium123 | PREMIUM | USER (5150 XP) |
| bold@nexus.mn | premium123 | PREMIUM | USER (7200 XP) |
| odgerel@nexus.mn | user123 | FREE | USER |
| ariunaa@nexus.mn | user123 | FREE | USER |
| gan@nexus.mn | user123 | PREMIUM | USER |
| dorj@nexus.mn | user123 | FREE | USER |

---

## Environment Variables

`.env` файлд тохируулах (`.env.local` нь override хийнэ):

```env
# Supabase PostgreSQL
DATABASE_URL="postgresql://postgres.xxx:password@aws-0-region.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.xxx:password@aws-0-region.pooler.supabase.com:5432/postgres"

# JWT
JWT_SECRET="<64 тэмдэгтийн random string>"

# Google OAuth
NEXT_PUBLIC_GOOGLE_CLIENT_ID="xxx.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-xxx"
GOOGLE_REDIRECT_URI="http://localhost:3000/api/auth/google/callback"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="<random string>"

# Anthropic Claude
ANTHROPIC_API_KEY="sk-ant-api03-xxx"

# HuggingFace (DeepSeek-R1)
HF_TOKEN="hf_xxx"

# Stripe
STRIPE_SECRET_KEY="sk_test_xxx"
STRIPE_PUBLISHABLE_KEY="pk_test_xxx"
STRIPE_WEBHOOK_SECRET="whsec_xxx"
STRIPE_PREMIUM_PRICE_ID="price_xxx"
STRIPE_MAX_PRICE_ID="price_xxx"
```

---

## Database Scripts

```bash
npx prisma db push          # Schema-г DB-д push хийх
npm run db:seed             # Test data + user нэмэх
npm run db:studio           # Prisma Studio GUI
npm run db:reset            # DB цэвэрлэж seed дахин хийх
npx prisma migrate deploy   # Production migration
```

---

## Supabase тохируулах

1. [supabase.com](https://supabase.com) → New Project үүсгэх
2. **Settings → Database → Connection String** руу орох
3. `Session mode` (port 5432) → `DIRECT_URL`
4. `Transaction mode` (port 6543) → `DATABASE_URL` (`?pgbouncer=true` нэмэх)
5. Schema deploy: `npx prisma db push`

---

## Stripe тохируулах

```bash
# Test mode-д price үүсгэх
stripe prices create \
  --unit-amount=300 \
  --currency=usd \
  --recurring[interval]=month \
  --product-data[name]="Nexus Premium"

stripe prices create \
  --unit-amount=700 \
  --currency=usd \
  --recurring[interval]=month \
  --product-data[name]="Nexus Max"
```

Checkout flow:
```
User → /api/stripe/checkout → Stripe Hosted Page → Payment
                                        ↓ success
                              /api/stripe/success → DB plan update
                                        ↓
                                  /home redirect
```

---

## XP Систем

| Үйлдэл | XP |
|--------|----|
| Блог нийтлэх | +50 |
| Блог унших (80%+) | +readTime × 4 |
| Сэтгэгдэл бичих | +10 |
| Like өгөх | +5 |
| Skill topic унших | +25–40 |
| Skill topic quiz (70%+) | +45–65 |
| Skill node нээх | +25–115 |
| Quest дуусгах | +20–1000 |

`level = Math.floor(xp / 200) + 1`

---

## Skill Tree бүтэц

```
                    [SEO Strategy]
                         ↑
[Perf. Marketing] ← [Branding] ← [Psychology] ← [STARTER] → [Security Audit]
                         ↓                                          ↓         ↓        ↓
                   [A/B Testing]                            [Pen Testing] [Mindset] [Sys. Arch.]
                         ↓                                       ↓              ↓         ↓
                       [CRO]                                  [CI/CD]      [Data Eng.] [DB Mgmt]
                      ↙      ↘                                  ↓               ↓         ↓
             [Behavioral]  [Content]                          [Agile]      [Research]  [Cloud Deploy]
                  ↓         Engine                                                          ↓
           [Social Media]                                                             [AI/ML Growth]
                  ↓
            [Viral Loop]
                  ↓
           [Narrative Viz]
```

**26 node · 6 категори · Premium/MAX lock системтэй**

---

## Security (middleware.ts)

Edge Middleware бүх API хүсэлтийг шүүдэг:

| Хамгаалалт | Тайлбар |
|-----------|---------|
| Rate limiting | Login: 5/мин, Register: 3/мин, AI: 20/мин, Other: 120/мин |
| Attack patterns | SQL injection, XSS, path traversal блок |
| Scanner block | sqlmap, nikto, masscan UA шүүлт |
| Body size limit | 5MB дээд хэмжээ |
| Auth guard | Protected route → /auth/login redirect |
| Security headers | X-Frame-Options, CSP, HSTS болон 7+ header |

---

## Production Deploy (Vercel)

```bash
npm install -g vercel
vercel login
vercel --prod
```

Vercel dashboard → Environment Variables руу `.env` утгуудыг нэм:

```env
DATABASE_URL=postgresql://...?pgbouncer=true
DIRECT_URL=postgresql://...
JWT_SECRET=<production-secret>
NEXTAUTH_URL=https://your-domain.vercel.app
GOOGLE_REDIRECT_URI=https://your-domain.vercel.app/api/auth/google/callback
ANTHROPIC_API_KEY=sk-ant-...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

> **Анхааруулга:** `.env` файлд жинхэнэ API key байгаа тул Git-д commit хийж болохгүй. `.gitignore` хамгаалж байна.

---

## AI Agent жишээ

```typescript
// Claude-р блог ноорог үүсгэх
const res = await fetch('/api/ai', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'generate_draft',
    payload: { topic: 'TikTok маркетингийн шинэ стратеги' }
  })
});
const { result } = await res.json();
// result: { title, excerpt, outline[], content }

// DeepSeek-R1 via HuggingFace
const res2 = await fetch('/api/ai', {
  method: 'POST',
  body: JSON.stringify({
    action: 'deepseek',
    payload: { messages: [{ role: 'user', content: 'Зарлагын тайлбар' }] }
  })
});
```

---

*Nexus v5.0.0 · Next.js 14 · Суурь тохиргоог `prisma/seed.ts` болон `.env`-д тохируулна*
