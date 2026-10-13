'use strict';
/* AEDS 8.29 — motor pedagógico puro.
   Mantém cálculo de retenção, estágios de domínio e TRI separado da interface. */
window.AEDS_ENGINE=(()=>{
  const DAY=86400000;
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  function normalizeSkillStat(x={}){
    const out=x&&typeof x==='object'?x:{};
    for(const k of ['done','correct','errors','content','interpretation','distraction','timeMs','confidentCorrect','transferCorrect','retentionPasses','retentionFails'])out[k]=Number(out[k])||0;
    out.firstSeen=Number(out.firstSeen)||0;out.lastSeen=Number(out.lastSeen)||0;out.lastCorrect=Number(out.lastCorrect)||0;
    out.nextReviewAt=Number(out.nextReviewAt)||0;out.intervalDays=Math.max(0,Number(out.intervalDays)||0);out.streak=Math.max(0,Number(out.streak)||0);
    return out;
  }
  function intervalAfter(stat,right,cdf,delayed){
    const prev=Math.max(0,Number(stat.intervalDays)||0);
    if(!right||cdf==='F')return 1;
    if(cdf==='D')return prev>=2?3:2;
    if(delayed)return prev>=21?45:prev>=10?21:prev>=5?10:prev>=2?5:3;
    return prev>=14?30:prev>=7?14:prev>=3?7:3;
  }
  function updateSkill(stat,{right=false,cdf='F',difficulty='médio',elapsed=0,now=Date.now()}={}){
    stat=normalizeSkillStat(stat);const previousSeen=stat.lastSeen||0,daysGap=previousSeen?(now-previousSeen)/DAY:0,delayed=daysGap>=2;
    if(!stat.firstSeen)stat.firstSeen=now;stat.done++;stat.timeMs+=Math.max(0,Number(elapsed)||0);stat.lastSeen=now;
    if(right&&cdf!=='F'){stat.correct++;stat.streak++;stat.lastCorrect=now;if(cdf==='C')stat.confidentCorrect++;if(cdf==='C'&&!String(difficulty).toLowerCase().includes('fác'))stat.transferCorrect++;if(delayed)stat.retentionPasses++}
    else{stat.errors++;stat.streak=0;if(delayed)stat.retentionFails++}
    stat.intervalDays=intervalAfter(stat,right,cdf,delayed);stat.nextReviewAt=now+stat.intervalDays*DAY;
    return stat;
  }
  function stage(stat,externalProof=false){
    const s=normalizeSkillStat(stat),accuracy=s.done?s.correct/s.done:0;
    let level=0;
    if(s.done>=1)level=1;
    if(s.done>=2&&accuracy>=.55)level=2;
    if(s.done>=4&&accuracy>=.70&&s.confidentCorrect>=1)level=3;
    if(s.done>=6&&accuracy>=.80&&s.transferCorrect>=2&&s.retentionPasses>=1&&externalProof)level=4;
    const defs=[
      {level:0,icon:'○',label:'Ainda não iniciado',short:'novo'},
      {level:1,icon:'🌱',label:'Conhecendo',short:'conhecendo'},
      {level:2,icon:'🧠',label:'Entendendo',short:'entendendo'},
      {level:3,icon:'🔄',label:'Aplicando',short:'aplicando'},
      {level:4,icon:'🏆',label:'Independente',short:'independente'}
    ];
    const d=defs[level];
    const progress=level===4?100:level===3?Math.round(72+Math.min(25,(accuracy-.70)*100)):level===2?Math.round(42+Math.min(28,(accuracy-.55)*100)):level===1?Math.min(40,15+s.done*8):0;
    return {...d,accuracy:Math.round(accuracy*100),progress:clamp(progress,0,100)};
  }
  function isDue(stat,now=Date.now()){const s=normalizeSkillStat(stat);return !!(s.done&&s.nextReviewAt&&s.nextReviewAt<=now)}
  function reviewLabel(stat,now=Date.now()){const s=normalizeSkillStat(stat);if(!s.done)return'novo';if(!s.nextReviewAt)return'agendar revisão';const delta=Math.ceil((s.nextReviewAt-now)/DAY);if(delta<=0)return'revisar hoje';if(delta===1)return'revisar amanhã';return`revisar em ${delta} dias`}
  function triParams(q){const d=String(q?.difficulty||'médio').toLowerCase(),opts=Math.max(2,q?.options?.length||5),fallback=d.includes('fác')?{a:.95,b:-1.15}:d.includes('dif')?{a:1.2,b:1.1}:{a:1.08,b:0},t=q?.tri||{};return {a:Number.isFinite(Number(t.a))?Number(t.a):fallback.a,b:Number.isFinite(Number(t.b))?Number(t.b):fallback.b,c:Number.isFinite(Number(t.c))?Number(t.c):Math.min(.35,1/opts),source:q?.tri?'calibrado/importado':'estimado pela dificuldade'}}
  function triProb(theta,p){const z=clamp(1.7*p.a*(theta-p.b),-35,35);return p.c+(1-p.c)/(1+Math.exp(-z))}
  function triEstimate(responses){if(!responses?.length)return {theta:0,score:500,se:null,coherence:0,n:0,estimated:true};const grid=[];let maxLog=-Infinity;for(let theta=-4;theta<=4.0001;theta+=.05){let ll=-theta*theta/2;for(const r of responses){const p=clamp(triProb(theta,triParams(r.q)),1e-9,1-1e-9);ll+=r.right?Math.log(p):Math.log(1-p)}grid.push([theta,ll]);if(ll>maxLog)maxLog=ll}let sw=0,st=0;for(const [t,ll] of grid){const w=Math.exp(ll-maxLog);sw+=w;st+=t*w}const theta=sw?st/sw:0;let variance=0;for(const [t,ll] of grid){const w=Math.exp(ll-maxLog);variance+=(t-theta)**2*w}variance=sw?variance/sw:0;const score=Math.round(clamp(500+100*theta,100,900));const sorted=[...responses].sort((x,y)=>triParams(x.q).b-triParams(y.q).b);let inv=0,pairs=0;for(let i=0;i<sorted.length;i++)for(let j=i+1;j<sorted.length;j++){if(triParams(sorted[j].q).b-triParams(sorted[i].q).b<.45)continue;pairs++;if(!sorted[i].right&&sorted[j].right)inv++}const coherence=pairs?Math.round(100*(1-inv/pairs)):100;return {theta:Number(theta.toFixed(2)),score,se:Number(Math.sqrt(variance).toFixed(2)),coherence,n:responses.length,estimated:responses.some(r=>!r.q?.tri)}}
  return {VERSION:'8.29',DAY,normalizeSkillStat,updateSkill,stage,isDue,reviewLabel,triParams,triProb,triEstimate};
})();
