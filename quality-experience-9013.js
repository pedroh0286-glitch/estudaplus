#!/usr/bin/env node
'use strict';
const fs=require('fs'),path=require('path');const root=__dirname;
const need=['aeds-config.js','quality-engine.js','rastro4.js','experience-9012.js','control-intelligence-9013.js','question-pack-index.js','tutor-config.js','manifest.webmanifest','icons/aeds-192.png','icons/aeds-512.png'];
for(const f of need)if(!fs.existsSync(path.join(root,f)))throw new Error('ausente: '+f);
const html=fs.readFileSync(path.join(root,'index.html'),'utf8'),exp=fs.readFileSync(path.join(root,'experience-9012.js'),'utf8'),ctl=fs.readFileSync(path.join(root,'control-intelligence-9013.js'),'utf8'),app=fs.readFileSync(path.join(root,'app.js'),'utf8'),sw=fs.readFileSync(path.join(root,'sw.js'),'utf8');
for(const t of ['manifest.webmanifest','aeds-config.js','question-pack-index.js','quality-engine.js','rastro4.js','experience-9012.js','control-intelligence-9013.js'])if(!html.includes(t))throw new Error('index sem '+t);
for(const t of ['Mapa do Saber','Por que agora?','todayRecommendation','data-map-area'])if(!exp.includes(t))throw new Error('experiência base sem '+t);
for(const t of ['Central de questões','ÁRVORE DO SABER','MEMÓRIA INDIVIDUAL','Aula adaptativa','Reportar questão','Tutor AEDS'])if(!ctl.includes(t))throw new Error('experiência 9.0.13 sem '+t);
if(!app.includes('LEGACY_STORES')||!app.includes('LEGACY_CLOUD_SESSION_STORES'))throw new Error('migração de armazenamento legado ausente');
if(!sw.includes('aeds-v9-0-13-shell')||!sw.includes('aeds-v9-0-13-content')||!sw.includes('question-pack-index.js')||!sw.includes('manifest.webmanifest'))throw new Error('PWA/cache 9.0.13 incompleto');
console.log('OK experiência 9.0.13 — Hoje na AEDS, escolha de aula, Árvore do Saber, memória, Tutor, Central Admin e PWA presentes.');
