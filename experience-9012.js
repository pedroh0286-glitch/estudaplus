'use strict';
/* AEDS 9.0.12 — experiência orientada ao próximo passo + Mapa do Saber. */
(()=>{
  function todayRecommendation(){
    const u=targetStudent(),s=stats(u?.id),pool=candidateBank().filter(q=>q.active!==false&&q.questionType==='multiple_choice');
    const due=dueSkillKeys(u?.id),dueSet=new Set(due);
    const dueQ=pool.find(q=>dueSet.has(keySkill(q)));
    if(dueQ)return {kind:'Revisão no momento certo',title:dueQ.skill||dueQ.area,subject:dueQ.subject,area:dueQ.area,why:'Você já viu esta habilidade, mas chegou o momento de recuperá-la sem olhar a explicação.',icon:'↻'};
    const weak=Object.entries(s.skill||{}).filter(([,v])=>v?.done).map(([k])=>({k,st:stageForSkillKey(k,u?.id)})).filter(x=>x.st.level<3).sort((a,b)=>a.st.level-b.st.level||a.st.accuracy-b.st.accuracy)[0];
    if(weak){const [subject,,area,...skill]=weak.k.split('|');return {kind:'Fortalecer um ponto instável',title:skill.join('|')||area,subject,area,why:'Há evidência de prática, mas ainda não há independência suficiente. A AEDS vai variar a forma da questão.',icon:'△'}}
    const fresh=pool.find(q=>!(s.skill?.[keySkill(q)]?.done));
    if(fresh)return {kind:'Próximo conhecimento',title:fresh.skill||fresh.area,subject:fresh.subject,area:fresh.area,why:'Não há revisão urgente. É um bom momento para avançar sem aumentar demais a carga.',icon:'+'};
    return {kind:'Sessão de manutenção',title:'Mistura inteligente',subject:'AEDS',area:'',why:'A AEDS vai escolher poucas questões diferentes para verificar o que continua estável.',icon:'✓'};
  }

  home=function(){
    const m=me();if(m.role==='admin')return adminHome();
    const s=stats(),first=esc((m.name||'Aluno').split(/\s+/)[0]),due=dueSkillKeys(m.id).length,independent=Object.keys(s.skill||{}).filter(k=>stageForSkillKey(k,m.id).level===4).length,r=todayRecommendation();
    return `<div class="student-home aeds-today">
      <section class="today-hero"><div><span class="eyebrow">HOJE NA AEDS</span><h1>Olá, ${first}.</h1><p>Você não precisa decidir qual ferramenta usar. A AEDS escolhe o próximo passo e explica o motivo.</p></div><div class="today-signal"><b>${due}</b><span>revisões no momento certo</span></div></section>
      <section class="today-card"><div class="today-symbol">${r.icon}</div><div class="today-copy"><span>${esc(r.kind)}</span><h2>${esc(r.title)}</h2><p><b>${esc(r.subject)}</b>${r.area?` · ${esc(r.area)}`:''}</p><div class="today-why"><b>Por que agora?</b> ${esc(r.why)}</div><small>Estimativa: 8–12 minutos. A sessão para antes de virar repetição mecânica.</small></div><button id="studyNow" class="btn btn-primary today-start">Começar</button></section>
      <section class="today-secondary"><button data-page="learn"><span>01</span><div><b>Quero aprender algo</b><small>Explicações e trilhas por assunto</small></div></button><button data-page="exam"><span>02</span><div><b>Quero me testar</b><small>Simulados e revisão de erros</small></div></button><button data-page="performance"><span>03</span><div><b>Ver meu Mapa do Saber</b><small>O que está começando, estável ou independente</small></div></button></section>
      <details class="home-more refined"><summary>Outros recursos</summary><div class="home-resource-links"><button data-page="train">Treino manual</button><button data-page="review">Revisões</button><button data-page="essay">Redação</button><button data-page="program">Computação</button><button data-page="favorites">Favoritos</button><button data-page="routine">Rotina</button><button data-page="settings">Configurações</button></div></details>
      <section class="today-proof"><div><small>Habilidades independentes</small><b>${independent}</b></div><div><small>Questões respondidas</small><b>${s.questions.toLocaleString('pt-BR')}</b></div><div><small>Regra da AEDS</small><b>Acertar ≠ dominar</b></div></section>
    </div>`;
  };

  function areaStatus(subject,grade,area,questions,uid){
    const keys=[...new Set(questions.map(keySkill))],seen=keys.filter(k=>stats(uid).skill?.[k]?.done),due=new Set(dueSkillKeys(uid));
    if(!seen.length)return {code:'new',label:'Ainda não visto',level:0};
    if(keys.some(k=>due.has(k)))return {code:'due',label:'Precisa recuperar',level:1};
    const levels=seen.map(k=>stageForSkillKey(k,uid).level),avg=levels.reduce((a,b)=>a+b,0)/levels.length;
    if(levels.length===keys.length&&levels.every(x=>x===4))return {code:'independent',label:'Independente',level:4};
    if(avg>=3)return {code:'almost',label:'Quase independente',level:3};
    if(avg>=2)return {code:'practice',label:'Praticando',level:2};
    return {code:'started',label:'Conhecendo',level:1};
  }
  function knowledgeMapHtml(){
    const u=targetStudent();if(!u)return'';const grade=Number(u.grade),allowed=new Set(u.unlockedSubjects||[]),pool=candidateBank().filter(q=>q.active!==false&&Number(q.grade)===grade&&(!allowed.size||allowed.has(q.subject)));
    const subjects=[...new Set(pool.map(q=>q.subject))];
    if(!subjects.length)return `<section class="card knowledge-map"><h3>Mapa do Saber</h3><p class="muted">Carregue conteúdos da sua série para formar o mapa.</p></section>`;
    return `<section class="card knowledge-map"><div class="map-head"><div><span class="eyebrow">MAPA DO SABER</span><h2>${gradeName(grade)}</h2><p>O mapa mostra evidência, não pontos. Toque em um assunto para abrir a trilha de aprendizagem.</p></div><div class="map-legend"><span class="km-new">○ novo</span><span class="km-started">◔ conhecendo</span><span class="km-practice">◑ praticando</span><span class="km-almost">◕ quase</span><span class="km-independent">● independente</span><span class="km-due">↻ revisar</span></div></div>
      <div class="knowledge-subjects">${subjects.map(subject=>{const rows=pool.filter(q=>q.subject===subject),areas=[...new Set(rows.map(q=>q.area))];return `<section class="knowledge-subject"><h3>${subjectIcon(subject)} ${esc(subject)}</h3><div class="knowledge-nodes">${areas.map(area=>{const qs=rows.filter(q=>q.area===area),st=areaStatus(subject,grade,area,qs,u.id),pre=PREREQ?.[subject]?.[String(grade)]?.[area]||'';return `<button class="knowledge-node km-${st.code}" data-map-subject="${esc(subject)}" data-map-grade="${grade}" data-map-area="${esc(area)}"><span class="node-dot"></span><b>${esc(area)}</b><small>${esc(st.label)}${pre?` · vem depois de ${esc(pre)}`:''}</small></button>`}).join('')}</div></section>`}).join('')}</div></section>`;
  }
  const previousPerformance=performanceView;
  performanceView=function(){const out=previousPerformance();return out.replace('<div class="grid g4">',knowledgeMapHtml()+'<div class="grid g4">')};

  const previousFeedback=rastroFeedbackHtml;
  rastroFeedbackHtml=function(q){
    const base=previousFeedback(q),last=ui.rastroLast;if(!base||!last)return base;
    const human=last.studentHypothesis?({Conteudo:'conteúdo',Interpretacao:'interpretação',Distracao:'distração'}[last.studentHypothesis]||last.studentHypothesis):null;
    const auto=last.automaticHypothesis?(AEDS_RASTRO.LABELS[last.automaticHypothesis]||last.automaticHypothesis):null;
    if(!human||!auto)return base;
    const note=`<div class="rastro-hypothesis"><b>Sua hipótese:</b> ${esc(human)} · <b>Hipótese automática:</b> ${esc(auto)}. Nenhuma das duas vira verdade sem contraprova.</div>`;const i=base.lastIndexOf('</div>');return i>=0?base.slice(0,i)+note+base.slice(i):base+note;
  };
  const previousFeedbackBlock=feedbackBlock;
  feedbackBlock=function(q){return previousFeedbackBlock(q).replace('CID — qual foi o principal motivo?','O que você acha que causou o erro?').replace('Só um CID fica salvo; trocar atualiza o registro.','Isso é uma hipótese sua. O Rastro vai tentar confirmá-la ou refutá-la com outra evidência.')};

  function qualityRuntimeAdminHtml(){
    if(!window.AEDS_QUALITY)return'';const s=AEDS_QUALITY.stats(),hard=Object.entries(s.hardFlags||{}).sort((a,b)=>b[1]-a[1]).slice(0,6),rev=Object.entries(s.reviewFlags||{}).sort((a,b)=>b[1]-a[1]).slice(0,6),queue=AEDS_QUALITY.reviewQueue?.(30)||[];
    return `<section class="card quality2-card"><div class="page-head"><div><span class="eyebrow">QUALITY 2.0</span><h3>Filtro pedagógico em execução</h3><p class="muted">Falhas objetivas são quarentenadas automaticamente. Sinais subjetivos apenas entram na fila de revisão.</p></div><span class="pill">${s.inspected} inspecionadas</span></div><div class="grid g3">${metric('Quarentena automática',s.quarantined)}${metric('Questões para revisar',queue.length?Math.min(s.warnings,queue.length):s.warnings)}${metric('Motor','2.0')}</div>${hard.length?`<div class="quality-flags"><b>Bloqueios</b>${hard.map(([k,n])=>`<span>${esc(k)} · ${n}</span>`).join('')}</div>`:''}${rev.length?`<div class="quality-flags"><b>Sinais encontrados</b>${rev.map(([k,n])=>`<span>${esc(k)} · ${n}</span>`).join('')}</div>`:''}${queue.length?`<details class="quality-review-list"><summary>Ver questões sinalizadas</summary><div class="list">${queue.map(x=>`<div class="item"><b>${esc(x.subject)} · ${esc(x.area)}</b><div class="tiny muted">${esc(x.id)} · ${gradeName(x.grade)}</div><div class="small">${esc((x.review||x.hard||[]).join(', '))}</div></div>`).join('')}</div></details>`:''}</section>`;
  }
  const previousAdmin=adminView;
  adminView=function(){return previousAdmin()+qualityRuntimeAdminHtml()};

  const previousWire=wire;
  wire=function(){previousWire();$$('[data-map-area]').forEach(b=>b.onclick=()=>{ui.subject=b.dataset.mapSubject;ui.grade=Number(b.dataset.mapGrade);ui.learningArea=b.dataset.mapArea;ui.page='learn';render()})};
})();
