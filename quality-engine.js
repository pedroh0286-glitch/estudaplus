'use strict';
/* AEDS Quality 2.0 — filtro pedagógico em tempo de execução.
   Bloqueia somente falhas objetivas. Sinais pedagógicos mais subjetivos vão para revisão, não para exclusão automática. */
window.AEDS_QUALITY=(()=>{
  const VERSION='2.0';
  const counters={inspected:0,quarantined:0,warnings:0,hardFlags:{},reviewFlags:{}};const flagged=[];
  const placeholder=/alternativa de compara[cç][aã]o|placeholder|lorem ipsum|op[cç][aã]o tempor[aá]ria/i;
  const metaOption=/^(alternativa|op[cç][aã]o)\s+[a-f0-9]+\b/i;
  const norm=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
  const words=v=>new Set(norm(v).replace(/[^a-z0-9 ]/g,' ').split(/\s+/).filter(x=>x.length>=5&&!['sobre','entre','depois','antes','qual','como','quando','onde','porque','apenas','correta','incorreta'].includes(x)));
  const bump=(bucket,k)=>bucket[k]=(bucket[k]||0)+1;
  function inspect(q){
    const hard=[],review=[];
    if(!q||typeof q!=='object')return {hard:['registro_invalido'],review:[],score:0};
    if(String(q.prompt||'').trim().length<8)hard.push('enunciado_curto_ou_vazio');
    if(q.questionType==='multiple_choice'){
      const opts=Array.isArray(q.options)?q.options:[];
      if(opts.length<3)hard.push('poucas_alternativas');
      if(opts.some(o=>!String(o||'').trim()))hard.push('alternativa_vazia');
      if(opts.some(o=>placeholder.test(String(o))))hard.push('placeholder_visivel');
      const ns=opts.map(norm);if(new Set(ns).size!==ns.length)hard.push('alternativas_duplicadas');
      const ci=Number(q.correctIndex);
      if(!Number.isInteger(ci)||ci<0||ci>=opts.length)hard.push('gabarito_fora_da_faixa');
      else if(q.correctText&&norm(q.correctText)!==norm(opts[ci]))hard.push('texto_do_gabarito_inconsistente');
      if(opts.some(o=>metaOption.test(String(o))))review.push('alternativa_meta_generica');
      if(opts.some(o=>/todas as anteriores|nenhuma das anteriores/i.test(String(o))))review.push('alternativa_todas_ou_nenhuma');
      if(Number.isInteger(ci)&&opts[ci]){
        const target=words(`${q.area||''} ${q.skill||''} ${q.prompt||''}`),cw=words(opts[ci]);
        let hit=0;for(const w of cw)if(target.has(w))hit++;
        const wrong=opts.filter((_,i)=>i!==ci).map(o=>{let n=0;for(const w of words(o))if(target.has(w))n++;return n});
        if(hit>=3&&wrong.length&&wrong.every(n=>n===0))review.push('gabarito_lexicalmente_denunciado');
      }
    }
    if(String(q.explanation||'').trim().length<20)review.push('explicacao_curta');
    if(/a explica[cç][aã]o central [ée]:/i.test(String(q.explanation||''))&&(!Array.isArray(q.explanationSteps)||q.explanationSteps.length<3))review.push('explicacao_formulaica');
    return {hard:[...new Set(hard)],review:[...new Set(review)],score:Math.max(0,100-hard.length*40-review.length*8)};
  }
  function prepare(q){
    counters.inspected++;
    const r=inspect(q);q.qualityRuntime={version:VERSION,score:r.score,hard:r.hard,review:r.review};
    for(const x of r.hard)bump(counters.hardFlags,x);for(const x of r.review)bump(counters.reviewFlags,x);
    counters.warnings+=r.review.length;if((r.hard.length||r.review.length)&&flagged.length<1000)flagged.push({id:q.id,subject:q.subject,grade:q.grade,area:q.area,skill:q.skill,hard:r.hard,review:r.review});
    if(q.active!==false&&r.hard.length){q.active=false;q.qualityRuntime.quarantined=true;counters.quarantined++}
    return q;
  }
  function stats(){return JSON.parse(JSON.stringify(counters))}
  function reviewQueue(limit=100){return flagged.slice(0,Math.max(0,Number(limit)||0)).map(x=>({...x,hard:[...x.hard],review:[...x.review]}))}
  return {VERSION,inspect,prepare,stats,reviewQueue};
})();
