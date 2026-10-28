const {test,before,after}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const os=require('node:os');
const path=require('node:path');
const {generateQuestions}=require('../public/questions');
let server,base,dir;
before(async()=>{
  dir=await fs.mkdtemp(path.join(os.tmpdir(),'slice-test-'));
  process.env.RESULTS_DIR=dir;
  ({server}=require('../server'));
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  base=`http://127.0.0.1:${server.address().port}`;
});
after(async()=>{await new Promise(r=>server.close(r));await fs.rm(dir,{recursive:true,force:true});});
async function request(route,input){
  const res=await fetch(base+route,{method:input?'POST':'GET',headers:{'Content-Type':'application/json'},body:input?JSON.stringify(input):undefined});
  return {status:res.status,data:await res.json()};
}
function answer(q){return Array.from({length:q.target},(_,i)=>i);}
const gcd=(a,b)=>b?gcd(b,a%b):a;
test('generated sets have attainable, distinct fractions and vary across runs',()=>{
  for(const mode of ['worksheet','percentages']){
    const sets=new Set();
    for(let run=0;run<20;run++){
      const questions=generateQuestions(mode);
      assert.equal(questions.length,mode==='worksheet'?20:8);
      assert.equal(new Set(questions.map(q=>q.id)).size,questions.length);
      const values=new Set();
      for(const q of questions){
        assert.ok(q.n>0&&q.n<=q.d);
        assert.ok(Number.isInteger(q.n*q.slices/q.d));
        assert.ok(q.slices>=2&&q.slices<=(mode==='worksheet'?32:100));
        const factor=gcd(q.n,q.d);values.add(`${q.n/factor}/${q.d/factor}`);
        if(mode==='percentages')assert.equal(q.slices,100);
      }
      assert.equal(values.size,questions.length);
      sets.add(JSON.stringify(questions));
    }
    assert.equal(sets.size,20);
  }
});
test('records mistakes, blocks skipping and persists the exact generated set',async()=>{
  let {data:r}=await request('/api/runs',{player:'Ada Test',mode:'worksheet'});
  const route='/api/runs/'+r.id,original=r.questions.map(({n,d,slices})=>({n,d,slices}));
  assert.match(r.filename,/Ada_Test_.*\.json$/);
  assert.equal((await request(route,{action:'next'})).status,400);
  ({data:r}=await request(route,{action:'attempt',questionId:r.questions[0].id,selected:[]}));
  assert.equal(r.questions[0].attempts[0].correct,false);
  assert.equal(r.currentIndex,0);
  assert.equal((await request(route,{action:'next'})).status,400);
  ({data:r}=await request(route,{action:'attempt',questionId:r.questions[0].id,selected:answer(r.questions[0])}));
  assert.equal(r.questions[0].solved,true);
  assert.equal(r.score,80);
  assert.equal(r.summary.problemsWithMistakes[0].attemptsNeededToGetRight,2);
  assert.equal(r.summary.problemsWithMistakes[0].wrongAttempts,1);
  assert.equal(r.questions[0].targetPercent,r.questions[0].n/r.questions[0].d*100);
  assert.equal(r.questions[0].attempts[1].shadedPercent,r.questions[0].target/r.questions[0].slices*100);
  assert.equal((await request(route,{action:'attempt',questionId:r.questions[0].id,selected:answer(r.questions[0])})).status,400);
  assert.equal((await request(route,{action:'next',questionId:'stale-question'})).status,400);
  ({data:r}=await request(route,{action:'next',questionId:r.questions[0].id}));
  assert.equal(r.currentIndex,1);
  const {data:resumed}=await request(route);
  assert.deepEqual(resumed.questions.map(({n,d,slices})=>({n,d,slices})),original);
  const downloaded=await fetch(base+route+'/download');
  assert.match(downloaded.headers.get('content-disposition'),/Ada_Test/);
  assert.equal((await downloaded.json()).questions[0].attempts.length,2);
  assert.ok((await fs.readdir(dir)).includes(r.filename));
});
test('validates segment indices and duplicate selections',async()=>{
  const {data:r}=await request('/api/runs',{player:'Bob',mode:'worksheet'});
  for(const selected of [[1,1],[-1],[r.questions[0].slices],[1.5]]){
    assert.equal((await request('/api/runs/'+r.id,{action:'attempt',questionId:r.questions[0].id,selected})).status,400);
  }
});
for(const mode of ['worksheet','percentages'])test(`completes a generated ${mode} round and records its leaderboard score`,async()=>{
  let {data:r}=await request('/api/runs',{player:`Explorer ${mode}`,mode});
  const route='/api/runs/'+r.id,total=r.questions.length;
  for(let i=0;i<total;i++){
    const q=r.questions[i];
    ({data:r}=await request(route,{action:'attempt',questionId:q.id,selected:answer(q)}));
    assert.equal(r.questions[i].solved,true);
    ({data:r}=await request(route,{action:'next',questionId:q.id}));
  }
  assert.ok(r.completedAt);
  assert.equal(r.score,total*100);
  const {data:board}=await request('/api/leaderboard');
  assert.ok(board.some(row=>row.player===`Explorer ${mode}`&&row.firstTry===total));
});
test('older saved worksheet questions can still be resumed and solved',async()=>{
  const {data:r}=await request('/api/runs',{player:'Legacy',mode:'worksheet'});
  const file=path.join(dir,r.filename);
  const old=JSON.parse(await fs.readFile(file,'utf8'));
  old.version=1;old.questions=[{id:'worksheet-1',n:2,d:32,slices:16,target:1,attempts:[],solved:false}];
  await fs.writeFile(file,JSON.stringify(old));
  const {data:solved}=await request('/api/runs/'+r.id,{action:'attempt',questionId:'worksheet-1',selected:[0]});
  assert.equal(solved.questions[0].solved,true);
  assert.equal(solved.questions[0].attempts[0].shadedPercent,6.25);
});
test('names and modes are required; static files do not expose server or results',async()=>{
  assert.equal((await request('/api/runs',{player:' ',mode:'worksheet'})).status,400);
  assert.equal((await request('/api/runs',{player:'A',mode:'other'})).status,400);
  assert.equal((await fetch(base+'/')).status,200);
  assert.equal((await fetch(base+'/server.js')).status,404);
  assert.equal((await fetch(base+'/results/')).status,404);
});
