'use strict';
const $ = id => document.getElementById(id);
let run=null, selected=new Set(), busy=false, sound=false, audio=null, paint=null, viewEpoch=0, moodTimer=null, lessonTimer=null;
const store={get(k){try{return localStorage.getItem(k);}catch{return null;}},set(k,v){try{localStorage.setItem(k,v);}catch{}}};
async function api(url,data){const res=await fetch(url,{method:data?'POST':'GET',headers:data?{'Content-Type':'application/json'}:{},body:data?JSON.stringify(data):undefined});const result=await res.json();if(!res.ok)throw Error(result.error||'Could not connect to the game server');return result;}
function play(success=true){if(!sound)return;try{audio ||= new (window.AudioContext||window.webkitAudioContext)();audio.resume().catch(()=>{});const notes=success?[523.25,659.25,783.99]:[261.63,220];notes.forEach((f,i)=>{const oscillator=audio.createOscillator(),gain=audio.createGain();oscillator.type='sine';oscillator.frequency.value=f;gain.gain.setValueAtTime(0,audio.currentTime+i*.1);gain.gain.linearRampToValueAtTime(.08,audio.currentTime+i*.1+.015);gain.gain.exponentialRampToValueAtTime(.001,audio.currentTime+i*.1+.3);oscillator.connect(gain);gain.connect(audio.destination);oscillator.start(audio.currentTime+i*.1);oscillator.stop(audio.currentTime+i*.1+.31);});}catch{}}
$('sound').onclick=()=>{sound=!sound;$('sound').setAttribute('aria-pressed',String(sound));$('sound').querySelector('span').textContent=sound?'Sound on':'Sound off';if(sound)play();};
function show(view){clearTimeout(moodTimer);clearTimeout(lessonTimer);viewEpoch++;document.body.dataset.mood=view==='game'?'thinking':view==='complete'?'correct':'welcome';for(const id of ['welcome','game','complete'])$(id).hidden=id!==view;$('leaderboard').hidden=view==='game';window.scrollTo({top:0,behavior:'instant'});}
function message(text,kind=''){$('feedback').textContent=text;$('feedback').className='feedback '+kind;}
const formatPercentage=LEARNING.percentage;
for(const container of document.querySelectorAll('.monster-body,.study-buddy'))container.innerHTML=MONSTER_ART;
function setMood(mood){
  clearTimeout(moodTimer);document.body.dataset.mood=mood;
  if(mood==='oops')moodTimer=setTimeout(()=>{document.body.dataset.mood='thinking';},3200);
}
function renderExplanation(q){
  const attempted=q.attempts.length>0;
  const content=$('explanation-content');content.replaceChildren();
  $('continue').hidden=!q.solved;
  $('continue').disabled=busy;
  $('continue').innerHTML=run.currentIndex===run.questions.length-1?'See the Hall of Fame <span>→</span>':'Continue adventure <span>→</span>';
  $('explanation-title').textContent=attempted?'Here’s the slice secret!':'Let’s figure it out.';
  $('buddy-speech').textContent=q.solved?'You did it! Let’s see why that works.':attempted?'Good experiment! Let’s work it out together.':'Hmm… how many slices belong in one group?';
  if(!attempted){
    const hint=document.createElement('p');hint.className='thinking-hint';hint.textContent='Try your circle and check your answer. I’ll show you the steps here, then you can continue when you’re ready.';content.append(hint);return;
  }
  const lesson=LEARNING.explain(q),list=document.createElement('ol');list.className='explanation-steps';
  for(const step of lesson.steps){
    const item=document.createElement('li'),title=document.createElement('h3'),text=document.createElement('p'),math=document.createElement('div');
    title.textContent=step.title;text.textContent=step.text;math.className='math-step';math.textContent=step.math;
    item.append(title,text,math);list.append(item);
  }
  const result=document.createElement('div');result.className='lesson-result';
  const summary=document.createElement('strong'),equivalent=document.createElement('span');
  summary.textContent=lesson.summary;equivalent.textContent=`${lesson.equivalent} · ${lesson.percent} of the whole`;
  result.append(summary,equivalent);content.append(list,result);
  if(!q.solved){const retry=document.createElement('p');retry.className='thinking-hint';retry.textContent='Try that amount on your circle, then check again. You’ve got this!';content.append(retry);}
}
function current(){return run.questions[run.currentIndex];}
function drawCircle(){const q=current();const svg=$('circle');svg.replaceChildren();for(let i=0;i<q.slices;i++){const a=i*2*Math.PI/q.slices-Math.PI/2,b=(i+1)*2*Math.PI/q.slices-Math.PI/2;const x=t=>200+184*Math.cos(t),y=t=>200+184*Math.sin(t);const wedge=document.createElementNS('http://www.w3.org/2000/svg','path');wedge.setAttribute('d',`M200,200 L${x(a)},${y(a)} A184,184 0 ${b-a>Math.PI?1:0},1 ${x(b)},${y(b)} Z`);wedge.dataset.index=i;if(q.slices===100)wedge.style.strokeWidth='.65';wedge.setAttribute('role','button');wedge.setAttribute('tabindex',q.solved?'-1':'0');wedge.setAttribute('aria-label',`Piece ${i+1} of ${q.slices}`);wedge.addEventListener('keydown',event=>{if(event.key===' '||event.key==='Enter'){event.preventDefault();toggle(i);}else if(['ArrowRight','ArrowDown','ArrowLeft','ArrowUp'].includes(event.key)){event.preventDefault();const delta=['ArrowRight','ArrowDown'].includes(event.key)?1:-1;svg.children[(i+delta+q.slices)%q.slices].focus();}});svg.append(wedge);}updateSelection();}
function updateSelection(){const q=current();$('leave').disabled=busy;$('continue').disabled=busy;Array.from($('circle').children).forEach((el,i)=>{el.setAttribute('class','wedge'+(selected.has(i)?' shaded':''));el.setAttribute('aria-pressed',String(selected.has(i)));el.setAttribute('aria-disabled',String(q.solved||busy));});$('shaded-count').textContent=selected.size;$('shaded-total').textContent=`of ${q.slices} pieces shaded`;$('percent-label').textContent=`${formatPercentage(selected.size,q.slices)} of the whole`;for(const id of ['clear','minus','plus','check'])$(id).disabled=q.solved||busy;$('minus').disabled ||= selected.size===0;$('plus').disabled ||= selected.size===q.slices;}
function toggle(i){if(busy||current().solved)return;if(selected.has(i))selected.delete(i);else selected.add(i);updateSelection();}
function indexAt(event){const rect=$('circle').getBoundingClientRect(), x=(event.clientX-rect.left)/rect.width*400-200,y=(event.clientY-rect.top)/rect.height*400-200;if(Math.hypot(x,y)>184)return null;let angle=(Math.atan2(y,x)+Math.PI/2+2*Math.PI)%(2*Math.PI);return Math.min(current().slices-1,Math.floor(angle/(2*Math.PI)*current().slices));}
$('circle').addEventListener('pointerdown',event=>{if(busy||current().solved||event.button!==0)return;const i=indexAt(event);if(i===null)return;event.preventDefault();paint={shade:!selected.has(i),last:i};$('circle').setPointerCapture(event.pointerId);if(paint.shade)selected.add(i);else selected.delete(i);updateSelection();});
$('circle').addEventListener('pointermove',event=>{if(!paint||busy||current().solved)return;const i=indexAt(event);if(i===null)return;if(i!==paint.last){if(paint.shade)selected.add(i);else selected.delete(i);paint.last=i;updateSelection();}});
for(const type of ['pointerup','pointercancel','lostpointercapture'])$('circle').addEventListener(type,()=>paint=null);
$('minus').onclick=()=>{selected.delete([...selected].pop());updateSelection();};
$('plus').onclick=()=>{for(let i=0;i<current().slices;i++)if(!selected.has(i)){selected.add(i);break;}updateSelection();};
$('clear').onclick=()=>{selected.clear();updateSelection();};
function renderQuestion(){show('game');$('celebration').replaceChildren();$('circle').classList.remove('correct-pulse');const q=current();selected=new Set(q.attempts.length?q.attempts.at(-1).selected:[]);$('player-badge').textContent=`Explorer: ${run.player}`;$('chapter').textContent=run.mode==='worksheet'?'FRACTION FOUNDATIONS':'THE 100-SLICE CHALLENGE';$('score').textContent=run.score;$('progress-text').textContent=`Discovery ${run.currentIndex+1} of ${run.questions.length}`;const done=run.questions.filter(q=>q.solved).length;const percent=Math.round(done/run.questions.length*100);$('progress-percent').textContent=`${percent}% explored`;$('progress-bar').style.width=percent+'%';$('target').innerHTML=`<span class="numerator">${q.n}</span><span class="denominator">${q.d}</span>`;$('target').setAttribute('aria-label',`${q.n} over ${q.d}`);$('target-percent').textContent=`That’s ${formatPercentage(q.n,q.d)} of the whole`;$('mission-help').textContent=`The circle has ${q.slices} equal pieces. Make the shaded amount equal to ${q.n}/${q.d}.`;$('tip-text').textContent=q.slices===100?'Each little slice is 1 out of 100. That’s 1%. Use + and − for precise shading.':q.d!==q.slices?'Look closely: the circle can have a different number of pieces from the fraction’s denominator. Equivalent fractions show the same amount.':'The bottom number tells you the whole. The top number tells you how much to shade.';$('slice-label').textContent=q.slices;$('attempt-label').textContent=q.attempts.length?`${q.attempts.length} attempt${q.attempts.length===1?'':'s'}`:'No attempts yet';$('check').hidden=q.solved;$('save-label').textContent='Progress saved automatically';message(q.solved?'Beautifully done. You’ve found the fraction!':'Every great discovery starts with a little try.',q.solved?'correct':'');drawCircle();renderExplanation(q);setMood(q.solved?'correct':'thinking');}
function celebrate(){
  const layer=$('celebration');layer.replaceChildren();
  const badge=document.createElement('div');badge.className='success-badge';badge.textContent='Brilliant! ✦';layer.append(badge);
  if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  $('circle').classList.remove('correct-pulse');void $('circle').getBoundingClientRect();$('circle').classList.add('correct-pulse');
  const ring=document.createElement('div');ring.className='celebration-ring';layer.append(ring);
  for(let i=0;i<48;i++){
    const piece=document.createElement('span');piece.className='confetti';piece.textContent=['✦','●','◆','★'][i%4];
    const angle=i/48*Math.PI*2;const distance=95+(i%5)*23;
    piece.style.setProperty('--x',`${Math.cos(angle)*distance}px`);piece.style.setProperty('--y',`${Math.sin(angle)*distance}px`);
    piece.style.setProperty('--spin',`${i%2?360:-360}deg`);piece.style.color=['#e89261','#398776','#d9b74b','#729fda','#cc7baf'][i%5];
    piece.style.fontSize=`${12+i%4*5}px`;piece.style.animationDelay=`${i%4*25}ms`;layer.append(piece);
  }
}
$('join').onsubmit=async event=>{event.preventDefault();if(busy)return;busy=true;$('start').disabled=true;$('join-error').textContent='';try{run=await api('/api/runs',{player:$('player').value,mode:new FormData($('join')).get('mode')});store.set('slicequest-run',run.id);store.set('slicequest-name',run.player);renderQuestion();}catch(e){$('join-error').textContent=e.message;}finally{busy=false;$('start').disabled=false;if(run)updateSelection();}};
$('check').onclick=async()=>{if(busy||current().solved)return;busy=true;updateSelection();$('save-label').textContent='Saving answer…';try{run=await api('/api/runs/'+run.id,{action:'attempt',questionId:current().id,selected:[...selected].sort((a,b)=>a-b)});const q=current();$('attempt-label').textContent=`${q.attempts.length} attempt${q.attempts.length===1?'':'s'}`;$('save-label').textContent='Answer saved';if(q.solved){play();renderQuestion();celebrate();$('explanation').focus({preventScroll:true});if(matchMedia('(max-width:800px)').matches)lessonTimer=setTimeout(()=>$('explanation').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'}),750);}else{play(false);renderExplanation(q);setMood('oops');const direction=selected.size<q.target?'more':'fewer';message(`Keep exploring! You shaded ${selected.size} of ${q.slices} pieces. Try shading ${direction} pieces to make ${q.n}/${q.d}.`,'wrong');}}catch(e){message(`Couldn’t save your answer. ${e.message}. Your shading is kept; try checking again.`,'wrong');$('save-label').textContent='Not saved — retry your answer';}finally{busy=false;updateSelection();}};
async function advance(){
  if(busy||!run||!current().solved)return;
  const epoch=viewEpoch, runId=run.id, questionId=current().id;
  busy=true;updateSelection();$('continue').disabled=true;
  try{
    const updated=await api('/api/runs/'+runId,{action:'next',questionId});
    if(epoch!==viewEpoch||run?.id!==runId)return;
    run=updated;
    if(run.completedAt)renderComplete();else{renderQuestion();$('check').focus({preventScroll:true});}
  }catch(e){
    if(epoch===viewEpoch){message(`Your answer is saved. Couldn’t load the next discovery: ${e.message}`,'wrong');$('continue').textContent='Try continuing again →';}
  }finally{busy=false;$('continue').disabled=false;if(run)updateSelection();}
}
$('continue').onclick=advance;
function download(){if(run)window.location.assign(`/api/runs/${run.id}/download`);}
$('download-final').onclick=download;$('download-progress').onclick=download;
function home(){show('welcome');$('resume').hidden=!store.get('slicequest-run');$('player').value=store.get('slicequest-name')||'';loadBoard();}
$('leave').onclick=home;$('play-again').onclick=home;
$('resume').onclick=async()=>{if(busy)return;busy=true;$('join-error').textContent='';try{run=await api('/api/runs/'+store.get('slicequest-run'));if(run.completedAt)renderComplete();else renderQuestion();}catch(e){$('join-error').textContent='Could not resume: '+e.message;}finally{busy=false;if(run)updateSelection();}};
function renderComplete(){show('complete');$('winner').textContent=run.player;$('final-score').textContent=run.score;$('first-try').textContent=`${run.questions.filter(q=>q.attempts.length===1).length}/${run.questions.length}`;$('total-attempts').textContent=run.questions.reduce((n,q)=>n+q.attempts.length,0);const review=$('review');review.replaceChildren();const heading=document.createElement('strong');const mistakes=run.questions.filter(q=>q.attempts.some(a=>!a.correct));heading.textContent=mistakes.length?'Little lessons along the way':'A perfect first-try adventure!';review.append(heading);if(mistakes.length){const list=document.createElement('ul');for(const q of mistakes){const li=document.createElement('li');li.textContent=`Discovery ${run.questions.indexOf(q)+1}: ${q.n}/${q.d} on ${q.slices} pieces — ${q.attempts.length} attempts (${q.attempts.filter(a=>!a.correct).map(a=>a.shaded).join(', ')} shaded before the correct answer).`;list.append(li);}review.append(list);}loadBoard();}
async function loadBoard(){
  const container=$('board-rows');container.setAttribute('aria-busy','true');
  try{
    const rows=await api('/api/leaderboard');container.replaceChildren();
    if(!rows.length){const p=document.createElement('p');p.textContent='The monsters are polishing the trophies. Finish an adventure to claim your place!';container.append(p);}
    for(const mode of ['worksheet','percentages']){
      const entries=rows.filter(row=>row.mode===mode);if(!entries.length)continue;
      const group=document.createElement('section');group.className='fame-group';
      const title=document.createElement('h3');title.textContent=mode==='worksheet'?'Fraction foundations · out of 2,000 points':'100-slice challenge · out of 800 points';
      const list=document.createElement('ol');list.className='fame-list';
      entries.forEach((r,i)=>{
        const row=document.createElement('li');row.className='board-row';
        if(run&&r.player.normalize('NFKC').toLowerCase()===run.player.normalize('NFKC').toLowerCase()&&r.mode===run.mode)row.classList.add('is-current');
        const rank=document.createElement('span');rank.className='fame-rank';rank.textContent=i<3?['★','✦','✧'][i]:String(i+1).padStart(2,'0');
        rank.setAttribute('aria-label',`Rank ${i+1}`);
        const name=document.createElement('b');name.textContent=r.player;
        const detail=document.createElement('small');detail.textContent=`${r.firstTry}/${r.total} first try · ${r.games} completed adventure${r.games===1?'':'s'}`;
        const points=document.createElement('strong');points.textContent=r.score+' ✦';row.append(rank,name,detail,points);list.append(row);
      });
      group.append(title,list);container.append(group);
    }
  }catch{container.textContent='The Hall of Fame is unavailable right now. Refresh to try again.';}
  finally{container.setAttribute('aria-busy','false');}
}
$('jump-fame').onclick=()=>$('leaderboard').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
$('refresh-board').onclick=loadBoard;$('show-board').onclick=()=>$('leaderboard').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
home();
