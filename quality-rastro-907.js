#!/usr/bin/env node
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const root=__dirname,errors=[];const fail=x=>errors.push(x);
for(const f of ['rastro.js','app.js','index.html','styles.css','sw.js'])if(!fs.existsSync(path.join(root,f)))fail('arquivo ausente: '+f);
let R=null;
try{const ctx={window:{}};vm.createContext(ctx);vm.runInContext(fs.readFileSync(path.join(root,'rastro.js'),'utf8'),ctx);R=ctx.window.AEDS_RASTRO}catch(e){fail('rastro.js inválido: '+e.message)}
if(R){
 const q=(difficulty='médio')=>({id:'q1',difficulty});
 const expect=(name,input,signal)=>{const got=R.classify(input).signal;if(got!==signal)fail(`${name}: esperado ${signal}, veio ${got}`)};
 expect('acerto com dúvida',{q:q(),rec:{right:true,cdf:'D'},context:{}},'incerteza');
 expect('erro com CID interpretação',{q:q(),rec:{right:false,cdf:'D',cid:'Interpretacao'},context:{}},'representacao');
 expect('erro com CID distração',{q:q(),rec:{right:false,cdf:'D',cid:'Distracao'},context:{}},'atencao');
 expect('erro após intervalo',{q:q(),rec:{right:false,cdf:'D'},context:{wasDue:true,daysSinceLastCorrect:4}},'retencao');
 expect('falha de transferência',{q:q('difícil'),rec:{right:false,cdf:'D'},context:{priorEasyCorrect:2}},'transferencia');
 expect('erro confiante',{q:q(),rec:{right:false,cdf:'C'},context:{}},'conceito');
 expect('transferência confirmada',{q:q('difícil'),rec:{right:true,cdf:'C'},context:{differentPatternSuccess:true}},'transferencia_confirmada');
 for(const s of ['representacao','conceito','procedimento','retencao','transferencia','atencao','incerteza']){
   const r=R.route(s,q());if(!r||!r.instruction||!r.changeOneThing)fail(`rota ${s} incompleta`);
 }
 let trace=R.normalize({});
 let a=R.observe(trace,{q:q(),rec:{right:false,cdf:'C'},context:{}});trace=a.trace;
 if(trace.scores.conceito<=0)fail('erro confiante não elevou conceito');
 const before=trace.scores.conceito;
 for(let i=0;i<3;i++){a=R.observe(trace,{q:q('difícil'),rec:{right:true,cdf:'C'},context:{differentPatternSuccess:true}});trace=a.trace}
 if(trace.scores.conceito>=before)fail('evidência positiva não enfraqueceu hipótese antiga');
 if(trace.transferProof<3)fail('contraprovas de transferência não foram registradas');
}
const app=fs.readFileSync(path.join(root,'app.js'),'utf8'),html=fs.readFileSync(path.join(root,'index.html'),'utf8'),css=fs.readFileSync(path.join(root,'styles.css'),'utf8'),sw=fs.readFileSync(path.join(root,'sw.js'),'utf8');
for(const t of ['rastro.js','9.0.7'])if(!html.includes(t))fail('index sem '+t);
for(const t of ['AEDS 9.0.7: Rastro','applyRastroRecord','pickRastroQuestion','rastroLearningHtml','rastroFeedbackHtml','injectRastroIntoSession','rastroPending'])if(!app.includes(t))fail('integração ausente: '+t);
for(const t of ['.rastro-feedback','.rastro-cue','.rastro-learning'])if(!css.includes(t))fail('CSS ausente: '+t);
for(const t of ['aeds-v9-0-7-shell','aeds-v9-0-7-content','rastro.js'])if(!sw.includes(t))fail('service worker sem '+t);
if(/data-page=["']rastro["']|ui\.page\s*=\s*["']rastro["']/.test(app+html))fail('Rastro virou uma página; requisito é ser tecnologia transversal');
if(!/changeOneThing:true/.test(fs.readFileSync(path.join(root,'rastro.js'),'utf8')))fail('regra de uma variável por vez ausente');
if(errors.length){errors.forEach(e=>console.error('ERRO:',e));process.exit(1)}
console.log('OK Rastro 9.0.7 — 7 hipóteses pedagógicas, rotas distintas, contraprova adaptativa, decaimento por evidência e integração transversal sem nova página.');
