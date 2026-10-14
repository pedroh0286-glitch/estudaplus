#!/usr/bin/env node
'use strict';
const fs=require('fs'),path=require('path'),http=require('http'),cp=require('child_process'),os=require('os');
const root=__dirname,HOLD_MS=180,TIMEOUT_MS=7000;
if(process.argv[2]==='--server'){
  const body=fs.readFileSync(path.join(root,'index.html'));
  const server=http.createServer((req,res)=>setTimeout(()=>{res.writeHead(200,{'Content-Type':'text/html','Content-Length':body.length,'Connection':'close'});res.end(body)},HOLD_MS));
  server.maxConnections=25000;server.listen(0,'127.0.0.1',511,()=>process.stdout.write(String(server.address().port)+'\n'));
  process.on('SIGTERM',()=>server.close(()=>process.exit(0)));return;
}
function round(port,n){return new Promise(resolve=>{let done=0,ok=0,fail=0,firstError=null,maxInFlight=0,inFlight=0;const started=Date.now();const finish=(success,err)=>{inFlight--;done++;if(success)ok++;else{fail++;if(!firstError)firstError=String(err?.code||err?.message||err||'erro')}if(done===n)resolve({concurrent:n,ok,fail,firstError,durationMs:Date.now()-started,maxInFlight})};for(let i=0;i<n;i++){let settled=false;try{inFlight++;maxInFlight=Math.max(maxInFlight,inFlight);const req=http.request({host:'127.0.0.1',port,path:'/index.html?i='+i,method:'GET',agent:false,headers:{Connection:'close'}},res=>{res.resume();res.on('end',()=>{if(settled)return;settled=true;finish(res.statusCode===200,res.statusCode===200?null:new Error('HTTP '+res.statusCode))})});req.setTimeout(TIMEOUT_MS,()=>req.destroy(Object.assign(new Error('timeout'),{code:'TIMEOUT'})));req.on('error',e=>{if(settled)return;settled=true;finish(false,e)});req.end()}catch(e){if(!settled){settled=true;finish(false,e)}}}})}
if(process.argv[2]==='--client'){
  const port=Number(process.argv[3]),n=Number(process.argv[4]);round(port,n).then(r=>{process.stdout.write(JSON.stringify(r)+'\n')}).catch(e=>{console.error(e);process.exit(1)});return;
}
function ulimit(){try{return Number(cp.execFileSync('bash',['-lc','ulimit -n'],{encoding:'utf8'}).trim())||null}catch{return null}}
function runClient(port,n){const txt=cp.execFileSync(process.execPath,[__filename,'--client',String(port),String(n)],{encoding:'utf8',timeout:30000,maxBuffer:1024*1024});return JSON.parse(txt.trim().split(/\r?\n/).pop())}
async function trial(n){
  const srv=cp.spawn(process.execPath,[__filename,'--server'],{stdio:['ignore','pipe','inherit']});let port='';
  try{for await(const c of srv.stdout){port+=c.toString();if(port.includes('\n'))break}port=Number(port.trim());if(!port)throw new Error('servidor de carga não iniciou');return runClient(port,n)}
  finally{srv.kill('SIGTERM')}
}
async function main(){const fd=ulimit();const candidates=[10000,16000,16350,16370].filter(n=>!fd||n<fd);const attempts=[];let maxZero=0,firstFail=null;
  for(const n of candidates){const r=await trial(n);attempts.push(r);console.log(JSON.stringify(r));if(r.fail===0)maxZero=n;else{firstFail=r;break}}
  const confirmations=[];if(maxZero){for(let i=0;i<2;i++){const r=await trial(maxZero);confirmations.push(r);console.log(JSON.stringify({confirmation:i+1,...r}))}}
  const stableMax=confirmations.length===2&&confirmations.every(r=>r.fail===0)?maxZero:0;
  const out={version:'9.0.9',environment:{cpus:os.cpus().length,totalMemoryBytes:os.totalmem(),fdSoftLimit:fd},holdMs:HOLD_MS,attempts,confirmations,maxZeroFailConcurrent:maxZero,maxStableConcurrent:stableMax,firstFailConcurrent:firstFail?.concurrent||null,firstFailCount:firstFail?.fail||0,firstFailReason:firstFail?.firstError||null,reachedEnvironmentCeiling:!!firstFail&&firstFail.firstError==='EMFILE',scope:'servidor HTTP local com arquivo pré-carregado; cada tentativa usa servidor e cliente novos. Mede o teto deste ambiente, não o limite contratado de Vercel/Supabase'};
  fs.writeFileSync(path.join(root,'load-static-max-909.json'),JSON.stringify(out,null,2));console.log(JSON.stringify(out,null,2));if(stableMax<10000)process.exit(1)}
main().catch(e=>{console.error(e);process.exit(1)});
