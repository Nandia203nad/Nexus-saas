'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';

interface User { id:string;name:string;email:string;avatar?:string;bio?:string;role:string;plan:string;xp:number;level:number;streak:number;createdAt:string;_count:{blogs:number;comments:number;likes:number};skills:Array<{skillId:string;xp:number;level:number;skill:{name:string;icon?:string;category:string;xpRequired:number}}>;achievements:Array<{earnedAt:string;achievement:{name:string;icon:string;description:string;xpReward:number}}>;portfolioFiles:Array<{id:string;name:string;type:string;content:string;size:number;createdAt:string}>; }
interface BlogAnalysisReport {
  generatedAt:string;
  user:{name:string;email:string;plan:string;xp:number;level:number}|null;
  totals:{authored:number;published:number;drafts:number;interacted:number;processed:number;totalViews:number;totalLikes:number;totalComments:number;averageSeoScore:number};
  authored:Array<Record<string, string|number|boolean|null>>;
  interacted:Array<Record<string, string|number|boolean|null>>;
  processed:Array<Record<string, string|number|boolean|null>>;
}
type Tab='overview'|'skills'|'achievements'|'subscription'|'portfolio';
const PLAN_COLORS={FREE:'var(--green)',PREMIUM:'var(--cyan)',MAX:'var(--purple)'};
const SKILL_DEFS=[
  {name:'Бичгийн урлаг',icon:'✍️',color:'var(--cyan)',   xpRequired:0,   treeId:'starter'},
  {name:'Маркетинг',    icon:'📢',color:'var(--purple)', xpRequired:60,  treeId:'marketing'},
  {name:'Дизайн',       icon:'🎨',color:'var(--orange)', xpRequired:70,  treeId:'creative-branding'},
  {name:'AI Ашиглалт',  icon:'🤖',color:'var(--magenta)',xpRequired:80,  treeId:'psychology'},
  {name:'SEO',          icon:'🔍',color:'var(--green)',  xpRequired:85,  treeId:'coding'},
  {name:'Аналитик',     icon:'📊',color:'var(--yellow)', xpRequired:85,  treeId:'seo-strategy'},
  {name:'Брэнд',        icon:'⭐',color:'var(--cyan)',   xpRequired:95,  treeId:'narrative-design'},
];

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User|null>(null);
  const [plan, setPlan] = useState<{currentPlan:string;plans:Record<string,{name:string;price:number;features:string[]}>}|null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('overview');
  const [upgrading, setUpgrading] = useState(false);
  const [portfolio, setPortfolio] = useState<User['portfolioFiles']>([]);
  const [newFile, setNewFile] = useState({name:'',type:'analysis',content:''});
  const [addingFile, setAddingFile] = useState(false);
  const [showAddFile, setShowAddFile] = useState(false);
  const [selectedFile, setSelectedFile] = useState<User['portfolioFiles'][0]|null>(null);
  const [analysisText, setAnalysisText] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{wordCount:number;readTime:number;sentiment:string;seoScore:number;suggestions:string[]}|null>(null);
  const [exportingReport, setExportingReport] = useState<'excel'|'pdf'|null>(null);

  useEffect(() => {
    const token=localStorage.getItem('nexus_token');
    if(!token){router.replace('/');return;}
    Promise.all([
      fetch('/api/auth/me',{headers:{Authorization:`Bearer ${token}`}}).then(r=>r.json()),
      fetch('/api/subscription',{headers:{Authorization:`Bearer ${token}`}}).then(r=>r.json()),
      fetch('/api/portfolio',{headers:{Authorization:`Bearer ${token}`}}).then(r=>r.json()),
    ]).then(([ud,pd,pfD])=>{
      if(ud.success)setUser(ud.user);
      if(pd.success)setPlan(pd);
      if(pfD.success)setPortfolio(pfD.files||[]);
    }).catch(()=>router.replace('/')).finally(()=>setLoading(false));
  },[router]);

  const handleUpgrade = async (p:'PREMIUM'|'MAX') => {
    setUpgrading(true);
    const token=localStorage.getItem('nexus_token');
    const res=await fetch('/api/subscription',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify({action:'upgrade',plan:p})});
    const data=await res.json();
    if(res.ok){alert(data.message);window.location.reload();}
    setUpgrading(false);
  };

  const handleAddFile = async (e:React.FormEvent) => {
    e.preventDefault();
    if(!newFile.name||!newFile.content)return;
    setAddingFile(true);
    const token=localStorage.getItem('nexus_token');
    const res=await fetch('/api/portfolio',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify(newFile)});
    const data=await res.json();
    if(res.ok){setPortfolio(p=>[data.file,...p]);setNewFile({name:'',type:'analysis',content:''});setShowAddFile(false);alert('Portfolio файл хадгалагдлаа!');}
    setAddingFile(false);
  };

  const handleDeleteFile = async (id:string) => {
    if(!confirm('Устгах уу?'))return;
    const token=localStorage.getItem('nexus_token');
    const res=await fetch(`/api/portfolio?id=${id}`,{method:'DELETE',headers:{Authorization:`Bearer ${token}`}});
    if(res.ok)setPortfolio(p=>p.filter(f=>f.id!==id));
  };

  const downloadFile = (file:{name:string;content:string}) => {
    const blob=new Blob([file.content],{type:'text/markdown'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');a.href=url;a.download=file.name.endsWith('.md')?file.name:file.name+'.md';a.click();URL.revokeObjectURL(url);
  };

  const escapeHtml = (value:unknown) => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch] || ch));
  const formatDate = (value:unknown) => value ? new Date(String(value)).toLocaleString() : '';
  const reportFileName = () => `Nexus_Blog_Analysis_${new Date().toISOString().slice(0,10)}`;

  const fetchReport = async () => {
    const token=localStorage.getItem('nexus_token');
    const res=await fetch('/api/reports/blog-analysis',{headers:{Authorization:`Bearer ${token}`}});
    const data=await res.json();
    if(!res.ok||!data.success)throw new Error(data.message||'Report export failed');
    return data as BlogAnalysisReport & {success:true};
  };

  const tableHtml = (title:string, rows:Array<Record<string, unknown>>) => {
    const keys=rows.length?Object.keys(rows[0]).filter(k=>k!=='id'):[];
    return `<h2>${escapeHtml(title)}</h2>${rows.length?`<table><thead><tr>${keys.map(k=>`<th>${escapeHtml(k)}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr>${keys.map(k=>`<td>${k.toLowerCase().includes('at')?escapeHtml(formatDate(row[k])):escapeHtml(row[k])}</td>`).join('')}</tr>`).join('')}</tbody></table>`:'<p>No data yet.</p>'}`;
  };

  const buildReportHtml = (report:BlogAnalysisReport) => `
    <html>
      <head>
        <meta charSet="utf-8" />
        <title>${reportFileName()}</title>
        <style>
          body{font-family:Arial,sans-serif;color:#18202f;margin:28px}
          h1{margin:0 0 6px;font-size:24px}
          h2{margin:26px 0 10px;font-size:16px;color:#0b7f7c}
          .meta{color:#667085;font-size:12px;margin-bottom:18px}
          .cards{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:18px 0}
          .card{border:1px solid #d8e4e7;border-radius:8px;padding:10px;background:#f8fbfc}
          .card span{display:block;font-size:11px;color:#667085;text-transform:uppercase}
          .card strong{display:block;margin-top:5px;font-size:18px;color:#0b7f7c}
          table{width:100%;border-collapse:collapse;margin-bottom:18px;font-size:11px}
          th,td{border:1px solid #d8e4e7;padding:7px;text-align:left;vertical-align:top}
          th{background:#eef8f8;color:#0b625f}
          @media print{body{margin:18px}.cards{grid-template-columns:repeat(4,1fr)}button{display:none}}
        </style>
      </head>
      <body>
        <h1>Nexus Blog Analysis Report</h1>
        <div class="meta">Generated: ${escapeHtml(formatDate(report.generatedAt))} · User: ${escapeHtml(report.user?.name)} (${escapeHtml(report.user?.email)}) · Plan: ${escapeHtml(report.user?.plan)}</div>
        <div class="cards">
          <div class="card"><span>Published</span><strong>${report.totals.published}</strong></div>
          <div class="card"><span>Drafts</span><strong>${report.totals.drafts}</strong></div>
          <div class="card"><span>Read / Saved</span><strong>${report.totals.interacted}</strong></div>
          <div class="card"><span>Processed</span><strong>${report.totals.processed}</strong></div>
          <div class="card"><span>Total Views</span><strong>${report.totals.totalViews}</strong></div>
          <div class="card"><span>Total Likes</span><strong>${report.totals.totalLikes}</strong></div>
          <div class="card"><span>Comments</span><strong>${report.totals.totalComments}</strong></div>
          <div class="card"><span>Avg SEO</span><strong>${report.totals.averageSeoScore}/100</strong></div>
        </div>
        ${tableHtml('Authored Blogs', report.authored)}
        ${tableHtml('Read / Saved Blogs', report.interacted)}
        ${tableHtml('Comments on Your Blogs', (report.authored as Array<Record<string,unknown>>).flatMap(b =>
          ((b.comments as Array<{author:string;content:string;createdAt:string}>) || []).map(c => ({
            blog: b.title, commenter: c.author, comment: c.content, date: c.createdAt
          }))
        ))}
        ${tableHtml('Processed Analysis Files', report.processed)}
      </body>
    </html>`;

  const saveReportToPortfolio = async (report: BlogAnalysisReport) => {
    const token = localStorage.getItem('nexus_token');
    if (!token) return;
    const name = `Blog_Report_${new Date().toISOString().slice(0,10)}.json`;
    const content = JSON.stringify({
      generatedAt: report.generatedAt,
      user: report.user,
      totals: report.totals,
      authored: report.authored,
      interacted: report.interacted,
    }, null, 2);
    const res = await fetch('/api/portfolio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name, type: 'report', content }),
    });
    if (res.ok) {
      const data = await res.json();
      setPortfolio(p => [data.file, ...p]);
    }
  };

  const exportBlogReportExcel = async () => {
    setExportingReport('excel');
    try {
      const report=await fetchReport();
      const html=buildReportHtml(report);
      const blob=new Blob([html],{type:'application/vnd.ms-excel;charset=utf-8'});
      const url=URL.createObjectURL(blob);
      const a=document.createElement('a');a.href=url;a.download=`${reportFileName()}.xls`;a.click();URL.revokeObjectURL(url);
      await saveReportToPortfolio(report);
    } catch (e) { alert(e instanceof Error ? e.message : 'Report export failed'); }
    finally { setExportingReport(null); }
  };

  const exportBlogReportPdf = async () => {
    setExportingReport('pdf');
    try {
      const report=await fetchReport();
      const win=window.open('', '_blank');
      if(!win)throw new Error('Popup blocked. Please allow popups to export PDF.');
      win.document.write(buildReportHtml(report));
      win.document.close();
      win.focus();
      window.setTimeout(()=>win.print(), 300);
      await saveReportToPortfolio(report);
    } catch (e) { alert(e instanceof Error ? e.message : 'Report export failed'); }
    finally { setExportingReport(null); }
  };

  const runAnalysis = async () => {
    if(!analysisText.trim())return;
    setAnalyzing(true);
    const token=localStorage.getItem('nexus_token');
    const res=await fetch('/api/ai',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify({action:'analyze',payload:{text:analysisText}})});
    const data=await res.json();
    if(res.ok)setAnalysisResult(data.result);
    setAnalyzing(false);
  };

  const saveAnalysisToPortfolio = async () => {
    if(!analysisResult)return;
    const content=`# Content Analysis Report\n\n**Date:** ${new Date().toLocaleDateString()}\n\n## Metrics\n- Word Count: ${analysisResult.wordCount}\n- Read Time: ${analysisResult.readTime} min\n- Sentiment: ${analysisResult.sentiment}\n- SEO Score: ${analysisResult.seoScore}/100\n\n## Original Content\n\n${analysisText}\n\n## Suggestions\n${analysisResult.suggestions.map(s=>`- ${s}`).join('\n')}`;
    setNewFile({name:`Analysis_${new Date().toLocaleDateString().replace(/\//g,'-')}.md`,type:'analysis',content});
    setShowAddFile(true);
    setTab('portfolio');
  };

  if(loading) return <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',position:'relative',zIndex:1}}><Navbar /><div style={{width:44,height:44,border:'3px solid rgba(99,179,237,0.15)',borderTopColor:'var(--cyan)',borderRadius:'50%',animation:'spin 0.7s linear infinite'}} /></div>;
  if(!user) return null;

  const initials=user.name.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2);
  const xpPL=200*user.level;const xpPct=Math.min(100,((user.xp%xpPL)/xpPL)*100);
  const TABS:Tab[]=['overview','skills','achievements','subscription','portfolio'];
  const planColor=PLAN_COLORS[user.plan as keyof typeof PLAN_COLORS]||'var(--cyan)';

  return (
    <div style={{position:'relative',zIndex:1,minHeight:'100vh'}}>
      <Navbar />
      <div className="container" style={{paddingTop:28,paddingBottom:60}}>
        {/* Profile header */}
        <div className="glass-card" style={{padding:'26px 30px',marginBottom:22}}>
          <div className="corner c-tl" /><div className="corner c-tr" /><div className="corner c-bl" /><div className="corner c-br" />
          <div style={{display:'flex',gap:22,alignItems:'flex-start',flexWrap:'wrap'}}>
            <div style={{position:'relative',flexShrink:0}}>
              <div style={{width:80,height:80,borderRadius:'50%',background:'linear-gradient(135deg,var(--cyan),var(--purple))',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.5rem',fontFamily:'JetBrains Mono,monospace',fontWeight:900,color:'#050810',border:'2px solid rgba(99,179,237,0.4)',boxShadow:'0 0 24px rgba(99,179,237,0.25)'}}>
                {user.avatar?<img src={user.avatar} alt="" style={{width:80,height:80,borderRadius:'50%',objectFit:'cover'}} />:initials}
              </div>
              <div style={{position:'absolute',bottom:-4,right:-4,background:planColor,color:'#050810',borderRadius:'50%',width:24,height:24,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'.6rem',fontFamily:'JetBrains Mono,monospace',fontWeight:800,boxShadow:`0 0 8px ${planColor}88`}}>{user.level}</div>
            </div>
            <div style={{flex:1,minWidth:200}}>
              <div style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap',marginBottom:5}}>
                <h1 className="editorial-title" style={{fontSize:'1.25rem'}}>{user.name}</h1>
                <span className={`badge ${user.plan==='MAX'?'b-max':user.plan==='PREMIUM'?'b-premium':'b-free'}`} style={{fontSize:'.52rem'}}>{user.plan}</span>
                {user.role==='ADMIN'&&<span className="badge b-magenta" style={{fontSize:'.52rem'}}>ADMIN</span>}
              </div>
              {user.bio&&<p style={{color:'var(--text2)',fontSize:'.88rem',marginBottom:10,lineHeight:1.5}}>{user.bio}</p>}
              <div style={{fontFamily:'JetBrains Mono,monospace',fontSize:'.62rem',color:'var(--text3)',marginBottom:12}}>{user.email}</div>
              <div style={{maxWidth:320,marginBottom:14}}>
                <div style={{display:'flex',justifyContent:'space-between',fontFamily:'JetBrains Mono,monospace',fontSize:'.6rem',color:'var(--text3)',marginBottom:5}}>
                  <span style={{color:planColor}}>Level {user.level}</span><span>{user.xp.toLocaleString()} XP total</span>
                </div>
                <div className="xp-bar" style={{height:5}}><div className="xp-fill" style={{width:`${xpPct}%`,background:`linear-gradient(90deg,${planColor},${planColor}88)`}} /></div>
              </div>
              <div style={{display:'flex',gap:22,flexWrap:'wrap'}}>
                {[{l:'Blogs',v:user._count.blogs,c:'var(--cyan)'},{l:'Comments',v:user._count.comments,c:'var(--purple)'},{l:'Likes',v:user._count.likes,c:'var(--magenta)'},{l:'Streak',v:`${user.streak}🔥`,c:'var(--orange)'}].map(s=>(
                  <div key={s.l} style={{textAlign:'center'}}>
                    <div className="editorial-title" style={{fontSize:'1.1rem',color:s.c,lineHeight:1}}>{s.v}</div>
                    <div style={{fontFamily:'JetBrains Mono,monospace',fontSize:'.52rem',color:'var(--text3)',marginTop:3,letterSpacing:'.07em'}}>{s.l}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{display:'flex',gap:2,marginBottom:22,background:'rgba(99,179,237,0.03)',border:'1px solid rgba(99,179,237,0.1)',borderRadius:10,padding:4}}>
          {TABS.map(t=>(
            <button key={t} onClick={()=>setTab(t)} style={{flex:1,padding:'9px 6px',borderRadius:8,border:tab===t?'1px solid rgba(99,179,237,0.32)':'1px solid transparent',cursor:'pointer',fontFamily:'JetBrains Mono,monospace',fontSize:'.56rem',color:tab===t?'var(--cyan)':'var(--text3)',background:tab===t?'rgba(99,179,237,0.1)':'transparent',letterSpacing:'.06em',transition:'all 0.2s',textTransform:'uppercase'}}>
              {t==='portfolio'?'📁 Portfolio':t.charAt(0).toUpperCase()+t.slice(1)}
            </button>
          ))}
        </div>

        {/* Overview */}
        {tab==='overview'&&(
          <div style={{display:'flex',flexDirection:'column',gap:18}}>
            <div className="grid-3">
              {[{icon:'✍️',title:'Content Rank',val:`${user._count.blogs} Articles`,sub:`${user._count.blogs*50} XP earned`,c:'var(--cyan)'},{icon:'💬',title:'Engagement',val:`${user._count.comments} Comments`,sub:`${user._count.comments*10} XP earned`,c:'var(--purple)'},{icon:'⚡',title:'Power Level',val:`Level ${user.level}`,sub:`${user.xp.toLocaleString()} total XP`,c:'var(--green)'}].map(c=>(
                <div key={c.title} className="glass-card" style={{padding:22,textAlign:'center'}}>
                  <div className="corner c-tl" style={{borderColor:c.c,opacity:0.4}} />
                  <div style={{fontSize:'2rem',marginBottom:10}}>{c.icon}</div>
                  <div style={{fontFamily:'JetBrains Mono,monospace',fontSize:'.65rem',color:c.c,letterSpacing:'.08em',marginBottom:6}}>{c.title}</div>
                  <div className="editorial-title" style={{fontSize:'1rem',marginBottom:4}}>{c.val}</div>
                  <div style={{fontFamily:'JetBrains Mono,monospace',fontSize:'.6rem',color:'var(--text3)'}}>{c.sub}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Skills */}
        {tab==='skills'&&(
          <div className="glass-card" style={{padding:26}}>
            <div className="corner c-tl" />
            <div className="editorial-label" style={{marginBottom:20}}>Skill Matrix</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(110px,1fr))',gap:20,marginBottom:20}}>
              {SKILL_DEFS.map((sd)=>{
                const unlocked = user.xp >= sd.xpRequired;
                const xpProgress = Math.min(100, sd.xpRequired === 0 ? 100 : (user.xp / sd.xpRequired) * 100);
                const dbSkill = user.skills.find(s=>s.skill.name===sd.name);
                const lvl = dbSkill?.level ?? (unlocked ? Math.max(1, Math.floor((user.xp - sd.xpRequired) / 50) + 1) : 0);
                return (
                  <a key={sd.name} href="/skill-tree" style={{textAlign:'center',textDecoration:'none',display:'block'}}>
                    <div style={{position:'relative',width:68,height:68,margin:'0 auto',borderRadius:'50%',background:unlocked?`${sd.color.replace('var(--','rgba(').replace(')',',0.12)')}`:undefined,border:`2px solid ${unlocked?sd.color:'var(--border)'}`,display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',boxShadow:unlocked?`0 0 16px ${sd.color.replace('var(--','rgba(').replace(')',',0.25)')}`:undefined,transition:'all .3s',cursor:'pointer'}}>
                      <div style={{fontSize:'1.5rem'}}>{sd.icon}</div>
                      {unlocked && lvl > 0 && <div style={{position:'absolute',top:-4,right:-4,background:sd.color,color:'#050810',borderRadius:'50%',width:18,height:18,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'.54rem',fontFamily:'JetBrains Mono,monospace',fontWeight:800,border:'2px solid var(--bg)'}}>{lvl}</div>}
                      {!unlocked && <div style={{position:'absolute',inset:0,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'.95rem',background:'rgba(5,8,16,0.55)'}}>🔒</div>}
                    </div>
                    <div style={{marginTop:8,fontFamily:'JetBrains Mono,monospace',fontSize:'.58rem',color:unlocked?sd.color:'var(--text3)',lineHeight:1.3,fontWeight:unlocked?700:400}}>{sd.name}</div>
                    <div style={{marginTop:5,height:3,background:'rgba(255,255,255,0.06)',borderRadius:2,overflow:'hidden',width:60,margin:'5px auto 0'}}>
                      <div style={{height:'100%',width:`${xpProgress}%`,background:sd.color,borderRadius:2,transition:'width .8s ease'}} />
                    </div>
                    <div style={{fontFamily:'JetBrains Mono,monospace',fontSize:'.5rem',color:'var(--text3)',marginTop:3}}>
                      {unlocked ? '✓ Unlocked' : `${sd.xpRequired} XP`}
                    </div>
                  </a>
                );
              })}
            </div>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:10}}>
              <p style={{fontFamily:'JetBrains Mono,monospace',fontSize:'.6rem',color:'var(--text3)',margin:0}}>// Skill Tree-д очиж XP цуглуулж skill нээ</p>
              <a href="/skill-tree" style={{fontFamily:'JetBrains Mono,monospace',fontSize:'.62rem',color:'var(--cyan)',textDecoration:'none',border:'1px solid rgba(99,179,237,0.2)',borderRadius:7,padding:'6px 14px',transition:'background .2s'}} onMouseOver={e=>(e.currentTarget.style.background='rgba(99,179,237,0.08)')} onMouseOut={e=>(e.currentTarget.style.background='transparent')}>
                Open Skill Tree →
              </a>
            </div>
          </div>
        )}

        {/* Achievements */}
        {tab==='achievements'&&(
          <div>
            {user.achievements.length===0?(
              <div className="glass-card" style={{padding:52,textAlign:'center'}}>
                <div style={{fontSize:'3rem',marginBottom:14}}>🏆</div>
                <h3 style={{fontFamily:'JetBrains Mono,monospace',fontSize:'.82rem',color:'var(--text2)',marginBottom:8}}>No Achievements Yet</h3>
                <p style={{fontFamily:'JetBrains Mono,monospace',fontSize:'.7rem',color:'var(--text3)'}}>Blog бичиж, сэтгэгдэл үлдээж тэмдэг цуглуулаарай</p>
              </div>
            ):(
              <div className="grid-3">
                {user.achievements.map((ua,i)=>(
                  <div key={i} className="glass-card" style={{padding:22,textAlign:'center'}}>
                    <div style={{fontSize:'2.2rem',marginBottom:8}}>{ua.achievement.icon}</div>
                    <div style={{fontFamily:'JetBrains Mono,monospace',fontSize:'.7rem',fontWeight:700,marginBottom:6,color:'var(--cyan)'}}>{ua.achievement.name}</div>
                    <div style={{fontSize:'.85rem',color:'var(--text2)',marginBottom:8,lineHeight:1.5}}>{ua.achievement.description}</div>
                    <span className="badge b-green" style={{fontSize:'.55rem'}}>+{ua.achievement.xpReward} XP</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Subscription */}
        {tab==='subscription'&&plan&&(
          <div>
            <div className="grid-3">
              {Object.entries(plan.plans).map(([key,p])=>{
                const isActive=(key==='FREE'&&plan.currentPlan==='FREE')||(key==='PREMIUM'&&plan.currentPlan==='PREMIUM')||(key==='MAX'&&plan.currentPlan==='MAX');
                const col=key==='FREE'?'var(--green)':key==='PREMIUM'?'var(--cyan)':'var(--purple)';
                return (
                  <div key={key} className="plan-card" style={{borderColor:isActive?col.replace('var(--','rgba(').replace(')',',0.5)'):'var(--border)',boxShadow:isActive?`0 0 28px ${col}18`:'none',position:'relative'}}>
                    {isActive&&<div style={{position:'absolute',top:-10,right:16}}><span className="badge b-green" style={{fontSize:'.52rem'}}>✓ Active</span></div>}
                    <div className="corner c-tl" style={{borderColor:col,opacity:0.5}} />
                    <div style={{fontSize:'1.8rem',marginBottom:12}}>{key==='FREE'?'🆓':key==='PREMIUM'?'💎':'🚀'}</div>
                    <div style={{fontFamily:'JetBrains Mono,monospace',fontWeight:700,fontSize:'.75rem',letterSpacing:'.1em',color:col,marginBottom:8,textTransform:'uppercase'}}>{p.name}</div>
                    <div style={{display:'flex',alignItems:'baseline',gap:4,marginBottom:18}}>
                      <span className="editorial-title" style={{fontSize:'2rem'}}>{p.price===0?'Free':`$${p.price}`}</span>
                      {p.price>0&&<span style={{color:'var(--text3)',fontSize:'.82rem'}}>/mo</span>}
                    </div>
                    <ul style={{listStyle:'none',display:'flex',flexDirection:'column',gap:8,marginBottom:22}}>
                      {p.features.map((f:string,i:number)=>(
                        <li key={i} style={{display:'flex',gap:7,fontSize:'.84rem',color:'var(--text2)'}}>
                          <span style={{color:col,flexShrink:0}}>✓</span>{f}
                        </li>
                      ))}
                    </ul>
                    {!isActive&&key!=='FREE'&&(
                      <button onClick={()=>handleUpgrade(key as 'PREMIUM'|'MAX')} disabled={upgrading} className="btn btn-primary btn-sm" style={{width:'100%',justifyContent:'center',background:`linear-gradient(135deg,${col},${col}88)`}}>
                        {upgrading?'Processing...':key==='PREMIUM'?'Upgrade — $3/mo':'Upgrade — $7/mo'}
                      </button>
                    )}
                    {isActive&&<div style={{textAlign:'center',fontFamily:'JetBrains Mono,monospace',fontSize:'.62rem',color:col}}>Current Plan</div>}
                  </div>
                );
              })}
            </div>
            <div className="glass-card" style={{padding:20,marginTop:20,display:'flex',gap:12,alignItems:'flex-start'}}>
              <span style={{fontSize:'1.3rem',flexShrink:0}}>💳</span>
              <div>
                <div style={{fontFamily:'JetBrains Mono,monospace',fontSize:'.72rem',color:'var(--cyan)',marginBottom:4}}>Payment Integration</div>
                <p style={{color:'var(--text2)',fontSize:'.84rem',lineHeight:1.6}}>Production-д Stripe нэгтгэлийг ашиглана. <code style={{background:'rgba(99,179,237,0.1)',padding:'1px 5px',borderRadius:3,fontSize:'.8em',fontFamily:'JetBrains Mono,monospace',color:'var(--cyan)'}}>STRIPE_SECRET_KEY</code> болон <code style={{background:'rgba(99,179,237,0.1)',padding:'1px 5px',borderRadius:3,fontSize:'.8em',fontFamily:'JetBrains Mono,monospace',color:'var(--cyan)'}}>STRIPE_PUBLISHABLE_KEY</code>-г .env файлд оруулаад Stripe Checkout-г идэвхжүүл.</p>
              </div>
            </div>
          </div>
        )}

        {/* Portfolio */}
        {tab==='portfolio'&&(
          <div style={{display:'flex',flexDirection:'column',gap:18}}>
            <div className="glass-card" style={{padding:24}}>
              <div className="corner c-tl" />
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:14,flexWrap:'wrap'}}>
                <div>
                  <div className="editorial-label" style={{marginBottom:8}}>Blog Analysis Export</div>
                  <p style={{margin:0,color:'var(--text2)',fontSize:'.86rem',lineHeight:1.6}}>
                    Export your authored, published, saved/read, and processed analysis data with SEO and engagement metrics.
                  </p>
                </div>
                <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                  <button onClick={exportBlogReportExcel} disabled={!!exportingReport} className="btn btn-secondary btn-sm">
                    {exportingReport==='excel'?'Preparing...':'Export Excel'}
                  </button>
                  <button onClick={exportBlogReportPdf} disabled={!!exportingReport} className="btn btn-primary btn-sm">
                    {exportingReport==='pdf'?'Preparing...':'Export PDF'}
                  </button>
                </div>
              </div>
            </div>

            {/* AI Analysis tool */}
            <div className="glass-card" style={{padding:24}}>
              <div className="corner c-tl" />
              <div className="editorial-label" style={{marginBottom:14}}>AI Content Analyzer — Save to Portfolio</div>
              <textarea className="input" placeholder="Шинжлэх контентоо энд оруулна уу..." value={analysisText} onChange={e=>setAnalysisText(e.target.value)} style={{marginBottom:12,minHeight:110,fontSize:'.9rem'}} />
              <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
                <button onClick={runAnalysis} disabled={analyzing||!analysisText.trim()} className="btn btn-primary btn-sm">
                  {analyzing?<><div style={{width:16,height:16,border:'2px solid rgba(5,8,16,0.3)',borderTopColor:'#050810',borderRadius:'50%',animation:'spin 0.7s linear infinite'}} /> Analyzing...</>:'🔍 Analyze Content'}
                </button>
                <span style={{fontFamily:'JetBrains Mono,monospace',fontSize:'.58rem',color:'var(--text3)'}}>{analysisText.split(/\s+/).filter(Boolean).length} words</span>
              </div>
              {analysisResult&&(
                <div style={{marginTop:16,padding:'14px 16px',background:'rgba(99,179,237,0.04)',border:'1px solid rgba(99,179,237,0.12)',borderRadius:9}}>
                  <div className="editorial-label" style={{marginBottom:12}}>Analysis Results</div>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:10,marginBottom:12}}>
                    {[{l:'Word Count',v:String(analysisResult.wordCount),c:'var(--cyan)'},{l:'Read Time',v:`${analysisResult.readTime} min`,c:'var(--purple)'},{l:'Sentiment',v:analysisResult.sentiment,c:'var(--green)'},{l:'SEO Score',v:`${analysisResult.seoScore}/100`,c:analysisResult.seoScore>60?'var(--green)':'var(--orange)'}].map(m=>(
                      <div key={m.l} style={{background:'rgba(0,0,0,0.2)',borderRadius:8,padding:'10px 12px'}}>
                        <div style={{fontFamily:'JetBrains Mono,monospace',fontSize:'.52rem',color:'var(--text3)',marginBottom:4}}>{m.l.toUpperCase()}</div>
                        <div style={{fontFamily:'JetBrains Mono,monospace',fontSize:'.9rem',fontWeight:700,color:m.c}}>{m.v}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{fontFamily:'JetBrains Mono,monospace',fontSize:'.6rem',color:'var(--text3)',marginBottom:6}}>SUGGESTIONS:</div>
                  {analysisResult.suggestions.map((s,i)=>(
                    <div key={i} style={{display:'flex',gap:7,fontSize:'.84rem',color:'var(--text2)',marginBottom:5}}>
                      <span style={{color:'var(--green)',flexShrink:0}}>→</span>{s}
                    </div>
                  ))}
                  <button onClick={saveAnalysisToPortfolio} className="btn btn-secondary btn-sm" style={{marginTop:10}}>💾 Save to Portfolio</button>
                </div>
              )}
            </div>

            {/* File list */}
            <div className="glass-card" style={{padding:24}}>
              <div className="corner c-tl" />
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:18}}>
                <div className="editorial-label">Portfolio Files ({portfolio.length})</div>
                <div style={{display:'flex',gap:8}}>
                  <button
                    className="btn btn-sm"
                    style={{ borderColor:'rgba(231,196,119,.4)', color:'#e7c477' }}
                    onClick={async () => {
                      const token = localStorage.getItem('nexus_token');
                      const sampleContent = JSON.stringify({
                        generatedAt: new Date().toISOString(),
                        note: 'Энэ бол жишээ portfolio файл юм.',
                        totals: { published: 3, drafts: 1, totalViews: 142, totalLikes: 28, totalComments: 9, averageSeoScore: 74 },
                        authored: [
                          { title: 'AI болон маркетингийн шинэ стратеги', views: 89, likes: 18, comments: 5, seoScore: 82 },
                          { title: 'Next.js 14 App Router гарын авлага', views: 53, likes: 10, comments: 4, seoScore: 68 },
                        ],
                      }, null, 2);
                      const res = await fetch('/api/portfolio', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                        body: JSON.stringify({ name: 'Sample_Blog_Report.json', type: 'report', content: sampleContent }),
                      });
                      if (res.ok) { const d = await res.json(); setPortfolio(p => [d.file, ...p]); alert('Жишээ файл нэмэгдлээ!'); }
                    }}
                  >
                    📄 Жишээ файл үүсгэх
                  </button>
                  <button onClick={()=>setShowAddFile(!showAddFile)} className={`btn btn-sm ${showAddFile?'btn-ghost':'btn-secondary'}`}>{showAddFile?'✕ Cancel':'+ Add File'}</button>
                </div>
              </div>

              {showAddFile&&(
                <form onSubmit={handleAddFile} style={{display:'flex',flexDirection:'column',gap:12,marginBottom:20,padding:16,background:'rgba(99,179,237,0.04)',border:'1px solid rgba(99,179,237,0.12)',borderRadius:10}}>
                  <div style={{display:'flex',gap:10}}>
                    <input className="input" placeholder="File name (e.g. SEO_Analysis.md)" value={newFile.name} onChange={e=>setNewFile({...newFile,name:e.target.value})} required style={{flex:1}} />
                    <select className="input" value={newFile.type} onChange={e=>setNewFile({...newFile,type:e.target.value})} style={{width:140}}>
                      <option value="analysis">Analysis</option>
                      <option value="report">Report</option>
                      <option value="strategy">Strategy</option>
                      <option value="research">Research</option>
                      <option value="portfolio">Portfolio</option>
                    </select>
                  </div>
                  <textarea className="input" placeholder="File content (Markdown supported)..." value={newFile.content} onChange={e=>setNewFile({...newFile,content:e.target.value})} required style={{minHeight:150,fontFamily:'JetBrains Mono,monospace',fontSize:'.82rem'}} />
                  <button type="submit" disabled={addingFile} className="btn btn-primary btn-sm" style={{alignSelf:'flex-start'}}>
                    {addingFile?'Saving...':'💾 Save File'}
                  </button>
                </form>
              )}

              {portfolio.length===0&&!showAddFile?(
                <div style={{textAlign:'center',padding:40,color:'var(--text3)',fontFamily:'JetBrains Mono,monospace',fontSize:'.72rem'}}>
                  <div style={{fontSize:'2.5rem',marginBottom:12}}>📁</div>
                  No portfolio files yet. Use the AI analyzer above to create your first file.
                </div>
              ):(
                <div style={{display:'flex',flexDirection:'column',gap:10}}>
                  {portfolio.map(f=>(
                    <div key={f.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,padding:'12px 16px',background:'rgba(99,179,237,0.03)',border:'1px solid rgba(99,179,237,0.08)',borderRadius:9,transition:'border-color 0.2s'}} onMouseOver={e=>(e.currentTarget.style.borderColor='rgba(99,179,237,0.22)')} onMouseOut={e=>(e.currentTarget.style.borderColor='rgba(99,179,237,0.08)')}>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:3}}>
                          <span style={{fontSize:'1rem'}}>📄</span>
                          <span style={{fontWeight:600,fontSize:'.9rem',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{f.name}</span>
                          <span className={`badge ${f.type==='analysis'?'b-cyan':f.type==='report'?'b-purple':f.type==='strategy'?'b-magenta':f.type==='research'?'b-green':'b-orange'}`} style={{fontSize:'.5rem',flexShrink:0}}>{f.type}</span>
                        </div>
                        <div style={{fontFamily:'JetBrains Mono,monospace',fontSize:'.58rem',color:'var(--text3)'}}>
                          {new Date(f.createdAt).toLocaleDateString()} · {(f.size/1024).toFixed(1)}KB
                        </div>
                      </div>
                      <div style={{display:'flex',gap:6,flexShrink:0}}>
                        <button onClick={()=>setSelectedFile(selectedFile?.id===f.id?null:f)} className="btn btn-ghost btn-xs" title="Preview">👁</button>
                        <button onClick={()=>downloadFile(f)} className="btn btn-secondary btn-xs" title="Download">⬇ .md</button>
                        <button onClick={()=>handleDeleteFile(f.id)} className="btn btn-danger btn-xs" title="Delete">✕</button>
                      </div>
                    </div>
                  ))}
                  {selectedFile&&(
                    <div style={{background:'rgba(0,0,0,0.3)',border:'1px solid rgba(99,179,237,0.15)',borderRadius:10,padding:20}}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
                        <div style={{fontFamily:'JetBrains Mono,monospace',fontSize:'.68rem',color:'var(--cyan)'}}>{selectedFile.name}</div>
                        <button onClick={()=>setSelectedFile(null)} style={{background:'none',border:'none',cursor:'pointer',color:'var(--text3)',fontSize:'1rem'}}>✕</button>
                      </div>
                      <pre style={{fontFamily:'JetBrains Mono,monospace',fontSize:'.78rem',color:'var(--text2)',whiteSpace:'pre-wrap',lineHeight:1.7,maxHeight:320,overflow:'auto'}}>{selectedFile.content}</pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
