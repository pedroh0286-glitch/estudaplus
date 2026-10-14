'use strict';
/* AEDS 9.0.11 — Conquistas por evidência.
   Não premia presença, streak ou clique. Marcos de aprendizagem usam evidência já auditada
   pelo banco e pelo Rastro. Conquistas permanecem registradas depois de obtidas. */
window.AEDS_ACHIEVEMENTS=(()=>{
  const VERSION='1.0';
  const n=x=>Math.max(0,Number(x)||0);
  const pct=x=>Math.round(n(x)*1000)/10;
  const DEFINITIONS=[
    {id:'correct_1',group:'marcos',title:'Primeiro passo',desc:'Acertou a primeira questão.',metric:'correct',goal:1},
    {id:'correct_100',group:'marcos',title:'100 respostas certas',desc:'100 acertos acumulados.',metric:'correct',goal:100},
    {id:'correct_1000',group:'marcos',title:'1.000 respostas certas',desc:'1.000 acertos acumulados.',metric:'correct',goal:1000},
    {id:'correct_5000',group:'marcos',title:'5.000 respostas certas',desc:'5.000 acertos acumulados.',metric:'correct',goal:5000},
    {id:'correct_10000',group:'marcos',title:'10.000 respostas certas',desc:'10.000 acertos acumulados. Um marco de longo prazo.',metric:'correct',goal:10000},
    {id:'confident_1000',group:'marcos',title:'1.000 acertos confiantes',desc:'1.000 respostas certas sem marcar falha ou chute.',metric:'confidentCorrect',goal:1000},
    {id:'families_100',group:'exploracao',title:'100 estruturas diferentes',desc:'Resolveu questões de pelo menos 100 famílias semânticas diferentes.',metric:'uniqueFamilies',goal:100},
    {id:'families_1000',group:'exploracao',title:'1.000 estruturas diferentes',desc:'Resolveu questões de pelo menos 1.000 famílias semânticas diferentes.',metric:'uniqueFamilies',goal:1000},
    {id:'subjects_5',group:'exploracao',title:'Conhecimento em cinco áreas',desc:'Conseguiu acertos em pelo menos cinco matérias.',metric:'subjectsCorrect',goal:5},
    {id:'subjects_10',group:'exploracao',title:'Conhecimento multidisciplinar',desc:'Conseguiu acertos em pelo menos dez matérias.',metric:'subjectsCorrect',goal:10},
    {id:'verified_1',group:'rastro',title:'Primeira aprendizagem verificada',desc:'O Rastro confirmou transferência, retenção e estabilidade em uma habilidade.',metric:'verifiedSkills',goal:1},
    {id:'verified_10',group:'rastro',title:'10 aprendizagens verificadas',desc:'Dez habilidades passaram pelo portão rigoroso do Rastro.',metric:'verifiedSkills',goal:10},
    {id:'verified_50',group:'rastro',title:'50 aprendizagens verificadas',desc:'Cinquenta habilidades com evidência de transferência e retenção.',metric:'verifiedSkills',goal:50},
    {id:'verified_100',group:'rastro',title:'100 aprendizagens verificadas',desc:'Cem habilidades verificadas pelo Rastro.',metric:'verifiedSkills',goal:100},
    {id:'transfer_1',group:'rastro',title:'Transferência comprovada',desc:'Usou uma habilidade com sucesso em uma estrutura independente.',metric:'transferProofs',goal:1},
    {id:'transfer_25',group:'rastro',title:'25 transferências comprovadas',desc:'Aplicou conhecimentos em 25 contraprovas independentes.',metric:'transferProofs',goal:25},
    {id:'transfer_100',group:'rastro',title:'100 transferências comprovadas',desc:'Aplicou conhecimentos em 100 contraprovas independentes.',metric:'transferProofs',goal:100},
    {id:'retention_1',group:'rastro',title:'Lembrou depois',desc:'Recuperou corretamente uma habilidade após intervalo.',metric:'retentionProofs',goal:1},
    {id:'retention_25',group:'rastro',title:'25 memórias resistentes',desc:'Vinte e cinco recuperações corretas após intervalo.',metric:'retentionProofs',goal:25},
    {id:'retention_100',group:'rastro',title:'100 memórias resistentes',desc:'Cem provas de retenção após intervalo.',metric:'retentionProofs',goal:100},
    {id:'deep_recovery_1',group:'rastro',title:'Transformou dificuldade em domínio',desc:'Verificou uma habilidade depois de pelo menos duas falhas no mesmo caso.',metric:'deepRecoveries',goal:1},
    {id:'deep_recovery_10',group:'rastro',title:'10 reconstruções profundas',desc:'Verificou dez habilidades que antes resistiram a duas ou mais tentativas.',metric:'deepRecoveries',goal:10},
    {id:'independent_10',group:'autonomia',title:'10 habilidades independentes',desc:'Chegou ao estágio Independente em dez habilidades.',metric:'independentSkills',goal:10},
    {id:'independent_50',group:'autonomia',title:'50 habilidades independentes',desc:'Chegou ao estágio Independente em cinquenta habilidades.',metric:'independentSkills',goal:50},
    {id:'independent_100',group:'autonomia',title:'100 habilidades independentes',desc:'Chegou ao estágio Independente em cem habilidades.',metric:'independentSkills',goal:100},
    {id:'method_discovered',group:'descoberta',title:'Meu método de estudo foi descoberto',desc:'A AEDS reuniu evidência suficiente para identificar qual estratégia funciona melhor para você.',special:'method'},
    {id:'method_flexible',group:'descoberta',title:'Aprendizagem flexível',desc:'Com amostra grande, explicação primeiro e tentativa primeiro tiveram resultados praticamente equivalentes.',special:'flexible'}
  ];
  function strategyEvidence(history=[]){
    const groups={attempt_first:{n:0,score:0,right:0,confident:0},explain_first:{n:0,score:0,right:0,confident:0}};
    for(const h of history||[]){const k=h?.strategy;if(!groups[k])continue;const g=groups[k];g.n++;if(h.right)g.right++;if(h.right&&h.cdf==='C')g.confident++;g.score+=h.right?(h.cdf==='C'?1:h.cdf==='D'?.72:.35):0}
    for(const g of Object.values(groups))g.rate=g.n?g.score/g.n:0;
    const a=groups.attempt_first,e=groups.explain_first,diff=a.rate-e.rate,abs=Math.abs(diff),enough=a.n>=30&&e.n>=30;
    let result={enough,winner:null,diff,attempt:a,explain:e,label:null};
    if(enough&&abs>=.10){result.winner=diff>0?'attempt_first':'explain_first';result.label=result.winner==='attempt_first'?'Tentar primeiro':'Explicação primeiro'}
    else if(a.n>=40&&e.n>=40&&abs<=.04){result.winner='flexible';result.label='Os dois métodos funcionam de forma parecida'}
    return result;
  }
  function metrics(ctx={}){
    const s=ctx.stats||{},rastro=ctx.rastro||{},history=Array.isArray(s.history)?s.history:[];
    let verifiedSkills=0,transferProofs=0,retentionProofs=0,deepRecoveries=0;
    for(const trace0 of Object.values(rastro||{})){
      const trace=ctx.rastroApi?.normalize?ctx.rastroApi.normalize(trace0):trace0||{};
      const gate=ctx.rastroApi?.masteryGate?ctx.rastroApi.masteryGate(trace):null;
      if(gate?.passed)verifiedSkills++;
      transferProofs+=n(trace.transferProof);retentionProofs+=n(trace.retentionProof);
      for(const c of trace.cases||[])if(c?.status==='verified'&&n(c.failures)>=2)deepRecoveries++;
    }
    const subjects=new Set(history.filter(h=>h?.right&&h?.subject).map(h=>h.subject));
    const strategy=strategyEvidence(history),methodProfile=ctx.methodsApi?.profile?ctx.methodsApi.profile(history):null;
    return {
      correct:n(s.correct),confidentCorrect:n(s.masteredCorrect),uniqueFamilies:new Set(s.answeredRoots||[]).size,
      subjectsCorrect:subjects.size,verifiedSkills,transferProofs,retentionProofs,deepRecoveries,
      independentSkills:n(ctx.independentSkills),strategy,methodProfile
    };
  }
  function evaluate(ctx={}){
    const m=metrics(ctx);return DEFINITIONS.map(d=>{
      let earned=false,progress=0,detail='';
      if(d.metric){const v=n(m[d.metric]);earned=v>=d.goal;progress=Math.min(1,v/d.goal);detail=`${v.toLocaleString('pt-BR')} / ${d.goal.toLocaleString('pt-BR')}`}
      if(d.special==='method'){const p=m.methodProfile;earned=!!p?.validated&&!!p?.best;progress=p?.best?Math.min(1,p.best.n/Math.max(1,p.best.method.minEvidence)):0;detail=earned?`${p.best.method.title} · ${pct(p.best.score)}% ponderado em ${p.best.n} usos`:`A AEDS ainda está testando métodos com amostra mínima antes de declarar preferência.`}
      if(d.special==='flexible'){earned=m.strategy.winner==='flexible';progress=Math.min(1,Math.min(m.strategy.attempt.n,m.strategy.explain.n)/40);detail=earned?`Diferença ponderada de apenas ${Math.abs(pct(m.strategy.diff))} p.p.`:`${Math.min(m.strategy.attempt.n,m.strategy.explain.n)} / 40 comparações mínimas em cada estratégia`}
      return {...d,earned,progress,detail};
    })
  }
  function unlock(current={},ctx={},now=Date.now()){
    current=current&&typeof current==='object'?{...current}:{};const unlocked=[];
    for(const a of evaluate(ctx))if(a.earned&&!current[a.id]){current[a.id]={unlockedAt:new Date(now).toISOString(),title:a.title,detail:a.detail};unlocked.push({...a,unlockedAt:current[a.id].unlockedAt})}
    return {earned:current,unlocked,all:evaluate(ctx),metrics:metrics(ctx)};
  }
  return {VERSION,DEFINITIONS,strategyEvidence,metrics,evaluate,unlock};
})();
