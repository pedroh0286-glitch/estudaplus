'use strict';
/* AEDS 9.0 — análise pedagógica, qualidade de itens e revisão por causas. */
window.AEDS_ANALYTICS=(()=>{
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  function reviewClusters(items,qById){
    const map=new Map();
    for(const item of items||[]){const q=qById(item.qid);if(!q)continue;const key=`${q.subject}|${q.grade}|${q.skill||q.area}`;let g=map.get(key);if(!g){g={key,subject:q.subject,grade:Number(q.grade),area:q.area,skill:q.skill||q.area,items:[],wrong:0,blank:0,cdfD:0,cdfF:0};map.set(key,g)}g.items.push(item);if(item.reason==='em branco')g.blank++;else if(item.reason==='errada')g.wrong++;else if(item.reason==='dúvida')g.cdfD++;else if(item.reason==='falha')g.cdfF++}
    return [...map.values()].sort((a,b)=>b.items.length-a.items.length||a.subject.localeCompare(b.subject));
  }
  function studentAbility(stats){if(!stats)return 0;const q=Number(stats.questions)||0,c=Number(stats.correct)||0;return q?c/q:0}
  function itemMetrics(users,statsById,qById,feedback=[]){
    const studentAbilityMap=new Map((users||[]).filter(u=>u.role==='student').map(u=>[u.id,studentAbility(statsById?.[u.id])]));
    const agg=new Map();
    for(const u of users||[]){if(u.role!=='student')continue;for(const h of statsById?.[u.id]?.history||[]){const q=qById(h.qid);if(!q||q.questionType!=='multiple_choice')continue;let x=agg.get(q.id);if(!x){x={qid:q.id,q,n:0,correct:0,selections:Array(Math.max(2,q.options?.length||5)).fill(0),highN:0,highCorrect:0,lowN:0,lowCorrect:0,confusing:0};agg.set(q.id,x)}x.n++;if(h.right)x.correct++;if(Number.isInteger(h.selected)&&h.selected>=0&&h.selected<x.selections.length)x.selections[h.selected]++;const a=studentAbilityMap.get(u.id)||0;if(a>=.7){x.highN++;if(h.right)x.highCorrect++}if(a<=.4){x.lowN++;if(h.right)x.lowCorrect++}}
    }
    for(const f of feedback||[]){if(!String(f.kind||'').toLowerCase().includes('quest'))continue;const id=String(f.ref||'').split(' ')[0];const x=agg.get(id);if(x)x.confusing++}
    return [...agg.values()].map(x=>{const p=x.n?x.correct/x.n:0,high=x.highN?x.highCorrect/x.highN:null,low=x.lowN?x.lowCorrect/x.lowN:null,disc=high!=null&&low!=null?high-low:null;const distractors=x.selections.map((n,i)=>({i,n,rate:x.n?n/x.n:0}));const unused=distractors.filter(d=>d.i!==x.q.correctIndex&&d.n===0).length;const flags=[];if(x.n>=20&&p<.15)flags.push('difícil demais ou ambígua');if(x.n>=20&&p>.95)flags.push('fácil demais');if(x.n>=20&&disc!=null&&disc<=0)flags.push('discriminação suspeita');if(x.n>=15&&unused>=2)flags.push('distratores fracos');if(x.confusing>=3)flags.push('muitos relatos de confusão');return {...x,correctRate:p,discrimination:disc,distractors,unused,flags,ready3pl:x.n>=80&&x.highN>=15&&x.lowN>=15}}).sort((a,b)=>b.flags.length-a.flags.length||b.n-a.n);
  }
  function coverage(questions,curricula={}){
    const rows=[];
    const by=new Map();
    for(const q of questions||[]){if(q.active===false)continue;const key=`${q.subject}|${q.grade}|${q.area}|${q.skill||q.area}`;let x=by.get(key);if(!x){x={key,subject:q.subject,grade:Number(q.grade),area:q.area,skill:q.skill||q.area,questions:0,families:new Set(),patterns:new Set(),discursive:0};by.set(key,x)}x.questions++;if(q.rootFamily||q.family)x.families.add(q.rootFamily||q.family);if(q.patternFamily)x.patterns.add(q.patternFamily);if(q.questionType==='discursive')x.discursive++}
    for(const x of by.values())rows.push({...x,families:x.families.size,patterns:x.patterns.size,health:x.families.size>=6?'boa':x.families.size>=3?'atenção':'fraca'});
    return rows.sort((a,b)=>a.families-b.families||a.questions-b.questions);
  }
  function strategyModel(history=[]){
    const bag={explain_first:{n:0,success:0},attempt_first:{n:0,success:0}};
    for(const h of history||[]){const s=h.learningStrategy;if(!bag[s])continue;bag[s].n++;if(h.right)bag[s].success++}
    const score=k=>{const x=bag[k];return (x.success+1.5)/(x.n+3)};
    const a=score('explain_first'),b=score('attempt_first');
    return {bag,scores:{explain_first:a,attempt_first:b},preferred:Math.abs(a-b)<.08?'mixed':a>b?'explain_first':'attempt_first',confidence:Math.min(1,(bag.explain_first.n+bag.attempt_first.n)/20)};
  }
  function chooseStrategy(history=[],explore=.18){const m=strategyModel(history);if(Math.random()<explore||m.preferred==='mixed')return Math.random()<.5?'explain_first':'attempt_first';return m.preferred}
  function todayRecommendation(stats,questions,qById){
    const due=Object.entries(stats?.skill||{}).filter(([,v])=>v?.done&&v?.nextReviewAt&&v.nextReviewAt<=Date.now()).length;
    const errors=(stats?.errors||[]).slice(-80);const last=errors.length?qById(errors[errors.length-1].qid):null;
    if(due)return {icon:'🕒',title:`${due} revisão(ões) no ponto certo`,text:'Recupere antes de esquecer; poucas questões novas são suficientes.',page:'review'};
    if(last)return {icon:'🧩',title:`Retomar ${last.skill||last.area}`,text:'Você errou algo relacionado recentemente. AEDS pode testar a habilidade com outro problema.',page:'train'};
    return {icon:'🌱',title:'Aprender algo novo',text:'Escolha uma explicação curta e depois tente usar a ideia fora da AEDS.',page:'learn'};
  }
  return {VERSION:'9.0',reviewClusters,itemMetrics,coverage,strategyModel,chooseStrategy,todayRecommendation};
})();
