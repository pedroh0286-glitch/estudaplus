#!/usr/bin/env node
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const root=__dirname,errors=[];const fail=x=>errors.push(x);
const src=fs.readFileSync(path.join(root,'achievements.js'),'utf8');
const ctx={window:{}};vm.createContext(ctx);vm.runInContext(src,ctx);const A=ctx.window.AEDS_ACHIEVEMENTS;
if(!A)fail('AEDS_ACHIEVEMENTS não carregou');
if(A?.VERSION!=='1.0')fail('versão do motor de conquistas inesperada');
const defs=A?.DEFINITIONS||[],ids=new Set(defs.map(x=>x.id));
if(ids.size!==defs.length)fail('IDs de conquistas duplicados');
for(const id of ['correct_10000','verified_100','transfer_100','retention_100','deep_recovery_1','method_discovered'])if(!ids.has(id))fail(`conquista obrigatória ausente: ${id}`);
const api={normalize:x=>x||{},masteryGate:x=>({passed:!!x.passed})};
const base={correct:9999,masteredCorrect:9000,answeredRoots:Array.from({length:999},(_,i)=>'f'+i),history:[]};
let r=A.evaluate({stats:base,rastro:{},rastroApi:api,independentSkills:9});
if(r.find(x=>x.id==='correct_10000')?.earned)fail('10.000 acertos liberou com 9.999');
base.correct=10000;r=A.evaluate({stats:base,rastro:{},rastroApi:api,independentSkills:9});
if(!r.find(x=>x.id==='correct_10000')?.earned)fail('10.000 acertos não liberou no limiar exato');
const hist=[];for(let i=0;i<29;i++){hist.push({strategy:'attempt_first',right:true,cdf:'C'});hist.push({strategy:'explain_first',right:false,cdf:'C'})}
let m=A.strategyEvidence(hist);if(m.enough||m.winner)fail('método foi descoberto antes de 30 evidências por estratégia');
hist.push({strategy:'attempt_first',right:true,cdf:'C'},{strategy:'explain_first',right:false,cdf:'C'});m=A.strategyEvidence(hist);if(m.winner!=='attempt_first')fail('método superior não foi detectado com amostra suficiente');
let ev=A.evaluate({stats:{...base,history:hist},rastro:{},rastroApi:api,independentSkills:0});if(!ev.find(x=>x.id==='method_discovered')?.earned)fail('conquista de método não liberou com evidência suficiente');
const flexible=[];for(let i=0;i<40;i++){flexible.push({strategy:'attempt_first',right:true,cdf:i%2?'C':'D'});flexible.push({strategy:'explain_first',right:true,cdf:i%2?'C':'D'})}
if(A.strategyEvidence(flexible).winner!=='flexible')fail('aprendizagem flexível não detectada');
const trace={passed:true,transferProof:5,retentionProof:4,cases:[{status:'verified',failures:3}]};
ev=A.evaluate({stats:{...base,history:[]},rastro:{k:trace},rastroApi:api,independentSkills:10});
for(const id of ['verified_1','transfer_1','retention_1','deep_recovery_1','independent_10'])if(!ev.find(x=>x.id===id)?.earned)fail(`evidência rigorosa não liberou ${id}`);
let u=A.unlock({}, {stats:{...base,history:hist},rastro:{k:trace},rastroApi:api,independentSkills:10}, 1000);const count=u.unlocked.length;
if(!count)fail('unlock não encontrou conquistas');
const u2=A.unlock(u.earned,{stats:{...base,history:hist},rastro:{k:trace},rastroApi:api,independentSkills:10},2000);if(u2.unlocked.length)fail('mesma conquista foi liberada duas vezes');
const app=fs.readFileSync(path.join(root,'app.js'),'utf8'),html=fs.readFileSync(path.join(root,'index.html'),'utf8'),sw=fs.readFileSync(path.join(root,'sw.js'),'utf8');
for(const token of ['achievementsHtml','refreshAchievements','achievementContext','state.achievements','strategy:ui.studySession'])if(!app.includes(token))fail(`integração ausente: ${token}`);
if(!html.includes('achievements.js'))fail('index não carrega achievements.js');if(!sw.includes("'./achievements.js'"))fail('service worker não inclui achievements.js no shell offline');
if(/data-page=["']achievements/.test(app)||/ui\.page\s*===\s*["']achievements/.test(app))fail('conquistas viraram uma nova página; devem ficar integradas ao Progresso');
if(errors.length){for(const e of errors)console.error('ERRO:',e);process.exit(1)}
console.log(`OK conquistas 9.0.10 — ${defs.length} conquistas, limites, método de estudo, idempotência e integração validados.`);
