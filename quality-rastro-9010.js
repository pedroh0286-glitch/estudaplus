#!/usr/bin/env node
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const root=__dirname,errors=[];const fail=x=>errors.push(x);
for(const f of ['rastro.js','sync-engine.js','app.js','index.html','styles.css','sw.js','content-loader.js','rastro-stress-909.js','sync-stress-909.js','load-static-max-909.js','rastro-isolation-909.js','RASTRO-RULES-9.0.9.md','FAILURE-TO-RULE-9.0.9.md','RASTRO-COVERAGE-DEBT-9.0.9.md'])if(!fs.existsSync(path.join(root,f)))fail('arquivo ausente: '+f);
let R=null,S=null;try{const c={window:{}};vm.createContext(c);vm.runInContext(fs.readFileSync(path.join(root,'rastro.js'),'utf8'),c);R=c.window.AEDS_RASTRO;const d={window:{}};vm.createContext(d);vm.runInContext(fs.readFileSync(path.join(root,'sync-engine.js'),'utf8'),d);S=d.window.AEDS_SYNC}catch(e){fail('motor inválido: '+e.message)}
if(R){
 if(R.VERSION!=='2.1')fail('Rastro não está em 2.1');
 const qa={subject:'X',grade:10,area:'A',skill:'A — aplicação em contexto',difficulty:'médio',id:'a',rootFamily:'ra',patternFamily:'pa'},qb={...qa,id:'b',skill:'A — diagnóstico conceitual',rootFamily:'rb',patternFamily:'pb'};
 if(R.skillKey(qa)!==R.skillKey(qb))fail('chave canônica fragmentou a mesma habilidade');
 let t=R.normalize({}),o=R.observe(t,{q:qa,rec:{right:false,cdf:'C',at:1000},context:{now:1000,eventId:'e0'}});t=o.trace;
 const e0=R.activeCase(t)?.failures||0;
 const dup=R.observe(t,{q:qa,rec:{right:false,cdf:'C',at:1000},context:{now:1000,eventId:'e0'}});if(!dup.duplicate||(R.activeCase(dup.trace)?.failures||0)!==e0)fail('evento duplicado não foi idempotente');t=dup.trace;
 for(let i=0;i<4;i++)t=R.observe(t,{q:qb,rec:{right:false,cdf:'D',at:2000+i},context:{now:2000+i,eventId:'cp'+i,isCounterproof:true,independentEvidence:true}}).trace;
 let c=R.activeCase(t);if(!c?.manualReviewRequired||R.masteryGate(t).level!=='needs_human_review')fail('quatro falhas não criaram bloqueio humano persistente');
 t=R.observe(t,{q:qb,rec:{right:true,cdf:'C',at:8000},context:{now:8000,eventId:'good1',isCounterproof:true,independentEvidence:true,differentPatternSuccess:true}}).trace;
 t=R.observe(t,{q:qa,rec:{right:true,cdf:'C',at:4*86400000},context:{now:4*86400000,eventId:'good2',delayedCorrect:true,daysSinceLastCorrect:4}}).trace;
 if(R.masteryGate(t).level!=='needs_human_review')fail('acertos posteriores apagaram revisão humana obrigatória');
 c=R.activeCase(t);let rejected=false;try{R.clearManualReview(t,c.id,{note:'curta',reviewer:'admin'})}catch{rejected=true}if(!rejected)fail('revisão humana aceitou justificativa insuficiente');
 t=R.clearManualReview(t,c.id,{note:'Revisão pedagógica conferiu o raciocínio e autorizou nova certificação.',reviewer:'admin-qa'});if(!R.masteryGate(t).passed)fail('revisão explícita válida não liberou gate após provas já existentes');
 let b=R.normalize({});b=R.observe(b,{q:qa,rec:{right:false,cdf:'C',at:1},context:{now:1,eventId:'b'}}).trace;b=R.setCoverage(b,'sem_contraprova_independente');const n=b.coverageGaps;b=R.setCoverage(b,'sem_contraprova_independente');if(b.coverageGaps!==n)fail('mesma lacuna de cobertura inflou o contador');
}
if(S){if(S.VERSION!=='1.0')fail('Sync Engine não está em 1.0');let m=S.normalize({});m=S.markDirty(m,0);const snap=m.dirtyVersion;m=S.markAttempt(m,1);m=S.markDirty(m,2);m=S.markSuccess(m,snap,3);if(!m.pending||m.dirtyVersion<=m.syncedVersion)fail('mudança durante upload foi perdida');const x=S.markFailure(m,{status:429,retryAfterMs:120000,error:'rate',now:100});if(!x.pending||x.nextRetryAt<120100)fail('429 não respeitou Retry-After');const y=S.markFailure(m,{status:401,error:'auth',now:100});if(!y.waitForAuth||!y.pending)fail('401 não pausou mantendo pendência')}
const app=fs.existsSync(path.join(root,'app.js'))?fs.readFileSync(path.join(root,'app.js'),'utf8'):'';const html=fs.existsSync(path.join(root,'index.html'))?fs.readFileSync(path.join(root,'index.html'),'utf8'):'';const sw=fs.existsSync(path.join(root,'sw.js'))?fs.readFileSync(path.join(root,'sw.js'),'utf8'):'';const loader=fs.existsSync(path.join(root,'content-loader.js'))?fs.readFileSync(path.join(root,'content-loader.js'),'utf8'):'';
for(const tok of ['AEDS 9.0.10: Rastro 2.1','rastroManualReviewAdminHtml','clearRastroManualReview','cloudSyncMeta','cloudSchedulePush','cloudCompactState'])if(!app.includes(tok))fail('app sem '+tok);
if(/data-page=["']rastro["']|ui\.page\s*=\s*["']rastro["']/.test(app+html))fail('Rastro virou página');
for(const tok of ['9.0.10','rastro.js','sync-engine.js'])if(!html.includes(tok))fail('index sem '+tok);
for(const tok of ['aeds-v9-0-10-shell','aeds-v9-0-10-content','SHELL_PATHS'])if(!sw.includes(tok))fail('service worker sem '+tok);
if(!loader.includes("VERSION:'9.0.10'")||!loader.includes('currentGrade')||!loader.includes('aeds-v9-0-10-content'))fail('loader 9.0.10 não é lazy/local-first');
try{const s=JSON.parse(fs.readFileSync(path.join(root,'rastro-stress-909.json'),'utf8'));if(s.users!==10000||s.activeQuestions!==5140||s.baseResponses!==51400000||!s.allEventuallyCorrect||s.contractErrors||s.escalationErrors||s.coverageSkills||s.coverageQuestions||s.simErrors)fail('stress pedagógico 9.0.9 não está totalmente verde')}catch(e){fail('resultado stress 9.0.9 ausente/inválido')}
try{const s=JSON.parse(fs.readFileSync(path.join(root,'sync-stress-909.json'),'utf8'));if(s.users!==10000||s.failedAssertions)fail('sync stress 9.0.9 não está verde')}catch(e){fail('sync stress 9.0.9 ausente/inválido')}
try{const s=JSON.parse(fs.readFileSync(path.join(root,'rastro-isolation-909.json'),'utf8'));if(s.users!==10000||!s.isolated||s.sharedStateLeaks)fail('isolamento 9.0.9 não está verde')}catch(e){fail('isolamento 9.0.9 ausente/inválido')}
try{const s=JSON.parse(fs.readFileSync(path.join(root,'load-static-max-909.json'),'utf8'));const conf=Array.isArray(s.confirmations)?s.confirmations:[];if(!s.maxStableConcurrent||s.maxStableConcurrent<10000||conf.length<2||conf.some(x=>x.concurrent!==s.maxStableConcurrent||x.fail!==0)||!s.firstFailConcurrent||s.firstFailConcurrent<=s.maxStableConcurrent||!s.firstFailReason)fail('rampa de carga não confirmou um máximo estável repetido e um primeiro nível falho')}catch(e){fail('resultado da rampa de carga ausente/inválido')}
try{const rules=fs.readFileSync(path.join(root,'RASTRO-RULES-9.0.9.md'),'utf8');for(const x of ['R24','R25','R26','R27','R28','R29'])if(!rules.includes(x+' —'))fail('regra permanente ausente: '+x)}catch(e){fail('regras 9.0.9 ausentes/inválidas')}
try{const debt=fs.readFileSync(path.join(root,'RASTRO-COVERAGE-DEBT-9.0.9.md'),'utf8');if(!debt.includes('**0 micro-habilidade(s)**')||!debt.includes('**0 questão(ões)**'))fail('dívida de cobertura não está zerada')}catch(e){fail('relatório de cobertura ausente/inválido')}
if(errors.length){errors.forEach(x=>console.error('ERRO:',x));process.exit(1)}console.log('OK Rastro 2.1 / AEDS 9.0.10 — cobertura zero, revisão humana persistente, sync durável, lazy-load e rampa de carga validados.');
