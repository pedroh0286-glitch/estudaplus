'use strict';
/* AEDS 9.0.13 — Controle & Inteligência
   - classificação humana questão.matéria.série
   - denúncias + moderação/quarentena pelo administrador
   - telemetria cognitiva para o Rastro
   - memória por habilidade em checkpoints semanais
   - aula normal/adaptativa com guarda de pré-requisitos
   - Árvore do Saber navegável
   - Tutor AEDS com integração opcional a endpoint externo e evidência para o Rastro
*/
(()=>{
  const VERSION='9.0.13', DAY=86400000;
  let registryStamp='';
  const SUBJECT_CODES=Object.freeze({
    'Matemática':'01','Português':'02','Ciências':'03','História':'04','Geografia':'05','Inglês':'06',
    'Física':'07','Química':'08','Biologia':'09','Literatura':'10','Redação':'11','Filosofia':'12','Sociologia':'13',
    'Artes':'14','Educação Física':'15','Educação Financeira':'16','Computação':'17','Robótica':'18','Espanhol':'19',
    'Metodologia Científica':'20','Projeto de Vida':'21'
  });
  const GRADE_CODES=Object.freeze({5:'01',6:'02',7:'03',8:'04',9:'05',10:'06',11:'07',12:'08'});
  const SUBJECT_BY_CODE=Object.freeze(Object.fromEntries(Object.entries(SUBJECT_CODES).map(([k,v])=>[v,k])));
  const GRADE_BY_CODE=Object.freeze(Object.fromEntries(Object.entries(GRADE_CODES).map(([k,v])=>[v,Number(k)])));
  let adminQuestionIndex=null,adminIndexById=null,adminIndexByCode=null,adminIndexPromise=null;
  function loadScript9013(src){return new Promise((resolve,reject)=>{const el=document.createElement('script');el.src=src;el.async=true;el.onload=()=>resolve();el.onerror=()=>reject(new Error(`Não foi possível carregar ${src}`));document.head.appendChild(el)})}
  async function decodeAdminIndex9013(b64){
    const bin=atob(b64||''),bytes=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);
    if(!('DecompressionStream' in window))throw new Error('O navegador não oferece descompressão gzip para o índice administrativo.');
    const stream=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
    return JSON.parse(await new Response(stream).text());
  }
  async function ensureAdminQuestionIndex(){
    if(adminQuestionIndex)return adminQuestionIndex;
    if(adminIndexPromise)return adminIndexPromise;
    adminIndexPromise=(async()=>{
      if(!window.AEDS_ADMIN_QINDEX_B64)await loadScript9013('./admin-question-index-9013.js');
      const rows=await decodeAdminIndex9013(window.AEDS_ADMIN_QINDEX_B64);
      adminQuestionIndex=Array.isArray(rows)?rows:[];
      adminIndexById=new Map(adminQuestionIndex.map(x=>[x.id,x]));
      adminIndexByCode=new Map(adminQuestionIndex.map(x=>[x.classification,x]));
      try{delete window.AEDS_ADMIN_QINDEX_B64}catch{}
      return adminQuestionIndex;
    })().catch(e=>{adminIndexPromise=null;throw e});
    return adminIndexPromise;
  }
  function requestAdminQuestionIndex(){
    if(me()?.role!=='admin'||adminQuestionIndex||ui._adminIndexLoading9013)return;
    ui._adminIndexLoading9013=true;ui._adminIndexError9013='';
    ensureAdminQuestionIndex().then(()=>{ui._adminIndexLoading9013=false;render()}).catch(e=>{ui._adminIndexLoading9013=false;ui._adminIndexError9013=String(e?.message||e);render()});
  }
  function classificationParts(code){const m=String(code||'').trim().match(/^(\d+)\.(\d{2})\.(\d{2})$/);if(!m)return null;return {number:Number(m[1]),subject:SUBJECT_BY_CODE[m[2]],grade:GRADE_BY_CODE[m[3]],subjectCode:m[2],gradeCode:m[3]}}
  async function loadQuestionForMeta(meta){
    if(!meta)return null;let q=qById(meta.id);if(q)return q;
    if(meta.subject&&meta.grade&&window.AEDS_CONTENT?.ensureSubjectGrade){await AEDS_CONTENT.ensureSubjectGrade(meta.subject,meta.grade);syncLoadedBank();registryStamp='';buildQuestionRegistry(true);q=qById(meta.id)}
    return q||null;
  }
  async function openAdminQuestionMeta(meta){
    try{ui._adminQuestionOpening9013=meta?.id||'';render();const q=await loadQuestionForMeta(meta);ui._adminQuestionOpening9013='';if(!q)throw new Error('Questão não encontrada no pacote correspondente.');ui.adminQuestionSearch=questionCode(q);render()}catch(e){ui._adminQuestionOpening9013='';ui._adminQuestionOpenError9013=String(e?.message||e);render()}
  }
  function dynamicAdminMetas(){if(!adminQuestionIndex)return[];return allQuestions().filter(q=>!adminIndexById?.has(q.id)).map(q=>({id:q.id,classification:questionCode(q),subject:q.subject,grade:q.grade,area:q.area,skill:q.skill,prompt:q.prompt,active:q.active!==false,review:AEDS_QUALITY?.inspect?.(q)?.review||[]}))}
  function searchAdminQuestionIndex(query,limit=40){
    const raw=String(query||'').trim(),q=raw.toLowerCase();if(!q||!adminQuestionIndex)return[];const dynamic=dynamicAdminMetas();
    const exact=adminIndexByCode?.get(raw)||adminIndexById?.get(raw)||dynamic.find(x=>x.classification===raw||x.id===raw);if(exact)return[exact];
    const out=[];for(const row of [...adminQuestionIndex,...dynamic]){const hay=[row.classification,row.id,row.subject,row.area,row.skill,row.prompt].join(' ').toLowerCase();if(hay.includes(q)){out.push(row);if(out.length>=limit)break}}return out;
  }
  const REPORT_REASONS=Object.freeze({
    gabarito:'Gabarito parece errado', enunciado:'Enunciado confuso ou incorreto', alternativa:'Alternativa problemática',
    avancado:'Conteúdo avançado demais para a série', duplicada:'Questão repetida/duplicada', explicacao:'Explicação não ajuda', outro:'Outro problema'
  });
  function ensure(){
    if(!state||typeof state!=='object')return;
    state.questionRegistry=state.questionRegistry&&typeof state.questionRegistry==='object'?state.questionRegistry:{};
    state.questionModeration=state.questionModeration&&typeof state.questionModeration==='object'?state.questionModeration:{};
    state.questionReports=Array.isArray(state.questionReports)?state.questionReports:[];
    state.lessonModeByUser=state.lessonModeByUser&&typeof state.lessonModeByUser==='object'?state.lessonModeByUser:{};
    state.adaptiveOverrides=state.adaptiveOverrides&&typeof state.adaptiveOverrides==='object'?state.adaptiveOverrides:{};
    state.memoryByUser=state.memoryByUser&&typeof state.memoryByUser==='object'?state.memoryByUser:{};
    state.cognitionByUser=state.cognitionByUser&&typeof state.cognitionByUser==='object'?state.cognitionByUser:{};
    state.tutorByUser=state.tutorByUser&&typeof state.tutorByUser==='object'?state.tutorByUser:{};
    for(const u of state.users||[]){
      state.memoryByUser[u.id]=state.memoryByUser[u.id]||{};
      state.cognitionByUser[u.id]=Array.isArray(state.cognitionByUser[u.id])?state.cognitionByUser[u.id]:[];
      state.tutorByUser[u.id]=Array.isArray(state.tutorByUser[u.id])?state.tutorByUser[u.id]:[];
      state.adaptiveOverrides[u.id]=state.adaptiveOverrides[u.id]||{};
    }
    buildQuestionRegistry();
  }
  function allQuestions(){return [...(BANK||[]),...(state?.customQuestions||[]),...(state?.officialQuestions||[])]}
  function subjectCode(subject){return SUBJECT_CODES[subject]||'99'}
  function gradeCode(grade){return GRADE_CODES[Number(grade)]||'99'}
  function buildQuestionRegistry(force=false){
    if(!state?.questionRegistry)return;
    const all=allQuestions(),stamp=`${BANK?.length||0}|${state.customQuestions?.length||0}|${state.officialQuestions?.length||0}`;
    if(!force&&registryStamp===stamp)return;
    const used=new Set(Object.values(state.questionRegistry));
    const groups=new Map();
    for(const q of all){
      const k=`${q.subject}|${Number(q.grade)}`;if(!groups.has(k))groups.set(k,[]);groups.get(k).push(q);
    }
    for(const [k,rows] of groups){
      const [subject,grade]=k.split('|'),sc=subjectCode(subject),gc=gradeCode(grade);
      let max=Number(window.AEDS_PACK_INDEX?.[k]?.count)||0; // reserva toda a faixa do banco-base, mesmo se o Admin não carregou o pacote
      for(const q of rows){const c=state.questionRegistry[q.id]||q.classification;if(c){state.questionRegistry[q.id]=c;const n=Number(String(c).split('.')[0]);if(Number.isFinite(n))max=Math.max(max,n)}}
      for(const q of rows){
        if(state.questionRegistry[q.id]){q.classification=state.questionRegistry[q.id];continue}
        let code;do{max++;code=`${String(max).padStart(2,'0')}.${sc}.${gc}`}while(used.has(code));
        state.questionRegistry[q.id]=code;used.add(code);q.classification=code;
      }
    }
    registryStamp=stamp;
  }
  function questionCode(q){if(q?.classification)return q.classification;ensure();return state.questionRegistry?.[q?.id]||'—'}
  function moderation(qid){ensure();return state.questionModeration[qid]||{status:'active',note:'',updatedAt:0,reviewer:''}}
  function isBlocked(qid){return ['quarantine','disabled'].includes(state?.questionModeration?.[qid]?.status||'active')}
  function moderationLabel(s){return ({active:'Ativa',verified:'Verificada',quarantine:'Quarentena',disabled:'Desativada'}[s]||s)}
  function moderationBadge(qid){const s=moderation(qid).status;return `<span class="q-status q-status-${esc(s)}">${esc(moderationLabel(s))}</span>`}

  // Quarentena administrativa é aplicada transversalmente sem alterar o banco-fonte.
  const legacyCandidateBank=candidateBank;
  candidateBank=function(){ensure();return legacyCandidateBank().filter(q=>!isBlocked(q.id))};

  function openReports(qid){return (state.questionReports||[]).filter(r=>r.qid===qid&&r.status==='pending')}
  function reporterHistory(userId){const rows=(state.questionReports||[]).filter(r=>r.userId===userId);return {total:rows.length,confirmed:rows.filter(r=>r.status==='resolved').length,dismissed:rows.filter(r=>r.status==='dismissed').length,pending:rows.filter(r=>r.status==='pending').length}}
  function reporterHistoryText(userId){const h=reporterHistory(userId);return h.total>1?`histórico: ${h.confirmed} confirmada(s), ${h.dismissed} descartada(s), ${h.pending} pendente(s)`:'primeira denúncia registrada'}
  function reportAlreadyExists(qid,uid){return (state.questionReports||[]).some(r=>r.qid===qid&&r.userId===uid&&r.status==='pending')}
  async function cloudCreateReport(r){
    if(!CLOUD.enabled||!cloudSession)return false;
    try{await cloudFetchJson(`${CLOUD.supabaseUrl}/rest/v1/question_reports`,{method:'POST',headers:{...cloudHeaders(),'Prefer':'return=minimal'},body:JSON.stringify({id:r.id,question_id:r.qid,classification:r.classification,profile_id:r.userId,reason:r.reason,detail:r.detail,status:r.status,created_at:r.createdAt})});return true}catch(e){console.warn('question report cloud',e);return false}
  }
  async function submitReport(q,reason,detail=''){
    ensure();const u=targetStudent()||me();if(!q||!u)return;
    if(reportAlreadyExists(q.id,u.id)){alert('Você já enviou esta questão para revisão. O administrador ainda não concluiu a análise.');return}
    const r={id:`QR-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,qid:q.id,classification:questionCode(q),userId:u.id,user:u.name||u.username||'Aluno',reason:reason||'outro',detail:String(detail||'').slice(0,600),status:'pending',createdAt:new Date().toISOString(),source:'student'};
    state.questionReports.push(r);state.questionReports=state.questionReports.slice(-4000);
    addFeedback('Questão reportada',`${r.classification} · ${q.subject} · ${q.area}`,`${REPORT_REASONS[r.reason]||r.reason}${r.detail?` — ${r.detail}`:''}`);
    await cloudCreateReport(r);localSave();ui.reportQuestionId=null;ui.reportReason=null;ui.reportDetail='';alert('Enviado ao administrador. A questão não é removida automaticamente: primeiro ela será conferida.');render();
  }
  async function cloudSetModeration(q,status,note=''){
    if(!CLOUD.enabled||!cloudSession||me()?.role!=='admin')return false;
    try{await cloudFetchJson(`${CLOUD.supabaseUrl}/rest/v1/question_moderation?on_conflict=question_id`,{method:'POST',headers:{...cloudHeaders(),'Prefer':'resolution=merge-duplicates,return=minimal'},body:JSON.stringify({question_id:q.id,classification:questionCode(q),status,note,reviewed_by:cloudSession.user.id,updated_at:new Date().toISOString()})});return true}catch(e){console.warn('question moderation cloud',e);return false}
  }
  async function cloudResolveReports(qid,status){
    if(!CLOUD.enabled||!cloudSession||me()?.role!=='admin')return false;
    try{await cloudFetchJson(`${CLOUD.supabaseUrl}/rest/v1/question_reports?question_id=eq.${encodeURIComponent(qid)}&status=eq.pending`,{method:'PATCH',headers:{...cloudHeaders(),'Prefer':'return=minimal'},body:JSON.stringify({status,reviewed_at:new Date().toISOString(),reviewed_by:cloudSession.user.id})});return true}catch(e){console.warn('question report resolve cloud',e);return false}
  }
  async function setModeration(q,status,note=''){
    ensure();if(me()?.role!=='admin'||!q)return;
    const previous=moderation(q.id).status;
    state.questionModeration[q.id]={status,note:String(note||'').slice(0,800),updatedAt:Date.now(),reviewer:me().username||me().name||'admin',classification:questionCode(q)};
    const resolved=status==='quarantine'||status==='disabled'?'resolved':'dismissed';
    for(const r of state.questionReports)if(r.qid===q.id&&r.status==='pending'){r.status=resolved;r.reviewedAt=new Date().toISOString();r.reviewedBy=me().username||'admin'}
    audit('moderação de questão',`${questionCode(q)} · ${previous} → ${status}${note?` · ${note}`:''}`);
    await Promise.allSettled([cloudSetModeration(q,status,note),cloudResolveReports(q.id,resolved)]);localSave();render();
  }
  async function loadModerationCloud(){
    if(!CLOUD.enabled||!cloudSession)return false;
    try{const mods=await cloudFetchJson(`${CLOUD.supabaseUrl}/rest/v1/question_moderation?select=*`,{headers:cloudHeaders()});for(const m of mods||[])state.questionModeration[m.question_id]={status:m.status,note:m.note||'',updatedAt:Date.parse(m.updated_at)||Date.now(),reviewer:m.reviewed_by||'admin',classification:m.classification};localSave();return true}catch(e){console.warn('question moderation cloud unavailable',e);return false}
  }
  async function loadQuestionControlCloud(){
    if(!CLOUD.enabled||!cloudSession||me()?.role!=='admin')return false;
    try{
      const [reports,mods,userStates,profiles,subs]=await Promise.all([
        cloudFetchJson(`${CLOUD.supabaseUrl}/rest/v1/question_reports?select=*&order=created_at.desc&limit=2000`,{headers:cloudHeaders()}),
        cloudFetchJson(`${CLOUD.supabaseUrl}/rest/v1/question_moderation?select=*`,{headers:cloudHeaders()}),
        cloudFetchJson(`${CLOUD.supabaseUrl}/rest/v1/user_state?select=profile_id,state`,{headers:cloudHeaders()}).catch(()=>[]),
        cloudFetchJson(`${CLOUD.supabaseUrl}/rest/v1/profiles?select=*`,{headers:cloudHeaders()}).catch(()=>[]),
        cloudFetchJson(`${CLOUD.supabaseUrl}/rest/v1/manual_submissions?select=*&order=created_at.desc&limit=200`,{headers:cloudHeaders()}).catch(()=>[])
      ]);
      for(const prof of profiles||[]){const patch=cloudProfileFromRow(prof,'');let u=state.users.find(x=>x.id===prof.id);if(u)Object.assign(u,patch);else state.users.push(patch)}
      const localBy=new Map((state.questionReports||[]).map(x=>[x.id,x]));for(const r of reports||[])localBy.set(r.id,{id:r.id,qid:r.question_id,classification:r.classification,userId:r.profile_id,user:state.users.find(u=>u.id===r.profile_id)?.name||'Aluno',reason:r.reason,detail:r.detail||'',status:r.status,createdAt:r.created_at,reviewedAt:r.reviewed_at,reviewedBy:r.reviewed_by,source:'cloud'});state.questionReports=[...localBy.values()].slice(-4000);
      for(const m of mods||[])state.questionModeration[m.question_id]={status:m.status,note:m.note||'',updatedAt:Date.parse(m.updated_at)||Date.now(),reviewer:m.reviewed_by||'admin',classification:m.classification};
      for(const row of userStates||[]){const rs=row.state||{},id=row.profile_id;if(rs.stats?.[id])state.stats[id]=rs.stats[id];if(rs.topicDifficulty?.[id])state.topicDifficulty[id]=rs.topicDifficulty[id];if(rs.prereqDone?.[id])state.prereqDone[id]=rs.prereqDone[id];if(rs.independence?.[id])state.independence[id]=rs.independence[id];if(rs.rastro?.[id])state.rastro[id]=rs.rastro[id];if(rs.rastroPending&&id in rs.rastroPending)state.rastroPending[id]=rs.rastroPending[id];if(rs.achievements?.[id])state.achievements[id]=rs.achievements[id];if(rs.lessonModeByUser?.[id])state.lessonModeByUser[id]=rs.lessonModeByUser[id];if(rs.adaptiveOverrides?.[id])state.adaptiveOverrides[id]=rs.adaptiveOverrides[id];if(rs.memoryByUser?.[id])state.memoryByUser[id]=rs.memoryByUser[id];if(rs.cognitionByUser?.[id])state.cognitionByUser[id]=rs.cognitionByUser[id];if(rs.tutorByUser?.[id])state.tutorByUser[id]=rs.tutorByUser[id]}
      state.manualQueue=(subs||[]).map(x=>({id:x.id,cloudId:x.id,kind:x.kind,studentId:x.profile_id,studentName:state.users.find(u=>u.id===x.profile_id)?.name||'Aluno',prompt:x.prompt,answer:x.answer,status:x.status,score:x.score,comment:x.comment,createdAt:x.created_at}));
      normalize();localSave();return true;
    }catch(e){console.warn('question control cloud unavailable',e);return false}
  }


  function questionReportHtml(q){
    const uid=targetStudent()?.id||me()?.id,already=uid&&reportAlreadyExists(q.id,uid),open=ui.reportQuestionId===q.id;
    return `<div class="question-report-box no-print"><div><b>Encontrou um problema?</b><small>A denúncia vai para o administrador. Ela não remove a questão automaticamente.</small></div>${already?`<span class="pill">Em análise</span>`:`<button id="reportQuestion" class="btn btn-ghost">⚑ Reportar questão</button>`}</div>${open&&!already?`<div class="question-report-form no-print"><b>O que parece errado?</b><div class="report-reasons">${Object.entries(REPORT_REASONS).map(([k,v])=>`<button class="choice reportReason ${ui.reportReason===k?'selected':''}" data-report-reason="${k}">${esc(v)}</button>`).join('')}</div><textarea id="reportDetail" class="scratch" placeholder="Explique o que você percebeu (opcional).">${esc(ui.reportDetail||'')}</textarea><div class="seg"><button id="sendQuestionReport" class="btn btn-primary" ${ui.reportReason?'':'disabled'}>Enviar ao administrador</button><button id="cancelQuestionReport" class="btn btn-ghost">Cancelar</button></div></div>`:''}`;
  }
  const legacyQuestionView=questionView;
  questionView=function(q,opts={}){
    ensure();let out=legacyQuestionView(q,opts);if(!q)return out;
    const badge=`<span class="tag q-classification" title="Classificação administrativa"># ${esc(questionCode(q))}</span>`;
    out=out.replace('<div class="qmeta">','<div class="qmeta">'+badge);
    if(!opts.exam&&!opts.review){const marker='<div class="seg" style="justify-content:flex-end;margin-top:14px">';out=out.replace(marker,questionReportHtml(q)+marker)}
    return out;
  };

  // -------- Evidência cognitiva: o Rastro observa comportamento, sem fingir ler pensamentos --------
  function startThinking(q){if(!q)return null;if(!ui.aedsThinking||ui.aedsThinking.qid!==q.id||ui.aedsThinking.committed){ui.aedsThinking={qid:q.id,startedAt:ui.started||Date.now(),firstChoiceAt:0,answerChanges:0,optionPath:[],cdfChanges:0,cdfPath:[],hintUsed:false,scratchChars:0,reportOpened:false,tutorMessages:0,committed:false}}return ui.aedsThinking}
  function thinkingSummary(q){const t=startThinking(q),now=Date.now();return {firstChoiceLatencyMs:t.firstChoiceAt?Math.max(0,t.firstChoiceAt-t.startedAt):null,totalThinkingMs:Math.max(1,now-t.startedAt),answerChanges:t.answerChanges,optionPath:t.optionPath.slice(-12),cdfChanges:t.cdfChanges,cdfPath:t.cdfPath.slice(-12),hintUsed:!!t.hintUsed,scratchChars:t.scratchChars,reportOpened:!!t.reportOpened,tutorMessages:t.tutorMessages}}
  const legacyRastroHistoryContext=rastroHistoryContext;
  rastroHistoryContext=function(q,rec,uid=rastroUid(),cueOverride=null){const c=legacyRastroHistoryContext(q,rec,uid,cueOverride);c.thinking=rec?.thinking||null;c.tutorEvidence=recentTutorEvidence(uid,rastroKey(q));return c};
  const legacyApplyRastroRecord=applyRastroRecord;
  applyRastroRecord=function(q,rec,opts={}){if(q&&rec&&!rec.thinking&&!rec.examId&&ui.question?.id===q.id){rec.thinking=thinkingSummary(q);if(ui.aedsThinking)ui.aedsThinking.committed=true}const out=legacyApplyRastroRecord(q,rec,opts);if(q&&rec)updateMemory(q,rec);return out};

  // -------- Memória individual por habilidade --------
  function memoryMap(uid=targetStudent()?.id){ensure();if(!uid)return{};return state.memoryByUser[uid]||(state.memoryByUser[uid]={})}
  function memoryRecord(skillKey,uid=targetStudent()?.id){const m=memoryMap(uid),r=m[skillKey]||(m[skillKey]={firstLearnedAt:0,lastTestAt:0,lastCorrectAt:0,cycleStartAt:0,longestDays:0,bestDays:0,certifiedDays:0,failedAfterDays:null,nextDueAt:0,tests:0,successes:0,failures:0,category:'não medido',history:[]});r.cycleStartAt=r.cycleStartAt||r.firstLearnedAt||0;r.bestDays=Math.max(Number(r.bestDays)||0,Number(r.longestDays)||0);r.certifiedDays=Number(r.certifiedDays)||0;return r}
  function memoryCategory(r){const d=Math.max(Number(r.longestDays)||0,Number(r.certifiedDays)||0),hasFail=r.failedAfterDays!==null&&r.failedAfterDays!==undefined&&Number.isFinite(Number(r.failedAfterDays));if(hasFail){if(d>=28)return {key:'incrivel',label:'Incrível',detail:'1 mês ou mais'};if(d>=21)return {key:'boa',label:'Boa',detail:'cerca de 3 semanas'};if(d>=14)return {key:'media',label:'Média',detail:'cerca de 2 semanas'};if(d>=7)return {key:'measuring',label:'Em medição',detail:'1 semana foi comprovada, mas 2 semanas ainda não'};return {key:'curta',label:'Curta',detail:'menos de 1 semana'}}if(d>=28)return {key:'incrivel',label:'Incrível',detail:'1 mês ou mais'};if(d>=21)return {key:'boa',label:'Boa',detail:'cerca de 3 semanas'};if(d>=14)return {key:'media',label:'Média',detail:'cerca de 2 semanas'};return {key:'measuring',label:'Em medição',detail:d>=7?'1 semana validada; aguardando a checagem de 2 semanas':'a primeira checagem acontece após 1 semana'} }
  function updateMemory(q,rec){
    const uid=targetStudent()?.id;if(!uid||!q||!rec)return;const k=rastroKey(q),r=memoryRecord(k,uid),now=Date.parse(rec.at)||Date.now();
    if(!r.firstLearnedAt&&rec.right&&rec.cdf!=='F'){r.firstLearnedAt=now;r.cycleStartAt=now;r.lastCorrectAt=now;r.lastTestAt=now;r.nextDueAt=now+7*DAY;r.history.push({at:now,right:true,gapDays:0,kind:'acquisition'});r.category=memoryCategory(r).key;return}
    if(!r.firstLearnedAt)return;
    const sinceLast=Math.max(0,(now-(r.lastTestAt||r.firstLearnedAt))/DAY);if(sinceLast<6.5)return; // checagens semanais reais, não várias tentativas no mesmo dia
    const span=Math.max(0,(now-(r.cycleStartAt||r.firstLearnedAt))/DAY);r.tests++;r.lastTestAt=now;
    if(rec.right&&rec.cdf!=='F'){r.successes++;r.longestDays=Math.max(Number(r.longestDays)||0,span);r.bestDays=Math.max(Number(r.bestDays)||0,r.longestDays);r.certifiedDays=r.longestDays;r.lastCorrectAt=now;r.failedAfterDays=null;r.nextDueAt=now+7*DAY}else{r.failures++;r.failedAfterDays=span;r.certifiedDays=Number(r.longestDays)||0;r.bestDays=Math.max(Number(r.bestDays)||0,r.certifiedDays);r.cycleStartAt=now;r.longestDays=0;r.nextDueAt=now+7*DAY}
    r.category=memoryCategory(r).key;r.history.push({at:now,right:!!rec.right&&rec.cdf!=='F',gapDays:Math.round(span*10)/10,kind:'weekly_retention'});r.history=r.history.slice(-40);
  }
  function memoryDueKeys(uid=targetStudent()?.id){const now=Date.now();return Object.entries(memoryMap(uid)).filter(([,r])=>r?.firstLearnedAt&&r.nextDueAt&&r.nextDueAt<=now).map(([k])=>k)}
  const legacyDueSkillKeys=dueSkillKeys;
  dueSkillKeys=function(uid=targetStudent()?.id){return [...new Set([...(legacyDueSkillKeys(uid)||[]),...memoryDueKeys(uid)])]};
  function memoryPanel(uid=targetStudent()?.id){
    const rows=Object.entries(memoryMap(uid)).filter(([,r])=>r.firstLearnedAt).map(([k,r])=>({k,r,c:memoryCategory(r)})).sort((a,b)=>(b.r.nextDueAt?1:0)-(a.r.nextDueAt?1:0)||b.r.longestDays-a.r.longestDays);
    const counts={curta:0,media:0,boa:0,incrivel:0,measuring:0};for(const x of rows)counts[x.c.key]=(counts[x.c.key]||0)+1;
    return `<section class="card memory-card"><div class="page-head"><div><span class="eyebrow">MEMÓRIA INDIVIDUAL</span><h3>Quanto tempo cada habilidade permanece recuperável</h3><p class="muted">A AEDS volta a testar a habilidade a cada semana. O nível só sobe quando há evidência real em semanas diferentes.</p></div><span class="pill">${rows.length} habilidades acompanhadas</span></div><div class="memory-definitions"><div class="notice"><b>Consolidação de memória</b><p>Aprender inicia um processo de estabilização da lembrança. Recuperar e usar o conhecimento em momentos separados tende a fortalecer esse traço; por isso a AEDS não considera uma resposta imediata como prova de memória duradoura.</p></div><div class="notice"><b>Curva do Esquecimento</b><p>A lembrança tende a enfraquecer quando não é recuperada ou usada. A velocidade varia entre pessoas e habilidades; a AEDS mede o seu padrão em vez de assumir uma porcentagem universal de esquecimento.</p></div></div><div class="memory-scale"><div><b>Curta</b><span>&lt; 1 semana</span><strong>${counts.curta||0}</strong></div><div><b>Média</b><span>~ 2 semanas</span><strong>${counts.media||0}</strong></div><div><b>Boa</b><span>~ 3 semanas</span><strong>${counts.boa||0}</strong></div><div><b>Incrível</b><span>1 mês+</span><strong>${counts.incrivel||0}</strong></div></div>${counts.measuring?`<div class="tiny muted" style="margin-top:8px">Em medição: ${counts.measuring} habilidade(s). Passar pela primeira semana ainda não é suficiente para classificar como Média.</div>`:''}${rows.length?`<details><summary>Ver habilidades medidas</summary><div class="list memory-list">${rows.slice(0,80).map(x=>{const p=x.k.split('|');return `<div class="item"><b>${esc(p.slice(3).join(' · ')||p[2])}</b><span class="memory-badge mem-${x.c.key}">${esc(x.c.label)}</span><div class="tiny muted">${esc(p[0])} · ${gradeName(p[1])} · melhor retenção comprovada: ${Math.floor(x.r.bestDays||x.r.longestDays||0)} dia(s)${x.r.nextDueAt?` · próxima checagem semanal: ${new Date(x.r.nextDueAt).toLocaleDateString('pt-BR')}`:''}</div></div>`}).join('')}</div></details>`:'<div class="notice">A medição começa depois que uma habilidade é aprendida. A primeira checagem ocorre aproximadamente uma semana depois.</div>'}</section>`;
  }

  // -------- Aula normal vs. adaptativa --------
  function lessonMode(uid=targetStudent()?.id){ensure();return state.lessonModeByUser[uid]||null}
  function lessonModeChooser(compact=false){const mode=lessonMode();return `<section class="lesson-mode ${compact?'compact':''}"><div><span class="eyebrow">MODO DE AULA</span><h2>${compact?'Como você quer aprender?':'Escolha como quer aprender antes de começar'}</h2><p>A escolha pode ser trocada a qualquer momento.</p></div><div class="lesson-mode-grid"><button class="lessonModeChoice ${mode==='normal'?'active':''}" data-lesson-mode="normal"><b>Aula normal</b><span>Segue a sequência prevista da matéria, com explicação, exemplos e exercícios em ordem estável. Não muda o caminho com base no seu desempenho.</span></button><button class="lessonModeChoice ${mode==='adaptive'?'active':''}" data-lesson-mode="adaptive"><b>Aula adaptativa</b><span>Ajusta apoio, exemplos e próximos passos usando o Rastro, mas nunca introduz um pré-requisito que você ainda não demonstrou conhecer.</span></button></div></section>`}
  const legacyHome9013=home;
  home=function(){ensure();if(me()?.role!=='admin'&&!lessonMode())return `<div class="visual-page-head onboarding-mode-head"><span class="page-big-icon">🧭</span><div><span class="eyebrow">ANTES DE COMEÇAR</span><h1>Como você quer que a AEDS ensine?</h1><p>Esta escolha define o comportamento das aulas, não o nível do conteúdo. Você pode trocar depois.</p></div></div>${lessonModeChooser()}`;return legacyHome9013()};
  const legacyLearnView=learnView;
  learnView=function(){ensure();const mode=lessonMode();if(!mode)return `<div class="visual-page-head"><span class="page-big-icon">📘</span><div><h1>Aprender</h1><p>Primeiro escolha o comportamento das aulas.</p></div></div>${lessonModeChooser()}`;return lessonModeChooser(true)+legacyLearnView()};
  function prerequisiteFor(subject,grade,area){return PREREQ?.[subject]?.[String(grade)]?.[area]||''}
  function prerequisiteKnown(subject,grade,area,uid=targetStudent()?.id){if(!area||!uid)return true;const key=`${subject}|${grade}|${area}`;if(state.prereqDone?.[uid]?.[key])return true;const prefix=`${subject}|${grade}|${area}|`;const keys=Object.keys(stats(uid).skill||{}).filter(k=>k.startsWith(prefix));return !!keys.length&&keys.some(k=>stageForSkillKey(k,uid).level>=2)}
  function adaptiveGuard(subject,grade,area){const uid=targetStudent()?.id,pre=prerequisiteFor(subject,grade,area);if(!uid||lessonMode(uid)!=='adaptive'||!pre||prerequisiteKnown(subject,grade,pre,uid)||state.adaptiveOverrides?.[uid]?.[`${subject}|${grade}|${area}`])return'';return `<section class="card adaptive-guard"><span class="adaptive-lock">↳</span><div><span class="eyebrow">AULA ADAPTATIVA</span><h2>Antes de ${esc(area)}, fortaleça ${esc(pre)}</h2><p>O Rastro encontrou um pré-requisito anterior que ainda não tem evidência suficiente. A AEDS não vai jogar conteúdo mais avançado no meio da aula sem preparação.</p><div class="seg"><button id="goPrerequisite" class="btn btn-primary" data-pre="${esc(pre)}">Fortalecer ${esc(pre)}</button><button id="overrideAdaptive" class="btn btn-ghost">Estudar ${esc(area)} mesmo assim</button></div></div></section>`}
  const legacyLearningArticle=learningArticle;
  learningArticle=function(subject,grade,area){const guard=adaptiveGuard(subject,grade,area);if(guard)return guard;let out=legacyLearningArticle(subject,grade,area);if(lessonMode()==='adaptive')out=out.replace('<article class="card article">','<div class="adaptive-mode-note"><b>Aula adaptativa ativa</b><span>O apoio pode mudar, mas o caminho respeita os pré-requisitos já comprovados.</span></div><article class="card article">');return out+tutorHtml({subject,grade,area,skill:area,contextType:'lesson'})};

  // -------- Árvore real do Saber --------
  function treeStatus(subject,grade,area,uid){const pool=candidateBank().filter(q=>q.subject===subject&&Number(q.grade)===Number(grade)&&q.area===area),keys=[...new Set(pool.map(keySkill))],s=stats(uid),seen=keys.filter(k=>s.skill?.[k]?.done),due=new Set(dueSkillKeys(uid));if(!seen.length)return {code:'new',label:'Ainda não visto',level:0};if(keys.some(k=>due.has(k)))return {code:'due',label:'Revisão necessária',level:1};const lv=seen.map(k=>stageForSkillKey(k,uid).level),avg=lv.reduce((a,b)=>a+b,0)/Math.max(1,lv.length);if(lv.length===keys.length&&lv.every(x=>x===4))return {code:'independent',label:'Independente',level:4};if(avg>=3)return {code:'almost',label:'Quase consolidado',level:3};if(avg>=2)return {code:'practice',label:'Praticando',level:2};return {code:'started',label:'Conhecendo',level:1}}
  function areaDepth(subject,grade,area,seen=new Set()){if(seen.has(area))return 0;seen.add(area);const p=prerequisiteFor(subject,grade,area);return p?Math.min(5,1+areaDepth(subject,grade,p,seen)):0}
  function knowledgeTreeHtml(uid=targetStudent()?.id){
    if(!uid)return'';const u=state.users.find(x=>x.id===uid)||targetStudent(),grade=Number(u?.grade||5),pool=candidateBank().filter(q=>Number(q.grade)===grade),subjects=[...new Set(pool.map(q=>q.subject))];
    return `<section class="card knowledge-tree"><div class="page-head"><div><span class="eyebrow">ÁRVORE DO SABER</span><h2>${gradeName(grade)}</h2><p class="muted">As linhas representam dependências reais. Um assunto pode ser aberto mesmo com lacunas, mas a AEDS mostra exatamente o que está bloqueando o caminho recomendado.</p></div><div class="tree-legend">○ novo · ◑ praticando · ◕ quase · ● independente · ↻ revisar</div></div><div class="tree-subjects">${subjects.map(subject=>{const areas=[...new Set(pool.filter(q=>q.subject===subject).map(q=>q.area))];return `<section class="tree-subject"><h3>${subjectIcon(subject)} ${esc(subject)}</h3><div class="tree-branch">${areas.map(area=>{const pre=prerequisiteFor(subject,grade,area),blocked=!!pre&&!prerequisiteKnown(subject,grade,pre,uid),st=treeStatus(subject,grade,area,uid),depth=areaDepth(subject,grade,area);return `<button class="tree-node tree-${st.code} ${blocked?'tree-blocked':''}" style="--depth:${depth}" data-tree-subject="${esc(subject)}" data-tree-grade="${grade}" data-tree-area="${esc(area)}"><span class="tree-glyph">${st.code==='independent'?'●':st.code==='almost'?'◕':st.code==='practice'?'◑':st.code==='due'?'↻':'○'}</span><span><b>${esc(area)}</b><small>${esc(st.label)}${blocked?` · recomendado antes: ${esc(pre)}`:''}</small></span></button>`}).join('')}</div></section>`}).join('')}</div></section>`;
  }
  const legacyPerformanceView=performanceView;
  performanceView=function(){ensure();let out=legacyPerformanceView();out=out.replace('<section class="card knowledge-map">','<section class="card knowledge-map legacy-knowledge-map">');const anchor='<div class="grid g4">';return out.replace(anchor,knowledgeTreeHtml()+memoryPanel()+anchor)};

  // -------- Tutor AEDS --------
  function tutorMessages(uid=targetStudent()?.id){ensure();return state.tutorByUser[uid]||(state.tutorByUser[uid]=[])}
  function tutorContextKey(ctx){return `${ctx.subject||''}|${ctx.grade||''}|${ctx.area||''}|${ctx.skill||ctx.area||''}`}
  function recentTutorEvidence(uid,key){const rows=tutorMessages(uid).filter(x=>x.skillKey===key&&x.role==='student').slice(-5);if(!rows.length)return null;return {messages:rows.length,lastText:rows[rows.length-1].text.slice(0,300),signals:rows.flatMap(x=>x.rastroSignals||[]).slice(-8)}}
  function localTutorReply(text,ctx){const t=String(text||'').trim();if(!t)return 'Escreva o que você entendeu ou exatamente onde travou.';if(/n[aã]o sei|n[aã]o entendi|confus/i.test(t))return `Vamos isolar uma coisa por vez. Em ${ctx.area||'este assunto'}, qual palavra, regra ou etapa parece ser a primeira que deixa de fazer sentido?`;if(/porque|por que|como/i.test(t))return 'Antes de eu entregar a resposta, tente descrever qual regra você acha que deveria funcionar aqui. Mesmo uma hipótese errada ajuda o Rastro a localizar a dificuldade.';return 'Entendi sua explicação. Agora tente transformar isso em uma regra curta e dê um exemplo diferente. O Rastro usa essa justificativa como evidência auxiliar, mas ainda precisa confirmar em uma questão.'}
  async function askTutor(text,ctx){
    const uid=targetStudent()?.id;if(!uid)return;const q=ui.question,skillKey=q?rastroKey(q):`${ctx.subject}|${ctx.grade}|${ctx.area}|${ctx.skill||ctx.area}`;const msg={id:`TM-${Date.now()}-u`,at:new Date().toISOString(),role:'student',text:String(text||'').slice(0,1500),context:tutorContextKey(ctx),skillKey,rastroSignals:[]};tutorMessages(uid).push(msg);
    if(ui.aedsThinking)ui.aedsThinking.tutorMessages=(ui.aedsThinking.tutorMessages||0)+1;
    let reply=null,signals=[];const endpoint=window.AEDS_TUTOR_CONFIG?.endpoint||'';
    if(endpoint){try{const headers={'Content-Type':'application/json'};if(endpoint.includes('/functions/v1/')&&CLOUD.enabled&&cloudSession?.access_token){headers.Authorization=`Bearer ${cloudSession.access_token}`;headers.apikey=CLOUD.anonKey}const r=await fetch(endpoint,{method:'POST',headers,body:JSON.stringify({message:msg.text,context:{subject:ctx.subject,grade:ctx.grade,area:ctx.area,skill:ctx.skill,question:q?{id:q.id,classification:questionCode(q),prompt:q.prompt,options:q.options}:null},history:tutorMessages(uid).filter(x=>x.context===msg.context).slice(-10).map(x=>({role:x.role,text:x.text}))})});if(!r.ok)throw new Error(`Tutor ${r.status}`);const data=await r.json();reply=String(data.reply||data.message||'').slice(0,2500);signals=Array.isArray(data.rastroSignals)?data.rastroSignals.slice(0,8):[]}catch(e){console.warn('Tutor endpoint',e)}}
    if(!reply)reply=localTutorReply(msg.text,ctx);
    msg.rastroSignals=signals;const bot={id:`TM-${Date.now()}-a`,at:new Date().toISOString(),role:'tutor',text:reply,context:msg.context,skillKey,rastroSignals:signals};tutorMessages(uid).push(bot);state.tutorByUser[uid]=tutorMessages(uid).slice(-500);localSave();render();
  }
  function tutorHtml(ctx){const uid=targetStudent()?.id;if(!uid||me()?.role==='admin')return'';const key=tutorContextKey(ctx),rows=tutorMessages(uid).filter(x=>x.context===key).slice(-6),external=!!window.AEDS_TUTOR_CONFIG?.endpoint;return `<section class="card tutor-card no-print"><div class="page-head"><div><span class="eyebrow">TUTOR AEDS</span><h3>${external?'Tutor AEDS · IA quando disponível':'Tutor socrático local'}</h3><p class="muted">Converse sobre seu raciocínio. O texto pode virar evidência auxiliar do Rastro; nunca substitui uma contraprova.</p></div><span class="pill">${external?'IA + fallback local':'modo local'}</span></div>${rows.length?`<div class="tutor-thread">${rows.map(x=>`<div class="tutor-msg ${x.role}"><b>${x.role==='student'?'Você':'Tutor'}</b><p>${esc(x.text)}</p></div>`).join('')}</div>`:''}<div class="tutor-compose"><textarea id="tutorInput" class="scratch" placeholder="Ex.: eu achei que 1/4 era maior que 1/3 porque 4 é maior que 3..."></textarea><button id="sendTutor" class="btn btn-primary" data-tutor-subject="${esc(ctx.subject||'')}" data-tutor-grade="${Number(ctx.grade)||''}" data-tutor-area="${esc(ctx.area||'')}" data-tutor-skill="${esc(ctx.skill||ctx.area||'')}">Enviar ao Tutor</button></div>${external?'':'<small class="muted">Para respostas de IA de verdade, configure <code>window.AEDS_TUTOR_CONFIG.endpoint</code>. Sem isso, o tutor usa perguntas socráticas locais e ainda registra a explicação para o Rastro.</small>'}</section>`}
  const legacyFeedbackBlock=feedbackBlock;
  feedbackBlock=function(q){return legacyFeedbackBlock(q)+tutorHtml({subject:q.subject,grade:q.grade,area:q.area,skill:q.skill,contextType:'question'})};

  // -------- Painel administrativo: controle total das questões --------
  function questionIssueCount(q){const quality=AEDS_QUALITY?.inspect?.(q)||{hard:[],review:[]};return openReports(q.id).length+(quality.hard?.length||0)+(quality.review?.length||0)}
  function questionAdminCard(q,{compact=false}={}){const reports=openReports(q.id),quality=AEDS_QUALITY?.inspect?.(q)||{hard:[],review:[]},m=moderation(q.id),correct=q.questionType==='multiple_choice'?q.options?.[q.correctIndex]:q.correctText;return `<article class="admin-question ${m.status==='quarantine'?'is-quarantine':''}"><div class="admin-q-head"><div><span class="q-code">${esc(questionCode(q))}</span> ${moderationBadge(q.id)} <span class="tag">${esc(q.subject)}</span> <span class="tag">${gradeName(q.grade)}</span></div><span class="pill">${reports.length} denúncia(s)</span></div><h4>${esc(q.prompt)}</h4>${compact?'':`<div class="admin-q-options">${(q.options||[]).map((o,i)=>`<div class="${i===q.correctIndex?'correct':''}"><b>${LETTERS[i]||i+1}</b> ${esc(o)}</div>`).join('')}</div><p class="small"><b>Resposta:</b> ${esc(correct||'—')}</p><p class="small"><b>Explicação:</b> ${esc(q.explanation||'—')}</p>`}${quality.hard?.length||quality.review?.length?`<div class="admin-q-flags">${[...(quality.hard||[]).map(x=>'bloqueio: '+x),...(quality.review||[]).map(x=>'sinal: '+x)].map(x=>`<span>${esc(x)}</span>`).join('')}</div>`:''}${reports.length?`<details open><summary>Denúncias pendentes</summary><div class="list">${reports.map(r=>`<div class="item"><b>${esc(REPORT_REASONS[r.reason]||r.reason)}</b><div class="small">${esc(r.detail||'Sem detalhe adicional.')}</div><div class="tiny muted">${esc(r.user||r.userId)} · ${new Date(r.createdAt).toLocaleString('pt-BR')} · ${esc(reporterHistoryText(r.userId))}</div></div>`).join('')}</div></details>`:''}<div class="admin-q-actions"><button class="btn btn-danger qModerate" data-qid="${esc(q.id)}" data-qstatus="quarantine">Quarentena</button><button class="btn btn-soft qModerate" data-qid="${esc(q.id)}" data-qstatus="active">Manter ativa</button><button class="btn btn-ghost qModerate" data-qid="${esc(q.id)}" data-qstatus="verified">Marcar verificada</button><button class="btn btn-ghost qModerate" data-qid="${esc(q.id)}" data-qstatus="disabled">Desativar</button></div>${m.note?`<div class="tiny muted">Última decisão: ${esc(m.note)}</div>`:''}</article>`}
  function adminMetaCard(meta){
    const loaded=qById(meta.id);if(loaded)return questionAdminCard(loaded,{compact:false});
    const reports=openReports(meta.id),m=moderation(meta.id),flags=Array.isArray(meta.review)?meta.review:[];
    return `<article class="admin-question admin-question-preview ${m.status==='quarantine'?'is-quarantine':''}"><div class="admin-q-head"><div><span class="q-code">${esc(meta.classification)}</span> ${moderationBadge(meta.id)} <span class="tag">${esc(meta.subject)}</span> <span class="tag">${gradeName(meta.grade)}</span></div><span class="pill">${reports.length} denúncia(s)</span></div><h4>${esc(meta.prompt)}</h4><p class="small muted">${esc(meta.area||'')} ${meta.skill?`· ${esc(meta.skill)}`:''}</p>${flags.length?`<div class="admin-q-flags">${flags.map(x=>`<span>sinal: ${esc(x)}</span>`).join('')}</div>`:''}${reports.length?`<details open><summary>Denúncias pendentes</summary><div class="list">${reports.map(r=>`<div class="item"><b>${esc(REPORT_REASONS[r.reason]||r.reason)}</b><div class="small">${esc(r.detail||'Sem detalhe adicional.')}</div><div class="tiny muted">${esc(r.user||r.userId)} · ${new Date(r.createdAt).toLocaleString('pt-BR')} · ${esc(reporterHistoryText(r.userId))}</div></div>`).join('')}</div></details>`:''}<button class="btn btn-primary openAdminQuestion" data-qid="${esc(meta.id)}">${ui._adminQuestionOpening9013===meta.id?'Abrindo pacote...':'Abrir questão completa'}</button></article>`;
  }
  function adminInitialMetas(){
    if(!adminQuestionIndex)return[];const out=[],seen=new Set();
    for(const r of (state.questionReports||[]).filter(x=>x.status==='pending')){const m=adminIndexById?.get(r.qid)||adminIndexByCode?.get(r.classification);if(m&&!seen.has(m.id)){seen.add(m.id);out.push(m);if(out.length>=30)return out}}
    for(const m of adminQuestionIndex){if(m.active&&Array.isArray(m.review)&&m.review.length&&!seen.has(m.id)){seen.add(m.id);out.push(m);if(out.length>=30)break}}
    return out;
  }
  function adminQuestionControlHtml(){
    ensure();requestAdminQuestionIndex();
    const pending=(state.questionReports||[]).filter(r=>r.status==='pending'),quarantine=Object.values(state.questionModeration).filter(x=>x.status==='quarantine').length,verified=Object.values(state.questionModeration).filter(x=>x.status==='verified').length,query=String(ui.adminQuestionSearch||'').trim();
    const dynamicCount=adminQuestionIndex?dynamicAdminMetas().length:0,total=(adminQuestionIndex?.length||Number(window.AEDS_CONTENT?.stats?.().totalQuestions)||0)+dynamicCount;
    const results=adminQuestionIndex?(query?searchAdminQuestionIndex(query,40):adminInitialMetas()):[];
    return `<section class="card admin-control-center"><div class="page-head"><div><span class="eyebrow">CONTROLE & INTELIGÊNCIA</span><h2>Central de questões</h2><p class="muted">Toda suspeita passa pelo administrador. Denúncia não é condenação: você decide se mantém ativa, verifica, coloca em quarentena ou desativa.</p></div><button id="refreshQuestionControl" class="btn btn-ghost">Sincronizar denúncias</button></div><div class="grid g4">${metric('Denúncias pendentes',pending.length)}${metric('Em quarentena',quarantine)}${metric('Verificadas',verified)}${metric('Classificadas',total.toLocaleString('pt-BR'))}</div><div class="classification-legend"><b>Classificação:</b> <code>questão.matéria.série</code> · <code>01.01.01</code> = questão 01 · Matemática · 5º ano. Série: 01=5º, 02=6º, 03=7º, 04=8º, 05=9º, 06=1º EM, 07=2º EM, 08=3º EM.</div><div class="admin-question-search"><input id="adminQuestionSearch" value="${esc(ui.adminQuestionSearch||'')}" placeholder="Pesquise 01.01.01, ID, matéria, assunto, habilidade ou texto da questão"><button id="runAdminQuestionSearch" class="btn btn-primary">Pesquisar</button><button id="clearAdminQuestionSearch" class="btn btn-ghost">Limpar</button></div>${ui._adminIndexLoading9013?'<div class="notice">Preparando o índice administrativo das 36.783 questões… você pode continuar no painel enquanto ele carrega.</div>':''}${ui._adminIndexError9013?`<div class="danger">${esc(ui._adminIndexError9013)}</div>`:''}${ui._adminQuestionOpenError9013?`<div class="danger">${esc(ui._adminQuestionOpenError9013)}</div>`:''}<div class="admin-q-results">${adminQuestionIndex?(results.length?results.map(adminMetaCard).join(''):`<div class="notice">${query?'Nenhuma questão encontrada.':'Nenhuma suspeita pendente nesta fila. Use a busca para abrir qualquer questão do banco.'}</div>`):'<div class="notice">O índice administrativo está sendo preparado.</div>'}</div></section>`;
  }
  async function executeAdminQuestionSearch(){
    ui.adminQuestionSearch=$('#adminQuestionSearch')?.value||ui.adminQuestionSearch||'';ui._adminQuestionOpenError9013='';
    try{await ensureAdminQuestionIndex();const exact=searchAdminQuestionIndex(String(ui.adminQuestionSearch).trim(),1)[0];if(exact&&(exact.classification===String(ui.adminQuestionSearch).trim()||exact.id===String(ui.adminQuestionSearch).trim()))await loadQuestionForMeta(exact);render()}catch(e){ui._adminIndexError9013=String(e?.message||e);render()}
  }
  function adminUsersDataHtml(){
    const students=(state.users||[]).filter(u=>u.role==='student');
    return `<section class="card"><div class="page-head"><div><span class="eyebrow">ADMINISTRAÇÃO</span><h2>Usuários & dados</h2><p class="muted">Contas, permissões, correções manuais, histórico e backups sem carregar os 36 mil itens do banco.</p></div><button id="refreshStudents" class="btn btn-ghost">Recarregar alunos</button></div><div class="grid g4">${metric('Alunos',students.length)}${metric('Correções pendentes',state.manualQueue.filter(x=>x.status==='pending').length)}${metric('Feedbacks',state.feedback.length)}${metric('Auditorias',state.audit.length)}</div></section><div class="grid g2" style="margin-top:14px"><div class="card"><h3>Criar aluno</h3><div class="field"><label>Nome</label><input id="newName"></div><div class="field"><label>Usuário</label><input id="newUsername"></div><div class="field"><label>Senha</label><input id="newPassword" value="1234"></div><div class="field"><label>Série inicial</label><select id="newGrade">${[5,6,7,8,9,10,11,12].map(g=>`<option value="${g}">${gradeName(g)}</option>`).join('')}</select></div><button id="createUser" class="btn btn-primary">Criar usuário</button></div><div class="card"><h3>Correção manual</h3>${manualQueueHtml()}</div></div><div class="card" style="margin-top:14px"><h3>Usuários</h3><div class="list">${students.length?students.map(u=>userAdminCard(u)).join(''):'<div class="notice">Nenhum aluno cadastrado ainda.</div>'}</div></div><div class="grid g2" style="margin-top:14px"><div class="card"><h3>Histórico de mudanças</h3><div class="list audit">${state.audit.slice(-100).reverse().map(a=>`<div class="item">${new Date(a.at).toLocaleString('pt-BR')} · <b>${esc(a.user)}</b> · ${esc(a.action)} · ${esc(a.detail)}</div>`).join('')||'<div class="muted">Nenhuma mudança ainda.</div>'}</div></div><div class="card"><h3>Dados & segurança operacional</h3><p class="small">Backup do estado, exportação de respostas para calibração e limpeza controlada dos dados de demonstração.</p><div class="seg"><button id="adminBackup" class="btn btn-primary">Exportar backup</button><button id="exportTriCalibration" class="btn btn-soft">Exportar dados TRI (CSV)</button><button id="clearDemo" class="btn btn-danger">Zerar dados dos alunos</button></div></div></div>`;
  }
  function adminIntelligenceHtml(){
    const students=(state.users||[]).filter(u=>u.role==='student');
    const traceLabel=k=>String(k||'').replaceAll('|',' · ');
    const rows=students.map(u=>{
      const traces=Object.entries(state.rastro?.[u.id]||{}).map(([k,t])=>({k,s:AEDS_RASTRO.summary(t)})).filter(x=>x.s).sort((a,b)=>(b.s.manualReviewRequired-a.s.manualReviewRequired)||(b.s.score-a.s.score)||(b.s.events-a.s.events));
      const top=traces[0],mem=Object.values(memoryMap(u.id)),due=memoryDueKeys(u.id).length,cats=mem.filter(x=>x.firstLearnedAt).reduce((acc,r)=>{const c=memoryCategory(r).label;acc[c]=(acc[c]||0)+1;return acc},{});
      const traceCards=traces.slice(0,8).map(({k,s})=>`<div class="rastro-admin-trace"><div class="rastro-admin-trace-head"><b>${esc(traceLabel(k))}</b><span class="tag">${esc(s.label)} · ${Math.round(s.score*100)}%</span>${s.manualReviewRequired?'<span class="q-status q-status-quarantine">revisão humana</span>':''}</div><div class="tiny muted">${s.events} evidência(s) · retenção ${s.retentionProof||0} · transferência ${s.transferProof||0} · estabilidade ${s.stableProof||0}</div><div class="small"><b>Estado do domínio:</b> ${s.gate?.passed?'comprovado':'ainda não comprovado'}${s.gate?.reason?` · ${esc(s.gate.reason)}`:''}</div>${s.caseFailures?`<div class="tiny">Contraprovas falhas no caso atual: ${s.caseFailures}</div>`:''}</div>`).join('');
      const memText=Object.entries(cats).map(([k,v])=>`${k} ${v}`).join(' · ')||'ainda sem nível fechado';
      return `<div class="item admin-student-intel"><div class="page-head"><div><b>${esc(u.name)}</b><small>${gradeName(u.grade)} · modo de aula: ${esc(state.lessonModeByUser[u.id]||'não escolhido')}</small></div><div><span class="tag">${due} checagem(ns) de memória</span>${top?`<span class="tag">hipótese principal: ${esc(top.s.label)} · ${Math.round(top.s.score*100)}%</span>`:'<span class="tag">sem hipótese forte</span>'}</div></div><div class="tiny muted">Memória: ${esc(memText)}</div>${traceCards?`<details class="rastro-admin-details"><summary>Ver como o Rastro está pensando (${traces.length} habilidade(s) com evidência)</summary><div class="rastro-admin-traces">${traceCards}</div></details>`:'<div class="notice">Ainda não há evidência suficiente do Rastro para este aluno.</div>'}<div class="seg"><button class="btn btn-ghost adminLessonMode" data-uid="${esc(u.id)}" data-mode="normal">Forçar normal</button><button class="btn btn-ghost adminLessonMode" data-uid="${esc(u.id)}" data-mode="adaptive">Forçar adaptativa</button><button class="btn btn-ghost adminLessonMode" data-uid="${esc(u.id)}" data-mode="clear">Deixar escolher</button></div></div>`;
    }).join('');
    const manual=(typeof rastroManualReviewAdminHtml==='function')?rastroManualReviewAdminHtml():'';
    return `<section class="card admin-rastro-observer"><div class="page-head"><div><span class="eyebrow">RASTRO OBSERVÁVEL</span><h3>O administrador vê evidências, hipóteses e limites do diagnóstico</h3><p class="muted">O Rastro não mostra só uma nota: exibe a hipótese dominante, força da evidência, provas de retenção/transferência e o motivo que ainda impede o domínio. Assim o próprio motor pode ser auditado.</p></div></div><div class="list">${rows||'<div class="notice">Nenhum aluno.</div>'}</div></section>${manual}`;
  }
  const legacyAdminView=adminView;
  function adminBankReady(){const st=window.AEDS_CONTENT?.stats?.();return !st||!st.totalPacks||st.loadedPacks>=st.totalPacks}
  function requestFullAdminBank(){
    if(me()?.role!=='admin'||adminBankReady()||ui._adminFullBankLoading9013)return;
    ui._adminFullBankLoading9013=true;
    Promise.resolve(window.AEDS_CONTENT?.ensureAll?.()).then(()=>{syncLoadedBank();registryStamp='';buildQuestionRegistry(true);ui._adminFullBankLoading9013=false;localSave();render()}).catch(e=>{ui._adminFullBankLoading9013=false;ui._adminFullBankError9013=String(e?.message||e);render()});
  }
  function adminTabsHtml(){
    const tab=ui.admin9013Tab||'questions';
    const items=[['questions','Questões'],['rastro','Rastro & Memória'],['users','Usuários & Dados'],['legacy','Conteúdo avançado']];
    return `<nav class="admin9013-tabs no-print" aria-label="Áreas do painel administrativo">${items.map(([id,label])=>`<button class="btn ${tab===id?'btn-primary':'btn-ghost'} admin9013Tab" data-admin9013-tab="${id}">${label}</button>`).join('')}</nav>`;
  }
  adminView=function(){
    ensure();const tab=ui.admin9013Tab||'questions';let body='';
    if(tab==='rastro')body=adminIntelligenceHtml();
    else if(tab==='users')body=adminUsersDataHtml();
    else if(tab==='legacy'){
      if(!adminBankReady()){
        requestFullAdminBank();const st=window.AEDS_CONTENT?.stats?.()||{};
        body=`<section class="card admin-bank-loading"><span class="eyebrow">GESTÃO CLÁSSICA</span><h2>Carregando ferramentas de banco completo</h2><p>Esta aba preserva os controles e auditorias das versões anteriores. Ela carrega todos os pacotes somente quando você realmente a abre, para não deixar o login administrativo pesado.</p><div class="loader"><span></span></div><p class="muted">${Number(st.loadedPacks)||0}/${Number(st.totalPacks)||135} pacotes · ${Number(st.loadedQuestions||0).toLocaleString('pt-BR')} questões carregadas</p>${ui._adminFullBankError9013?`<div class="danger">${esc(ui._adminFullBankError9013)}</div>`:''}</section>`;
      }else body=`<section class="card legacy-admin-intro"><span class="eyebrow">GESTÃO CLÁSSICA</span><h3>Controles anteriores preservados</h3><p class="muted">Usuários, editor, auditorias, cobertura e ferramentas das versões anteriores continuam disponíveis aqui.</p></section>`+legacyAdminView();
    }else body=adminQuestionControlHtml();
    return adminTabsHtml()+body;
  };

  const legacyCloudLoadProfile9013=cloudLoadProfile;
  cloudLoadProfile=async function(){const ok=await legacyCloudLoadProfile9013();if(ok){ensure();await loadModerationCloud()}return ok};

  // Cloud compact state inclui as novas estruturas sem remover compatibilidade.
  const legacyCloudCompactState=cloudCompactState;
  cloudCompactState=function(u){ensure();const x=legacyCloudCompactState(u);const own=obj=>(obj&&Object.prototype.hasOwnProperty.call(obj,u.id))?{[u.id]:obj[u.id]}:{};return {...x,questionRegistry:u.role==='admin'?state.questionRegistry:{},questionReports:u.role==='admin'?state.questionReports:(state.questionReports||[]).filter(r=>r.userId===u.id),questionModeration:u.role==='admin'?state.questionModeration:{},lessonModeByUser:own(state.lessonModeByUser),adaptiveOverrides:own(state.adaptiveOverrides),memoryByUser:own(state.memoryByUser),cognitionByUser:own(state.cognitionByUser),tutorByUser:own(state.tutorByUser)}};
  const legacyCloudUpsertEditorial9013=cloudUpsertEditorial;
  cloudUpsertEditorial=async function(kind,x){if(kind==='question'&&x){ensure();registryStamp='';buildQuestionRegistry(true);x.classification=questionCode(x)}return legacyCloudUpsertEditorial9013(kind,x)};
  const legacyCloudAdminRefresh=cloudAdminRefresh;
  cloudAdminRefresh=async function(){ensure();if(CLOUD.enabled&&cloudSession&&me()?.role==='admin')await loadQuestionControlCloud();else await legacyCloudAdminRefresh();render()};

  // -------- UI wiring --------
  const legacyWire=wire;
  wire=function(){
    ensure();legacyWire();
    if(CLOUD.enabled&&cloudSession&&!ui._moderation9013Loaded){ui._moderation9013Loaded=true;const p=me()?.role==='admin'?loadQuestionControlCloud():loadModerationCloud();p.then(changed=>{if(changed)render()}).catch(()=>{})}
    $$('.lessonModeChoice').forEach(b=>b.onclick=()=>{const uid=targetStudent()?.id;if(!uid)return;state.lessonModeByUser[uid]=b.dataset.lessonMode;audit('modo de aula',`${uid}: ${b.dataset.lessonMode}`);localSave();render()});
    $('#goPrerequisite')?.addEventListener('click',e=>{ui.learningArea=e.currentTarget.dataset.pre;render()});
    $('#overrideAdaptive')?.addEventListener('click',()=>{const uid=targetStudent()?.id;if(!uid)return;state.adaptiveOverrides[uid][`${ui.subject}|${ui.grade}|${ui.learningArea}`]=true;localSave();render()});
    $$('[data-tree-area]').forEach(b=>b.onclick=()=>{ui.subject=b.dataset.treeSubject;ui.grade=Number(b.dataset.treeGrade);ui.learningArea=b.dataset.treeArea;ui.page='learn';render()});

    $('#reportQuestion')?.addEventListener('click',()=>{if(!ui.question)return;ui.reportQuestionId=ui.question.id;ui.reportReason=null;ui.reportDetail='';const t=startThinking(ui.question);if(t)t.reportOpened=true;render()});
    $$('.reportReason').forEach(b=>b.onclick=()=>{ui.reportReason=b.dataset.reportReason;render()});
    $('#reportDetail')?.addEventListener('input',e=>ui.reportDetail=e.target.value);
    $('#cancelQuestionReport')?.addEventListener('click',()=>{ui.reportQuestionId=null;ui.reportReason=null;ui.reportDetail='';render()});
    $('#sendQuestionReport')?.addEventListener('click',()=>submitReport(ui.question,ui.reportReason,$('#reportDetail')?.value||ui.reportDetail||''));

    const tq=ui.question;if(tq&&!ui.corrected)startThinking(tq);
    $$('input[name="answer"]').forEach(x=>x.addEventListener('change',e=>{const t=startThinking(ui.question);if(!t)return;const v=Number(e.target.value);if(!t.firstChoiceAt)t.firstChoiceAt=Date.now();if(t.optionPath.length&&t.optionPath[t.optionPath.length-1]!==v)t.answerChanges++;if(t.optionPath[t.optionPath.length-1]!==v)t.optionPath.push(v)}));
    $$('.cdf').forEach(b=>b.addEventListener('click',()=>{const t=startThinking(ui.question);if(!t)return;const v=b.dataset.v;if(t.cdfPath.length&&t.cdfPath[t.cdfPath.length-1]!==v)t.cdfChanges++;if(t.cdfPath[t.cdfPath.length-1]!==v)t.cdfPath.push(v)}));
    $('#hintBtn')?.addEventListener('click',()=>{const t=startThinking(ui.question);if(t)t.hintUsed=true});
    $('#scratch')?.addEventListener('input',e=>{const t=startThinking(ui.question);if(t)t.scratchChars=e.target.value.length});

    $('#sendTutor')?.addEventListener('click',e=>{const b=e.currentTarget,text=$('#tutorInput')?.value||'';if(!text.trim())return;askTutor(text,{subject:b.dataset.tutorSubject,grade:Number(b.dataset.tutorGrade),area:b.dataset.tutorArea,skill:b.dataset.tutorSkill})});

    $$('.admin9013Tab').forEach(b=>b.onclick=()=>{ui.admin9013Tab=b.dataset.admin9013Tab||'questions';render()});
    const search=$('#adminQuestionSearch');if(search){search.oninput=e=>{ui.adminQuestionSearch=e.target.value};search.onkeydown=e=>{if(e.key==='Enter')executeAdminQuestionSearch()}}
    $('#runAdminQuestionSearch')?.addEventListener('click',executeAdminQuestionSearch);
    $('#clearAdminQuestionSearch')?.addEventListener('click',()=>{ui.adminQuestionSearch='';ui._adminQuestionOpenError9013='';render()});
    $$('.openAdminQuestion').forEach(b=>b.onclick=async()=>{try{await ensureAdminQuestionIndex();const meta=adminIndexById?.get(b.dataset.qid);await openAdminQuestionMeta(meta)}catch(e){ui._adminQuestionOpenError9013=String(e?.message||e);render()}});
    $('#refreshQuestionControl')?.addEventListener('click',async()=>{await loadQuestionControlCloud();render()});
    $$('.qModerate').forEach(b=>b.onclick=()=>{const q=qById(b.dataset.qid);if(!q)return;const status=b.dataset.qstatus,note=prompt(`Decisão: ${moderationLabel(status)}. Escreva uma justificativa curta para o histórico:`,moderation(q.id).note||'');if(note===null)return;setModeration(q,status,note)});
    $$('.adminLessonMode').forEach(b=>b.onclick=()=>{const uid=b.dataset.uid,mode=b.dataset.mode;if(mode==='clear')delete state.lessonModeByUser[uid];else state.lessonModeByUser[uid]=mode;audit('modo de aula pelo admin',`${uid}: ${mode}`);localSave();render()});
  };

  // version visibility
  try{if(window.AEDS_APP)Object.defineProperty(window.AEDS_APP,'_runtime9013',{value:true,configurable:true})}catch{}
  window.AEDS_9013=Object.freeze({VERSION,SUBJECT_CODES,GRADE_CODES,questionCode,moderation,memoryCategory,memoryDueKeys,classificationParts,ensureAdminQuestionIndex,searchAdminQuestionIndex});
})();
