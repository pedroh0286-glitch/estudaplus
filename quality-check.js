#!/usr/bin/env node
'use strict';
/* AEDS 8.29 — verificação automática para rodar antes de publicar.
   Uso: node quality-check.js */
const fs=require('fs'),zlib=require('zlib'),path=require('path');
const root=__dirname,errors=[],warnings=[];
function fail(x){errors.push(x)} function warn(x){warnings.push(x)}
for(const f of ['index.html','styles.css','app.js','engine.js','bank-data.js','cloud-config.js','sw.js','vercel.json'])if(!fs.existsSync(path.join(root,f)))fail(`arquivo ausente: ${f}`);
let data=null;
try{const src=fs.readFileSync(path.join(root,'bank-data.js'),'utf8'),m=src.match(/ESTUDAPLUS_BANK_B64='([^']+)'/);if(!m)throw new Error('payload B64 não encontrado');data=JSON.parse(zlib.gunzipSync(Buffer.from(m[1],'base64')).toString('utf8'))}catch(e){fail(`bank-data inválido: ${e.message}`)}
if(data){
 const qs=data.questions||[],ids=new Set(),active=qs.filter(q=>q.active!==false),mc=active.filter(q=>q.questionType==='multiple_choice');
 for(const q of qs){if(!q.id)fail('questão sem id');else if(ids.has(q.id))fail(`id duplicado: ${q.id}`);else ids.add(q.id);if(q.questionType==='multiple_choice'&&q.active!==false){if(!Array.isArray(q.options)||q.options.length<2)fail(`${q.id}: alternativas insuficientes`);if(!Number.isInteger(q.correctIndex)||q.correctIndex<0||q.correctIndex>=q.options.length)fail(`${q.id}: correctIndex inválido`)}}
 const articles=Object.values(data.learningByGrade||{}).reduce((n,grades)=>n+Object.values(grades).reduce((m,areas)=>m+Object.keys(areas).length,0),0);
 if(articles<140)fail(`apenas ${articles} artigos por série; esperado >= 140`);
 for(const [sub,grades] of Object.entries(data.learningByGrade||{}))for(const [g,areas] of Object.entries(grades))for(const [area,a] of Object.entries(areas)){const kinds=new Set((a.sections||[]).map(x=>x.kind));for(const k of ['concept','why','method','recognition','practice','transfer_map','independence'])if(!kinds.has(k))warn(`${sub}/${g}/${area}: falta seção ${k}`)}
 if(String(data.manifest?.version)!=='8.29')fail(`manifest version ${data.manifest?.version} != 8.29`);
 if(Number(data.manifest?.storageQuestions)!==qs.length)warn(`storageQuestions=${data.manifest?.storageQuestions}, real=${qs.length}`);
 console.log(`AEDS ${data.manifest?.version||'?'}: ${qs.length} armazenadas, ${active.length} ativas, ${mc.length} objetivas ativas, ${articles} artigos.`);
}
const app=fs.existsSync(path.join(root,'app.js'))?fs.readFileSync(path.join(root,'app.js'),'utf8'):'';
const html=fs.existsSync(path.join(root,'index.html'))?fs.readFileSync(path.join(root,'index.html'),'utf8'):'';
const sw=fs.existsSync(path.join(root,'sw.js'))?fs.readFileSync(path.join(root,'sw.js'),'utf8'):'';
for(const token of ['startSmartStudy','AEDS_ENGINE','autonomyPanelHtml','dueSkillKeys','TRI-AEDS'])if(!app.includes(token))fail(`app.js sem ${token}`);

try{
 global.window=global;require(path.join(root,'engine.js'));const E=global.AEDS_ENGINE;
 let st=E.normalizeSkillStat({}),t0=1700000000000;
 const seq=[['médio',true,'C',0],['médio',true,'C',3],['difícil',true,'C',6],['médio',true,'C',9],['difícil',true,'C',12],['difícil',true,'C',16]];
 for(const [difficulty,right,cdf,day] of seq)E.updateSkill(st,{difficulty,right,cdf,now:t0+day*E.DAY});
 if(E.stage(st,false).level>=4)fail('independência foi liberada sem prova externa');
 if(E.stage(st,true).level!==4)fail('motor não reconheceu independência após retenção + transferência + prova externa');
 const qEasy={difficulty:'fácil',options:[1,2,3,4,5]},qMed={difficulty:'médio',options:[1,2,3,4,5]},qHard={difficulty:'difícil',options:[1,2,3,4,5]};
 const coherent=E.triEstimate([{q:qEasy,right:true},{q:qEasy,right:true},{q:qMed,right:true},{q:qHard,right:false},{q:qHard,right:false},{q:qMed,right:false}]);
 const incoherent=E.triEstimate([{q:qEasy,right:false},{q:qEasy,right:false},{q:qMed,right:false},{q:qHard,right:true},{q:qHard,right:true},{q:qMed,right:true}]);
 if(coherent.coherence<=incoherent.coherence)fail('teste TRI: padrão coerente não recebeu coerência maior');
}catch(e){fail(`engine.js falhou nos testes: ${e.message}`)}

if(!html.includes('engine.js'))fail('index não carrega engine.js');if(!html.includes('8.29'))fail('index não mostra 8.29');if(!sw.includes('engine.js')||!sw.includes('v8-29'))fail('service worker não foi atualizado para 8.29');
for(const w of warnings.slice(0,30))console.warn('AVISO:',w);if(warnings.length>30)console.warn(`AVISO: +${warnings.length-30} outros avisos`);

try{const cp=require('child_process'),r=cp.spawnSync(process.execPath,[path.join(root,'logic-test.js')],{encoding:'utf8'});if(r.status!==0)fail('logic-test.js: '+(r.stderr||r.stdout||'falhou').trim());else console.log((r.stdout||'').trim())}catch(e){fail(`não foi possível rodar logic-test.js: ${e.message}`)}

if(errors.length){for(const e of errors)console.error('ERRO:',e);process.exit(1)}console.log(`OK — ${warnings.length} aviso(s), 0 erro(s) crítico(s).`);
