import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Nexus database...');

  // Skills
  const skills = await Promise.all([
    prisma.skill.upsert({ where: { slug: 'writing' }, create: { name: 'Бичгийн урлаг', slug: 'writing', icon: '✍️', category: 'Content', xpRequired: 100 }, update: {} }),
    prisma.skill.upsert({ where: { slug: 'marketing' }, create: { name: 'Маркетинг', slug: 'marketing', icon: '📢', category: 'Growth', xpRequired: 200 }, update: {} }),
    prisma.skill.upsert({ where: { slug: 'seo' }, create: { name: 'SEO', slug: 'seo', icon: '🔍', category: 'Tech', xpRequired: 300 }, update: {} }),
    prisma.skill.upsert({ where: { slug: 'ai-tools' }, create: { name: 'AI Ашиглалт', slug: 'ai-tools', icon: '🤖', category: 'AI', xpRequired: 400 }, update: {} }),
    prisma.skill.upsert({ where: { slug: 'design' }, create: { name: 'Дизайн', slug: 'design', icon: '🎨', category: 'Creative', xpRequired: 250 }, update: {} }),
    prisma.skill.upsert({ where: { slug: 'analytics' }, create: { name: 'Аналитик', slug: 'analytics', icon: '📊', category: 'Data', xpRequired: 350 }, update: {} }),
    prisma.skill.upsert({ where: { slug: 'brand' }, create: { name: 'Брэнд', slug: 'brand', icon: '⭐', category: 'Brand', xpRequired: 500 }, update: {} }),
  ]);

  // Achievements
  await Promise.all([
    prisma.achievement.upsert({ where: { id: 'ach-first-blog' }, create: { id: 'ach-first-blog', name: 'Эхний блог', description: 'Анхны блогоо нийтэлсэн', icon: '📝', xpReward: 100, condition: 'blogs_count >= 1' }, update: {} }),
    prisma.achievement.upsert({ where: { id: 'ach-level-5' }, create: { id: 'ach-level-5', name: 'Level 5', description: 'Level 5-д хүрсэн', icon: '⚡', xpReward: 200, condition: 'level >= 5' }, update: {} }),
    prisma.achievement.upsert({ where: { id: 'ach-streak-7' }, create: { id: 'ach-streak-7', name: '7-day Streak', description: '7 дараалсан өдөр идэвхтэй', icon: '🔥', xpReward: 150, condition: 'streak >= 7' }, update: {} }),
    prisma.achievement.upsert({ where: { id: 'ach-premium' }, create: { id: 'ach-premium', name: 'Premium Architect', description: 'Premium гишүүнчлэл авсан', icon: '💎', xpReward: 500, condition: 'plan = PREMIUM' }, update: {} }),
    prisma.achievement.upsert({ where: { id: 'ach-5000xp' }, create: { id: 'ach-5000xp', name: 'XP Master', description: '5000 XP цуглуулсан', icon: '🏆', xpReward: 1000, condition: 'xp >= 5000' }, update: {} }),
  ]);

  // Tags
  const tagData = [
    { name: 'TikTok', slug: 'tiktok', color: '#00f0ff' },
    { name: 'AI', slug: 'ai', color: '#b400ff' },
    { name: 'SEO', slug: 'seo', color: '#00ff88' },
    { name: 'Маркетинг', slug: 'marketing', color: '#ff00aa' },
    { name: 'Freelance', slug: 'freelance', color: '#ff6b00' },
    { name: 'Web3', slug: 'web3', color: '#00f0ff' },
    { name: 'Брэнд', slug: 'brand', color: '#b400ff' },
    { name: 'Tech', slug: 'tech', color: '#00ff88' },
    { name: 'Номын нийтлэл', slug: 'book', color: '#ffd600' },
    { name: 'YouTube', slug: 'youtube', color: '#ff0000' },
  ];
  const tags: Record<string, { id: string }> = {};
  for (const t of tagData) {
    tags[t.slug] = await prisma.tag.upsert({ where: { slug: t.slug }, create: t, update: {} });
  }

  // 9 active users — 5 with 5000XP Premium, 4 regular
  const adminPwd = await bcrypt.hash('admin123!', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@nexus.mn' },
    create: { email: 'admin@nexus.mn', password: adminPwd, name: 'Nexus Admin', role: 'ADMIN', plan: 'MAX', xp: 12000, level: 60, streak: 45, bio: 'Nexus платформын гол архитект' },
    update: {},
  });

  // 5 Premium users with 5000+ XP who write book posts
  const premiumUsers = [
    { name: 'Батболд Дорж', email: 'batbold@nexus.mn', xp: 5420, level: 27, streak: 21, bio: 'TikTok маркетерт зориулсан номын нийтлэгч', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&auto=format' },
    { name: 'Сарнай Ганзориг', email: 'sarnai@nexus.mn', xp: 6100, level: 30, streak: 35, bio: 'AI хэрэгслүүдийн нийтлэгч, технологийн зохиолч', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&auto=format' },
    { name: 'Мөнхбаяр Цэнд', email: 'munkhbayar@nexus.mn', xp: 5800, level: 29, streak: 28, bio: 'SEO, digital marketing мэргэжилтэн', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&auto=format' },
    { name: 'Энхтуяа Балдан', email: 'enkhtuyaa@nexus.mn', xp: 5150, level: 25, streak: 18, bio: 'Freelance, personal brand coach', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&auto=format' },
    { name: 'Болдбаатар Хасбаяр', email: 'bold@nexus.mn', xp: 7200, level: 36, streak: 42, bio: 'Web3, blockchain контент бүтээгч', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&auto=format' },
  ];

  const premUserRecs: { id: string; name: string; email: string }[] = [];
  for (const u of premiumUsers) {
    const pwd = await bcrypt.hash('premium123', 12);
    const user = await prisma.user.upsert({
      where: { email: u.email },
      create: { ...u, password: pwd, plan: 'PREMIUM', role: 'USER' },
      update: { xp: u.xp, level: u.level, plan: 'PREMIUM' },
    });
    premUserRecs.push({ id: user.id, name: user.name, email: user.email });
  }

  // 4 regular active users
  const regularUsers = [
    { name: 'Одгэрэл Цогт', email: 'odgerel@nexus.mn', xp: 1240, level: 8, streak: 7, plan: 'FREE' as const },
    { name: 'Ариунаа Төмөр', email: 'ariunaa@nexus.mn', xp: 890, level: 6, streak: 5, plan: 'FREE' as const },
    { name: 'Ганбаатар Наран', email: 'gan@nexus.mn', xp: 2100, level: 12, streak: 14, plan: 'PREMIUM' as const },
    { name: 'Дорж Мөнх', email: 'dorj@nexus.mn', xp: 680, level: 5, streak: 3, plan: 'FREE' as const },
  ];
  const regUserRecs: { id: string }[] = [];
  for (const u of regularUsers) {
    const pwd = await bcrypt.hash('user123', 12);
    const user = await prisma.user.upsert({
      where: { email: u.email },
      create: { email: u.email, password: pwd, name: u.name, xp: u.xp, level: u.level, streak: u.streak, plan: u.plan },
      update: { xp: u.xp, level: u.level },
    });
    regUserRecs.push({ id: user.id });
  }

  // All user IDs for seeding content
  const allRegularIds = [...premUserRecs.map(u => u.id), ...regUserRecs.map(u => u.id)];

  // 10 blogs with real Unsplash images
  const blogs = [
    {
      id: 'blog-1', title: 'TikTok алгоритмыг хэрхэн ялах вэ? 2025 стратеги',
      excerpt: 'TikTok-ийн алгоритм 2025 онд ихээхэн өөрчлөгдсөн. Шинэ стратегиар амжилтанд хүр.',
      coverImage: 'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=800&h=400&fit=crop&auto=format&q=75',
      category: 'marketing', minPlan: 'FREE' as const, authorIdx: 0, tagSlugs: ['tiktok', 'marketing'],
      content: `# TikTok алгоритмыг хэрхэн ялах вэ?\n\n## Оршил\n\nTikTok 2025 онд 3 тэрбум хэрэглэгчтэй болсон. Энэ гайхалтай платформд хэрхэн амжилтанд хүрэх вэ?\n\n## Алгоритм яаж ажилладаг вэ?\n\n1. **Watch Time** — Хэрэглэгч видеог хэр удаан үзсэн бэ?\n2. **Engagement** — Like, comment, share тоо\n3. **Profile visits** — Хэчнээн хүн таны профайл орсон?\n4. **Re-watch** — Давтан үзсэн тоо\n\n## 2025 оны шинэ стратеги\n\n### Hook буюу эхний 3 секунд\nВидеогийн эхний 3 секунд хамгийн чухал. Хэрэглэгчийн анхаарлыг нэн даруй татах үгийг ашиглана.\n\n### Тогтмол байдал\nӨдөрт 1-3 видео байршуулж буй аккаунтууд 3x илүү хурдан өсдөг.\n\n### Trending audio\nTrending audio болон hashtag-ийг ашиглах нь таны контентыг илүү олон хүнд хүргэдэг.\n\n## Дүгнэлт\n\nTikTok-д амжилтанд хүрэх нь тогтмол байж, чанартай контент гаргахад л хамаарна.`
    },
    {
      id: 'blog-2', title: 'AI хэрэгслүүд 2025: Контент бүтээгчдэд хэрэгтэй 10 tool',
      excerpt: 'Хиймэл оюун ухаан контент бүтээлтийг хувьсгаж байна. Шилдэг хэрэгслүүдийг судалж үзье.',
      coverImage: 'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=800&h=400&fit=crop&auto=format&q=75',
      category: 'ai', minPlan: 'FREE' as const, authorIdx: 1, tagSlugs: ['ai', 'tech'],
      content: `# AI хэрэгслүүд 2025\n\n## ChatGPT-4o\nАгуулга бичих, санаа гаргах, орчуулах — бүх зүйлд ашиглаж болно.\n\n## Midjourney v7\nТекстийг зурагт хувиргадаг хамгийн дэвшилтэт хэрэгсэл.\n\n## Claude 3.5\nСудалгаа хийх, дэлгэрэнгүй агуулга бичихэд хамгийн сайн.\n\n## Runway Gen-3\nВидео контент автоматаар үүсгэх боломжтой.\n\n## ElevenLabs\nТаны дуу хоолойг клонлож, олон хэлэнд дуу үүсгэнэ.\n\n## Дүгнэлт\nAI хэрэгслүүд цаг хэмнэж, чанарыг нэмэгдүүлэхэд тустай.`
    },
    {
      id: 'blog-3', title: 'Personal Брэнд байгуулах: 2025 гарын авлага',
      excerpt: 'Хувийн брэнд бол таны дижитал нэр хүнд. Яагаад одоо эхлэх ёстойг тайлбарлав.',
      coverImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=400&fit=crop&auto=format&q=75',
      category: 'brand', minPlan: 'FREE' as const, authorIdx: 3, tagSlugs: ['brand', 'marketing'],
      content: `# Personal Брэнд\n\n## Яагаад чухал вэ?\n\nHHарьцааны тоо нэмэгдэж, карьерийн боломж нэмэгдэнэ.\n\n## Эхлэх алхамууд\n\n1. Тодорхойлох — Та юуд мэргэшсэн бэ?\n2. Нийтлэх — Жижиг ч гэсэн өдөр бүр нийтэл\n3. Нийгэмлэг — Дагагчидтайгаа харилцаарай`
    },
    {
      id: 'blog-4', title: 'SEO-г эзэмших: Google-д #1 байрлах арга',
      excerpt: 'Google-ийн алгоритмыг ойлгож, органик traffic авах практик аргачлал.',
      coverImage: 'https://images.unsplash.com/photo-1562577309-4932fdd64cd1?w=800&h=400&fit=crop&auto=format&q=75',
      category: 'seo', minPlan: 'PREMIUM' as const, authorIdx: 2, tagSlugs: ['seo', 'tech'],
      content: `# SEO-г эзэмших\n\n## On-page SEO\n- Title tag оновчтой болгох\n- Meta description бичих\n- H1-H6 хэрэглэх\n- Image alt text нэмэх\n\n## Off-page SEO\n- Backlink олж авах\n- Guest posting хийх\n- Social signals нэмэх\n\n## Technical SEO\n- Site speed оновчлох\n- Mobile-friendly болгох\n- Schema markup нэмэх`
    },
    {
      id: 'blog-5', title: 'Freelancer амжилттай болох 7 нууц',
      excerpt: 'Freelancer болж амжилтанд хүрэх нь тийм ч хэцүү биш.',
      coverImage: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800&h=400&fit=crop&auto=format&q=75',
      category: 'freelance', minPlan: 'FREE' as const, authorIdx: 3, tagSlugs: ['freelance'],
      content: `# Freelancer болох 7 нууц\n\n1. Portfolio байгуул\n2. Нишийгээ тодорхойл\n3. Үнийгээ зөв тогтоо\n4. Клиенттэй харилцааг сайжруул\n5. Deadline-аа хат\n6. Тасралтгүй сур\n7. Нийгэмлэг байгуул`
    },
    {
      id: 'blog-6', title: 'Web3 контент маркетинг: 2025 гарын авлага',
      excerpt: 'Web3 болон blockchain технологи контент маркетингт хэрхэн нөлөөлж байна.',
      coverImage: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800&h=400&fit=crop&auto=format&q=75',
      category: 'web3', minPlan: 'MAX' as const, authorIdx: 4, tagSlugs: ['web3', 'tech'],
      content: `# Web3 Контент Маркетинг\n\n## DAO контент стратеги\nDecentralized autonomous organization-д хэрхэн контент маркетинг хийх вэ?\n\n## NFT Community\nNFT-тэй холбоотой контент нийгэмлэг байгуулах арга замууд.\n\n## Token-gated content\nOnlyfans загвараар premium контент үүсгэх боломж.`
    },
    {
      id: 'blog-7', title: 'Email маркетингийн шинэ стратеги 2025',
      excerpt: 'Email маркетинг 2025 онд ч хамгийн өндөр ROI-г өгдөг хэрэгсэл хэвээр байна.',
      coverImage: 'https://images.unsplash.com/photo-1563986768494-4dee2763ff3f?w=800&h=400&fit=crop&auto=format&q=75',
      category: 'marketing', minPlan: 'FREE' as const, authorIdx: 2, tagSlugs: ['marketing'],
      content: `# Email Маркетинг 2025\n\n## Яагаад email маркетинг?\n- 42:1 ROI\n- Нийгмийн медиаас 40x илүү үр дүнтэй\n\n## Стратеги\n1. Welcome sequence байгуул\n2. Сегментчилэл хий\n3. Personalization ашиглах\n4. A/B тест хий\n5. Metrics дагаж сайжруулах`
    },
    {
      id: 'blog-8', title: 'YouTube Shorts vs TikTok: Аль нь дээр вэ?',
      excerpt: 'Богино видео контентийн хоёр гигант. Таны бизнест аль нь тохиромжтой вэ?',
      coverImage: 'https://images.unsplash.com/photo-1611162618071-b39a2ec055fb?w=800&h=400&fit=crop&auto=format&q=75',
      category: 'marketing', minPlan: 'FREE' as const, authorIdx: 0, tagSlugs: ['youtube', 'tiktok'],
      content: `# YouTube Shorts vs TikTok\n\n## YouTube Shorts\n- Урт контенттой нэгдсэн\n- Монетизаци илүү\n- Хөгшин үзэгчид\n\n## TikTok\n- Залуу үзэгчид\n- Органик reach илүү\n- Trend-д хурдан орно\n\n## Дүгнэлт\nХоёуланг нь ашигла!`
    },
    // Book posts from 5 premium users
    {
      id: 'blog-9', title: '📚 Номын нийтлэл: "TikTok Growth Hacking" — Батболд',
      excerpt: 'TikTok-р брэнд өсгөх бүрэн гарын авлага. Premium нийтлэгч Батболд Доржийн оноо, дүгнэлт.',
      coverImage: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&h=400&fit=crop&auto=format&q=75',
      category: 'book', minPlan: 'PREMIUM' as const, authorIdx: 0, tagSlugs: ['book', 'tiktok', 'marketing'],
      content: `# 📚 TikTok Growth Hacking — Номын дүгнэлт\n\n**Зохиогч:** Gary Vaynerchuk\n**Уншсан огноо:** 2025.04.15\n**Үнэлгээ:** ⭐⭐⭐⭐⭐ (5/5)\n\n## Гол санаанууд\n\n### 1. Attention is the currency\nGary-ийн хамгийн том санаа бол анхаарал бол мөнгө. TikTok дээр анхаарал татах контент бол бизнесийн эхлэл.\n\n### 2. Document, don't create\nПerfect байхыг хүлээхгүйгээр, одоо байгаагаа баримтжуул. Уран сайхан биш, жинхэнэ байдлаас ирдэг.\n\n### 3. Speed over perfection\n2025 онд хурд чухал. Алгоритм тогтмол контентыг илүүд үздэг.\n\n## Практик хэрэглэлт\n\nЭнэ номыг уншсаны дараа би:\n- Өдөр бүр 3 видео байршуулах болсон\n- "Явцынхаа тухай бич" гэсэн зарчмыг дагаж\n- Subscriber 400% өссөн\n\n## Санал болгох уу?\n\nТийм ээ! TikTok ашигладаг маркетер, контент бүтээгч бүрт зайлшгүй унших ном.`
    },
    {
      id: 'blog-10', title: '📚 Номын нийтлэл: "The AI Advantage" — Сарнай',
      excerpt: 'AI-г ажиллагаандаа яаж нэгтгэх вэ? Premium нийтлэгч Сарнайгийн гүнзгий дүгнэлт.',
      coverImage: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&h=400&fit=crop&auto=format&q=75',
      category: 'book', minPlan: 'PREMIUM' as const, authorIdx: 1, tagSlugs: ['book', 'ai'],
      content: `# 📚 The AI Advantage — Номын дүгнэлт\n\n**Зохиогч:** Ethan Mollick\n**Уншсан огноо:** 2025.03.20\n**Үнэлгээ:** ⭐⭐⭐⭐⭐ (5/5)\n\n## Яагаад энэ ном?\n\nAI-г хэрэглэх нь зүгээр нэг хэрэгсэл биш — бодит давуу тал болгон хэрхэн хувиргах тухай.\n\n## Гол санаанууд\n\n### AI бол дотоод зөвлөх\nMollick AI-г "ер бусын дотоод зөвлөх" гэж тодорхойлно. Ямар ч асуулт асуух боломжтой.\n\n### Trepidation vs. Trust\nAI-г итгэж ашигла, гэхдээ давхар шалга. Hallucination буюу хуурамч мэдээлэл байж болно.\n\n### Skill augmentation\nAI таны ур чадварыг солихгүй, харин нэмэгдүүлнэ.\n\n## Хэрэглэж байгаа арга\n\n- Блог зохиоход ChatGPT + Claude хослуулах\n- Зураг үүсгэхэд Midjourney\n- Судалгаанд Perplexity\n\n## Дүгнэлт\n\nAI-г мэргэжил болгон хөгжүүлэх хүн бүрт зориулсан шилдэг ном.`
    },
  ];

  for (const blog of blogs) {
    const { authorIdx, tagSlugs, ...blogData } = blog;
    const authorId = authorIdx < premUserRecs.length ? premUserRecs[authorIdx].id : admin.id;
    const created = await prisma.blog.upsert({
      where: { id: blog.id },
      create: { ...blogData, authorId, published: true, readTime: Math.ceil(blogData.content.split(/\s+/).length / 200) },
      update: {},
    });
    // Add tags
    for (const slug of tagSlugs) {
      if (tags[slug]) {
        await prisma.postTag.upsert({ where: { blogId_tagId: { blogId: created.id, tagId: tags[slug].id } }, create: { blogId: created.id, tagId: tags[slug].id }, update: {} });
      }
    }
  }

  // Add likes, comments, bookmarks from regular users
  const blogIds = blogs.map(b => b.id);
  for (const userId of allRegularIds) {
    // Each user has read most blogs and liked several
    const likedCount = Math.floor(Math.random() * 7) + 3;
    for (let i = 0; i < likedCount; i++) {
      const blogId = blogIds[Math.floor(Math.random() * blogIds.length)];
      await prisma.like.upsert({ where: { userId_blogId: { userId, blogId } }, create: { userId, blogId }, update: {} }).catch(() => {});
    }
    // Comments
    const commentTexts = ['Маш гайхалтай нийтлэл!', 'Баярлалаа, маш хэрэгтэй!', 'Практик жишээ нэмж болох байсан.', 'Дэлгэрэнгүй мэдээлэл, лайк!', 'Энэ аргыг туршиж үзнэ!'];
    const commentCount = Math.floor(Math.random() * 3) + 1;
    for (let i = 0; i < commentCount; i++) {
      const blogId = blogIds[Math.floor(Math.random() * blogIds.length)];
      await prisma.comment.create({ data: { blogId, authorId: userId, content: commentTexts[Math.floor(Math.random() * commentTexts.length)] } }).catch(() => {});
    }
    // Bookmarks
    const bookmarkId = blogIds[Math.floor(Math.random() * blogIds.length)];
    await prisma.bookmark.upsert({ where: { userId_blogId: { userId, blogId: bookmarkId } }, create: { userId, blogId: bookmarkId }, update: {} }).catch(() => {});
  }

  // Add XP views for premium users from reading all blogs
  for (const u of premUserRecs) {
    await prisma.user.update({ where: { id: u.id }, data: { xp: { increment: 200 } } }).catch(() => {});
  }

  // Portfolio files for premium users (analysis exports)
  const portfolioData = [
    { name: 'TikTok_Marketing_Analysis_2025.md', type: 'analysis', content: '# TikTok Marketing Analysis\n\n## Executive Summary\n\nBased on 6 months of data collection and content analysis...\n\n## Key Metrics\n- Reach: 2.4M impressions\n- Engagement Rate: 8.7%\n- Follower Growth: +340%\n\n## Recommendations\n1. Post between 6-9pm\n2. Use trending sounds\n3. Engage in comments\n\n## Conclusion\nTikTok remains the highest ROI platform for B2C brands in 2025.' },
    { name: 'AI_Tools_Comparison_Report.md', type: 'report', content: '# AI Tools Comparison Report\n\n## Tools Evaluated\n1. ChatGPT-4o\n2. Claude 3.5 Sonnet\n3. Gemini 1.5 Pro\n4. Mistral Large\n\n## Scoring Matrix\n| Tool | Speed | Quality | Price | Overall |\n|------|-------|---------|-------|--------|\n| Claude | 9 | 10 | 8 | 9.0 |\n| GPT-4o | 9 | 9 | 7 | 8.3 |\n| Gemini | 8 | 8 | 9 | 8.3 |\n\n## Recommendation\nClaude 3.5 Sonnet for quality content creation.' },
    { name: 'SEO_Strategy_Q2_2025.md', type: 'strategy', content: '# SEO Strategy Q2 2025\n\n## Current Status\n- DA: 34\n- Monthly Organic: 12,400\n- Keywords ranking: 847\n\n## Q2 Goals\n- Increase organic traffic by 40%\n- Target 50 new keywords\n- Build 20 quality backlinks\n\n## Action Plan\n1. Content calendar: 3 posts/week\n2. Technical audit completion\n3. Link building outreach campaign' },
    { name: 'Personal_Brand_Portfolio.md', type: 'portfolio', content: '# Personal Brand Portfolio\n\n## About Me\nFreelance content strategist with 5 years experience.\n\n## Services\n- Content Strategy\n- Social Media Management\n- SEO Consulting\n\n## Case Studies\n### Client A: E-commerce Brand\n- Grew Instagram from 2K to 48K followers\n- Increased website traffic by 280%\n\n## Rates\nStarting from $50/hour' },
    { name: 'Web3_Content_Research.md', type: 'research', content: '# Web3 Content Marketing Research\n\n## Market Overview\nWeb3 content marketing is a $2.1B industry growing at 34% YoY.\n\n## Key Platforms\n1. Mirror.xyz — Decentralized blogging\n2. Lens Protocol — Social graph\n3. Farcaster — Decentralized Twitter\n\n## Content Strategy for Web3\n- Build in public approach\n- Token-gated exclusives\n- DAO contribution visibility\n\n## Conclusion\nEarly movers in Web3 content have significant advantages.' },
  ];

  for (let i = 0; i < premUserRecs.length; i++) {
    const pf = portfolioData[i];
    await prisma.portfolioFile.create({ data: { userId: premUserRecs[i].id, name: pf.name, type: pf.type, content: pf.content, size: pf.content.length } }).catch(() => {});
  }

  // View counts
  for (const b of blogs) {
    const views = Math.floor(Math.random() * 5000) + 200;
    await prisma.blog.update({ where: { id: b.id }, data: { views } }).catch(() => {});
  }

  console.log('\n✅ Seed complete!');
  console.log('👤 Admin:   admin@nexus.mn / admin123!');
  console.log('💎 Premium: batbold@nexus.mn / premium123');
  console.log('💎 Premium: sarnai@nexus.mn / premium123');
  console.log('💎 Premium: munkhbayar@nexus.mn / premium123');
  console.log('💎 Premium: enkhtuyaa@nexus.mn / premium123');
  console.log('💎 Premium: bold@nexus.mn / premium123');
  console.log('👤 Regular: odgerel@nexus.mn / user123');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());

// Additional seeding - run after main seed
async function seedExtra() {
  // Badges
  const badges = [
    { id:'badge-beginner', name:'Beginner', description:'Эхний 20 XP цуглуулсан', icon:'🌱', color:'#68d391', xpRequired:20, condition:'xp_100' },
    { id:'badge-learner', name:'Learner', description:'200 XP цуглуулсан', icon:'📚', color:'#63b3ed', xpRequired:200, condition:'xp_1000' },
    { id:'badge-expert', name:'Expert', description:'1000 XP цуглуулсан', icon:'⚡', color:'#f6ad55', xpRequired:1000, condition:'xp_5000' },
    { id:'badge-master', name:'Master', description:'5000 XP цуглуулсан', icon:'🏆', color:'#ed64a6', xpRequired:5000, condition:'xp_5000' },
    { id:'badge-first-post', name:'First Post', description:'Анхны блог нийтэлсэн', icon:'📝', color:'#9f7aea', xpRequired:0, condition:'blogs_1' },
    { id:'badge-premium', name:'Premium', description:'Premium эрх авсан', icon:'💎', color:'#9f7aea', xpRequired:0, condition:'premium' },
  ];
  for (const b of badges) {
    await prisma.badge.upsert({ where: { id: b.id }, create: b, update: {} }).catch(() => {});
  }

  // Quests
  const quests = [
    { id:'quest-first-step', title:'First Step', description:'Starter дар', xpReward:20, conditions:{type:'click_starter'}, isActive:true },
    { id:'quest-marketer', title:'Marketer', description:'Marketing skill унших', xpReward:60, conditions:{type:'read_skill',skillId:'marketing-basic'}, isActive:true },
    { id:'quest-xp-500', title:'XP Hunter', description:'500 XP цуглуул', xpReward:100, conditions:{type:'xp',amount:500}, isActive:true },
    { id:'quest-premium', title:'Premium Member', description:'Premium болох', xpReward:500, conditions:{type:'plan',plan:'PREMIUM'}, isActive:true },
  ];
  for (const q of quests) {
    await prisma.quest.upsert({ where: { id: q.id }, create: q, update: {} }).catch(() => {});
  }

  console.log('✅ Extra seed done (badges, quests)');
}
seedExtra().catch(console.error);
