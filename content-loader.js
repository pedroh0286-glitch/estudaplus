'use strict';
/* AEDS 9.0.13 — carregador modular local-first e lazy-load por matéria/série. */
window.AEDS_CONTENT=(()=>{
  const loaded=new Set(), loading=new Map();
  const questions=[], qmap=new Map();
  let core=null;
  async function ungzipB64(b64){
    if(!b64)throw new Error('Pacote de conteúdo vazio.');
    const bin=atob(b64),bytes=new Uint8Array(bin.length);
    for(let i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);
    if('DecompressionStream' in window){
      const stream=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
      return JSON.parse(await new Response(stream).text());
    }
    throw new Error('Seu navegador precisa oferecer descompressão gzip moderna para abrir os pacotes locais.');
  }
  async function init(){
    if(core)return core;
    if(!window.AEDS_CORE_B64)throw new Error('content-core.js não encontrado.');
    core=await ungzipB64(window.AEDS_CORE_B64);
    return core;
  }
  function scriptLoad(src){return new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.async=true;s.onload=()=>resolve();s.onerror=()=>reject(new Error(`Não foi possível carregar ${src}`));document.head.appendChild(s)})}
  async function loadPack(key){
    if(loaded.has(key))return 0;
    if(loading.has(key))return loading.get(key);
    const meta=window.AEDS_PACK_INDEX?.[key];
    if(!meta)return 0;
    const p=(async()=>{
      if(!window.AEDS_PACK_PAYLOADS?.[key])await scriptLoad(meta.src);
      const rows=await ungzipB64(window.AEDS_PACK_PAYLOADS?.[key]);
      let n=0;
      for(let q of rows||[]){if(qmap.has(q.id))continue;if(window.AEDS_QUALITY?.prepare)q=window.AEDS_QUALITY.prepare(q);qmap.set(q.id,q);questions.push(q);n++}
      loaded.add(key);delete window.AEDS_PACK_PAYLOADS[key];
      return n;
    })().finally(()=>loading.delete(key));
    loading.set(key,p);return p;
  }
  function desiredKeys(user,history=[]){
    if(!user)return[];
    const set=new Set();
    // O Admin 9.0.13 usa um índice leve e carrega o pacote completo somente ao abrir uma questão.
    // Isso evita descompactar 36 mil questões no login administrativo.
    if(user.role==='admin')return [];
    const subjects=(user.unlockedSubjects||[]),currentGrade=Number(user.grade);
    // Escala 9.0.13: no login do aluno, carregar somente a série atual.
    // Outras séries são carregadas sob demanda quando o aluno realmente inicia o treino.
    for(const sub of subjects){const k=`${sub}|${currentGrade}`;if(window.AEDS_PACK_INDEX?.[k])set.add(k)}
    for(const h of (history||[]).slice(-80)){if(h?.subject&&h?.grade){const k=`${h.subject}|${Number(h.grade)}`;if(window.AEDS_PACK_INDEX?.[k])set.add(k)}}
    return [...set];
  }
  async function loadMany(keys,concurrency=8){
    keys=[...new Set(keys||[])];let next=0;
    async function worker(){while(next<keys.length){const i=next++;await loadPack(keys[i])}}
    await Promise.all(Array.from({length:Math.min(Math.max(1,concurrency),Math.max(1,keys.length))},worker));
    return questions.length;
  }
  async function ensureForUser(user,history=[]){const keys=desiredKeys(user,history);return loadMany(keys,user?.role==='admin'?10:5)}
  async function ensureSubjectGrade(subject,grade){return loadPack(`${subject}|${Number(grade)}`)}
  async function ensureAll(){return loadMany(Object.keys(window.AEDS_PACK_INDEX||{}),10)}
  function hasPack(key){return loaded.has(key)}
  function getQuestions(){return questions}
  function getById(id){return qmap.get(id)}
  function packKeysFor(user){return desiredKeys(user,[])}
  async function prefetchPack(key){
    const meta=window.AEDS_PACK_INDEX?.[key];if(!meta)throw new Error('Pacote não encontrado.');
    if(!('caches' in window)){await fetch(meta.src,{cache:'reload'});return true}
    const cache=await caches.open((window.AEDS_APP?.contentCache||'aeds-v9-0-13-content'));
    await cache.add(meta.src);return true;
  }
  async function removeOfflinePack(key){const meta=window.AEDS_PACK_INDEX?.[key];if(!meta||!('caches' in window))return false;const cache=await caches.open((window.AEDS_APP?.contentCache||'aeds-v9-0-13-content'));return cache.delete(meta.src)}
  async function offlineStatus(key){const meta=window.AEDS_PACK_INDEX?.[key];if(!meta||!('caches' in window))return false;const cache=await caches.open((window.AEDS_APP?.contentCache||'aeds-v9-0-13-content'));return !!(await cache.match(meta.src))}
  function stats(){const all=Object.values(window.AEDS_PACK_INDEX||{});return {loadedPacks:loaded.size,totalPacks:all.length,loadedQuestions:questions.length,totalQuestions:all.reduce((n,x)=>n+(x.count||0),0)}}
  return {VERSION:(window.AEDS_APP?.version||'9.0.13'),init,loadPack,loadMany,ensureForUser,ensureSubjectGrade,ensureAll,getQuestions,getById,hasPack,packKeysFor,prefetchPack,removeOfflinePack,offlineStatus,stats};
})();
