'use strict';
/* AEDS Sync Engine 1.0 — fila persistente, backoff e isolamento por usuário. */
window.AEDS_SYNC=(()=>{
  const VERSION='1.0';
  const POLICY={debounceMinMs:10000,jitterMaxMs:120000,minPushGapMs:60000,requestTimeoutMs:15000,backoffBaseMs:5000,backoffMaxMs:900000};
  const num=(x,d=0)=>Number.isFinite(Number(x))?Number(x):d;
  function normalize(m={}){return {pending:!!m.pending,dirtyVersion:Math.max(0,num(m.dirtyVersion)),syncedVersion:Math.max(0,num(m.syncedVersion)),lastSuccessAt:Math.max(0,num(m.lastSuccessAt)),lastAttemptAt:Math.max(0,num(m.lastAttemptAt)),nextRetryAt:Math.max(0,num(m.nextRetryAt)),failures:Math.max(0,num(m.failures)),waitForAuth:!!m.waitForAuth,lastStatus:m.lastStatus==null?null:num(m.lastStatus),lastError:String(m.lastError||'').slice(0,300)}}
  function markDirty(m,now=Date.now()){m=normalize(m);m.dirtyVersion++;m.pending=true;if(m.waitForAuth)m.lastError='aguardando autenticação para sincronizar';return m}
  function deterministicJitter(seed=''){let h=2166136261;for(const c of String(seed))h=Math.imul(h^c.charCodeAt(0),16777619)>>>0;return h%(POLICY.jitterMaxMs+1)}
  function nextDelay(m,{now=Date.now(),seed='',minDelay=POLICY.debounceMinMs}={}){m=normalize(m);if(!m.pending||m.waitForAuth)return null;const gap=m.lastAttemptAt>0?Math.max(0,(m.lastAttemptAt+POLICY.minPushGapMs)-now):0,retry=Math.max(0,m.nextRetryAt-now),j=deterministicJitter(`${seed}|${m.dirtyVersion}|${m.failures}`);return Math.max(gap,retry,minDelay+j)}
  function parseRetryAfter(value,now=Date.now()){if(value==null||value==='')return 0;const n=Number(value);if(Number.isFinite(n))return Math.max(0,n*1000);const t=Date.parse(value);return Number.isFinite(t)?Math.max(0,t-now):0}
  function failureDecision(status,retryAfterMs=0,failures=0){status=Number(status)||0;if(status===401||status===403)return {retry:false,pauseForAuth:true,delayMs:0};if(status===429)return {retry:true,pauseForAuth:false,delayMs:Math.max(retryAfterMs||0,Math.min(POLICY.backoffMaxMs,POLICY.backoffBaseMs*(2**Math.min(8,failures))))};if(status===0||status>=500)return {retry:true,pauseForAuth:false,delayMs:Math.max(retryAfterMs||0,Math.min(POLICY.backoffMaxMs,POLICY.backoffBaseMs*(2**Math.min(8,failures))))};return {retry:false,pauseForAuth:false,delayMs:0}}
  function markAttempt(m,now=Date.now()){m=normalize(m);m.lastAttemptAt=now;return m}
  function markSuccess(m,snapshotVersion,now=Date.now()){m=normalize(m);m.syncedVersion=Math.max(m.syncedVersion,num(snapshotVersion));m.lastSuccessAt=now;m.failures=0;m.nextRetryAt=0;m.waitForAuth=false;m.lastStatus=200;m.lastError='';m.pending=m.dirtyVersion>m.syncedVersion;return m}
  function markFailure(m,{status=0,retryAfterMs=0,error='',now=Date.now()}={}){m=normalize(m);m.failures++;m.lastStatus=Number(status)||0;m.lastError=String(error||'falha de sincronização').slice(0,300);const d=failureDecision(status,retryAfterMs,m.failures-1);if(d.pauseForAuth){m.waitForAuth=true;m.pending=true;m.nextRetryAt=0}else if(d.retry){m.pending=true;m.nextRetryAt=now+d.delayMs}else{m.pending=true;m.nextRetryAt=now+POLICY.backoffMaxMs}return {...m,decision:d}}
  function resumeAfterAuth(m){m=normalize(m);m.waitForAuth=false;m.nextRetryAt=0;return m}
  return {VERSION,POLICY,normalize,markDirty,deterministicJitter,nextDelay,parseRetryAfter,failureDecision,markAttempt,markSuccess,markFailure,resumeAfterAuth};
})();
