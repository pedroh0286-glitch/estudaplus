#!/usr/bin/env node
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const root=__dirname,errors=[],warnings=[];const fail=x=>errors.push(x),warn=x=>warnings.push(x);
const files=['cs-foundations.js','source/ciencia-computacao-do-zero-aos-fundamentos.txt','app.js','index.html','sw.js','styles.css'];
for(const f of files)if(!fs.existsSync(path.join(root,f)))fail('arquivo ausente: '+f);
let d=null;
if(fs.existsSync(path.join(root,'cs-foundations.js'))){try{const ctx={window:{}};vm.createContext(ctx);vm.runInContext(fs.readFileSync(path.join(root,'cs-foundations.js'),'utf8'),ctx);d=ctx.window.AEDS_CS_FOUNDATIONS}catch(e){fail('cs-foundations.js inválido: '+e.message)}}
if(d){
 const source=fs.readFileSync(path.join(root,'source/ciencia-computacao-do-zero-aos-fundamentos.txt'),'utf8');
 if(d.sourceText.replace(/\r\n/g,'\n')!==source.replace(/\r\n/g,'\n'))fail('texto integral da trilha não é idêntico ao arquivo-fonte autoral');
 const lines=source.split(/\r?\n/).length;if(Number(d.sourceLines)!==lines)fail(`sourceLines=${d.sourceLines}; arquivo possui ${lines}`);
 if(d.modules?.length!==8)fail(`módulos=${d.modules?.length}; esperado 8`);
 if(d.cases?.length!==2)fail(`casos=${d.cases?.length}; esperado 2 presentes no arquivo`);
 if(d.labs?.length!==1)fail(`laboratórios=${d.labs?.length}; esperado 1 presente no arquivo`);
 if(d.projects?.length!==7)fail(`projetos=${d.projects?.length}; esperado 7`);
 if(d.glossary?.length!==56)fail(`glossário=${d.glossary?.length}; esperado 56 termos extraídos`);
 if(d.references?.length!==10)fail(`referências=${d.references?.length}; esperado 10`);
 if(d.finalChecklist?.length!==7)fail(`checklist final=${d.finalChecklist?.length}; esperado 7`);
 const unique=(arr,key)=>new Set(arr.map(x=>x[key])).size===arr.length;
 if(!unique(d.modules,'id'))fail('IDs de módulos duplicados');if(!unique(d.projects,'id'))fail('IDs de projetos duplicados');
 if(new Set(d.glossary.map(x=>x.term.toLowerCase())).size!==d.glossary.length)fail('termos duplicados no glossário');
 for(const token of ['Programação é conhecimento executável.','ESTUDO DE CASO 1 - A BUSCA QUE FICOU LENTA','ESTUDO DE CASO 4 - A API QUE DUPLICA PEDIDOS','LABORATÓRIO 6 - HTTP, DNS E UMA API PEQUENA','Projeto 7 - Serviço distribuído','Se P = NP continua','Portfólio demonstra capacidade'])if(!source.includes(token))fail('fonte autoral sem trecho crítico: '+token);
 for(const m of d.modules||[]){if(!m.title||!m.subtitle||!m.source)fail(`módulo ${m.id} incompleto`);if(!Array.isArray(m.concepts)||m.concepts.length<3)fail(`módulo ${m.id} com poucos conceitos`);if(!Array.isArray(m.practice)||m.practice.length<3)fail(`módulo ${m.id} com pouca prática`);if(!m.independence)fail(`módulo ${m.id} sem critério de independência`)}
}
const app=fs.existsSync(path.join(root,'app.js'))?fs.readFileSync(path.join(root,'app.js'),'utf8'):'';
const html=fs.existsSync(path.join(root,'index.html'))?fs.readFileSync(path.join(root,'index.html'),'utf8'):'';
const sw=fs.existsSync(path.join(root,'sw.js'))?fs.readFileSync(path.join(root,'sw.js'),'utf8'):'';
const css=fs.existsSync(path.join(root,'styles.css'))?fs.readFileSync(path.join(root,'styles.css'),'utf8'):'';
if(!/^<!doctype html>/i.test(html.trim()))fail('index.html não começa como HTML válido');if(!/<html[\s>]/i.test(html)||!/<\/html>/i.test(html))fail('index.html sem estrutura HTML completa');if(/self\.addEventListener\(['"]install/.test(html))fail('index.html contém código de Service Worker — provável sobrescrita de arquivo');
for(const t of ['cs-foundations.js'])if(!html.includes(t))fail('index.html sem '+t);
for(const t of ['cs-foundations.js'])if(!sw.includes(t))fail('sw.js sem '+t);
for(const t of ['csFoundationView','csNotebook','csCompleteModule','cs-project-done','fundamentos_cs','Livro completo'])if(!app.includes(t))fail('app.js sem integração: '+t);
for(const t of ['cs-mode-switch','cs-cycle','cs-glossary','cs-full-book'])if(!css.includes(t))fail('styles.css sem '+t);
if(errors.length){errors.forEach(e=>console.error('ERRO:',e));process.exit(1)}
warnings.forEach(w=>console.warn('AVISO:',w));
console.log(`OK Computação 9.0.6 — ${d.modules.length} módulos, ${d.cases.length} casos, ${d.labs.length} laboratório, ${d.projects.length} projetos, ${d.glossary.length} termos e texto autoral integral preservado (${d.sourceLines} linhas).`);
