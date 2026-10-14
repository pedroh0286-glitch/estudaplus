const fs=require('fs'),path=require('path'),zlib=require('zlib'),vm=require('vm');
const dir=path.join(__dirname,'data','questions'); let errors=[];let totalNew=0;
function sim(a,b){const tok=s=>new Set((s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').match(/[a-z0-9]+/g)||[]).filter(x=>x.length>2));const A=tok(a),B=tok(b);let i=0;for(const x of A)if(B.has(x))i++;const u=new Set([...A,...B]).size;return u?i/u:0}
for(const file of fs.readdirSync(dir).filter(x=>x.endsWith('.js'))){
 const sandbox={window:{}};vm.createContext(sandbox);vm.runInContext(fs.readFileSync(path.join(dir,file),'utf8'),sandbox);
 const payloads=sandbox.window.AEDS_PACK_PAYLOADS||{}; const key=Object.keys(payloads)[0];
 const arr=JSON.parse(zlib.gunzipSync(Buffer.from(payloads[key],'base64')).toString()); const active=arr.filter(q=>q.active!==false);
 if(active.length<14) errors.push(`${key}: apenas ${active.length} questões ativas confiáveis`);
 const n=arr.filter(q=>q.editorial?.version==='9.0.2'); totalNew+=n.length;
 for(const q of n){if(!q.prompt||q.prompt.length<80) errors.push(`${q.id}: enunciado curto`); if(!q.explanation||q.explanation.length<80) errors.push(`${q.id}: explicação curta`); if(new Set(q.options||[]).size!==(q.options||[]).length) errors.push(`${q.id}: alternativas repetidas`); if(!q.family||!q.patternFamily) errors.push(`${q.id}: sem família/padrão`);}
 for(let i=0;i<n.length;i++)for(let j=i+1;j<n.length;j++){if(n[i].area===n[j].area&&sim(n[i].prompt,n[j].prompt)>=0.70) errors.push(`${key}: novas quase iguais ${n[i].id} / ${n[j].id}`)}
}
if(totalNew!==2346) errors.push(`esperava 2346 novas; encontrei ${totalNew}`);
console.log(`AEDS 9.0.2 cobertura: ${totalNew} novas famílias; ${errors.length} erro(s).`); if(errors.length){console.error(errors.slice(0,80).join('\n'));process.exit(1)}
