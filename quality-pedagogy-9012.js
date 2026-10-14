#!/usr/bin/env node
'use strict';
const fs=require('fs'),path=require('path'),zlib=require('zlib'),vm=require('vm');
const root=__dirname,ctx={window:{}};vm.createContext(ctx);vm.runInContext(fs.readFileSync(path.join(root,'quality-engine.js'),'utf8'),ctx);const Q=ctx.window.AEDS_QUALITY;if(!Q)throw new Error('Quality 2.0 não carregou');
const files=fs.readdirSync(path.join(root,'data/questions')).filter(x=>x.endsWith('.js')),rows=[];for(const f of files){const s=fs.readFileSync(path.join(root,'data/questions',f),'utf8'),m=s.match(/='([^']+)';?\s*$/);if(!m)throw new Error('pack inválido '+f);rows.push(...JSON.parse(zlib.gunzipSync(Buffer.from(m[1],'base64')).toString()))}
let active=0,hard=0,warnings=0,placeholder=0;const warningTypes={};for(const q of rows){if(q.active===false)continue;active++;const r=Q.inspect(q);hard+=r.hard.length;warnings+=r.review.length;for(const x of r.review)warningTypes[x]=(warningTypes[x]||0)+1;if((q.options||[]).some(o=>/alternativa de compara[cç][aã]o|placeholder|lorem ipsum/i.test(String(o))))placeholder++}
if(hard)throw new Error(`há ${hard} bloqueios objetivos em questões ativas`);if(placeholder)throw new Error(`há ${placeholder} questões ativas com placeholder`);
const out={version:'9.0.12',quality:'2.0',stored:rows.length,active,hardErrors:hard,reviewWarnings:warnings,warningTypes};fs.writeFileSync(path.join(root,'quality-pedagogy-9012.json'),JSON.stringify(out,null,2));console.log(`OK Quality 2.0 — ${active} ativas, 0 bloqueios objetivos, ${warnings} sinais para revisão humana, 0 placeholders visíveis.`);
