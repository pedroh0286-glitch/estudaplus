'use strict';
const fs=require('fs'),vm=require('vm'),zlib=require('zlib');
const path=require('path');const root=__dirname;
const ctx={console,Buffer,setTimeout:()=>0,clearTimeout:()=>{},Date,Math,JSON,Uint8Array,WeakMap,Map,Set,Blob:global.Blob,Response:global.Response,atob:s=>Buffer.from(s,'base64').toString('binary'),btoa:s=>Buffer.from(s,'binary').toString('base64'),alert:(x)=>{throw new Error('ALERT:'+x)},confirm:()=>true,fetch:()=>Promise.reject(new Error('offline')),location:{protocol:'file:'},navigator:{},localStorage:{m:new Map(),getItem(k){return this.m.get(k)||null},setItem(k,v){this.m.set(k,v)}},document:{querySelector:()=>null,querySelectorAll:()=>[],documentElement:{style:{}},body:{classList:{toggle(){}}},addEventListener(){},createElement(){return {click(){},style:{}}}},window:null};
ctx.window=ctx;ctx.window.ESTUDA_CLOUD={enabled:false};vm.createContext(ctx);
vm.runInContext(fs.readFileSync(root+'/engine.js','utf8'),ctx,{filename:'engine.js'});
let app=fs.readFileSync(root+'/app.js','utf8').replace(/decodeData\(\)\.catch\([\s\S]*$/,'');
const bankSrc=fs.readFileSync(root+'/bank-data.js','utf8'),m=bankSrc.match(/ESTUDAPLUS_BANK_B64='([^']+)'/),data=JSON.parse(zlib.gunzipSync(Buffer.from(m[1],'base64')).toString());
app += `\nDATA=${JSON.stringify({})};BANK=__DATA.questions;CREDITS=__DATA.credits;LEARNING=__DATA.learning;LEARNING_BY_GRADE=__DATA.learningByGrade||{};PROGRAMMING=__DATA.programming;MANIFEST=__DATA.manifest;PREREQ=__DATA.prerequisites;MATH_CURRICULUM=__DATA.mathCurriculum||{};PORT_CURRICULUM=__DATA.portugueseCurriculum||{};FOCUS_CURRICULUM=__DATA.focusCurriculum||{};ESSAY_REPERTOIRE=__DATA.essayRepertoire||{};QMAP=new Map(BANK.map(q=>[q.id,q]));CREDIT_MAP=new Map(CREDITS.map(c=>[c.id,c]));state=defaults();state.currentUser='aluno1';normalize();state.users.find(u=>u.id==='aluno1').unlockedGrades=[5,6,7,8,9,10,11,12];state.users.find(u=>u.id==='aluno1').unlockedSubjects=Object.keys(MANIFEST.subjects);render=()=>{};cloudSaveSoon=()=>{};\n`;
ctx.__DATA=data;vm.runInContext(app,ctx,{filename:'app.js'});
function evalx(s){return vm.runInContext(s,ctx)}
const plan=evalx("smartPlan('study',7).map(x=>({id:x.q.id,root:x.q.rootFamily||x.q.family,pat:promptPattern(x.q),ans:x.q.correctText,prompt:x.q.prompt}))");
if(!plan.length)throw new Error('smartPlan vazio');
if(new Set(plan.map(x=>x.root)).size!==plan.length)throw new Error('smartPlan repetiu família');
if(new Set(plan.map(x=>x.pat)).size!==plan.length)throw new Error('smartPlan repetiu padrão');
if(new Set(plan.map(x=>x.ans)).size!==plan.length)throw new Error('smartPlan repetiu resposta correta');
for(let i=0;i<plan.length;i++)for(let j=i+1;j<plan.length;j++){ctx.__A=plan[i].prompt;ctx.__B=plan[j].prompt;if(evalx('promptSimilarity(__A,__B)')>=.70)throw new Error('smartPlan gerou questões parecidas demais')}
evalx('newExam(1)');const ex1=evalx('ui.exam');if(!ex1||ex1.questions.length<1||ex1.questions.length>90)throw new Error('Dia 1 inválido');ctx.__IDS=ex1.questions;const areas1=evalx('[...new Set(__IDS.map(id=>examArea(qById(id).subject)))]');if(areas1.some(x=>!['Linguagens','Ciências Humanas'].includes(x)))throw new Error('Dia 1 contém área errada: '+areas1);
evalx('ui.exam=null;newExam(2)');const ex2=evalx('ui.exam');if(!ex2||ex2.questions.length<1||ex2.questions.length>90)throw new Error('Dia 2 inválido');ctx.__IDS=ex2.questions;const areas2=evalx('[...new Set(__IDS.map(id=>examArea(qById(id).subject)))]');if(areas2.some(x=>!['Ciências da Natureza','Matemática'].includes(x)))throw new Error('Dia 2 contém área errada: '+areas2);
console.log('OK runtime lógico — sessão',plan.length,'itens; dia1',ex1.questions.length,areas1,'; dia2',ex2.questions.length,areas2);
