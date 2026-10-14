#!/usr/bin/env node
'use strict';
const fs=require('fs'),path=require('path'),zlib=require('zlib'),vm=require('vm'),cp=require('child_process');
const root=__dirname;
const fail=m=>{throw new Error(m)};
const SUBJECT_CODES={
  'Matemática':'01','Português':'02','Ciências':'03','História':'04','Geografia':'05','Inglês':'06',
  'Física':'07','Química':'08','Biologia':'09','Literatura':'10','Redação':'11','Filosofia':'12','Sociologia':'13',
  'Artes':'14','Educação Física':'15','Educação Financeira':'16','Computação':'17','Robótica':'18','Espanhol':'19',
  'Metodologia Científica':'20','Projeto de Vida':'21'
};
const GRADE_CODES={5:'01',6:'02',7:'03',8:'04',9:'05',10:'06',11:'07',12:'08'};
const required=['question-pack-index.js','admin-question-index-9013.js','control-intelligence-9013.js','tutor-config.js','api/tutor.js','supabase/functions/aeds-tutor/index.ts','supabase-aeds-9013.sql'];
for(const f of required)if(!fs.existsSync(path.join(root,f)))fail('arquivo 9.0.13 ausente: '+f);

// Índice modular explícito.
const ixCtx={window:{}};vm.createContext(ixCtx);vm.runInContext(fs.readFileSync(path.join(root,'question-pack-index.js'),'utf8'),ixCtx);
const packIndex=ixCtx.window.AEDS_PACK_INDEX||{};if(Object.keys(packIndex).length!==135)fail(`índice modular tem ${Object.keys(packIndex).length} pacotes; esperado 135`);
let total=0,active=0,classified=0;const codes=new Set(),ids=new Set();
for(const [key,meta] of Object.entries(packIndex)){
  const p=path.join(root,meta.src);if(!fs.existsSync(p))fail('pack index aponta para arquivo ausente: '+meta.src);
  const s=fs.readFileSync(p,'utf8'),m=s.match(/AEDS_PACK_PAYLOADS\["([^"]+)"\]='([^']+)'/);if(!m||m[1]!==key)fail('pack inválido/index divergente: '+key);
  const rows=JSON.parse(zlib.gunzipSync(Buffer.from(m[2],'base64')).toString());if(rows.length!==meta.count)fail(`${key}: count do índice ${meta.count} != ${rows.length}`);
  const sc=SUBJECT_CODES[meta.subject]||'99',gc=GRADE_CODES[Number(meta.grade)]||'99';
  rows.forEach((q,i)=>{
    total++;if(q.active!==false)active++;
    if(ids.has(q.id))fail('ID duplicado: '+q.id);ids.add(q.id);
    const expected=`${String(i+1).padStart(2,'0')}.${sc}.${gc}`;
    if(q.classification!==expected)fail(`${q.id}: classificação ${q.classification} != ${expected}`);
    if(!/^\d{2,}\.\d{2}\.\d{2}$/.test(q.classification))fail(`${q.id}: formato de classificação inválido`);
    if(codes.has(q.classification))fail('classificação duplicada: '+q.classification);codes.add(q.classification);classified++;
  });
}
if(total!==36783||active!==5140||classified!==36783)fail(`banco divergente: ${total} armazenadas, ${active} ativas, ${classified} classificadas`);
const m5=fs.readFileSync(path.join(root,packIndex['Matemática|5'].src),'utf8').match(/='([^']+)'/);const math5=JSON.parse(zlib.gunzipSync(Buffer.from(m5[1],'base64')).toString());if(math5[0]?.classification!=='01.01.01')fail('primeira questão de Matemática/5º não é 01.01.01');
// Índice administrativo leve: busca global sem descompactar os 135 pacotes no login.
const aidx=fs.readFileSync(path.join(root,'admin-question-index-9013.js'),'utf8').match(/='([^']+)'/);if(!aidx)fail('índice administrativo inválido');const adminRows=JSON.parse(zlib.gunzipSync(Buffer.from(aidx[1],'base64')).toString());if(adminRows.length!==36783)fail('índice administrativo incompleto');if(adminRows.filter(x=>x.active&&Array.isArray(x.review)&&x.review.length).reduce((n,x)=>n+x.review.length,0)!==243)fail('índice administrativo não preserva os 243 sinais do Quality 2.0');if(adminRows.find(x=>x.classification==='01.01.01')?.id!==math5[0].id)fail('busca administrativa 01.01.01 diverge do banco');

// Rastro 4.1: evidência observada vence autorrelato e apoio não vira domínio independente.
const rc={window:{}};vm.createContext(rc);vm.runInContext(fs.readFileSync(path.join(root,'rastro.js'),'utf8'),rc);vm.runInContext(fs.readFileSync(path.join(root,'rastro4.js'),'utf8'),rc);const R=rc.window.AEDS_RASTRO;
if(!R||R.VERSION!=='4.1'||R.CORE_VERSION!=='3.0')fail('Rastro 4.1 não carregou sobre núcleo 3.0');
const q={id:'T',subject:'Matemática',grade:5,area:'Frações',skill:'Comparar frações',difficulty:'médio'};
let x=R.classify({q,rec:{right:false,cdf:'D',cid:'Distracao'},context:{recentWrongSameSkill:3}});if(x.signal!=='conceito'||x.confidence<.8)fail('autorrelato venceu erros repetidos');
x=R.classify({q,rec:{right:false,cdf:'D',cid:'Interpretacao'},context:{wasDue:true,daysSinceLastCorrect:8}});if(x.signal!=='retencao')fail('retenção não venceu autorrelato');
x=R.classify({q,rec:{right:false,cdf:'D',cid:'Distracao'},context:{}});if(x.signal!=='atencao'||x.confidence>.60)fail('autorrelato de distração recebeu certeza excessiva');
x=R.classify({q,rec:{right:false,cdf:'D'},context:{thinking:{answerChanges:3,totalThinkingMs:30000}}});if(x.signal!=='procedimento')fail('telemetria de trocas não alimenta hipótese de procedimento');
x=R.classify({q,rec:{right:true,cdf:'C'},context:{thinking:{hintUsed:true}}});if(x.signal!=='incerteza')fail('acerto com dica foi tratado como independente');
x=R.classify({q,rec:{right:false,cdf:'D'},context:{tutorEvidence:{signals:['representacao']}}});if(x.signal!=='representacao')fail('evidência do Tutor não chegou ao Rastro');

const html=fs.readFileSync(path.join(root,'index.html'),'utf8'),sw=fs.readFileSync(path.join(root,'sw.js'),'utf8'),ctl=fs.readFileSync(path.join(root,'control-intelligence-9013.js'),'utf8'),loader=fs.readFileSync(path.join(root,'content-loader.js'),'utf8'),sql=fs.readFileSync(path.join(root,'supabase-aeds-9013.sql'),'utf8'),tutor=fs.readFileSync(path.join(root,'api/tutor.js'),'utf8'),edge=fs.readFileSync(path.join(root,'supabase/functions/aeds-tutor/index.ts'),'utf8'),tutorCfg=fs.readFileSync(path.join(root,'tutor-config.js'),'utf8');
for(const f of ['cloud-config.js','question-pack-index.js','tutor-config.js','control-intelligence-9013.js'])if(!html.includes(f))fail('index não carrega '+f);
if(html.indexOf('question-pack-index.js')>html.indexOf('content-loader.js'))fail('índice de pacotes carrega tarde demais');
if(!html.includes('9.0.13'))fail('index sem 9.0.13');
for(const t of ['aeds-v9-0-13-shell','aeds-v9-0-13-content','question-pack-index.js','control-intelligence-9013.js','admin-question-index-9013.js'])if(!sw.includes(t))fail('service worker 9.0.13 sem '+t);
if(!loader.includes("if(user.role==='admin')return [];"))fail('admin ainda tenta carregar todos os pacotes no login');
for(const t of ['questionRegistry','questionModeration','questionReports','Reportar questão','01.01.01','Aula normal','Aula adaptativa','adaptiveGuard','ÁRVORE DO SABER','MEMÓRIA INDIVIDUAL','Consolidação de memória','Curva do Esquecimento','Tutor AEDS','adminQuestionSearch','Quarentena','Marcar verificada','Desativar','firstChoiceLatencyMs','answerChanges','tutorEvidence','Usuários & Dados','Conteúdo avançado','ensureAdminQuestionIndex'])if(!ctl.includes(t))fail('Controle & Inteligência sem '+t);
for(const t of ['create table if not exists public.question_reports','create table if not exists public.question_moderation','enable row level security','aeds_question_reports_admin_update','aeds_question_moderation_admin_update'])if(!sql.toLowerCase().includes(t.toLowerCase()))fail('SQL 9.0.13 sem '+t);
if(tutor.includes('sk-'))fail('API Tutor contém possível chave embutida');
for(const t of ['OPENAI_API_KEY','/v1/responses','rastroSignals'])if(!tutor.includes(t))fail('Tutor API sem '+t);
if(edge.includes('sk-'))fail('Supabase Tutor contém possível chave embutida');
for(const t of ['OPENAI_API_KEY','/v1/responses','rastroSignals','Deno.serve','gpt-6-luna'])if(!edge.includes(t))fail('Supabase Tutor sem '+t);
for(const t of ['functions/v1/aeds-tutor','/api/tutor'])if(!tutorCfg.includes(t))fail('Configuração do Tutor sem fallback '+t);
for(const t of ['rastroManualReviewAdminHtml','retentionProof','transferProof','Estado do domínio'])if(!ctl.includes(t))fail('Admin Rastro observável sem '+t);
for(const f of ['question-pack-index.js','admin-question-index-9013.js','control-intelligence-9013.js','rastro.js','rastro4.js','tutor-config.js','api/tutor.js','sw.js']){const r=cp.spawnSync(process.execPath,['--check',path.join(root,f)],{encoding:'utf8'});if(r.status!==0)fail(`sintaxe ${f}: ${(r.stderr||r.stdout).trim()}`)}
console.log(`OK Controle & Inteligência 9.0.13 — ${total} classificadas; 135 pacotes indexados; denúncias/moderação; Rastro 4.1; memória; aula adaptativa protegida; Árvore do Saber; Tutor integrado.`);
