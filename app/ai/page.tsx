'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';

type Action = 'chat' | 'image' | 'video' | 'generate_draft' | 'recommend' | 'analyze' | 'deepseek';

type ChatMessage = { role: 'user' | 'assistant'; content: string; imagePreview?: string };

const TABS: { k: Action; l: string; i: string; c: string }[] = [
  { k: 'chat',            l: 'AI Chat',        i: '🤖', c: 'var(--cyan)' },
  { k: 'image',           l: 'Image Analysis', i: '🖼️', c: 'var(--purple)' },
  { k: 'video',           l: 'Video Analysis', i: '🎬', c: 'var(--magenta)' },
  { k: 'generate_draft',  l: 'Generate Draft', i: '✍️', c: 'var(--cyan)' },
  { k: 'recommend',       l: 'Recommend',      i: '💡', c: 'var(--purple)' },
  { k: 'analyze',         l: 'Analyze Text',   i: '🔍', c: 'var(--green)' },
  { k: 'deepseek',        l: 'DeepSeek R1',    i: '🧠', c: 'var(--orange)' },
];

export default function AIPage() {
  const router = useRouter();
  const [active, setActive] = useState<Action>('chat');
  const [loading, setLoading] = useState(false);
  const [log, setLog] = useState<string[]>([]);

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // DeepSeek state
  const [dsMessages, setDsMessages] = useState<ChatMessage[]>([]);
  const [dsInput, setDsInput] = useState('');
  const dsEndRef = useRef<HTMLDivElement>(null);

  // Image state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [imageQuestion, setImageQuestion] = useState('');
  const [imageResult, setImageResult] = useState('');

  // Video state
  const [videoUrl, setVideoUrl] = useState('');
  const [videoQuestion, setVideoQuestion] = useState('');
  const [videoResult, setVideoResult] = useState('');

  // Existing tabs state
  const [topic, setTopic] = useState('');
  const [text, setText] = useState('');
  const [result, setResult] = useState<Record<string, unknown> | null>(null);

  const addLog = (m: string) => setLog(p => [`[${new Date().toLocaleTimeString()}] ${m}`, ...p.slice(0, 14)]);

  useEffect(() => { if (!localStorage.getItem('nexus_token')) router.replace('/'); }, [router]);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMessages]);
  useEffect(() => { dsEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [dsMessages]);

  async function apiCall(action: string, payload: Record<string, unknown>) {
    const token = localStorage.getItem('nexus_token');
    if (!token) { router.replace('/'); return null; }
    addLog(`INIT: ${action.toUpperCase()}`);
    const res = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ action, payload }),
    });
    const data = await res.json();
    if (!res.ok) { addLog(`ERR: ${data.message}`); throw new Error(data.message); }
    addLog(`OK: ${String(data.action)}`);
    return data;
  }

  async function sendChat() {
    if (!chatInput.trim()) return;
    const userMsg: ChatMessage = { role: 'user', content: chatInput };
    const newMessages = [...chatMessages, userMsg];
    setChatMessages(newMessages);
    setChatInput('');
    setLoading(true);
    try {
      const data = await apiCall('chat', {
        messages: newMessages.map(m => ({ role: m.role, content: m.content })),
      });
      if (data) {
        setChatMessages(prev => [...prev, { role: 'assistant', content: data.result?.reply || '' }]);
      }
    } catch (e) {
      setChatMessages(prev => [...prev, { role: 'assistant', content: `Error: ${e instanceof Error ? e.message : 'Failed'}` }]);
    } finally {
      setLoading(false);
    }
  }

  function handleImageFile(file: File) {
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = e => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);
    setImageResult('');
  }

  async function analyzeImage() {
    if (!imageFile && !imagePreview) return;
    setLoading(true);
    setImageResult('');
    try {
      const base64 = imagePreview.split(',')[1];
      const mediaType = imageFile?.type || 'image/jpeg';
      const data = await apiCall('analyze_image', { imageBase64: base64, mediaType, question: imageQuestion });
      if (data) setImageResult(data.result?.analysis || '');
    } catch (e) {
      setImageResult(`Error: ${e instanceof Error ? e.message : 'Analysis failed'}`);
    } finally {
      setLoading(false);
    }
  }

  async function analyzeVideo() {
    if (!videoUrl.trim()) return;
    setLoading(true);
    setVideoResult('');
    try {
      const data = await apiCall('analyze_video', { videoUrl, question: videoQuestion });
      if (data) setVideoResult(data.result?.analysis || '');
    } catch (e) {
      setVideoResult(`Error: ${e instanceof Error ? e.message : 'Analysis failed'}`);
    } finally {
      setLoading(false);
    }
  }

  async function sendDeepSeek() {
    if (!dsInput.trim()) return;
    const userMsg: ChatMessage = { role: 'user', content: dsInput };
    const newMessages = [...dsMessages, userMsg];
    setDsMessages(newMessages);
    setDsInput('');
    setLoading(true);
    try {
      const data = await apiCall('deepseek', {
        messages: newMessages.map(m => ({ role: m.role, content: m.content })),
      });
      if (data) {
        setDsMessages(prev => [...prev, { role: 'assistant', content: data.result?.reply || '' }]);
      }
    } catch (e) {
      setDsMessages(prev => [...prev, { role: 'assistant', content: `Error: ${e instanceof Error ? e.message : 'Failed'}` }]);
    } finally {
      setLoading(false);
    }
  }

  async function callLegacy(action: Action, payload: Record<string, unknown>) {
    setLoading(true);
    setResult(null);
    try {
      const data = await apiCall(action, payload);
      if (data) setResult(data);
    } catch { /* logged */ } finally {
      setLoading(false);
    }
  }

  const res = result?.result as Record<string, unknown> | undefined;
  const currentTab = TABS.find(t => t.k === active)!;

  return (
    <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh' }}>
      <Navbar />
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        .chat-bubble-user { background: linear-gradient(135deg,rgba(99,179,237,0.18),rgba(99,179,237,0.08)); border:1px solid rgba(99,179,237,0.22); border-radius:14px 14px 4px 14px; }
        .chat-bubble-ai { background: rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:14px 14px 14px 4px; }
        .drop-zone { border:2px dashed rgba(159,122,234,0.35); border-radius:12px; transition:all 0.2s; }
        .drop-zone:hover, .drop-zone.drag-over { border-color:rgba(159,122,234,0.7); background:rgba(159,122,234,0.07); }
        @media(max-width:900px){ .ai-grid{grid-template-columns:1fr !important;} }
      `}</style>

      <div className="container" style={{ paddingTop: 28, paddingBottom: 60 }}>
        <div style={{ marginBottom: 28 }}>
          <div className="editorial-label" style={{ marginBottom: 8 }}>NexusAI Agent v2.0</div>
          <h1 className="editorial-title" style={{ fontSize: 'clamp(1.4rem,3vw,2rem)', marginBottom: 6 }}>
            AI <span className="grad-text">Agent Terminal</span>
          </h1>
          <p style={{ color: 'var(--text2)', fontSize: '.88rem' }}>Chat, image analysis, video analysis, content generation — all in one agent</p>
        </div>

        {/* Tab row */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
          {TABS.map(t => (
            <button key={t.k} onClick={() => { setActive(t.k); setResult(null); }}
              style={{ padding: '10px 14px', background: active === t.k ? `${t.c}18` : 'rgba(99,179,237,0.03)', border: `1px solid ${active === t.k ? t.c : 'rgba(99,179,237,0.1)'}`, borderRadius: 10, cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 7, boxShadow: active === t.k ? `0 0 12px ${t.c}33` : 'none' }}>
              <span style={{ fontSize: '1rem' }}>{t.i}</span>
              <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: '.6rem', color: active === t.k ? t.c : 'var(--text3)', letterSpacing: '.05em' }}>{t.l}</span>
            </button>
          ))}
        </div>

        <div className="ai-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 22, alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* ── CHAT TAB ── */}
            {active === 'chat' && (
              <div className="glass-card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', height: 520 }}>
                <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(99,179,237,0.08)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green)', boxShadow: '0 0 6px var(--green)' }} />
                  <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: '.62rem', color: 'var(--cyan)' }}>AI CHAT — ask anything</span>
                </div>
                <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {chatMessages.length === 0 && (
                    <div style={{ textAlign: 'center', color: 'var(--text3)', fontFamily: 'JetBrains Mono,monospace', fontSize: '.7rem', paddingTop: 60, opacity: 0.6 }}>
                      // Ask anything — content, code, images, strategy...
                    </div>
                  )}
                  {chatMessages.map((m, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                      <div className={m.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'}
                        style={{ maxWidth: '82%', padding: '10px 14px', fontSize: '.88rem', lineHeight: 1.6, color: 'var(--text)', whiteSpace: 'pre-wrap' }}>
                        {m.role === 'assistant' && <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: '.55rem', color: 'var(--cyan)', marginBottom: 5 }}>NexusAI</div>}
                        {m.content}
                      </div>
                    </div>
                  ))}
                  {loading && (
                    <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                      <div className="chat-bubble-ai" style={{ padding: '10px 16px' }}>
                        <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                          {[0, 1, 2].map(i => <span key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--cyan)', opacity: 0.7, animation: `treePulse 1s ease-in-out ${i * 0.2}s infinite` }} />)}
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>
                <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(99,179,237,0.08)', display: 'flex', gap: 8 }}>
                  <input className="input" value={chatInput} onChange={e => setChatInput(e.target.value)}
                    placeholder="Type your question..."
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChat(); } }}
                    style={{ flex: 1, padding: '10px 14px', fontSize: '.88rem' }} disabled={loading} />
                  <button onClick={sendChat} disabled={loading || !chatInput.trim()} className="btn btn-primary" style={{ padding: '10px 18px' }}>
                    {loading ? '...' : '▶'}
                  </button>
                  {chatMessages.length > 0 && (
                    <button onClick={() => setChatMessages([])} className="btn" style={{ padding: '10px 12px', fontSize: '.7rem' }}>
                      Clear
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* ── IMAGE ANALYSIS TAB ── */}
            {active === 'image' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="glass-card" style={{ padding: 22 }}>
                  <div className="corner c-tl" />
                  <div className="editorial-label" style={{ marginBottom: 14 }}>Upload Image</div>
                  <div
                    className="drop-zone"
                    style={{ padding: 28, textAlign: 'center', cursor: 'pointer', position: 'relative', background: imagePreview ? 'transparent' : undefined }}
                    onClick={() => document.getElementById('img-input')?.click()}
                    onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('drag-over'); }}
                    onDragLeave={e => e.currentTarget.classList.remove('drag-over')}
                    onDrop={e => { e.preventDefault(); e.currentTarget.classList.remove('drag-over'); const f = e.dataTransfer.files[0]; if (f?.type.startsWith('image/')) handleImageFile(f); }}
                  >
                    <input id="img-input" type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) handleImageFile(f); }} />
                    {imagePreview ? (
                      <div>
                        <img src={imagePreview} alt="Preview" style={{ maxHeight: 220, maxWidth: '100%', borderRadius: 8, objectFit: 'contain' }} />
                        <div style={{ marginTop: 8, fontFamily: 'JetBrains Mono,monospace', fontSize: '.6rem', color: 'var(--text3)' }}>{imageFile?.name} · Click to change</div>
                      </div>
                    ) : (
                      <>
                        <div style={{ fontSize: '2.5rem', marginBottom: 10 }}>🖼️</div>
                        <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: '.68rem', color: 'var(--text3)' }}>Click or drag & drop an image</div>
                        <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: '.58rem', color: 'var(--text3)', marginTop: 4, opacity: 0.6 }}>JPG, PNG, GIF, WEBP</div>
                      </>
                    )}
                  </div>
                  <input className="input" placeholder="What do you want to know about this image? (optional)" value={imageQuestion} onChange={e => setImageQuestion(e.target.value)} style={{ marginTop: 12 }} />
                  <button onClick={analyzeImage} disabled={loading || !imagePreview} className="btn btn-primary" style={{ width: '100%', marginTop: 12 }}>
                    {loading ? <><div style={{ width: 18, height: 18, border: '2px solid rgba(5,8,16,0.3)', borderTopColor: '#050810', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> Analyzing...</> : '🔍 Analyze Image'}
                  </button>
                </div>
                {imageResult && (
                  <div className="glass-card" style={{ padding: 22, animation: 'fadeUp 0.3s ease', border: '1px solid rgba(159,122,234,0.22)' }}>
                    <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: '.6rem', color: 'var(--purple)', marginBottom: 10 }}>IMAGE ANALYSIS RESULT</div>
                    <div style={{ fontSize: '.9rem', lineHeight: 1.7, color: 'var(--text)', whiteSpace: 'pre-wrap' }}>{imageResult}</div>
                  </div>
                )}
              </div>
            )}

            {/* ── VIDEO ANALYSIS TAB ── */}
            {active === 'video' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="glass-card" style={{ padding: 22 }}>
                  <div className="corner c-tl" />
                  <div className="editorial-label" style={{ marginBottom: 14 }}>Video Analysis</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <input className="input" placeholder="YouTube URL or video URL (e.g. https://youtube.com/watch?v=...)" value={videoUrl} onChange={e => setVideoUrl(e.target.value)} />
                    <textarea className="input" placeholder="What do you want to know about this video? (optional)" value={videoQuestion} onChange={e => setVideoQuestion(e.target.value)} rows={3} style={{ resize: 'vertical' }} />
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {['Analyze content topic', 'Target audience', 'SEO potential', 'Key takeaways', 'Thumbnail quality'].map(q => (
                        <button key={q} onClick={() => setVideoQuestion(q)} className="tag-pill t-cyan" style={{ cursor: 'pointer', fontSize: '.6rem' }}>{q}</button>
                      ))}
                    </div>
                    <button onClick={analyzeVideo} disabled={loading || !videoUrl.trim()} className="btn btn-primary">
                      {loading ? <><div style={{ width: 18, height: 18, border: '2px solid rgba(5,8,16,0.3)', borderTopColor: '#050810', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> Analyzing...</> : '🎬 Analyze Video'}
                    </button>
                  </div>
                </div>
                {videoResult && (
                  <div className="glass-card" style={{ padding: 22, animation: 'fadeUp 0.3s ease', border: '1px solid rgba(237,100,166,0.22)' }}>
                    <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: '.6rem', color: 'var(--magenta)', marginBottom: 10 }}>VIDEO ANALYSIS RESULT</div>
                    <div style={{ fontSize: '.9rem', lineHeight: 1.7, color: 'var(--text)', whiteSpace: 'pre-wrap' }}>{videoResult}</div>
                  </div>
                )}
              </div>
            )}

            {/* ── GENERATE DRAFT TAB ── */}
            {active === 'generate_draft' && (
              <div className="glass-card" style={{ padding: 22 }}>
                <div className="corner c-tl" /><div className="corner c-tr" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div className="editorial-label">Define Topic</div>
                  <input className="input" placeholder="e.g. TikTok algorithm 2025..." value={topic} onChange={e => setTopic(e.target.value)} />
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {['TikTok algorithm', 'AI tools for creators', 'Personal brand strategy', 'SEO in 2025', 'Email marketing'].map(t => (
                      <button key={t} onClick={() => setTopic(t)} className="tag-pill t-cyan" style={{ cursor: 'pointer', fontSize: '.6rem' }}>{t}</button>
                    ))}
                  </div>
                  <button onClick={() => callLegacy('generate_draft', { topic })} disabled={loading || !topic.trim()} className="btn btn-primary">
                    {loading ? <><div style={{ width: 18, height: 18, border: '2px solid rgba(5,8,16,0.3)', borderTopColor: '#050810', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> Generating...</> : '▶ Generate Draft'}
                  </button>
                </div>
              </div>
            )}

            {/* ── RECOMMEND TAB ── */}
            {active === 'recommend' && (
              <div className="glass-card" style={{ padding: 22 }}>
                <div className="corner c-tl" /><div className="corner c-tr" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div className="editorial-label">Topic Recommendations Based on Your Level</div>
                  <div className="glass-card" style={{ padding: 14, display: 'flex', gap: 10, alignItems: 'center' }}>
                    <span style={{ fontSize: '1.3rem' }}>👤</span>
                    <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: '.7rem', color: 'var(--text2)' }}>Profile data will be used to personalize suggestions.</div>
                  </div>
                  <button onClick={() => { const u = JSON.parse(localStorage.getItem('nexus_user') || '{}'); callLegacy('recommend', { level: u.level || 1 }); }} disabled={loading} className="btn btn-purple">
                    {loading ? <><div style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> Processing...</> : '▶ Get Recommendations'}
                  </button>
                </div>
              </div>
            )}

            {/* ── ANALYZE TAB ── */}
            {active === 'analyze' && (
              <div className="glass-card" style={{ padding: 22 }}>
                <div className="corner c-tl" /><div className="corner c-tr" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div className="editorial-label">Content Input</div>
                  <textarea className="input" placeholder="Paste content to analyze..." value={text} onChange={e => setText(e.target.value)} style={{ minHeight: 140, fontFamily: 'JetBrains Mono,monospace', fontSize: '.82rem' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'JetBrains Mono,monospace', fontSize: '.6rem', color: 'var(--text3)' }}>
                    <span>{text.length} chars</span><span>{text.split(/\s+/).filter(Boolean).length} words</span><span>~{Math.max(1, Math.ceil(text.split(/\s+/).length / 200))} min read</span>
                  </div>
                  <button onClick={() => callLegacy('analyze', { text })} disabled={loading || !text.trim()} style={{ background: 'linear-gradient(90deg,var(--green),rgba(104,211,145,0.8))', border: 'none', borderRadius: 7, padding: '12px 24px', fontFamily: 'JetBrains Mono,monospace', fontSize: '.7rem', color: '#050810', cursor: loading || !text.trim() ? 'not-allowed' : 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                    {loading ? <><div style={{ width: 18, height: 18, border: '2px solid rgba(5,8,16,0.3)', borderTopColor: '#050810', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> Analyzing...</> : '▶ Analyze Content'}
                  </button>
                </div>
              </div>
            )}

            {/* ── DEEPSEEK TAB ── */}
            {active === 'deepseek' && (
              <div className="glass-card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', height: 520, border: '1px solid rgba(251,146,60,0.22)' }}>
                <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(251,146,60,0.12)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--orange)', boxShadow: '0 0 6px var(--orange)' }} />
                  <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: '.62rem', color: 'var(--orange)' }}>DEEPSEEK R1 — step-by-step reasoning</span>
                  <div style={{ marginLeft: 'auto', padding: '2px 8px', borderRadius: 4, background: 'rgba(251,146,60,0.1)', border: '1px solid rgba(251,146,60,0.2)', fontFamily: 'JetBrains Mono,monospace', fontSize: '.5rem', color: 'var(--orange)' }}>HuggingFace</div>
                </div>
                <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {dsMessages.length === 0 && (
                    <div style={{ textAlign: 'center', color: 'var(--text3)', fontFamily: 'JetBrains Mono,monospace', fontSize: '.7rem', paddingTop: 60, opacity: 0.6 }}>
                      // DeepSeek-R1 reasons step-by-step — great for math, logic, coding...
                    </div>
                  )}
                  {dsMessages.map((m, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                      <div className={m.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'}
                        style={{ maxWidth: '82%', padding: '10px 14px', fontSize: '.88rem', lineHeight: 1.6, color: 'var(--text)', whiteSpace: 'pre-wrap', borderColor: m.role === 'assistant' ? 'rgba(251,146,60,0.15)' : undefined }}>
                        {m.role === 'assistant' && <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: '.55rem', color: 'var(--orange)', marginBottom: 5 }}>DeepSeek-R1</div>}
                        {m.content}
                      </div>
                    </div>
                  ))}
                  {loading && active === 'deepseek' && (
                    <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                      <div className="chat-bubble-ai" style={{ padding: '10px 16px', borderColor: 'rgba(251,146,60,0.15)' }}>
                        <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                          {[0, 1, 2].map(i => <span key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--orange)', opacity: 0.7, animation: `treePulse 1s ease-in-out ${i * 0.2}s infinite` }} />)}
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={dsEndRef} />
                </div>
                <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(251,146,60,0.1)', display: 'flex', gap: 8 }}>
                  <input className="input" value={dsInput} onChange={e => setDsInput(e.target.value)}
                    placeholder="Ask a reasoning question..."
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendDeepSeek(); } }}
                    style={{ flex: 1, padding: '10px 14px', fontSize: '.88rem', borderColor: 'rgba(251,146,60,0.2)' }} disabled={loading} />
                  <button onClick={sendDeepSeek} disabled={loading || !dsInput.trim()} style={{ padding: '10px 18px', background: 'linear-gradient(135deg,var(--orange),rgba(251,146,60,0.7))', border: 'none', borderRadius: 7, fontFamily: 'JetBrains Mono,monospace', fontSize: '.7rem', color: '#050810', cursor: loading || !dsInput.trim() ? 'not-allowed' : 'pointer', fontWeight: 700 }}>
                    {loading ? '...' : '▶'}
                  </button>
                  {dsMessages.length > 0 && (
                    <button onClick={() => setDsMessages([])} className="btn" style={{ padding: '10px 12px', fontSize: '.7rem' }}>
                      Clear
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* ── Legacy results ── */}
            {result && res && (active === 'generate_draft' || active === 'recommend' || active === 'analyze') && (
              <div className="glass-card" style={{ padding: 22, border: '1px solid rgba(99,179,237,0.22)', animation: 'fadeUp 0.4s ease' }}>
                <div className="corner c-tl" /><div className="corner c-br" />
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, paddingBottom: 14, borderBottom: '1px solid rgba(99,179,237,0.08)' }}>
                  <span style={{ fontSize: '1.2rem' }}>🤖</span>
                  <div>
                    <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: '.72rem', color: 'var(--cyan)' }}>NexusAI Agent</div>
                    <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: '.6rem', color: 'var(--text3)' }}>ACTION: {String(result.action)} · STATUS: OK</div>
                  </div>
                  <div style={{ marginLeft: 'auto', width: 8, height: 8, borderRadius: '50%', background: 'var(--green)', boxShadow: '0 0 8px var(--green)' }} />
                </div>
                {result.action === 'GENERATE_DRAFT' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div><div className="editorial-label" style={{ marginBottom: 6 }}>Title</div><h3 className="editorial-title" style={{ fontSize: '.95rem', color: 'var(--cyan)', lineHeight: 1.4 }}>{String(res.title)}</h3></div>
                    <div><div className="editorial-label" style={{ marginBottom: 6 }}>Outline</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {(res.outline as string[]).map((item, i) => (
                          <div key={i} style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: '.72rem', color: 'var(--text2)', padding: '5px 10px', background: 'rgba(99,179,237,0.04)', borderLeft: '2px solid rgba(99,179,237,0.3)', borderRadius: '0 6px 6px 0' }}>{item}</div>
                        ))}
                      </div>
                    </div>
                    <div><div className="editorial-label" style={{ marginBottom: 6 }}>Content Preview</div>
                      <div style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(99,179,237,0.1)', borderRadius: 8, padding: 14, fontFamily: 'JetBrains Mono,monospace', fontSize: '.78rem', color: 'var(--text2)', lineHeight: 1.8, maxHeight: 220, overflow: 'auto', whiteSpace: 'pre-wrap' }}>{String(res.content)}</div>
                    </div>
                    <button onClick={() => router.push('/blogs')} className="btn btn-primary btn-sm">📤 Use in New Post →</button>
                  </div>
                )}
                {result.action === 'RECOMMEND' && (
                  <div>
                    <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: '.7rem', color: 'var(--purple)', marginBottom: 14 }}>💡 {String(res.message)}</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {(res.topics as string[]).map((t, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', background: 'rgba(159,122,234,0.06)', border: '1px solid rgba(159,122,234,0.15)', borderRadius: 8 }}>
                          <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: '.68rem', color: 'var(--purple)', minWidth: 22 }}>0{i + 1}</span>
                          <span style={{ flex: 1, fontSize: '.9rem', color: 'var(--text)' }}>{t}</span>
                          <button onClick={() => { setActive('generate_draft'); setTopic(t); setResult(null); }} className="btn btn-ghost btn-xs" style={{ fontFamily: 'JetBrains Mono,monospace', color: 'var(--cyan)' }}>Write →</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {result.action === 'ANALYZE' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10 }}>
                      {[{ l: 'Word Count', v: String(res.wordCount), c: 'var(--cyan)' }, { l: 'Read Time', v: `${res.readTime} min`, c: 'var(--purple)' }, { l: 'Sentiment', v: String(res.sentiment), c: 'var(--green)' }, { l: 'SEO Score', v: `${res.seoScore}/100`, c: (res.seoScore as number) > 60 ? 'var(--green)' : 'var(--orange)' }].map(m => (
                        <div key={m.l} style={{ background: 'rgba(0,0,0,0.25)', border: `1px solid ${m.c}22`, borderRadius: 8, padding: '12px 14px' }}>
                          <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: '.52rem', color: 'var(--text3)', marginBottom: 4 }}>{m.l}</div>
                          <div style={{ fontFamily: 'JetBrains Mono,monospace', fontWeight: 700, color: m.c, fontSize: '.95rem' }}>{m.v}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ height: 7, borderRadius: 999, background: 'rgba(99,179,237,0.06)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${res.seoScore as number}%`, background: (res.seoScore as number) > 60 ? 'linear-gradient(90deg,var(--green),var(--cyan))' : 'linear-gradient(90deg,var(--orange),var(--magenta))', transition: 'width 0.8s ease' }} />
                    </div>
                    <div>
                      <div className="editorial-label" style={{ marginBottom: 8 }}>Suggestions</div>
                      {(res.suggestions as string[]).map((s, i) => (
                        <div key={i} style={{ display: 'flex', gap: 8, fontSize: '.88rem', color: 'var(--text2)', padding: '5px 0', borderBottom: '1px solid rgba(99,179,237,0.05)' }}>
                          <span style={{ color: 'var(--green)', flexShrink: 0 }}>→</span>{s}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── AGENT LOG SIDEBAR ── */}
          <div className="glass-card" style={{ padding: 18, position: 'sticky', top: 78 }}>
            <div className="corner c-tl" />
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', boxShadow: '0 0 6px var(--green)' }} />
              <div className="editorial-label">Agent Log</div>
            </div>
            <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: '.62rem', color: 'var(--text3)', lineHeight: 2, minHeight: 120 }}>
              {log.length === 0 ? <span style={{ opacity: 0.4 }}>// Waiting for input...</span> : log.map((l, i) => (
                <div key={i} style={{ color: i === 0 ? 'var(--cyan)' : 'var(--text3)', borderBottom: '1px solid rgba(99,179,237,0.04)', paddingBottom: 3, marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l}</div>
              ))}
            </div>
            <div style={{ borderTop: '1px solid rgba(99,179,237,0.08)', paddingTop: 14, marginTop: 8 }}>
              <div className="editorial-label" style={{ marginBottom: 10 }}>Capabilities</div>
              {[
                { fn: 'chat(messages)', d: 'General AI conversation' },
                { fn: 'analyze_image(img)', d: 'Vision & image analysis' },
                { fn: 'analyze_video(url)', d: 'Video content analysis' },
                { fn: 'generate_draft(topic)', d: 'Blog draft generation' },
                { fn: 'recommend(level)', d: 'Personalized topics' },
                { fn: 'analyze(content)', d: 'SEO & quality analysis' },
                { fn: 'deepseek(messages)', d: 'Reasoning AI via HuggingFace' },
              ].map(c => (
                <div key={c.fn} style={{ marginBottom: 8 }}>
                  <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: '.58rem', color: 'var(--cyan)' }}>{c.fn}</div>
                  <div style={{ fontSize: '.72rem', color: 'var(--text3)' }}>{c.d}</div>
                </div>
              ))}
            </div>
            {active === 'chat' && chatMessages.length > 0 && (
              <div style={{ marginTop: 12, padding: '8px 10px', borderRadius: 8, background: 'rgba(99,179,237,0.05)', border: '1px solid rgba(99,179,237,0.1)', fontFamily: 'JetBrains Mono,monospace', fontSize: '.58rem', color: 'var(--text3)' }}>
                {chatMessages.length} messages · {Math.round(chatMessages.reduce((s, m) => s + m.content.length, 0) / 4)} tokens est.
              </div>
            )}
            {active === 'deepseek' && dsMessages.length > 0 && (
              <div style={{ marginTop: 12, padding: '8px 10px', borderRadius: 8, background: 'rgba(251,146,60,0.05)', border: '1px solid rgba(251,146,60,0.15)', fontFamily: 'JetBrains Mono,monospace', fontSize: '.58rem', color: 'var(--orange)' }}>
                {dsMessages.length} messages · DeepSeek-R1-8B
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
