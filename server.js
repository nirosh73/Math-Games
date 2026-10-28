const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const {worksheet, percentages} = require('./public/questions');
const ROOT = path.join(__dirname, 'public');
const DATA = process.env.RESULTS_DIR || path.join(__dirname, 'results');
const LIMIT = 256 * 1024;
const locks = new Map();
const headers = {'X-Content-Type-Options':'nosniff', 'Cache-Control':'no-store'};
function json(res, code, data) {res.writeHead(code, {...headers,'Content-Type':'application/json'});res.end(JSON.stringify(data));}
async function body(req) {let chunks=[],size=0; for await (const chunk of req) {size+=chunk.length;if(size>LIMIT) throw Error('Request too large');chunks.push(chunk);}return JSON.parse(Buffer.concat(chunks).toString());}
function safeName(name) {return name.normalize('NFKD').replace(/[^a-zA-Z0-9_-]/g,'_').slice(0,40)||'player';}
function filename(run) {return `${safeName(run.player)}_${run.startedAt.replace(/[:.]/g,'-')}_${run.id}.json`;}
async function save(run) {run.summary={solved:run.questions.filter(q=>q.solved).length,totalAttempts:run.questions.reduce((n,q)=>n+q.attempts.length,0),problemsWithMistakes:run.questions.filter(q=>q.attempts.some(a=>!a.correct)).map(q=>({questionId:q.id,fraction:`${q.n}/${q.d}`,slices:q.slices,wrongAttempts:q.attempts.filter(a=>!a.correct).length,attemptsNeededToGetRight:q.solved?q.attempts.length:null}))};await fs.mkdir(DATA,{recursive:true});const file=path.join(DATA,filename(run));const tmp=file+'.tmp';await fs.writeFile(tmp,JSON.stringify(run,null,2));await fs.rename(tmp,file);}
async function readRun(id) {if(!/^[0-9a-f-]{36}$/.test(id)) throw Error('Invalid run');const files=await fs.readdir(DATA);const file=files.find(f=>f.endsWith(`_${id}.json`));if(!file)throw Error('Run not found');return JSON.parse(await fs.readFile(path.join(DATA,file),'utf8'));}
function publicRun(run) {return {...run,filename:filename(run)};}
function sequence(mode) {return mode==='percentages'?percentages:worksheet;}
async function createRun(input) {
 const player=String(input.player||'').trim();if(!player||player.length>32)throw Error('Enter a name of 1–32 characters');
 if(!['worksheet','percentages'].includes(input.mode))throw Error('Choose a valid adventure');
 const run={version:1,id:crypto.randomUUID(),player,mode:input.mode,startedAt:new Date().toISOString(),completedAt:null,currentIndex:0,score:0,questions:sequence(input.mode).map(q=>({...q,target:q.n*q.slices/q.d,attempts:[],solved:false}))};
 await save(run);return run;
}
async function updateRun(id,input) {
 const run=await readRun(id);const q=run.questions[run.currentIndex];
 if(input.action==='attempt') {
  if(!q||q.solved)throw Error('This question is already solved');
  if(input.questionId!==q.id)throw Error('Question changed; reload the run');
  if(!Array.isArray(input.selected)||input.selected.length>q.slices||input.selected.some(i=>!Number.isInteger(i)||i<0||i>=q.slices)||new Set(input.selected).size!==input.selected.length)throw Error('Invalid shaded segments');
  const correct=input.selected.length*q.d===q.n*q.slices;
  q.attempts.push({at:new Date().toISOString(),selected:input.selected,shaded:input.selected.length,correct});q.solved=correct;
  if(correct)run.score+=Math.max(20,100-(q.attempts.length-1)*20);
 } else if(input.action==='next') {
  if(!q?.solved)throw Error('Solve this question first');
  if(run.currentIndex<run.questions.length-1)run.currentIndex++;
  else run.completedAt ||= new Date().toISOString();
 } else throw Error('Unknown action');
 await save(run);return run;
}
const server=http.createServer(async(req,res)=>{
 try {
  const url=new URL(req.url,'http://localhost');const route=url.pathname;
  if(req.method==='POST'&&route==='/api/runs')return json(res,201,publicRun(await createRun(await body(req))));
  const match=route.match(/^\/api\/runs\/([0-9a-f-]{36})(\/download)?$/);
  if(match) {
   const id=match[1];
   if(req.method==='POST'&&!match[2]) {
    const input=await body(req);const prior=locks.get(id)||Promise.resolve();const operation=prior.catch(()=>{}).then(()=>updateRun(id,input));locks.set(id,operation);
    try {return json(res,200,publicRun(await operation));} finally {if(locks.get(id)===operation)locks.delete(id);}
   }
   if(req.method==='GET') {const run=await readRun(id);if(match[2]){res.writeHead(200,{...headers,'Content-Type':'application/json','Content-Disposition':`attachment; filename="${filename(run)}"`});return res.end(JSON.stringify(run,null,2));}return json(res,200,publicRun(run));}
  }
  if(req.method==='GET'&&route==='/api/leaderboard') {
   await fs.mkdir(DATA,{recursive:true});const files=(await fs.readdir(DATA)).filter(f=>f.endsWith('.json'));
   const runs=await Promise.all(files.map(async f=>{try{return JSON.parse(await fs.readFile(path.join(DATA,f),'utf8'));}catch{return null;}}));
   return json(res,200,runs.filter(r=>r?.completedAt).sort((a,b)=>b.score-a.score).slice(0,20).map(r=>({player:r.player,score:r.score,mode:r.mode,completedAt:r.completedAt,firstTry:r.questions.filter(q=>q.attempts.length===1).length,total:r.questions.length})));
  }
  if(req.method!=='GET')return json(res,404,{error:'Not found'});
  const files={'/':'index.html','/app.js':'app.js','/styles.css':'styles.css','/questions.js':'questions.js'};
  const file=files[route];if(!file)return json(res,404,{error:'Not found'});
  const data=await fs.readFile(path.join(ROOT,file));res.writeHead(200,{...headers,'Content-Type':file.endsWith('.html')?'text/html; charset=utf-8':file.endsWith('.css')?'text/css':'text/javascript'});res.end(data);
 }catch(error){json(res,400,{error:error.message});}
});
if(require.main===module)server.listen(Number(process.env.PORT)||3000,'0.0.0.0',()=>console.log('Slice Quest listening on port '+(process.env.PORT||3000)));
module.exports={server};
