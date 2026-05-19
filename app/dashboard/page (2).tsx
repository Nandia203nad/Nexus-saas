'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';

type Tab = 'overview'|'growth'|'engagement'|'revenue';
interface AdminData { stats:{userCount:number;blogCount:number;commentCount:number;premiumCount:number;maxCount:number}; topUsers:Array<{id:string;name:string;email:string;xp:number;level:number;plan:string;streak:number;_count:{blogs:number;comments:number}}>; recentBlogs:Array<{id:string;title:string;author:{name:string};_count:{comments:number;likes:number};views:number}>; }

export default function DashboardPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('overview');
  const [data, setData] = useState<AdminData|null>(null);
  const [loading, setLoading] = useState(true);
  const chartsRef = useRef<Record<string,unknown>>({});
  const chartJsLoaded = useRef(false);

  useEffect(() => {
    const token = localStorage.getItem('nexus_token');
    if (!token) { router.replace('/'); return; }
    fetch('/api/admin',{headers:{Authorization:`Bearer ${token}`}}).then(r=>r.json()).then(d=>{if(d.success)setData(d);}).finally(()=>setLoading(false));
    if (!document.getElementById('cjs')) {
      const s=document.createElement('script'); s.id='cjs'; s.src='https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js'; document.head.appendChild(s);
    }
  },[router]);

  const destroyCharts = () => { Object.values(chartsRef.current).forEach((c:unknown)=>{try{(c as {destroy:()=>void}).destroy();}catch{}}); chartsRef.current={}; };

  const makeChart = (id:string, type:string, chartData:unknown, opts:unknown) => {
    const el = document.getElementById(id) as HTMLCanvasElement|null; if(!el) return;
    const C = (window as unknown as {Chart:new(el:HTMLCanvasElement,cfg:unknown)=>unknown}).Chart;
    if (!C) { setTimeout(()=>makeChart(id,type,chartData,opts),400); return; }
    if (chartsRef.current[id]) { try{(chartsRef.current[id] as {destroy:()=>void}).destroy();}catch{} }
    chartsRef.current[id] = new C(el,{type,data:chartData,options:opts});
  };

  const base = { responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}}, scales:{x:{ticks:{color:'#718096',font:{size:11,family:'JetBrains Mono'}},grid:{color:'rgba(99,179,237,0.05)'}},y:{ticks:{color:'#718096',font:{size:10,family:'JetBrains Mono'}},grid:{color:'rgba(99,179,237,0.05)'}}} };
  const noScale = { responsive:true, maintainAspectRatio:false, plugins:{legend:{display:true,labels:{color:'#a0aec0',font:{size:11,family:'JetBrains Mono'},boxWidth:12,padding:14}}}, cutout:'65%' };

  useEffect(()=>{
    destroyCharts();
    const t=setTimeout(()=>{
      if(tab==='overview'){
        makeChart('c1','bar',{labels:['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],datasets:[{data:[180,240,195,310,420,285,210],backgroundColor:['rgba(99,179,237,0.22)','rgba(159,122,234,0.22)','rgba(99,179,237,0.22)','rgba(104,211,145,0.25)','rgba(99,179,237,0.8)','rgba(159,122,234,0.22)','rgba(99,179,237,0.22)'],borderColor:['#63b3ed','#9f7aea','#63b3ed','#68d391','#63b3ed','#9f7aea','#63b3ed'],borderWidth:1,borderRadius:4}]},base);
        makeChart('c2','doughnut',{labels:['AI','Marketing','SEO','Freelance','Other'],datasets:[{data:[28,22,18,12,20],backgroundColor:['#63b3ed','#9f7aea','#68d391','#f6ad55','#ed64a6'],borderWidth:0,hoverOffset:5}]},{...noScale});
      } else if(tab==='growth'){
        const months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        const lOpts={...base,plugins:{legend:{display:true,labels:{color:'#a0aec0',font:{size:11,family:'JetBrains Mono'},boxWidth:14,padding:12}}}};
        makeChart('cg1','line',{labels:months,datasets:[{label:'Total Users',data:[800,920,1050,1200,1380,1520,1720,1900,2050,2180,2310,2401],borderColor:'#63b3ed',backgroundColor:'rgba(99,179,237,0.08)',fill:true,tension:0.4,pointBackgroundColor:'#63b3ed',pointRadius:4,borderWidth:2},{label:'Premium',data:[0,0,0,2,3,4,5,5,5,5,5,5],borderColor:'#9f7aea',backgroundColor:'rgba(159,122,234,0.06)',fill:true,tension:0.4,borderDash:[5,5],pointBackgroundColor:'#9f7aea',pointRadius:3,borderWidth:2}]},lOpts);
        makeChart('cg2','bar',{labels:months,datasets:[{label:'New Posts',data:[0,0,2,3,4,5,6,7,8,9,9,10],backgroundColor:(c: {dataIndex:number})=>{const cols=['rgba(99,179,237,0.15)','rgba(99,179,237,0.15)','rgba(99,179,237,0.18)','rgba(104,211,145,0.18)','rgba(99,179,237,0.2)','rgba(159,122,234,0.18)','rgba(104,211,145,0.2)','rgba(99,179,237,0.22)','rgba(159,122,234,0.2)','rgba(99,179,237,0.25)','rgba(99,179,237,0.25)','rgba(99,179,237,0.7)'];return cols[c.dataIndex];},borderColor:'rgba(99,179,237,0.4)',borderWidth:1,borderRadius:4}]},{...base,plugins:{legend:{display:false}}});
      } else if(tab==='engagement'){
        makeChart('ce1','bar',{labels:['AI','Marketing','SEO','TikTok','Freelance','Web3','Book'],datasets:[{data:[4200,3560,2100,1890,756,4200,890],backgroundColor:'rgba(99,179,237,0.18)',borderColor:'#63b3ed',borderWidth:1,borderRadius:4}]},{...base,indexAxis:'y' as const});
        makeChart('ce2','pie',{labels:['♥ Like','💬 Comment','◈ Bookmark','👁 View'],datasets:[{data:[34,28,18,20],backgroundColor:['rgba(237,100,166,0.6)','rgba(99,179,237,0.6)','rgba(104,211,145,0.6)','rgba(159,122,234,0.6)'],borderColor:['#ed64a6','#63b3ed','#68d391','#9f7aea'],borderWidth:1}]},{...noScale,cutout:'55%'});
      } else if(tab==='revenue'){
        const months2=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        makeChart('cr1','bar',{labels:months2,datasets:[{label:'Revenue ($)',data:[0,0,0,6,9,12,15,15,15,15,15,15],backgroundColor:(c:{dataIndex:number})=>{const g=(c as unknown as {chart:{ctx:CanvasRenderingContext2D;chartArea:{bottom:number}}}).chart.ctx.createLinearGradient(0,0,0,(c as unknown as {chart:{chartArea:{bottom:number}}}).chart.chartArea.bottom);g.addColorStop(0,'rgba(99,179,237,0.7)');g.addColorStop(1,'rgba(99,179,237,0.05)');return g;},borderColor:'#63b3ed',borderWidth:1,borderRadius:4}]},{...base,plugins:{legend:{display:false}}});
        makeChart('cr2','doughnut',{labels:['Premium $3/mo','Max $7/mo','Free'],datasets:[{data:[15,35,50],backgroundColor:['rgba(99,179,237,0.7)','rgba(159,122,234,0.7)','rgba(104,211,145,0.3)'],borderWidth:0}]},{...noScale});
      }
    },150);
    return ()=>clearTimeout(t);
  },[tab]);

  const PLAN_COL: Record<string,string> = {FREE:'var(--green)',PREMIUM:'var(--cyan)',MAX:'var(--purple)'};
  const TABS:Tab[]=['overview','growth','engagement','revenue'];

  if(loading) return <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',position:'relative',zIndex:1}}><Navbar /><div style={{width:44,height:44,border:'3px solid rgba(99,179,237,0.15)',borderTopColor:'var(--cyan)',borderRadius:'50%',animation:'spin 0.7s linear infinite'}} /></div>;

  const stats = data?.stats || {userCount:9,blogCount:10,commentCount:0,premiumCount:5,maxCount:0};
  const topUsers = data?.topUsers || [];
  const recentBlogs = data?.recentBlogs || [];

  return (
    <div style={{position:'relative',zIndex:1,minHeight:'100vh'}}>
      <Navbar />
      <div className="container" style={{paddingTop:28,paddingBottom:60}}>
        <div style={{marginBottom:28}}>
          <div className="editorial-label" style={{marginBottom:10}}>System Analytics</div>
          <h1 className="editorial-title" style={{fontSize:'clamp(1.3rem,3vw,1.9rem)',marginBottom:4}}>Admin <span className="grad-text">Dashboard</span></h1>
          <div style={{fontFamily:'JetBrains Mono,monospace',fontSize:'.6rem',color:'var(--text3)'}}>// Real-time platform metrics · {new Date().toLocaleDateString('mn-MN')}</div>
        </div>

        {/* Metric cards */}
        <div className="grid-4" style={{marginBottom:24}}>
          {[
            {icon:'👥',label:'TOTAL USERS',val:stats.userCount,color:'var(--cyan)',trend:'+12%'},
            {icon:'📝',label:'TOTAL POSTS',val:stats.blogCount,color:'var(--purple)',trend:'+10%'},
            {icon:'💎',label:'PREMIUM',val:stats.premiumCount,color:'var(--magenta)',trend:'+5%'},
            {icon:'💬',label:'COMMENTS',val:stats.commentCount,color:'var(--green)',trend:'+23%'},
          ].map(m=>(
            <div key={m.label} className="glass-card" style={{padding:20}}>
              <div className="corner c-tl" style={{borderColor:m.color,opacity:0.5}} />
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10}}>
                <span style={{fontSize:'1.5rem'}}>{m.icon}</span>
                <span style={{fontFamily:'JetBrains Mono,monospace',fontSize:'.58rem',color:'var(--green)',background:'rgba(104,211,145,0.08)',padding:'2px 6px',borderRadius:4}}>{m.trend}</span>
              </div>
              <div className="editorial-title" style={{fontSize:'1.8rem',color:m.color,lineHeight:1,marginBottom:4}}>{m.val.toLocaleString()}</div>
              <div style={{fontFamily:'JetBrains Mono,monospace',fontSize:'.52rem',color:'var(--text3)',letterSpacing:'.08em'}}>{m.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{display:'flex',gap:3,marginBottom:22,background:'rgba(99,179,237,0.03)',border:'1px solid rgba(99,179,237,0.1)',borderRadius:10,padding:4}}>
          {TABS.map(t=>(
            <button key={t} onClick={()=>setTab(t)} style={{flex:1,padding:'9px 6px',borderRadius:8,border:tab===t?'1px solid rgba(99,179,237,0.32)':'1px solid transparent',cursor:'pointer',fontFamily:'JetBrains Mono,monospace',fontSize:'.58rem',color:tab===t?'var(--cyan)':'var(--text3)',background:tab===t?'rgba(99,179,237,0.1)':'transparent',letterSpacing:'.06em',transition:'all 0.2s',textTransform:'uppercase'}}>
              {t}
            </button>
          ))}
        </div>

        {tab==='overview'&&(
          <div style={{display:'flex',flexDirection:'column',gap:20}}>
            <div className="grid-2">
              <div className="glass-card" style={{padding:22}}>
                <div className="corner c-tl" />
                <div className="editorial-label" style={{marginBottom:14}}>Weekly Active Users</div>
                <div style={{height:220}}><canvas id="c1" /></div>
              </div>
              <div className="glass-card" style={{padding:22}}>
                <div className="corner c-tl" />
                <div className="editorial-label" style={{marginBottom:14}}>Content by Category</div>
                <div style={{height:220}}><canvas id="c2" /></div>
              </div>
            </div>
            {/* 9 active users leaderboard */}
            <div className="glass-card" style={{padding:22}}>
              <div className="corner c-tl" />
              <div className="editorial-label" style={{marginBottom:16}}>Top 9 Architects — XP Leaderboard</div>
              <div style={{display:'flex',flexDirection:'column',gap:8}}>
                {topUsers.map((u,i)=>(
                  <div key={u.id} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 14px',background:'rgba(99,179,237,0.03)',border:'1px solid rgba(99,179,237,0.06)',borderRadius:9,transition:'border-color 0.2s'}} onMouseOver={e=>(e.currentTarget.style.borderColor='rgba(99,179,237,0.2)')} onMouseOut={e=>(e.currentTarget.style.borderColor='rgba(99,179,237,0.06)')}>
                    <div style={{width:26,height:26,borderRadius:'50%',background:i<3?'linear-gradient(135deg,var(--yellow),var(--orange))':'var(--surface)',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'JetBrains Mono,monospace',fontWeight:700,fontSize:'.7rem',color:i<3?'#050810':'var(--text3)',flexShrink:0}}>#{i+1}</div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:3}}>
                        <span style={{fontWeight:600,fontSize:'.88rem'}}>{u.name}</span>
                        <span className={`badge ${u.plan==='MAX'?'b-max':u.plan==='PREMIUM'?'b-premium':'b-free'}`} style={{fontSize:'.5rem',padding:'1px 6px'}}>{u.plan}</span>
                        {u.streak>20&&<span style={{fontSize:'.65rem'}}>🔥{u.streak}</span>}
                      </div>
                      <div style={{display:'flex',gap:12,alignItems:'center'}}>
                        <div style={{width:120,height:4,background:'rgba(99,179,237,0.08)',borderRadius:2,overflow:'hidden'}}>
                          <div style={{height:'100%',width:`${Math.min(100,(u.xp/7200)*100)}%`,background:`linear-gradient(90deg,${PLAN_COL[u.plan]||'var(--cyan)'},${PLAN_COL[u.plan]||'var(--cyan)'}88)`,borderRadius:2}} />
                        </div>
                        <span style={{fontFamily:'JetBrains Mono,monospace',fontSize:'.6rem',color:PLAN_COL[u.plan]||'var(--cyan)',fontWeight:600}}>{u.xp.toLocaleString()} XP</span>
                      </div>
                    </div>
                    <div style={{display:'flex',gap:14,fontFamily:'JetBrains Mono,monospace',fontSize:'.6rem',color:'var(--text3)',flexShrink:0}}>
                      <span>Lv.{u.level}</span>
                      <span>📝{u._count.blogs}</span>
                      <span>💬{u._count.comments}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Platform metrics */}
            <div className="glass-card" style={{padding:22}}>
              <div className="corner c-tl" />
              <div className="editorial-label" style={{marginBottom:16}}>Platform Analytics</div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:14}}>
                {[{l:'Conversion Rate',v:`${stats.userCount>0?Math.round((stats.premiumCount/stats.userCount)*100):0}%`,b:stats.userCount>0?(stats.premiumCount/stats.userCount)*100:0,c:'var(--magenta)'},{l:'Avg Posts/User',v:(stats.blogCount/Math.max(stats.userCount,1)).toFixed(1),b:Math.min(100,(stats.blogCount/Math.max(stats.userCount,1))*20),c:'var(--purple)'},{l:'Premium Rate',v:`${stats.userCount>0?Math.round((stats.premiumCount/stats.userCount)*100):0}%`,b:stats.userCount>0?(stats.premiumCount/stats.userCount)*100:0,c:'var(--cyan)'},{l:'Max Rate',v:`${stats.userCount>0?Math.round((stats.maxCount/stats.userCount)*100):0}%`,b:stats.userCount>0?(stats.maxCount/stats.userCount)*100:0,c:'var(--orange)'}].map(m=>(
                  <div key={m.l} style={{background:'rgba(0,0,0,0.2)',border:'1px solid rgba(99,179,237,0.06)',borderRadius:10,padding:14}}>
                    <div style={{fontFamily:'JetBrains Mono,monospace',fontSize:'.54rem',color:'var(--text3)',marginBottom:5,letterSpacing:'.07em'}}>{m.l.toUpperCase()}</div>
                    <div className="editorial-title" style={{fontSize:'1.4rem',color:m.c,marginBottom:8}}>{m.v}</div>
                    <div className="xp-bar" style={{height:4}}><div className="xp-fill" style={{width:`${m.b}%`,background:`linear-gradient(90deg,${m.c},${m.c}88)`}} /></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab==='growth'&&(
          <div style={{display:'flex',flexDirection:'column',gap:20}}>
            <div className="glass-card" style={{padding:22}}>
              <div className="corner c-tl" />
              <div className="editorial-label" style={{marginBottom:14}}>User Growth — 12 Months</div>
              <div style={{height:280}}><canvas id="cg1" /></div>
            </div>
            <div className="glass-card" style={{padding:22}}>
              <div className="corner c-tl" />
              <div className="editorial-label" style={{marginBottom:14}}>New Posts Per Month</div>
              <div style={{height:220}}><canvas id="cg2" /></div>
            </div>
          </div>
        )}

        {tab==='engagement'&&(
          <div style={{display:'flex',flexDirection:'column',gap:20}}>
            <div className="grid-2">
              <div className="glass-card" style={{padding:22}}>
                <div className="corner c-tl" />
                <div className="editorial-label" style={{marginBottom:14}}>Views by Tag</div>
                <div style={{height:260}}><canvas id="ce1" /></div>
              </div>
              <div className="glass-card" style={{padding:22}}>
                <div className="corner c-tl" />
                <div className="editorial-label" style={{marginBottom:14}}>Interaction Distribution</div>
                <div style={{height:260}}><canvas id="ce2" /></div>
              </div>
            </div>
            {recentBlogs.length>0&&(
              <div className="glass-card" style={{padding:22}}>
                <div className="corner c-tl" />
                <div className="editorial-label" style={{marginBottom:16}}>Recent Posts Performance</div>
                {recentBlogs.map(b=>(
                  <div key={b.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 14px',background:'rgba(99,179,237,0.03)',border:'1px solid rgba(99,179,237,0.06)',borderRadius:9,marginBottom:8}}>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:'.88rem',fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{b.title}</div>
                      <div style={{fontFamily:'JetBrains Mono,monospace',fontSize:'.6rem',color:'var(--text3)'}}>by {b.author.name}</div>
                    </div>
                    <div style={{display:'flex',gap:12,fontFamily:'JetBrains Mono,monospace',fontSize:'.6rem',color:'var(--text3)',flexShrink:0,marginLeft:12}}>
                      <span>👁{(b as unknown as {views?:number}).views||0}</span><span>💬{b._count.comments}</span><span style={{color:'var(--magenta)'}}>♥{b._count.likes}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab==='revenue'&&(
          <div style={{display:'flex',flexDirection:'column',gap:20}}>
            <div className="glass-card" style={{padding:22}}>
              <div className="corner c-tl" />
              <div className="editorial-label" style={{marginBottom:14}}>Monthly Revenue ($)</div>
              <div style={{height:260}}><canvas id="cr1" /></div>
            </div>
            <div className="grid-2">
              <div className="glass-card" style={{padding:22}}>
                <div className="corner c-tl" />
                <div className="editorial-label" style={{marginBottom:14}}>Revenue Split</div>
                <div style={{height:200}}><canvas id="cr2" /></div>
              </div>
              <div className="glass-card" style={{padding:22}}>
                <div className="corner c-tl" />
                <div className="editorial-label" style={{marginBottom:16}}>Key Metrics</div>
                {[{l:'Premium Users',v:`${stats.premiumCount} users × $3`,c:'var(--cyan)'},{l:'Max Users',v:`${stats.maxCount} users × $7`,c:'var(--purple)'},{l:'Total MRR',v:`$${stats.premiumCount*3+stats.maxCount*7}/mo`,c:'var(--green)'},{l:'ARR (projected)',v:`$${(stats.premiumCount*3+stats.maxCount*7)*12}/yr`,c:'var(--orange)'}].map(m=>(
                  <div key={m.l} style={{display:'flex',justifyContent:'space-between',padding:'9px 0',borderBottom:'1px solid rgba(99,179,237,0.06)'}}>
                    <span style={{fontFamily:'JetBrains Mono,monospace',fontSize:'.62rem',color:'var(--text3)'}}>{m.l}</span>
                    <span style={{fontFamily:'JetBrains Mono,monospace',fontSize:'.72rem',fontWeight:700,color:m.c}}>{m.v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
