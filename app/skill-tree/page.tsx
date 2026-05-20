'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import {
  getParentIds,
  SKILL_CATEGORIES,
  SKILL_TOPICS,
  SKILL_TREE_NODES,
  SkillCategory,
  SkillTopic,
  SkillTreeNode,
} from '@/lib/skill-tree-data';

type UserState = {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
  plan: string;
  xp: number;
  level: number;
};

type SkillProgress = {
  skillId: string;
};

type TopicComment = {
  id: string;
  content: string;
  createdAt: string;
  author: { name: string; avatar?: string | null; level: number; plan: string };
};

type TopicProgress = {
  read: boolean;
  quizPassed: boolean;
  quizScore: number;
};

type TopicState = {
  comments: TopicComment[];
  reactions: { counts: Record<string, number>; mine: string[] };
  progress?: TopicProgress | null;
  attempts: Array<{ id: string; score: number; passed: boolean; createdAt: string }>;
};

type AiGenerateResult = { title: string; outline: string[]; draft: string };
type AiAnalyzeResult = { seoScore: number; strengths: string[]; suggestions: string[] };

const PLAN_COLORS: Record<string, string> = {
  FREE: '#78f5df',
  PREMIUM: '#d98ec8',
  MAX: '#e7c477',
};

const REACTIONS = [
  { type: 'like', label: 'Like' },
  { type: 'insight', label: 'Insight' },
  { type: 'fire', label: 'Useful' },
  { type: 'bookmark', label: 'Save' },
];

function canUsePlan(node: SkillTreeNode, plan?: string) {
  if (node.maxOnly) return plan === 'MAX';
  if (node.premium) return plan === 'PREMIUM' || plan === 'MAX';
  return true;
}

function nodeStatus(node: SkillTreeNode, completedIds: Set<string>, plan?: string) {
  const parents = getParentIds(node.id);
  const parentsDone = node.id === 'starter' || parents.every(id => completedIds.has(id));
  const planOk = canUsePlan(node, plan);
  if (completedIds.has(node.id)) return 'complete';
  if (parentsDone && planOk) return 'available';
  if (parentsDone && !planOk) return 'plan';
  return 'locked';
}

function emptyTopicState(): TopicState {
  return {
    comments: [],
    reactions: { counts: {}, mine: [] },
    progress: null,
    attempts: [],
  };
}

function getNodePct(nodeId: string, completedIds: Set<string>): number {
  const subtree: string[] = [];
  function collect(id: string) {
    subtree.push(id);
    const n = SKILL_TREE_NODES.find(x => x.id === id);
    n?.children.forEach(childId => collect(childId));
  }
  collect(nodeId);
  const done = subtree.filter(id => completedIds.has(id)).length;
  return Math.round((done / Math.max(subtree.length, 1)) * 100);
}

export default function SkillTreePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserState | null>(null);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [unlockedNodes, setUnlockedNodes] = useState<Set<string>>(new Set(['starter']));
  const [selected, setSelected] = useState<SkillTreeNode>(SKILL_TREE_NODES[0]);
  const [activeTopic, setActiveTopic] = useState<SkillTopic>(SKILL_TOPICS[0]);
  const [topicState, setTopicState] = useState<TopicState>(emptyTopicState());
  const [activeCategory, setActiveCategory] = useState<SkillCategory | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [topicLoading, setTopicLoading] = useState(false);
  const [topicModalOpen, setTopicModalOpen] = useState(false);
  const [comment, setComment] = useState('');
  const [answers, setAnswers] = useState<number[]>([]);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [aiMode, setAiMode] = useState<'generate' | 'analyze' | null>(null);
  const [aiResult, setAiResult] = useState<AiGenerateResult | AiAnalyzeResult | null>(null);
  const [tldrResult, setTldrResult] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [topicProgressMap, setTopicProgressMap] = useState<Record<string, TopicProgress | null>>({});
  const topicCache = useRef<Record<string, TopicState>>({});
  const quizSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = localStorage.getItem('nexus_token');
    if (!token) {
      setLoading(false);
      router.replace('/auth/login?redirect=/skill-tree');
      return;
    }

    fetch('/api/skill-tree', { headers: { Authorization: `Bearer ${token}` } })
      .then(async res => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Skill tree failed to load');
        setUser(data.user);
        localStorage.setItem('nexus_user', JSON.stringify(data.user));
        setCompletedIds(new Set((data.progress || []).map((item: SkillProgress) => item.skillId)));
      })
      .catch(err => setError(err instanceof Error ? err.message : 'Skill tree failed to load'))
      .finally(() => setLoading(false));
  }, [router]);

  useEffect(() => {
    const token = localStorage.getItem('nexus_token');
    if (!token) return;

    setAnswers([]);
    setAiResult(null);
    setAiMode(null);
    setTldrResult(null);
    setQuizSubmitted(false);

    const cached = topicCache.current[activeTopic.id];
    if (cached) {
      setTopicState(cached);
      return;
    }

    setTopicLoading(true);
    fetch(`/api/skill-tree/topics?topicId=${encodeURIComponent(activeTopic.id)}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async res => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Topic failed to load');
        const state: TopicState = {
          comments: data.comments || [],
          reactions: data.reactions || { counts: {}, mine: [] },
          progress: data.progress || null,
          attempts: data.attempts || [],
        };
        topicCache.current[activeTopic.id] = state;
        setTopicState(state);
        setTopicProgressMap(prev => ({ ...prev, [activeTopic.id]: data.progress || null }));
      })
      .catch(err => setError(err instanceof Error ? err.message : 'Topic failed to load'))
      .finally(() => setTopicLoading(false));
  }, [activeTopic]);

  const filteredNodes = useMemo(() => {
    if (activeCategory === 'all') return SKILL_TREE_NODES;
    return SKILL_TREE_NODES.filter(node => node.category === activeCategory || node.category === 'core');
  }, [activeCategory]);

  const visibleIds = useMemo(() => new Set(filteredNodes.map(node => node.id)), [filteredNodes]);
  const completedCount = completedIds.size;
  const totalXp = user?.xp || 0;
  const planColor = PLAN_COLORS[user?.plan || 'FREE'] || '#78f5df';
  const nextLevelXp = Math.max(0, (user?.level || 1) * 200 - totalXp);
  const progressPct = Math.round((completedCount / SKILL_TREE_NODES.length) * 100);
  const genResult = aiMode === 'generate' ? (aiResult as AiGenerateResult) : null;
  const anaResult = aiMode === 'analyze' ? (aiResult as AiAnalyzeResult) : null;

  function handleNodeClick(node: SkillTreeNode) {
    setSelected(node);
    setUnlockedNodes(prev => new Set([...prev, node.id]));
    const topicForNode = SKILL_TOPICS.find(t => t.category === node.category) ?? SKILL_TOPICS[0];
    openTopic(topicForNode);
  }

  async function completeSkill(node: SkillTreeNode) {
    const token = localStorage.getItem('nexus_token');
    if (!token) return router.replace('/auth/login?redirect=/skill-tree');

    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/skill-tree', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ skillId: node.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Skill could not be completed');
      setCompletedIds(current => new Set([...Array.from(current), node.id]));
      if (data.user) {
        setUser(data.user);
        localStorage.setItem('nexus_user', JSON.stringify(data.user));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Skill could not be completed');
    } finally {
      setSaving(false);
    }
  }

  async function topicAction(action: string, extra: Record<string, unknown> = {}) {
    const token = localStorage.getItem('nexus_token');
    if (!token) return router.replace('/auth/login?redirect=/skill-tree');

    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/skill-tree/topics', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, topicId: activeTopic.id, ...extra }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Topic action failed');
      const freshState: TopicState = {
        comments: data.comments || [],
        reactions: data.reactions || { counts: {}, mine: [] },
        progress: data.progress || null,
        attempts: data.attempts || [],
      };
      topicCache.current[activeTopic.id] = freshState;
      setTopicState(freshState);
      setTopicProgressMap(prev => ({ ...prev, [activeTopic.id]: freshState.progress || null }));
      if (data.user) {
        setUser(data.user);
        localStorage.setItem('nexus_user', JSON.stringify(data.user));
      }
      if (data.ai) {
        if (action === 'tldr') {
          setTldrResult(data.ai.tldr || null);
        } else {
          setAiResult(data.ai);
          setAiMode(action === 'ai_generate' ? 'generate' : 'analyze');
        }
      }
      if (action === 'comment') setComment('');
      if (action === 'quiz') setQuizSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Topic action failed');
    } finally {
      setSaving(false);
    }
  }

  function openTopic(topic: SkillTopic) {
    setActiveTopic(topic);
    setActiveCategory(topic.category);
    setTopicModalOpen(true);
  }

  function submitQuiz() {
    if (answers.length < activeTopic.quiz.length || answers.some(answer => answer === undefined)) {
      setError('Answer every quiz question first.');
      return;
    }
    topicAction('quiz', { answers });
  }

  function lockMessage(node: SkillTreeNode) {
    const parents = getParentIds(node.id).filter(id => !completedIds.has(id));
    if (parents.length) return `Complete prerequisite: ${parents.join(', ')}`;
    if (node.maxOnly) return 'MAX plan required';
    if (node.premium) return 'Premium plan required';
    return 'Locked';
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', position: 'relative', zIndex: 1 }}>
        <div className="glass-card" style={{ padding: 28, color: 'var(--text2)' }}>Loading skill tree...</div>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh', overflowX: 'hidden' }}>
      <Navbar />
      <style>{`
        @keyframes treePulse { 0%,100%{opacity:.35;transform:scale(1)} 50%{opacity:.9;transform:scale(1.12)} }
        @keyframes outerRing { 0%,100%{opacity:.2;r:28} 50%{opacity:.7;r:32} }
        @keyframes dashFlow { to { stroke-dashoffset: -44; } }
        @keyframes nodeFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-3px)} }
        @keyframes branchGlow { 0%,100%{opacity:.5} 50%{opacity:1} }
        @keyframes modalSlide { from{opacity:0;transform:translateY(18px) scale(.98)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes quizGlow { 0%,100%{box-shadow:0 0 0 0 rgba(120,245,223,0),transform:scale(1)} 50%{box-shadow:0 0 22px 4px rgba(120,245,223,0.35);transform:scale(1.02)} }
        .tree-node { transition: filter .2s; }
        .tree-node:hover { filter: brightness(1.35) drop-shadow(0 0 8px currentColor); }
        .skill-shell {
          min-height: calc(100vh - 62px);
          padding-top: 62px;
          display: grid;
          grid-template-columns: 230px minmax(520px, 1fr) 292px;
          background:
            linear-gradient(90deg, rgba(0,0,0,.48), transparent 16%, transparent 84%, rgba(0,0,0,.48)),
            radial-gradient(circle at 50% 45%, rgba(120,245,223,.18), transparent 34%),
            url('/skilltree.jpg') center/cover no-repeat;
        }
        .skill-shell::before {
          content: '';
          position: fixed;
          inset: 62px 0 0;
          background: rgba(4,10,18,.78);
          pointer-events: none;
        }
        .left-rail, .tree-stage, .right-monitor { min-width: 0; }
        .tree-node:hover .node-main { filter: brightness(1.24); }
        .topic-row:hover { background: rgba(255,255,255,.08) !important; border-color: rgba(255,255,255,.22) !important; transform: translateX(2px); }
        .modal-backdrop { position:fixed;inset:0;z-index:2200;display:flex;align-items:flex-start;justify-content:center;background:rgba(0,0,0,.72);backdrop-filter:blur(14px);padding:20px;overflow-y:auto; }
        .modal-card { position:relative;width:100%;max-width:980px;max-height:calc(100vh - 40px);margin:auto 0;overflow:hidden;display:flex;flex-direction:column;background:linear-gradient(170deg,rgba(14,20,34,.98),rgba(6,10,18,.99));border:1px solid rgba(142,231,255,.24);border-radius:18px;box-shadow:0 32px 80px rgba(0,0,0,.65),0 0 60px rgba(142,231,255,.08);animation:modalSlide .24s ease; }
        .modal-body { flex:1;overflow:auto;display:grid;grid-template-columns:minmax(0,1fr) 320px;gap:0; }
        .modal-left { padding:24px 22px;border-right:1px solid rgba(255,255,255,.07);overflow-y:auto; }
        .modal-right { padding:20px 18px;overflow-y:auto;background:rgba(0,0,0,.22); }
        .modal-comments { padding:18px 22px;border-top:1px solid rgba(255,255,255,.07); }
        .ai-card { border-radius:12px;padding:14px 16px;margin-top:10px; }
        @media (max-width: 1180px) {
          .skill-shell { grid-template-columns: 210px minmax(480px, 1fr); }
          .right-monitor { display: none; }
        }
        @media (max-width: 820px) {
          .skill-shell { grid-template-columns: 1fr; min-height: 100vh; overflow: visible; }
          .skill-shell::before { position: absolute; inset: 62px 0 0; }
          .left-rail { order: 1; border-right: 0 !important; border-bottom: 1px solid rgba(142,231,255,.18); max-height: none; }
          .tree-stage { order: 2; min-height: 620px; overflow: visible !important; }
          .right-monitor { order: 3; display: block; border-left: 0 !important; border-top: 1px solid rgba(142,231,255,.18); }
          .modal-backdrop { padding: 10px; }
          .modal-card { max-height: calc(100vh - 20px); border-radius: 14px; }
          .modal-body { grid-template-columns: 1fr; }
          .modal-left { border-right: 0; }
          .modal-right { border-top:1px solid rgba(255,255,255,.07); }
        }
      `}</style>

      <main className="skill-shell">
        <aside className="left-rail" style={{ position: 'relative', zIndex: 2, padding: 16, borderRight: '1px solid rgba(142,231,255,.18)', background: 'linear-gradient(180deg, rgba(35,28,20,.86), rgba(6,10,18,.9))', overflowY: 'auto' }}>
          <div className="rail-title" style={{ border: '1px solid rgba(231,196,119,.35)', borderRadius: 8, padding: '9px 11px', marginBottom: 12, color: '#e7c477', fontFamily: 'JetBrains Mono,monospace', fontSize: '.7rem', fontWeight: 800 }}>
            NEXUS PLATFORM
          </div>

          <div style={{ display: 'grid', gap: 6 }}>
            {SKILL_CATEGORIES.map(category => {
              const active = activeCategory === category.id;
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setActiveCategory(category.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 9, width: '100%',
                    padding: '9px 10px', borderRadius: 8,
                    border: `1px solid ${active ? category.color : 'rgba(142,231,255,.16)'}`,
                    background: active ? `linear-gradient(135deg, ${category.color}33, rgba(255,255,255,.08))` : 'rgba(10,16,28,.72)',
                    color: active ? '#fff' : 'rgba(255,255,255,.68)', cursor: 'pointer',
                    fontFamily: 'JetBrains Mono,monospace', fontSize: '.64rem', textAlign: 'left',
                  }}
                >
                  <span style={{ width: 21, height: 21, borderRadius: '50%', display: 'grid', placeItems: 'center', border: `1px solid ${category.color}`, color: category.color, fontWeight: 800, flexShrink: 0 }}>{category.icon}</span>
                  <span>{category.label}</span>
                </button>
              );
            })}
          </div>

          <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid rgba(142,231,255,.14)' }}>
            <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: '.55rem', color: 'rgba(255,255,255,.42)', marginBottom: 7, letterSpacing: '.1em' }}>BLOG TOPICS</div>
            <div style={{ display: 'grid', gap: 5 }}>
              {SKILL_TOPICS.map((topic, index) => {
                const active = activeTopic.id === topic.id && topicModalOpen;
                const totalTopicXp = topic.readXp + topic.quizXp;
                const prog = topicProgressMap[topic.id];
                const subtitle = prog?.quizPassed
                  ? '✓ Quiz Passed'
                  : prog?.read
                    ? 'Read — Take Quiz!'
                    : 'Click to read';
                const subtitleColor = prog?.quizPassed ? '#78f5df' : prog?.read ? '#e7c477' : 'rgba(255,255,255,.34)';
                return (
                  <button
                    key={topic.id}
                    type="button"
                    className="topic-row"
                    onClick={() => openTopic(topic)}
                    style={{
                      display: 'grid', gridTemplateColumns: '24px 1fr auto', alignItems: 'center', gap: 8, padding: '8px 9px', borderRadius: 8,
                      border: `1px solid ${active ? topic.color : prog?.quizPassed ? 'rgba(120,245,223,.25)' : 'rgba(255,255,255,.08)'}`,
                      background: active ? `${topic.color}22` : prog?.quizPassed ? 'rgba(120,245,223,.05)' : 'rgba(255,255,255,.03)',
                      color: active ? '#fff' : 'rgba(255,255,255,.66)', cursor: 'pointer',
                      textAlign: 'left', fontFamily: 'JetBrains Mono,monospace', fontSize: '.53rem',
                      transition: 'all .18s',
                    }}
                    title={`${topic.title} - ${totalTopicXp} XP`}
                  >
                    <span style={{ width: 24, height: 24, borderRadius: 6, display: 'grid', placeItems: 'center', background: `${topic.color}1a`, color: topic.color, flexShrink: 0, fontWeight: 900, fontSize: '.58rem' }}>{index + 1}</span>
                    <span style={{ lineHeight: 1.22 }}>
                      <span style={{ display: 'block' }}>{topic.title}</span>
                      <span style={{ display: 'block', color: subtitleColor, marginTop: 2 }}>{subtitle}</span>
                    </span>
                    <span style={{ color: '#78f5df', fontSize: '.5rem', whiteSpace: 'nowrap' }}>+{totalTopicXp} XP</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ marginTop: 16, padding: 12, border: '1px solid rgba(231,196,119,.25)', borderRadius: 12, background: 'rgba(0,0,0,.28)' }}>
            <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: '.55rem', color: 'rgba(255,255,255,.42)', marginBottom: 5 }}>TREE PROGRESS</div>
            <div style={{ color: '#e7c477', fontSize: '1.3rem', fontWeight: 900, lineHeight: 1 }}>{progressPct}%</div>
            <div style={{ height: 5, marginTop: 9, borderRadius: 999, background: 'rgba(255,255,255,.08)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progressPct}%`, background: 'linear-gradient(90deg,#78f5df,#e7c477)' }} />
            </div>
          </div>
        </aside>

        <section className="tree-stage" style={{ position: 'relative', zIndex: 2, minHeight: 'calc(100vh - 62px)', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(142,231,255,.045) 1px, transparent 1px), linear-gradient(90deg, rgba(142,231,255,.045) 1px, transparent 1px)', backgroundSize: '44px 44px' }} />
          <header style={{ position: 'absolute', top: 20, left: 24, right: 24, textAlign: 'center', zIndex: 4, pointerEvents: 'none' }}>
            <div style={{ color: '#8ee7ff', fontFamily: 'JetBrains Mono,monospace', fontSize: '.62rem', letterSpacing: '.22em' }}>BLOG SKILL TREE PLATFORM</div>
            <h1 style={{ color: '#d9fbff', textShadow: '0 0 18px rgba(142,231,255,.55)', fontSize: 'clamp(1.4rem, 3vw, 2.25rem)', margin: '4px 0 0', letterSpacing: 0 }}>Creative Growth Map</h1>
          </header>

          <svg viewBox="0 0 1000 700" preserveAspectRatio="xMidYMid meet" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 3 }}>
            <defs>
              <filter id="nodeGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
              <filter id="softGlow" x="-80%" y="-80%" width="260%" height="260%">
                <feGaussianBlur stdDeviation="10" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
              <radialGradient id="coreFill" cx="40%" cy="35%">
                <stop offset="0%" stopColor="#d9fbff" stopOpacity=".75" />
                <stop offset="55%" stopColor="#8ee7ff" stopOpacity=".4" />
                <stop offset="100%" stopColor="#07101b" stopOpacity=".95" />
              </radialGradient>
              <radialGradient id="starterGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(142,231,255,0.35)" />
                <stop offset="100%" stopColor="rgba(142,231,255,0)" />
              </radialGradient>
              <radialGradient id="bgVignette" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(142,231,255,0.04)" />
                <stop offset="100%" stopColor="rgba(0,0,0,0)" />
              </radialGradient>
            </defs>

            {/* Ambient glow rings around center */}
            <circle cx="500" cy="360" r="280" fill="url(#bgVignette)" />
            <circle cx="500" cy="360" r="260" fill="none" stroke="rgba(142,231,255,.06)" strokeWidth="1" strokeDasharray="6 14" />
            <circle cx="500" cy="360" r="180" fill="none" stroke="rgba(231,196,119,.06)" strokeWidth="1" strokeDasharray="4 12" />
            <circle cx="500" cy="360" r="100" fill="none" stroke="rgba(142,231,255,.08)" strokeWidth="1" />

            {/* Organic cubic bezier branches */}
            {SKILL_TREE_NODES.flatMap(parent => parent.children.map(childId => {
              const child = SKILL_TREE_NODES.find(node => node.id === childId);
              if (!child || !visibleIds.has(parent.id) || !visibleIds.has(child.id)) return null;
              const pStatus = nodeStatus(parent, completedIds, user?.plan);
              const cStatus = nodeStatus(child, completedIds, user?.plan);
              const isActive = pStatus === 'complete' || unlockedNodes.has(parent.id);
              const isDone = cStatus === 'complete';
              const x1 = parent.x * 10; const y1 = parent.y * 7;
              const x2 = child.x * 10;  const y2 = child.y * 7;
              const dx = x2 - x1; const dy = y2 - y1;
              // Perpendicular offset for organic S-curve
              const px = -dy * 0.28; const py = dx * 0.28;
              const d = `M ${x1} ${y1} C ${x1 + dx*0.38 + px} ${y1 + dy*0.38 + py} ${x2 - dx*0.38 + px} ${y2 - dy*0.38 + py} ${x2} ${y2}`;
              return (
                <g key={`${parent.id}-${child.id}`}>
                  {/* Glow layer */}
                  {isActive && (
                    <path d={d} fill="none"
                      stroke={isDone ? child.color : `${child.color}44`}
                      strokeWidth={isDone ? 8 : 5}
                      filter="url(#softGlow)" opacity=".5"
                      style={isActive && !isDone ? { animation: 'branchGlow 2.4s ease-in-out infinite' } : undefined}
                    />
                  )}
                  {/* Main line */}
                  <path d={d} fill="none"
                    stroke={isDone ? child.color : isActive ? `${child.color}99` : 'rgba(120,140,160,.18)'}
                    strokeWidth={isDone ? 3 : isActive ? 2 : 1.2}
                    strokeDasharray={isActive && !isDone ? '8 7' : undefined}
                    strokeLinecap="round"
                    style={isActive && !isDone ? { animation: 'dashFlow 1.4s linear infinite' } : undefined}
                  />
                </g>
              );
            }))}

            {/* Nodes */}
            {filteredNodes.map(node => {
              const status = nodeStatus(node, completedIds, user?.plan);
              const x = node.x * 10; const y = node.y * 7;
              const isSelected = selected.id === node.id;
              const isComplete = status === 'complete';
              const isAvailable = status === 'available';
              const isLocked = status === 'locked' || status === 'plan';
              const isUnlocked = unlockedNodes.has(node.id);
              const isStarter = node.id === 'starter';
              const lit = isComplete || isAvailable || isUnlocked;
              const pct = getNodePct(node.id, completedIds);
              const ringColor = isComplete ? node.color : isAvailable ? `${node.color}cc` : 'rgba(148,163,184,.35)';
              const sz = node.size;

              return (
                <g key={node.id} className="tree-node" transform={`translate(${x} ${y})`}
                  onClick={() => handleNodeClick(node)} style={{ cursor: 'pointer' }}>

                  {/* Outermost ambient glow (pulsing) */}
                  {lit && (
                    <circle r={sz + 22} fill="none"
                      stroke={node.color} strokeWidth="1.5" opacity=".22"
                      style={{ animation: 'treePulse 2.6s ease-in-out infinite', animationDelay: `${(node.x * 0.3) % 1.2}s` }}
                    />
                  )}

                  {/* Outer ring - double ring effect */}
                  <circle r={sz + 13}
                    fill={lit ? `${node.color}0c` : 'rgba(0,0,0,.18)'}
                    stroke={lit ? `${node.color}55` : 'rgba(255,255,255,.08)'}
                    strokeWidth="1"
                  />

                  {/* Middle ring */}
                  <circle r={sz + 6}
                    fill={isComplete ? `${node.color}1a` : 'rgba(5,9,18,.75)'}
                    stroke={ringColor}
                    strokeWidth={isSelected ? 3 : 1.8}
                    filter={lit ? 'url(#nodeGlow)' : undefined}
                  />

                  {/* Inner core */}
                  <circle r={sz}
                    fill={isStarter ? 'url(#coreFill)' : isComplete ? `${node.color}2e` : isAvailable ? `${node.color}1a` : 'rgba(6,10,20,.9)'}
                    stroke={isComplete ? node.color : isAvailable ? `${node.color}88` : 'rgba(148,163,184,.3)'}
                    strokeWidth="1.5"
                  />

                  {/* Inner gloss highlight */}
                  <ellipse rx={sz * 0.52} ry={sz * 0.28} cx={-sz * 0.14} cy={-sz * 0.32}
                    fill="rgba(255,255,255,.07)"
                  />

                  {/* Content: lock icon or node icon */}
                  {isLocked ? (
                    <g opacity=".6">
                      {/* Padlock shackle */}
                      <path d={`M -5 -2 L -5 -8 A 5 5 0 0 1 5 -8 L 5 -2`}
                        fill="none" stroke="rgba(255,255,255,.5)" strokeWidth="2" strokeLinecap="round"
                      />
                      {/* Padlock body */}
                      <rect x="-7" y="-2" width="14" height="11" rx="2.5"
                        fill="rgba(255,255,255,.14)" stroke="rgba(255,255,255,.45)" strokeWidth="1.2"
                      />
                      {/* Keyhole */}
                      <circle cx="0" cy="3.5" r="2" fill="rgba(0,0,0,.55)" />
                      <rect x="-1" y="4" width="2" height="3.5" rx="0.5" fill="rgba(0,0,0,.55)" />
                    </g>
                  ) : (
                    <text textAnchor="middle" y={isStarter ? 6 : 5}
                      fontFamily="JetBrains Mono,monospace"
                      fontSize={node.icon.length > 2 ? 11 : 15}
                      fontWeight="900"
                      fill={lit ? '#fff' : 'rgba(255,255,255,.4)'}
                    >
                      {node.icon}
                    </text>
                  )}

                  {/* Percentage badge (top-right of node) */}
                  {(isComplete || (isAvailable && pct > 0)) && (
                    <g transform={`translate(${sz - 2} ${-sz + 4})`}>
                      <rect x="-13" y="-8" width="26" height="13" rx="6"
                        fill={isComplete ? `${node.color}dd` : `${node.color}88`}
                      />
                      <text textAnchor="middle" y="3"
                        fontFamily="JetBrains Mono,monospace" fontSize="8" fontWeight="900"
                        fill={isComplete ? '#050810' : '#fff'}
                      >
                        {isComplete ? '100%' : `${pct}%`}
                      </text>
                    </g>
                  )}

                  {/* Node label */}
                  <text textAnchor="middle" y={sz + 18}
                    fontFamily="JetBrains Mono,monospace" fontSize="10" fontWeight="800"
                    fill={lit ? node.color : 'rgba(255,255,255,.38)'}
                    style={lit ? { filter: `drop-shadow(0 0 4px ${node.color}88)` } : undefined}
                  >
                    {node.label}
                  </text>

                  {/* XP label */}
                  <text textAnchor="middle" y={sz + 30}
                    fontFamily="JetBrains Mono,monospace" fontSize="8"
                    fill={lit ? 'rgba(142,231,255,.7)' : 'rgba(255,255,255,.22)'}
                  >
                    {node.xp} XP
                  </text>

                  {/* Selected indicator ring */}
                  {isSelected && (
                    <circle r={sz + 17} fill="none"
                      stroke={node.color} strokeWidth="2.5" opacity=".6"
                      strokeDasharray="6 4"
                    />
                  )}
                </g>
              );
            })}
          </svg>

          {error && <div style={{ position: 'absolute', left: 24, bottom: 24, zIndex: 6, maxWidth: 420, padding: 12, borderRadius: 10, border: '1px solid rgba(252,129,129,.35)', background: 'rgba(45,10,15,.78)', color: '#ffb4b4', fontSize: '.82rem' }}>{error}</div>}
        </section>

        <aside className="right-monitor" style={{ position: 'relative', zIndex: 2, padding: 16, borderLeft: '1px solid rgba(142,231,255,.18)', background: 'linear-gradient(180deg, rgba(9,18,28,.9), rgba(5,8,16,.94))', overflowY: 'auto' }}>
          <div style={{ border: '1px solid rgba(142,231,255,.32)', borderRadius: 14, padding: 14, background: 'rgba(142,231,255,.07)', boxShadow: 'inset 0 0 24px rgba(142,231,255,.08)' }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{ width: 68, height: 68, borderRadius: 14, border: `2px solid ${planColor}`, overflow: 'hidden', background: `${planColor}22`, display: 'grid', placeItems: 'center', color: planColor, fontWeight: 900, fontSize: '1.1rem', flexShrink: 0 }}>
                {user?.avatar ? <img src={user.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (user?.name || 'NX').slice(0, 2).toUpperCase()}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ color: '#fff', fontWeight: 900, lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name || 'Nexus User'}</div>
                <div style={{ color: planColor, fontFamily: 'JetBrains Mono,monospace', fontSize: '.6rem', marginTop: 4 }}>{user?.plan || 'FREE'} / LV {user?.level || 1}</div>
                <div style={{ color: 'rgba(255,255,255,.35)', fontFamily: 'JetBrains Mono,monospace', fontSize: '.5rem', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</div>
              </div>
            </div>
            <div style={{ marginTop: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'rgba(255,255,255,.6)', fontFamily: 'JetBrains Mono,monospace', fontSize: '.57rem', marginBottom: 5 }}>
                <span>{totalXp.toLocaleString()} XP</span>
                <span>{nextLevelXp} to next</span>
              </div>
              <div style={{ height: 6, borderRadius: 999, background: 'rgba(255,255,255,.08)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.min(100, ((totalXp % 200) / 200) * 100)}%`, background: `linear-gradient(90deg,${planColor},#8ee7ff)` }} />
              </div>
            </div>
          </div>

          <div style={{ marginTop: 12, border: '1px solid rgba(231,196,119,.28)', borderRadius: 14, padding: 14, background: 'rgba(0,0,0,.22)' }}>
            <div style={{ color: selected.color, fontFamily: 'JetBrains Mono,monospace', fontSize: '.57rem', letterSpacing: '.14em', textTransform: 'uppercase' }}>{selected.category}</div>
            <h2 style={{ color: '#fff', fontSize: '1.1rem', lineHeight: 1.25, margin: '6px 0 7px' }}>{selected.label}</h2>
            <p style={{ color: 'rgba(255,255,255,.62)', fontSize: '.78rem', lineHeight: 1.55, margin: 0 }}>{selected.summary}</p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
              <span className="badge b-green">+{selected.xp} XP</span>
              {selected.premium && <span className="badge b-purple">Premium</span>}
              {selected.maxOnly && <span className="badge b-yellow">MAX</span>}
              <span className="badge b-cyan">{nodeStatus(selected, completedIds, user?.plan)}</span>
            </div>
            <div style={{ marginTop: 12, display: 'grid', gap: 7 }}>
              {selected.lesson.map((line, index) => (
                <div key={line} style={{ display: 'flex', gap: 9, color: 'rgba(255,255,255,.7)', fontSize: '.76rem', lineHeight: 1.45 }}>
                  <span style={{ color: selected.color, fontFamily: 'JetBrains Mono,monospace', fontWeight: 900, flexShrink: 0 }}>{index + 1}</span>
                  <span>{line}</span>
                </div>
              ))}
            </div>
            {nodeStatus(selected, completedIds, user?.plan) === 'complete' ? (
              <button type="button" className="btn btn-secondary" disabled style={{ width: '100%', marginTop: 12 }}>Completed</button>
            ) : nodeStatus(selected, completedIds, user?.plan) === 'available' ? (
              <button type="button" className="btn btn-primary" onClick={() => completeSkill(selected)} disabled={saving} style={{ width: '100%', marginTop: 12 }}>
                {saving ? 'Saving...' : `Complete +${selected.xp} XP`}
              </button>
            ) : (
              <div style={{ marginTop: 12, padding: 10, borderRadius: 9, border: '1px solid rgba(231,196,119,.28)', color: '#e7c477', background: 'rgba(231,196,119,.08)', fontSize: '.73rem' }}>
                {lockMessage(selected)}
                {(selected.premium || selected.maxOnly) && <Link href="/profile?tab=subscription" style={{ display: 'block', marginTop: 7, color: '#8ee7ff' }}>Upgrade plan</Link>}
              </div>
            )}
          </div>

          <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div style={{ padding: 12, borderRadius: 12, background: 'rgba(120,245,223,.06)', border: '1px solid rgba(120,245,223,.15)' }}>
              <div style={{ color: '#78f5df', fontWeight: 900, fontSize: '1.2rem' }}>{completedCount}</div>
              <div style={{ color: 'rgba(255,255,255,.42)', fontFamily: 'JetBrains Mono,monospace', fontSize: '.5rem', marginTop: 2 }}>Complete</div>
            </div>
            <div style={{ padding: 12, borderRadius: 12, background: 'rgba(231,196,119,.06)', border: '1px solid rgba(231,196,119,.15)' }}>
              <div style={{ color: '#e7c477', fontWeight: 900, fontSize: '1.2rem' }}>{SKILL_TREE_NODES.length - completedCount}</div>
              <div style={{ color: 'rgba(255,255,255,.42)', fontFamily: 'JetBrains Mono,monospace', fontSize: '.5rem', marginTop: 2 }}>Remaining</div>
            </div>
          </div>

          <div style={{ marginTop: 12, padding: '10px 12px', borderRadius: 10, background: 'rgba(142,231,255,.05)', border: '1px solid rgba(142,231,255,.12)' }}>
            <div style={{ color: '#8ee7ff', fontFamily: 'JetBrains Mono,monospace', fontSize: '.56rem', marginBottom: 4 }}>BLOG TOPICS</div>
            <p style={{ color: 'rgba(255,255,255,.5)', fontSize: '.72rem', lineHeight: 1.5, margin: 0 }}>
              Left topic buttons show available read and quiz XP. Click a topic to unlock it, read, react, comment, generate, analyze, and submit the quiz.
            </p>
          </div>
        </aside>
      </main>

      {topicModalOpen && (
        <div className="modal-backdrop" onClick={event => { if (event.target === event.currentTarget) setTopicModalOpen(false); }}>
          <div className="modal-card">
            <div style={{ padding: '18px 22px 14px', borderBottom: '1px solid rgba(255,255,255,.08)', display: 'flex', gap: 14, alignItems: 'flex-start', flexShrink: 0, flexWrap: 'wrap' }}>
              <div style={{ width: 46, height: 46, borderRadius: 12, background: `${activeTopic.color}1a`, border: `1.5px solid ${activeTopic.color}55`, display: 'grid', placeItems: 'center', color: activeTopic.color, fontWeight: 900, fontSize: '.85rem', flexShrink: 0 }}>{activeTopic.icon}</div>
              <div style={{ flex: 1, minWidth: 220 }}>
                <div style={{ color: activeTopic.color, fontFamily: 'JetBrains Mono,monospace', fontSize: '.58rem', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 3 }}>BLOG TOPIC</div>
                <h2 style={{ color: '#fff', fontSize: '1.25rem', lineHeight: 1.2, margin: 0 }}>{activeTopic.title}</h2>
                <p style={{ color: 'rgba(255,255,255,.52)', fontSize: '.8rem', lineHeight: 1.5, margin: '5px 0 0' }}>{activeTopic.summary}</p>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0, flexWrap: 'wrap' }}>
                <span style={{ padding: '4px 10px', borderRadius: 20, background: 'rgba(120,245,223,.12)', color: '#78f5df', fontFamily: 'JetBrains Mono,monospace', fontSize: '.6rem', fontWeight: 800 }}>READ +{activeTopic.readXp} XP</span>
                <span style={{ padding: '4px 10px', borderRadius: 20, background: 'rgba(231,196,119,.12)', color: '#e7c477', fontFamily: 'JetBrains Mono,monospace', fontSize: '.6rem', fontWeight: 800 }}>QUIZ +{activeTopic.quizXp} XP</span>
                <button type="button" onClick={() => setTopicModalOpen(false)} style={{ width: 34, height: 34, borderRadius: '50%', border: '1px solid rgba(255,255,255,.18)', background: 'rgba(255,255,255,.06)', color: 'rgba(255,255,255,.7)', cursor: 'pointer', fontWeight: 900, fontSize: '1rem', display: 'grid', placeItems: 'center' }}>x</button>
              </div>
            </div>

            <div className="modal-body">
              <div className="modal-left">
                {topicLoading ? (
                  <div style={{ color: 'rgba(255,255,255,.4)', fontFamily: 'JetBrains Mono,monospace', fontSize: '.78rem', paddingTop: 20 }}>Loading content...</div>
                ) : (
                  <>
                    <div style={{ display: 'grid', gap: 14 }}>
                      {activeTopic.body.map((paragraph, index) => (
                        <div key={paragraph} style={{ display: 'flex', gap: 14 }}>
                          <div style={{ width: 26, height: 26, borderRadius: 8, background: `${activeTopic.color}18`, border: `1px solid ${activeTopic.color}44`, display: 'grid', placeItems: 'center', color: activeTopic.color, fontFamily: 'JetBrains Mono,monospace', fontWeight: 900, fontSize: '.65rem', flexShrink: 0, marginTop: 2 }}>{index + 1}</div>
                          <p style={{ margin: 0, color: 'rgba(255,255,255,.82)', fontSize: '.9rem', lineHeight: 1.7 }}>{paragraph}</p>
                        </div>
                      ))}
                    </div>

                    <div style={{ marginTop: 22, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,.07)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <button
                        type="button"
                        onClick={() => topicAction('read')}
                        disabled={saving || Boolean(topicState.progress?.read)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 9, padding: '12px 20px',
                          borderRadius: 10, border: `1px solid ${topicState.progress?.read ? 'rgba(120,245,223,.4)' : `${activeTopic.color}55`}`,
                          background: topicState.progress?.read ? 'rgba(120,245,223,.08)' : `${activeTopic.color}18`,
                          color: topicState.progress?.read ? '#78f5df' : '#fff',
                          cursor: topicState.progress?.read ? 'default' : 'pointer',
                          fontWeight: 700, fontSize: '.86rem',
                        }}
                      >
                        {topicState.progress?.read ? '✓ Уншсан — XP нэмэгдлээ' : `Уншсан гэж тэмдэглэх +${activeTopic.readXp} XP`}
                      </button>

                      {topicState.progress?.read && !topicState.progress?.quizPassed && (
                        <button
                          type="button"
                          onClick={() => quizSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                          style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                            padding: '13px 20px', borderRadius: 10, fontWeight: 800, fontSize: '.9rem',
                            border: '1.5px solid rgba(120,245,223,.55)',
                            background: 'linear-gradient(135deg,rgba(120,245,223,.18),rgba(120,245,223,.07))',
                            color: '#78f5df', cursor: 'pointer',
                            animation: 'quizGlow 2s ease-in-out infinite',
                          }}
                        >
                          ⚡ Дараагийн алхам: Quiz → +{activeTopic.quizXp} XP
                        </button>
                      )}
                    </div>

                    <div style={{ marginTop: 14, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {REACTIONS.map(reaction => {
                        const mine = topicState.reactions.mine.includes(reaction.type);
                        return (
                          <button
                            key={reaction.type}
                            type="button"
                            onClick={() => topicAction('reaction', { type: reaction.type })}
                            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 20, border: `1px solid ${mine ? activeTopic.color : 'rgba(255,255,255,.12)'}`, background: mine ? `${activeTopic.color}22` : 'rgba(255,255,255,.04)', color: mine ? activeTopic.color : 'rgba(255,255,255,.65)', cursor: 'pointer', fontSize: '.82rem', fontWeight: mine ? 700 : 400, transition: 'all .18s' }}
                          >
                            {reaction.label} <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: '.7rem', opacity: .7 }}>{topicState.reactions.counts[reaction.type] || 0}</span>
                          </button>
                        );
                      })}
                    </div>

                    <div style={{ marginTop: 18, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,.07)' }}>
                      <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: '.58rem', color: 'rgba(255,255,255,.4)', marginBottom: 10, letterSpacing: '.1em' }}>AI TOOLS</div>
                      <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap' }}>
                        <button type="button" onClick={() => { setAiMode(null); setAiResult(null); setTldrResult(null); topicAction('ai_generate'); }} disabled={saving} className="btn btn-sm" style={{ flex: '1 1 140px' }}>
                          Generate Content
                        </button>
                        <button type="button" onClick={() => { setAiMode(null); setAiResult(null); setTldrResult(null); topicAction('ai_analyze'); }} disabled={saving} className="btn btn-sm" style={{ flex: '1 1 140px' }}>
                          Analyze Topic
                        </button>
                        <button type="button" onClick={() => { setTldrResult(null); topicAction('tldr'); }} disabled={saving} className="btn btn-sm" style={{ flex: '1 1 140px', borderColor: 'rgba(231,196,119,.45)', color: '#e7c477' }}>
                          {saving ? '...' : 'TLDR'}
                        </button>
                      </div>

                      {tldrResult && (
                        <div style={{ marginTop: 12, padding: '14px 16px', borderRadius: 12, background: 'rgba(231,196,119,.07)', border: '1px solid rgba(231,196,119,.28)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                            <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: '.6rem', color: '#e7c477', letterSpacing: '.1em' }}>TLDR</span>
                            <span style={{ flex: 1, height: 1, background: 'rgba(231,196,119,.22)' }} />
                          </div>
                          <p style={{ margin: 0, color: 'rgba(255,255,255,.88)', fontSize: '.88rem', lineHeight: 1.65 }}>{tldrResult}</p>
                        </div>
                      )}

                      {genResult && (
                        <div className="ai-card" style={{ background: `${activeTopic.color}0a`, border: `1px solid ${activeTopic.color}33` }}>
                          <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: '.6rem', color: activeTopic.color, marginBottom: 8, letterSpacing: '.1em' }}>GENERATED CONTENT DRAFT</div>
                          <div style={{ color: '#fff', fontWeight: 700, fontSize: '.95rem', marginBottom: 12 }}>{genResult.title}</div>
                          <div style={{ marginBottom: 12 }}>
                            <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: '.6rem', color: 'rgba(255,255,255,.42)', marginBottom: 6 }}>OUTLINE</div>
                            <div style={{ display: 'grid', gap: 5 }}>
                              {genResult.outline.map((item, index) => (
                                <div key={item} style={{ display: 'flex', gap: 10, color: 'rgba(255,255,255,.78)', fontSize: '.82rem' }}>
                                  <span style={{ color: activeTopic.color, fontFamily: 'JetBrains Mono,monospace', fontWeight: 900, flexShrink: 0 }}>{index + 1}.</span>
                                  <span>{item}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div style={{ borderTop: '1px solid rgba(255,255,255,.08)', paddingTop: 10 }}>
                            <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: '.6rem', color: 'rgba(255,255,255,.42)', marginBottom: 6 }}>DRAFT</div>
                            <div style={{ color: 'rgba(255,255,255,.75)', fontSize: '.82rem', lineHeight: 1.65, whiteSpace: 'pre-line' }}>{genResult.draft}</div>
                          </div>
                        </div>
                      )}

                      {anaResult && (
                        <div className="ai-card" style={{ background: 'rgba(231,196,119,.06)', border: '1px solid rgba(231,196,119,.22)' }}>
                          <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: '.6rem', color: '#e7c477', marginBottom: 10, letterSpacing: '.1em' }}>TOPIC ANALYSIS</div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '.78rem', color: 'rgba(255,255,255,.65)' }}>
                            <span>SEO Score</span>
                            <span style={{ color: '#e7c477', fontWeight: 700 }}>{anaResult.seoScore}/100</span>
                          </div>
                          <div style={{ height: 6, borderRadius: 999, background: 'rgba(255,255,255,.08)', overflow: 'hidden', marginBottom: 12 }}>
                            <div style={{ height: '100%', width: `${anaResult.seoScore}%`, background: 'linear-gradient(90deg,#e7c477,#78f5df)', borderRadius: 999 }} />
                          </div>
                          <div style={{ display: 'grid', gap: 10 }}>
                            <div>
                              <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: '.6rem', color: 'rgba(255,255,255,.42)', marginBottom: 6 }}>STRENGTHS</div>
                              {anaResult.strengths.map(item => <div key={item} style={{ color: 'rgba(255,255,255,.78)', fontSize: '.8rem', marginBottom: 4 }}>OK - {item}</div>)}
                            </div>
                            <div>
                              <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: '.6rem', color: 'rgba(255,255,255,.42)', marginBottom: 6 }}>SUGGESTIONS</div>
                              {anaResult.suggestions.map(item => <div key={item} style={{ color: 'rgba(255,255,255,.72)', fontSize: '.8rem', marginBottom: 4 }}>- {item}</div>)}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              <div className="modal-right" ref={quizSectionRef}>
                <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: '.6rem', color: activeTopic.color, marginBottom: 12, letterSpacing: '.1em' }}>KNOWLEDGE QUIZ</div>

                {topicState.progress?.quizPassed ? (
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ padding: '14px 16px', borderRadius: 12, background: 'rgba(120,245,223,.08)', border: '1px solid rgba(120,245,223,.25)' }}>
                      <div style={{ color: '#78f5df', fontWeight: 900, fontSize: '.95rem' }}>Quiz Passed</div>
                      <div style={{ color: 'rgba(255,255,255,.6)', fontSize: '.78rem', marginTop: 4 }}>Score: {topicState.progress.quizScore}% - +{activeTopic.quizXp} XP earned</div>
                    </div>
                    {(() => {
                      const idx = SKILL_TOPICS.findIndex(t => t.id === activeTopic.id);
                      const next = SKILL_TOPICS[idx + 1];
                      return next ? (
                        <button
                          type="button"
                          onClick={() => openTopic(next)}
                          style={{
                            width: '100%', marginTop: 10, padding: '12px 16px', borderRadius: 12,
                            border: '1.5px solid rgba(120,245,223,.5)',
                            background: 'linear-gradient(135deg,rgba(120,245,223,.2),rgba(120,245,223,.08))',
                            color: '#78f5df', fontWeight: 800, fontSize: '.88rem',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                          }}
                        >
                          Next Topic: {next.title} →
                        </button>
                      ) : (
                        <div style={{ marginTop: 10, padding: '10px 14px', borderRadius: 10, background: 'rgba(231,196,119,.08)', border: '1px solid rgba(231,196,119,.28)', color: '#e7c477', fontSize: '.82rem', textAlign: 'center', fontWeight: 700 }}>
                          All topics completed!
                        </div>
                      );
                    })()}
                  </div>
                ) : quizSubmitted ? (
                  <div style={{ padding: '14px 16px', borderRadius: 12, background: 'rgba(231,196,119,.08)', border: '1px solid rgba(231,196,119,.25)', marginBottom: 14 }}>
                    <div style={{ color: '#e7c477', fontWeight: 900, fontSize: '.95rem' }}>Оноо: {topicState.attempts[0]?.score ?? 0}%</div>
                    <div style={{ color: 'rgba(255,255,255,.6)', fontSize: '.78rem', marginTop: 4 }}>Тэнцэхийн тулд 70%+ хэрэгтэй.</div>
                    <button
                      type="button"
                      onClick={() => { setQuizSubmitted(false); setAnswers([]); }}
                      style={{ marginTop: 10, padding: '7px 16px', borderRadius: 8, border: '1px solid rgba(231,196,119,.45)', background: 'rgba(231,196,119,.12)', color: '#e7c477', fontWeight: 700, fontSize: '.78rem', cursor: 'pointer' }}
                    >
                      🔄 Дахин оролдох
                    </button>
                  </div>
                ) : null}

                <div style={{ display: 'grid', gap: 16 }}>
                  {activeTopic.quiz.map((question, qIndex) => {
                    const answered = answers[qIndex] !== undefined;
                    const passed = Boolean(topicState.progress?.quizPassed);
                    const isCorrect = quizSubmitted && answers[qIndex] === question.answer;
                    const isWrong = quizSubmitted && answered && answers[qIndex] !== question.answer;
                    return (
                      <div key={question.question} style={{ padding: '14px 16px', borderRadius: 12, background: isCorrect ? 'rgba(120,245,223,.06)' : isWrong ? 'rgba(252,129,129,.06)' : 'rgba(255,255,255,.04)', border: `1px solid ${isCorrect ? 'rgba(120,245,223,.25)' : isWrong ? 'rgba(252,129,129,.22)' : 'rgba(255,255,255,.09)'}` }}>
                        <div style={{ color: '#fff', fontSize: '.86rem', fontWeight: 600, marginBottom: 10, lineHeight: 1.45 }}>
                          <span style={{ color: activeTopic.color, fontFamily: 'JetBrains Mono,monospace', marginRight: 6 }}>{qIndex + 1}.</span>
                          {question.question}
                        </div>
                        <div style={{ display: 'grid', gap: 7 }}>
                          {question.options.map((option, optionIndex) => {
                            const selectedOption = answers[qIndex] === optionIndex;
                            const revealCorrect = quizSubmitted && optionIndex === question.answer;
                            const revealWrong = quizSubmitted && selectedOption && optionIndex !== question.answer;
                            const locked = passed;
                            return (
                              <label
                                key={option}
                                style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '8px 12px', borderRadius: 9, border: `1px solid ${revealCorrect ? 'rgba(120,245,223,.4)' : revealWrong ? 'rgba(252,129,129,.35)' : selectedOption ? `${activeTopic.color}55` : 'rgba(255,255,255,.08)'}`, background: revealCorrect ? 'rgba(120,245,223,.08)' : revealWrong ? 'rgba(252,129,129,.07)' : selectedOption ? `${activeTopic.color}14` : 'rgba(255,255,255,.02)', cursor: locked ? 'default' : 'pointer', transition: 'all .15s' }}
                              >
                                <input
                                  type="radio"
                                  name={`modal-quiz-${qIndex}`}
                                  checked={selectedOption}
                                  disabled={locked}
                                  onChange={() => !locked && setAnswers(current => { const next = [...current]; next[qIndex] = optionIndex; return next; })}
                                  style={{ marginTop: 2, accentColor: activeTopic.color, flexShrink: 0 }}
                                />
                                <span style={{ color: revealCorrect ? '#78f5df' : revealWrong ? '#fc8181' : 'rgba(255,255,255,.78)', fontSize: '.83rem', lineHeight: 1.4 }}>
                                  {option}{revealCorrect ? ' ✓' : ''}{revealWrong ? ' ✗' : ''}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={submitQuiz}
                  disabled={saving || Boolean(topicState.progress?.quizPassed) || answers.length < activeTopic.quiz.length || answers.some(answer => answer === undefined)}
                  style={{
                    width: '100%', marginTop: 16, padding: '13px 16px', borderRadius: 12,
                    border: `1px solid ${topicState.progress?.quizPassed ? 'rgba(120,245,223,.3)' : `${activeTopic.color}55`}`,
                    background: topicState.progress?.quizPassed ? 'rgba(120,245,223,.08)' : `linear-gradient(135deg, ${activeTopic.color}33, ${activeTopic.color}18)`,
                    color: topicState.progress?.quizPassed ? '#78f5df' : '#fff',
                    cursor: topicState.progress?.quizPassed ? 'default' : 'pointer',
                    fontWeight: 800, fontSize: '.88rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  }}
                >
                  {saving ? 'Submitting...' : topicState.progress?.quizPassed ? 'Quiz Complete' : `Submit Quiz +${activeTopic.quizXp} XP`}
                </button>

                {topicState.attempts.length > 0 && (
                  <div style={{ marginTop: 14 }}>
                    <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: '.56rem', color: 'rgba(255,255,255,.38)', marginBottom: 7 }}>ATTEMPT HISTORY</div>
                    <div style={{ display: 'grid', gap: 5 }}>
                      {topicState.attempts.slice(0, 3).map((attempt, index) => (
                        <div key={attempt.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', borderRadius: 8, background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.06)', fontSize: '.72rem', color: 'rgba(255,255,255,.55)' }}>
                          <span>Attempt {index + 1}</span>
                          <span style={{ color: attempt.passed ? '#78f5df' : '#fc8181', fontWeight: 700 }}>{attempt.score}% {attempt.passed ? 'OK' : 'Retry'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="modal-comments">
              <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: '.58rem', color: 'rgba(255,255,255,.4)', marginBottom: 10, letterSpacing: '.1em' }}>COMMENTS</div>
              <div style={{ display: 'flex', gap: 9, marginBottom: 12, flexWrap: 'wrap' }}>
                <input
                  className="input"
                  placeholder="Share your thoughts on this topic..."
                  value={comment}
                  onChange={event => setComment(event.target.value)}
                  style={{ flex: '1 1 260px', padding: '9px 12px', fontSize: '.82rem' }}
                  onKeyDown={event => event.key === 'Enter' && comment.trim().length >= 2 && topicAction('comment', { content: comment })}
                />
                <button type="button" className="btn btn-primary btn-sm" disabled={saving || comment.trim().length < 2} onClick={() => topicAction('comment', { content: comment })} style={{ padding: '9px 16px' }}>
                  Post
                </button>
              </div>
              <div style={{ display: 'grid', gap: 8, maxHeight: 180, overflowY: 'auto' }}>
                {topicLoading ? (
                  <div style={{ color: 'rgba(255,255,255,.38)', fontSize: '.78rem' }}>Loading...</div>
                ) : topicState.comments.length === 0 ? (
                  <div style={{ color: 'rgba(255,255,255,.28)', fontSize: '.78rem', fontFamily: 'JetBrains Mono,monospace' }}>No comments yet. Be the first.</div>
                ) : topicState.comments.map(item => (
                  <div key={item.id} style={{ padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, color: 'rgba(255,255,255,.38)', fontSize: '.6rem', fontFamily: 'JetBrains Mono,monospace', marginBottom: 5 }}>
                      <span>{item.author.name} - Lv.{item.author.level} - {item.author.plan}</span>
                      <span>{new Date(item.createdAt).toLocaleDateString('mn-MN')}</span>
                    </div>
                    <div style={{ color: 'rgba(255,255,255,.82)', fontSize: '.83rem', lineHeight: 1.5 }}>{item.content}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
