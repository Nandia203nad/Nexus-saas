'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';

type Tab = 'overview' | 'growth' | 'engagement' | 'revenue';

interface AdminData {
  stats: { userCount: number; blogCount: number; commentCount: number; premiumCount: number; maxCount: number };
  topUsers: Array<{ id: string; name: string; email: string; xp: number; level: number; plan: string; streak: number; _count: { blogs: number; comments: number } }>;
  recentBlogs: Array<{ id: string; title: string; author: { name: string }; _count: { comments: number; likes: number }; views?: number }>;
}

interface UserData {
  user: { id: string; name: string; xp: number; level: number; plan: string; streak: number; createdAt: string };
  stats: { blogCount: number; commentCount: number; likeCount: number; topicsRead: number; quizPassed: number; avgQuizScore: number; totalXp: number; level: number; streak: number };
  recentBlogs: Array<{ id: string; title: string; _count: { comments: number; likes: number } }>;
  platform: { totalUsers: number; totalPosts: number };
}

const PLAN_COL: Record<string, string> = { FREE: 'var(--green)', PREMIUM: 'var(--cyan)', MAX: 'var(--purple)' };
const TABS: Tab[] = ['overview', 'growth', 'engagement', 'revenue'];

export default function DashboardPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('overview');
  const [adminData, setAdminData] = useState<AdminData | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [secondsAgo, setSecondsAgo] = useState(0);
  const chartsRef = useRef<Record<string, unknown>>({});
  const adminRef = useRef(false);

  const fetchData = useCallback((token: string, admin: boolean) => {
    const endpoint = admin ? '/api/admin' : '/api/dashboard';
    fetch(endpoint, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          if (admin) setAdminData(d);
          else setUserData(d);
          setLastUpdated(new Date());
          setSecondsAgo(0);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('nexus_token');
    if (!token) { router.replace('/'); return; }

    let role = 'USER';
    try { role = JSON.parse(localStorage.getItem('nexus_user') || '{}').role || 'USER'; } catch { /* */ }
    const admin = role === 'ADMIN';
    adminRef.current = admin;
    setIsAdmin(admin);

    if (!document.getElementById('cjs')) {
      const s = document.createElement('script');
      s.id = 'cjs';
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js';
      s.async = true;
      document.head.appendChild(s);
    }

    fetchData(token, admin);

    // Poll every 30 seconds
    const interval = setInterval(() => {
      const t = localStorage.getItem('nexus_token');
      if (t) fetchData(t, adminRef.current);
    }, 30000);

    return () => clearInterval(interval);
  }, [router, fetchData]);

  // Update "X seconds ago" counter
  useEffect(() => {
    if (!lastUpdated) return;
    const timer = setInterval(() => {
      setSecondsAgo(Math.floor((Date.now() - lastUpdated.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [lastUpdated]);

  const destroyCharts = () => {
    Object.values(chartsRef.current).forEach((c: unknown) => { try { (c as { destroy: () => void }).destroy(); } catch { /**/ } });
    chartsRef.current = {};
  };

  const makeChart = (id: string, type: string, chartData: unknown, opts: unknown) => {
    const el = document.getElementById(id) as HTMLCanvasElement | null;
    if (!el) return;
    const C = (window as unknown as { Chart: new (el: HTMLCanvasElement, cfg: unknown) => unknown }).Chart;
    if (!C) { setTimeout(() => makeChart(id, type, chartData, opts), 300); return; }
    if (chartsRef.current[id]) { try { (chartsRef.current[id] as { destroy: () => void }).destroy(); } catch { /**/ } }
    chartsRef.current[id] = new C(el, { type, data: chartData, options: opts });
  };

  const base = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: '#718096', font: { size: 11, family: 'JetBrains Mono' } }, grid: { color: 'rgba(99,179,237,0.05)' } }, y: { ticks: { color: '#718096', font: { size: 10, family: 'JetBrains Mono' } }, grid: { color: 'rgba(99,179,237,0.05)' } } } };
  const noScale = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: true, labels: { color: '#a0aec0', font: { size: 11, family: 'JetBrains Mono' }, boxWidth: 12, padding: 14 } }, cutout: '65%' } };

  useEffect(() => {
    if (loading) return;
    destroyCharts();
    const t = setTimeout(() => {
      if (tab === 'overview') {
        const xpData = isAdmin
          ? [180, 240, 195, 310, 420, 285, 210]
          : [0, 0, 25, 25, 70, 95, userData?.stats.totalXp || 95];
        makeChart('c1', 'bar', { labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], datasets: [{ data: xpData, backgroundColor: ['rgba(99,179,237,0.22)', 'rgba(159,122,234,0.22)', 'rgba(99,179,237,0.22)', 'rgba(104,211,145,0.25)', 'rgba(99,179,237,0.8)', 'rgba(159,122,234,0.22)', 'rgba(99,179,237,0.22)'], borderColor: ['#63b3ed', '#9f7aea', '#63b3ed', '#68d391', '#63b3ed', '#9f7aea', '#63b3ed'], borderWidth: 1, borderRadius: 4 }] }, base);
        makeChart('c2', 'doughnut', { labels: ['AI', 'Marketing', 'SEO', 'Freelance', 'Other'], datasets: [{ data: [28, 22, 18, 12, 20], backgroundColor: ['#63b3ed', '#9f7aea', '#68d391', '#f6ad55', '#ed64a6'], borderWidth: 0, hoverOffset: 5 }] }, { ...noScale });
      } else if (tab === 'growth') {
        const allMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const curM = new Date().getMonth(); // 0-based; May 2026 = 4
        const months = allMonths.slice(0, curM + 1);
        const lOpts = { ...base, plugins: { legend: { display: true, labels: { color: '#a0aec0', font: { size: 11, family: 'JetBrains Mono' }, boxWidth: 14, padding: 12 } } } };

        // Build a capped array: interpolate from 0 to finalVal, set last point to actual
        function growTo(finalVal: number, baseArr: number[]): number[] {
          return Array.from({ length: curM + 1 }, (_, i) =>
            i === curM ? finalVal : Math.min(baseArr[i] ?? 0, finalVal)
          );
        }
        function linearTo(finalVal: number): number[] {
          return Array.from({ length: curM + 1 }, (_, i) =>
            i === curM ? finalVal : Math.round(finalVal * (i / Math.max(curM, 1)) * 0.65)
          );
        }

        const adminUserBase = [800, 920, 1050, 1200, 1380, 1520, 1720, 1900, 2050, 2180, 2310, 2401];
        const adminPremBase = [0, 0, 0, 2, 3, 4, 5, 5, 5, 5, 5, 5];
        const adminPostBase = [0, 0, 2, 3, 4, 5, 6, 7, 8, 9, 9, 10];

        const totalXp   = userData?.stats.totalXp   || 0;
        const topicsRd  = userData?.stats.topicsRead || 0;
        const quizCount = userData?.stats.quizPassed || 0;
        const userCount = adminData?.stats.userCount    || 2401;
        const premCount = adminData?.stats.premiumCount || 5;
        const postCount = adminData?.stats.blogCount    || 10;

        makeChart('cg1', 'line', { labels: months, datasets: [
          { label: isAdmin ? `Total Users (${userCount})` : `XP Progress (${totalXp} XP)`,
            data: isAdmin ? growTo(userCount, adminUserBase) : linearTo(totalXp),
            borderColor: '#63b3ed', backgroundColor: 'rgba(99,179,237,0.08)', fill: true, tension: 0.4,
            pointBackgroundColor: '#63b3ed', pointRadius: 4, borderWidth: 2 },
          { label: isAdmin ? `Premium (${premCount})` : `Topics Read (${topicsRd})`,
            data: isAdmin ? growTo(premCount, adminPremBase) : linearTo(topicsRd),
            borderColor: '#9f7aea', backgroundColor: 'rgba(159,122,234,0.06)', fill: true, tension: 0.4,
            borderDash: [5, 5], pointBackgroundColor: '#9f7aea', pointRadius: 3, borderWidth: 2 },
        ] }, lOpts);
        makeChart('cg2', 'bar', { labels: months, datasets: [{
          label: isAdmin ? `New Posts (${postCount})` : `Quiz Passed (${quizCount})`,
          data: isAdmin ? growTo(postCount, adminPostBase) : linearTo(quizCount),
          backgroundColor: 'rgba(99,179,237,0.22)', borderColor: 'rgba(99,179,237,0.4)', borderWidth: 1, borderRadius: 4,
        }] }, { ...base, plugins: { legend: { display: true, labels: { color: '#a0aec0', font: { size: 10, family: 'JetBrains Mono' }, boxWidth: 10, padding: 10 } } } });
      } else if (tab === 'engagement') {
        makeChart('ce1', 'bar', { labels: ['AI', 'Marketing', 'SEO', 'TikTok', 'Freelance', 'Web3', 'Book'], datasets: [{ data: [4200, 3560, 2100, 1890, 756, 4200, 890], backgroundColor: 'rgba(99,179,237,0.18)', borderColor: '#63b3ed', borderWidth: 1, borderRadius: 4 }] }, { ...base, indexAxis: 'y' as const });
        makeChart('ce2', 'pie', { labels: ['❤ Like', '💬 Comment', '🔖 Bookmark', '👁 View'], datasets: [{ data: [34, 28, 18, 20], backgroundColor: ['rgba(237,100,166,0.6)', 'rgba(99,179,237,0.6)', 'rgba(104,211,145,0.6)', 'rgba(159,122,234,0.6)'], borderColor: ['#ed64a6', '#63b3ed', '#68d391', '#9f7aea'], borderWidth: 1 }] }, { ...noScale, cutout: '55%' });
      } else if (tab === 'revenue') {
        const allM2 = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const curM2 = new Date().getMonth();
        const months2 = allM2.slice(0, curM2 + 1);
        const revenueBase = [0, 0, 0, 6, 9, 12, 15, 15, 15, 15, 15, 15];
        const pCount = adminData?.stats.premiumCount || 0;
        const mCount = adminData?.stats.maxCount || 0;
        const mrr = pCount * 3 + mCount * 7;
        const revenueData = Array.from({ length: curM2 + 1 }, (_, i) =>
          i === curM2 ? mrr : Math.min(revenueBase[i] ?? 0, mrr > 0 ? mrr : (revenueBase[i] ?? 0))
        );
        const freeUsers = Math.max(0, (adminData?.stats.userCount || 0) - pCount - mCount);
        makeChart('cr1', 'bar', { labels: months2, datasets: [{ label: `Revenue ($${mrr}/mo)`, data: revenueData, backgroundColor: 'rgba(99,179,237,0.4)', borderColor: '#63b3ed', borderWidth: 1, borderRadius: 4 }] }, { ...base, plugins: { legend: { display: true, labels: { color: '#a0aec0', font: { size: 10, family: 'JetBrains Mono' }, boxWidth: 10, padding: 10 } } } });
        makeChart('cr2', 'doughnut', { labels: [`Premium ${pCount}`, `Max ${mCount}`, `Free ${freeUsers}`], datasets: [{ data: [Math.max(pCount, 1), Math.max(mCount, 1), Math.max(freeUsers, 1)], backgroundColor: ['rgba(99,179,237,0.7)', 'rgba(159,122,234,0.7)', 'rgba(104,211,145,0.3)'], borderWidth: 0 }] }, { ...noScale });
      }
    }, 150);
    return () => clearTimeout(t);
  }, [tab, loading, isAdmin, userData]);

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 1 }}>
      <Navbar />
      <div style={{ width: 44, height: 44, border: '3px solid rgba(99,179,237,0.15)', borderTopColor: 'var(--cyan)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
    </div>
  );

  // User dashboard stats
  const uStats = userData?.stats || { blogCount: 0, commentCount: 0, likeCount: 0, topicsRead: 0, quizPassed: 0, avgQuizScore: 0, totalXp: 0, level: 1, streak: 0 };
  // Admin dashboard stats
  const aStats = adminData?.stats || { userCount: 0, blogCount: 0, commentCount: 0, premiumCount: 0, maxCount: 0 };
  const topUsers = adminData?.topUsers || [];
  const recentBlogs = isAdmin ? (adminData?.recentBlogs || []) : (userData?.recentBlogs || []);

  const metricCards = isAdmin
    ? [
        { icon: '👥', label: 'TOTAL USERS', val: aStats.userCount, color: 'var(--cyan)', trend: '+12%' },
        { icon: '📝', label: 'TOTAL POSTS', val: aStats.blogCount, color: 'var(--purple)', trend: '+10%' },
        { icon: '⭐', label: 'PREMIUM', val: aStats.premiumCount, color: 'var(--magenta)', trend: '+5%' },
        { icon: '💬', label: 'COMMENTS', val: aStats.commentCount, color: 'var(--green)', trend: '+23%' },
      ]
    : [
        { icon: '✨', label: 'TOTAL XP', val: uStats.totalXp, color: 'var(--cyan)', trend: `Lv.${uStats.level}` },
        { icon: '📝', label: 'MY POSTS', val: uStats.blogCount, color: 'var(--purple)', trend: '+posts' },
        { icon: '📚', label: 'TOPICS READ', val: uStats.topicsRead, color: 'var(--green)', trend: 'topics' },
        { icon: '✅', label: 'QUIZ PASSED', val: uStats.quizPassed, color: 'var(--magenta)', trend: `${uStats.avgQuizScore}% avg` },
      ];

  return (
    <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh' }}>
      <Navbar />
      <div className="container" style={{ paddingTop: 28, paddingBottom: 60 }}>
        <div style={{ marginBottom: 28 }}>
          <div className="editorial-label" style={{ marginBottom: 10 }}>
            {isAdmin ? 'System Analytics' : 'Personal Analytics'}
          </div>
          <h1 className="editorial-title" style={{ fontSize: 'clamp(1.3rem,3vw,1.9rem)', marginBottom: 4 }}>
            {isAdmin ? 'Admin' : 'My'} <span className="grad-text">Dashboard</span>
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontFamily: 'JetBrains Mono,monospace', fontSize: '.6rem', color: 'var(--text3)' }}>
            <span>// {isAdmin ? 'Real-time platform metrics' : 'Your learning & content progress'} · {new Date().toLocaleDateString('mn-MN')}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', display: 'inline-block', animation: 'pulse 2s infinite' }} />
              <span style={{ color: 'var(--green)', letterSpacing: '.08em' }}>LIVE</span>
            </span>
            {lastUpdated && (
              <span style={{ color: 'var(--text3)' }}>
                Updated {secondsAgo < 5 ? 'just now' : `${secondsAgo}s ago`}
              </span>
            )}
          </div>
        </div>

        {/* Metric cards */}
        <div className="grid-4" style={{ marginBottom: 24 }}>
          {metricCards.map(m => (
            <div key={m.label} className="glass-card" style={{ padding: 20 }}>
              <div className="corner c-tl" style={{ borderColor: m.color, opacity: 0.5 }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <span style={{ fontSize: '1.5rem' }}>{m.icon}</span>
                <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: '.58rem', color: 'var(--green)', background: 'rgba(104,211,145,0.08)', padding: '2px 6px', borderRadius: 4 }}>{m.trend}</span>
              </div>
              <div className="editorial-title" style={{ fontSize: '1.8rem', color: m.color, lineHeight: 1, marginBottom: 4 }}>{m.val.toLocaleString()}</div>
              <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: '.52rem', color: 'var(--text3)', letterSpacing: '.08em' }}>{m.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 3, marginBottom: 22, background: 'rgba(99,179,237,0.03)', border: '1px solid rgba(99,179,237,0.1)', borderRadius: 10, padding: 4 }}>
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: '9px 6px', borderRadius: 8, border: tab === t ? '1px solid rgba(99,179,237,0.32)' : '1px solid transparent', cursor: 'pointer', fontFamily: 'JetBrains Mono,monospace', fontSize: '.58rem', color: tab === t ? 'var(--cyan)' : 'var(--text3)', background: tab === t ? 'rgba(99,179,237,0.1)' : 'transparent', letterSpacing: '.06em', transition: 'all 0.2s', textTransform: 'uppercase' }}>
              {t}
            </button>
          ))}
        </div>

        {tab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="grid-2">
              <div className="glass-card" style={{ padding: 22 }}>
                <div className="corner c-tl" />
                <div className="editorial-label" style={{ marginBottom: 14 }}>{isAdmin ? 'Weekly Active Users' : 'Weekly XP Activity'}</div>
                <div style={{ height: 220 }}><canvas id="c1" /></div>
              </div>
              <div className="glass-card" style={{ padding: 22 }}>
                <div className="corner c-tl" />
                <div className="editorial-label" style={{ marginBottom: 14 }}>Content by Category</div>
                <div style={{ height: 220 }}><canvas id="c2" /></div>
              </div>
            </div>

            {isAdmin && topUsers.length > 0 && (
              <div className="glass-card" style={{ padding: 22 }}>
                <div className="corner c-tl" />
                <div className="editorial-label" style={{ marginBottom: 16 }}>Top 9 Architects — XP Leaderboard</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {topUsers.map((u, i) => (
                    <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'rgba(99,179,237,0.03)', border: '1px solid rgba(99,179,237,0.06)', borderRadius: 9 }}>
                      <div style={{ width: 26, height: 26, borderRadius: '50%', background: i < 3 ? 'linear-gradient(135deg,var(--yellow),var(--orange))' : 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'JetBrains Mono,monospace', fontWeight: 700, fontSize: '.7rem', color: i < 3 ? '#050810' : 'var(--text3)', flexShrink: 0 }}>#{i + 1}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                          <span style={{ fontWeight: 600, fontSize: '.88rem' }}>{u.name}</span>
                          <span className={`badge ${u.plan === 'MAX' ? 'b-max' : u.plan === 'PREMIUM' ? 'b-premium' : 'b-free'}`} style={{ fontSize: '.5rem', padding: '1px 6px' }}>{u.plan}</span>
                        </div>
                        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                          <div style={{ width: 120, height: 4, background: 'rgba(99,179,237,0.08)', borderRadius: 2, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${Math.min(100, (u.xp / 7200) * 100)}%`, background: `linear-gradient(90deg,${PLAN_COL[u.plan] || 'var(--cyan)'},${PLAN_COL[u.plan] || 'var(--cyan)'}88)`, borderRadius: 2 }} />
                          </div>
                          <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: '.6rem', color: PLAN_COL[u.plan] || 'var(--cyan)', fontWeight: 600 }}>{u.xp.toLocaleString()} XP</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 14, fontFamily: 'JetBrains Mono,monospace', fontSize: '.6rem', color: 'var(--text3)', flexShrink: 0 }}>
                        <span>Lv.{u.level}</span><span>📝{u._count.blogs}</span><span>💬{u._count.comments}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!isAdmin && (
              <div className="glass-card" style={{ padding: 22 }}>
                <div className="corner c-tl" />
                <div className="editorial-label" style={{ marginBottom: 16 }}>My Learning Progress</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 14 }}>
                  {[
                    { l: 'XP Level', v: `Lv.${uStats.level}`, b: Math.min(100, ((uStats.totalXp % 200) / 200) * 100), c: 'var(--cyan)' },
                    { l: 'Quiz Score Avg', v: `${uStats.avgQuizScore}%`, b: uStats.avgQuizScore, c: 'var(--purple)' },
                    { l: 'Login Streak', v: `${uStats.streak}d`, b: Math.min(100, (uStats.streak / 30) * 100), c: 'var(--green)' },
                    { l: 'Comments', v: `${uStats.commentCount}`, b: Math.min(100, uStats.commentCount * 5), c: 'var(--orange)' },
                  ].map(m => (
                    <div key={m.l} style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(99,179,237,0.06)', borderRadius: 10, padding: 14 }}>
                      <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: '.54rem', color: 'var(--text3)', marginBottom: 5, letterSpacing: '.07em' }}>{m.l.toUpperCase()}</div>
                      <div className="editorial-title" style={{ fontSize: '1.4rem', color: m.c, marginBottom: 8 }}>{m.v}</div>
                      <div className="xp-bar" style={{ height: 4 }}><div className="xp-fill" style={{ width: `${m.b}%`, background: `linear-gradient(90deg,${m.c},${m.c}88)` }} /></div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {isAdmin && (
              <div className="glass-card" style={{ padding: 22 }}>
                <div className="corner c-tl" />
                <div className="editorial-label" style={{ marginBottom: 16 }}>Platform Analytics</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 14 }}>
                  {[
                    { l: 'Conversion Rate', v: `${aStats.userCount > 0 ? Math.round((aStats.premiumCount / aStats.userCount) * 100) : 0}%`, b: aStats.userCount > 0 ? (aStats.premiumCount / aStats.userCount) * 100 : 0, c: 'var(--magenta)' },
                    { l: 'Avg Posts/User', v: (aStats.blogCount / Math.max(aStats.userCount, 1)).toFixed(1), b: Math.min(100, (aStats.blogCount / Math.max(aStats.userCount, 1)) * 20), c: 'var(--purple)' },
                    { l: 'Premium Rate', v: `${aStats.userCount > 0 ? Math.round((aStats.premiumCount / aStats.userCount) * 100) : 0}%`, b: aStats.userCount > 0 ? (aStats.premiumCount / aStats.userCount) * 100 : 0, c: 'var(--cyan)' },
                    { l: 'Max Rate', v: `${aStats.userCount > 0 ? Math.round((aStats.maxCount / aStats.userCount) * 100) : 0}%`, b: aStats.userCount > 0 ? (aStats.maxCount / aStats.userCount) * 100 : 0, c: 'var(--orange)' },
                  ].map(m => (
                    <div key={m.l} style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(99,179,237,0.06)', borderRadius: 10, padding: 14 }}>
                      <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: '.54rem', color: 'var(--text3)', marginBottom: 5, letterSpacing: '.07em' }}>{m.l.toUpperCase()}</div>
                      <div className="editorial-title" style={{ fontSize: '1.4rem', color: m.c, marginBottom: 8 }}>{m.v}</div>
                      <div className="xp-bar" style={{ height: 4 }}><div className="xp-fill" style={{ width: `${m.b}%`, background: `linear-gradient(90deg,${m.c},${m.c}88)` }} /></div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'growth' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="glass-card" style={{ padding: 22 }}>
              <div className="corner c-tl" />
              <div className="editorial-label" style={{ marginBottom: 14 }}>{isAdmin ? 'User Growth — 12 Months' : 'XP & Topics Growth — 12 Months'}</div>
              <div style={{ height: 280 }}><canvas id="cg1" /></div>
            </div>
            <div className="glass-card" style={{ padding: 22 }}>
              <div className="corner c-tl" />
              <div className="editorial-label" style={{ marginBottom: 14 }}>{isAdmin ? 'New Posts Per Month' : 'Quiz Attempts Per Month'}</div>
              <div style={{ height: 220 }}><canvas id="cg2" /></div>
            </div>
          </div>
        )}

        {tab === 'engagement' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="grid-2">
              <div className="glass-card" style={{ padding: 22 }}>
                <div className="corner c-tl" />
                <div className="editorial-label" style={{ marginBottom: 14 }}>Views by Tag</div>
                <div style={{ height: 260 }}><canvas id="ce1" /></div>
              </div>
              <div className="glass-card" style={{ padding: 22 }}>
                <div className="corner c-tl" />
                <div className="editorial-label" style={{ marginBottom: 14 }}>Interaction Distribution</div>
                <div style={{ height: 260 }}><canvas id="ce2" /></div>
              </div>
            </div>
            {recentBlogs.length > 0 && (
              <div className="glass-card" style={{ padding: 22 }}>
                <div className="corner c-tl" />
                <div className="editorial-label" style={{ marginBottom: 16 }}>{isAdmin ? 'Recent Posts Performance' : 'My Recent Posts'}</div>
                {recentBlogs.map(b => (
                  <div key={b.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(99,179,237,0.03)', border: '1px solid rgba(99,179,237,0.06)', borderRadius: 9, marginBottom: 8 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '.88rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.title}</div>
                      {isAdmin && 'author' in b && <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: '.6rem', color: 'var(--text3)' }}>by {(b as { author: { name: string } }).author.name}</div>}
                    </div>
                    <div style={{ display: 'flex', gap: 12, fontFamily: 'JetBrains Mono,monospace', fontSize: '.6rem', color: 'var(--text3)', flexShrink: 0, marginLeft: 12 }}>
                      {isAdmin && <span>👁 {(b as { views?: number }).views || 0}</span>}
                      <span>💬 {b._count.comments}</span>
                      <span style={{ color: 'var(--magenta)' }}>❤ {b._count.likes}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'revenue' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="glass-card" style={{ padding: 22 }}>
              <div className="corner c-tl" />
              <div className="editorial-label" style={{ marginBottom: 14 }}>{isAdmin ? 'Monthly Revenue ($)' : 'Platform Revenue Trend'}</div>
              <div style={{ height: 260 }}><canvas id="cr1" /></div>
            </div>
            <div className="grid-2">
              <div className="glass-card" style={{ padding: 22 }}>
                <div className="corner c-tl" />
                <div className="editorial-label" style={{ marginBottom: 14 }}>Revenue Split</div>
                <div style={{ height: 200 }}><canvas id="cr2" /></div>
              </div>
              <div className="glass-card" style={{ padding: 22 }}>
                <div className="corner c-tl" />
                <div className="editorial-label" style={{ marginBottom: 16 }}>Key Metrics</div>
                {isAdmin
                  ? [
                      { l: 'Premium Users', v: `${aStats.premiumCount} users × $3`, c: 'var(--cyan)' },
                      { l: 'Max Users', v: `${aStats.maxCount} users × $7`, c: 'var(--purple)' },
                      { l: 'Total MRR', v: `$${aStats.premiumCount * 3 + aStats.maxCount * 7}/mo`, c: 'var(--green)' },
                      { l: 'ARR (projected)', v: `$${(aStats.premiumCount * 3 + aStats.maxCount * 7) * 12}/yr`, c: 'var(--orange)' },
                    ].map(m => (
                      <div key={m.l} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid rgba(99,179,237,0.06)' }}>
                        <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: '.62rem', color: 'var(--text3)' }}>{m.l}</span>
                        <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: '.72rem', fontWeight: 700, color: m.c }}>{m.v}</span>
                      </div>
                    ))
                  : [
                      { l: 'My Plan', v: userData?.user?.plan || 'FREE', c: 'var(--cyan)' },
                      { l: 'Posts Published', v: `${uStats.blogCount}`, c: 'var(--purple)' },
                      { l: 'Likes Received', v: `${uStats.likeCount}`, c: 'var(--green)' },
                      { l: 'Platform Users', v: `${userData?.platform?.totalUsers || 0}`, c: 'var(--orange)' },
                    ].map(m => (
                      <div key={m.l} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid rgba(99,179,237,0.06)' }}>
                        <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: '.62rem', color: 'var(--text3)' }}>{m.l}</span>
                        <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: '.72rem', fontWeight: 700, color: m.c }}>{m.v}</span>
                      </div>
                    ))
                }
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
