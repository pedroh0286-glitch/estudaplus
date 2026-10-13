'use strict';
/* AEDS 9.0 — carregador modular de conteúdo por matéria e série. */
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
      for(const q of rows||[]){if(qmap.has(q.id))continue;qmap.set(q.id,q);questions.push(q);n++}
      loaded.add(key);delete window.AEDS_PACK_PAYLOADS[key];
      return n;
    })().finally(()=>loading.delete(key));
    loading.set(key,p);return p;
  }
  function desiredKeys(user,history=[]){
    if(!user)return[];
    const set=new Set();
    if(user.role==='admin')return Object.keys(window.AEDS_PACK_INDEX||{});
    const subjects=(user.unlockedSubjects||[]),grades=(user.unlockedGrades||[user.grade]).map(Number);
    for(const s of subjects)for(const g of grades){const k=`${s}|${g}`;if(window.AEDS_PACK_INDEX?.[k])set.add(k)}
    for(const h of history||[]){if(h?.subject&&h?.grade){const k=`${h.subject}|${Number(h.grade)}`;if(window.AEDS_PACK_INDEX?.[k])set.add(k)}}
    return [...set];
  }
  async function ensureForUser(user,history=[]){const keys=desiredKeys(user,history);for(const key of keys)await loadPack(key);return questions.length}
  async function ensureSubjectGrade(subject,grade){return loadPack(`${subject}|${Number(grade)}`)}
  async function ensureAll(){for(const key of Object.keys(window.AEDS_PACK_INDEX||{}))await loadPack(key);return questions.length}
  function hasPack(key){return loaded.has(key)}
  function getQuestions(){return questions}
  function getById(id){return qmap.get(id)}
  function packKeysFor(user){return desiredKeys(user,[])}
  async function prefetchPack(key){
    const meta=window.AEDS_PACK_INDEX?.[key];if(!meta)throw new Error('Pacote não encontrado.');
    if(!('caches' in window)){await fetch(meta.src,{cache:'reload'});return true}
    const cache=await caches.open('aeds-v9-0-1-content');
    await cache.add(meta.src);return true;
  }
  async function removeOfflinePack(key){const meta=window.AEDS_PACK_INDEX?.[key];if(!meta||!('caches' in window))return false;const cache=await caches.open('aeds-v9-0-1-content');return cache.delete(meta.src)}
  async function offlineStatus(key){const meta=window.AEDS_PACK_INDEX?.[key];if(!meta||!('caches' in window))return false;const cache=await caches.open('aeds-v9-0-1-content');return !!(await cache.match(meta.src))}
  function stats(){const all=Object.values(window.AEDS_PACK_INDEX||{});return {loadedPacks:loaded.size,totalPacks:all.length,loadedQuestions:questions.length,totalQuestions:all.reduce((n,x)=>n+(x.count||0),0)}}
  return {VERSION:'9.0',init,loadPack,ensureForUser,ensureSubjectGrade,ensureAll,getQuestions,getById,hasPack,packKeysFor,prefetchPack,removeOfflinePack,offlineStatus,stats};
})();
