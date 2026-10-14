#!/usr/bin/env node
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');const root=__dirname,c={window:{}};vm.createContext(c);vm.runInContext(fs.readFileSync(path.join(root,'rastro.js'),'utf8'),c);vm.runInContext(fs.readFileSync(path.join(root,'rastro4.js'),'utf8'),c);const R=c.window.AEDS_RASTRO;if(!R||R.VERSION!=='4.0'||R.CORE_VERSION!=='3.0')throw new Error('Rastro 4 não carregou sobre o núcleo 3.0');
const q={id:'t',subject:'Matemática',grade:7,area:'Frações',skill:'Comparar frações',difficulty:'médio'};
let x=R.classify({q,rec:{right:false,cdf:'D',cid:'Distracao'},context:{recentWrongSameSkill:3}});if(x.signal!=='conceito')throw new Error('autorrelato de distração venceu evidência repetida');
x=R.classify({q,rec:{right:false,cdf:'D',cid:'Interpretacao'},context:{wasDue:true,daysSinceLastCorrect:8}});if(x.signal!=='retencao')throw new Error('autorrelato de interpretação venceu evidência de retenção');
x=R.classify({q,rec:{right:false,cdf:'D',cid:'Conteudo'},context:{priorCorrect:2}});if(x.signal!=='procedimento')throw new Error('Rastro não testou procedimento após acertos prévios');
x=R.classify({q,rec:{right:true,cdf:'C',cid:null},context:{}});if(x.signal!=='estavel')throw new Error('acerto confiante deixou de funcionar');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8'),app=fs.readFileSync(path.join(root,'app.js'),'utf8');if(!html.includes('rastro4.js'))throw new Error('index não carrega Rastro 4');if(!app.includes('Rastro 4.0'))throw new Error('interface ainda identifica Rastro antigo');console.log('OK Rastro 4.0 — autorrelato virou hipótese auxiliar e evidência observada tem prioridade.');
