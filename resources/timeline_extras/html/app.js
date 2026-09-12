const resource = typeof GetParentResourceName === 'function' ? GetParentResourceName() : 'timeline_extras';
const $ = (id) => document.getElementById(id);
const post = (name, data = {}) => fetch(`https://${resource}/${name}`, {method:'POST',headers:{'Content-Type':'application/json; charset=UTF-8'},body:JSON.stringify(data)}).then(r=>r.json().catch(()=>true)).catch(()=>false);
const money = v => '$' + Math.floor(Number(v)||0).toLocaleString('de-DE');
let activeModal = null;
let dmvQuestions = [], dmvAnswers = [], dmvIndex = 0, dmvSelected = null;
let moneywashFee = 35, moneywashTimer = null;
let currentTrainMode = null;
let passTimer = null;

function showModal(name){
  document.querySelectorAll('.panel').forEach(x=>x.classList.add('hidden'));
  $('modalRoot').classList.remove('hidden');
  $(`${name}View`).classList.remove('hidden');
  activeModal = name;
}
function hideModal(name){
  if(name && activeModal !== name) return;
  document.querySelectorAll('.panel').forEach(x=>x.classList.add('hidden'));
  $('modalRoot').classList.add('hidden');
  activeModal = null;
}
document.querySelectorAll('[data-close]').forEach(btn=>btn.addEventListener('click',()=>post(`${btn.dataset.close}Close`)));
document.addEventListener('keydown',e=>{ if(e.key==='Escape' && activeModal) post(`${activeModal}Close`); });

function renderDMVMenu(data){
  showModal('dmv'); $('dmvMenu').classList.remove('hidden'); $('dmvTheory').classList.add('hidden');
  const list = $('dmvCategories'); list.innerHTML='';
  const images={car:'car.png',bike:'bike.png',truck:'truck.png'};
  (data.categories||[]).forEach(c=>{
    const owned = data.licenses && data.licenses[c.license];
    const el=document.createElement('div'); el.className='license-card'+(owned?' owned':'');
    el.innerHTML=`<img src="assets/dmv/${images[c.key]||'car.png'}"><div><h3>${c.label}</h3><p>${money(c.price)} · ${owned?'Bereits vorhanden':'Theorie + Praxis'}</p></div><button ${owned?'disabled':''}>${owned?'Vorhanden':'Auswählen'}</button>`;
    el.querySelector('button').addEventListener('click',()=>{ if(!owned){ post('dmvStart',{type:c.key}); }});
    list.appendChild(el);
  });
}
function renderDMVQuestion(){
  const q=dmvQuestions[dmvIndex]; if(!q) return;
  $('dmvTheoryProgress').textContent=`${dmvIndex+1}/${dmvQuestions.length}`;
  $('dmvQuestion').textContent=q.question||'Frage';
  const list=$('dmvAnswers'); list.innerHTML=''; dmvSelected=null; $('dmvNext').disabled=true;
  (q.answers||[]).forEach(a=>{ const el=document.createElement('div'); el.className='answer'; el.textContent=`${a.value}. ${a.label}`; el.addEventListener('click',()=>{document.querySelectorAll('#dmvAnswers .answer').forEach(x=>x.classList.remove('selected'));el.classList.add('selected');dmvSelected=a.value;$('dmvNext').disabled=false;}); list.appendChild(el); });
}
function openDMVTheory(data){
  showModal('dmv'); $('dmvMenu').classList.add('hidden'); $('dmvTheory').classList.remove('hidden');
  dmvQuestions=data.questions||[]; dmvAnswers=[]; dmvIndex=0; $('dmvMaxWrong').textContent=`Maximal ${data.maxWrong||0} Fehler erlaubt`; renderDMVQuestion();
}
$('dmvNext').addEventListener('click',()=>{ if(!dmvSelected) return; dmvAnswers[dmvIndex]=dmvSelected; if(dmvIndex<dmvQuestions.length-1){dmvIndex++;renderDMVQuestion();}else{$('dmvNext').disabled=true;post('dmvTheorySubmit',{answers:dmvAnswers});} });

function openMoneywash(data){
  showModal('moneywash'); moneywashFee=Number(data.feePercent)||35; $('mwBlack').textContent=money(data.blackmoney); $('mwCash').textContent=money(data.money); $('mwFee').textContent=`Gebühr ${moneywashFee}%`; $('mwAmount').value=''; $('mwQuick').innerHTML=''; $('mwProgressWrap').classList.add('hidden'); $('mwStart').disabled=false;
  (data.options||[]).forEach(v=>{const b=document.createElement('button');b.textContent=money(v);b.addEventListener('click',()=>{$('mwAmount').value=v;updateMoneywashReceive();});$('mwQuick').appendChild(b);}); updateMoneywashReceive();
}
function updateMoneywashReceive(){ const amount=Math.max(0,Number($('mwAmount').value)||0); $('mwReceive').textContent=money(amount*(1-moneywashFee/100)); }
$('mwAmount').addEventListener('input',updateMoneywashReceive);
$('mwStart').addEventListener('click',()=>{ const amount=Number($('mwAmount').value)||0; if(amount<=0)return; $('mwStart').disabled=true; post('moneywashStart',{amount}); });
function startMoneywashProgress(data){
  const duration=Math.max(500,Number(data.duration)||10000); $('mwProgressWrap').classList.remove('hidden'); $('mwStart').disabled=true; const started=Date.now(); if(moneywashTimer)clearInterval(moneywashTimer); moneywashTimer=setInterval(()=>{const p=Math.min(100,((Date.now()-started)/duration)*100);$('mwProgress').style.width=`${p}%`;$('mwProgressText').textContent=`${Math.floor(p)}%`;if(p>=100){clearInterval(moneywashTimer);moneywashTimer=null;}},100);
}
function moneywashResult(data){ if(moneywashTimer){clearInterval(moneywashTimer);moneywashTimer=null;} $('mwProgress').style.width='100%'; $('mwProgressText').textContent=data.success?'Fertig':'Abgebrochen'; $('mwBlack').textContent=money(data.blackmoney); $('mwCash').textContent=money(data.money); setTimeout(()=>{$('mwProgressWrap').classList.add('hidden');$('mwProgress').style.width='0';$('mwStart').disabled=false;$('mwAmount').value='';updateMoneywashReceive();},900); }

function openTrain(data){
  showModal('train'); currentTrainMode=data.mode; $('trainType').textContent=(data.mode||'SCHICHT').toUpperCase(); $('trainLabel').textContent=data.label||'Zugjob'; $('trainInfo').textContent='Fahre die Route vollständig ab. W/S steuert die Geschwindigkeit, E bestätigt Haltestellen.'; $('trainStations').textContent=data.stations||0; $('trainSpeed').textContent=`${data.maxSpeed||0} km/h`; $('trainReward').textContent=`${money(data.rewardMin||0)}–${money(data.rewardMax||0)}`;
}
$('trainStart').addEventListener('click',()=>{ if(!currentTrainMode)return; $('trainStart').disabled=true; post('trainStart',{mode:currentTrainMode}); setTimeout(()=>{$('trainStart').disabled=false;},1200); });
function trainOverlay(data){ $('trainOverlay').classList.remove('hidden'); $('trainOverlayLabel').textContent=data.label||'Zugjob'; $('trainOverlayStation').textContent=data.station||'-'; $('trainOverlayProgress').textContent=`${data.index||1}/${data.total||1}`; $('trainOverlayLimit').textContent=`${data.maxSpeed||0} km/h`; }

$('gwCreate').addEventListener('click',()=>{ const payload={type:$('gwType').value,name:$('gwName').value.trim(),amount:Number($('gwAmount').value)||0,minutes:Number($('gwMinutes').value)||0}; $('gwCreate').disabled=true; post('giveawayCreate',payload).then(()=>setTimeout(()=>$('gwCreate').disabled=false,700)); });
function giveawayState(data){
  if(!data || !data.active){$('giveawayCard').classList.add('hidden');return;} $('giveawayCard').classList.remove('hidden'); $('gwCardReward').textContent=data.rewardLabel||'Belohnung'; $('gwCardMembers').textContent=`${data.members||0} Teilnehmer`; updateGiveawayTime(data.remaining||0);
}
function updateGiveawayTime(seconds){seconds=Math.max(0,Number(seconds)||0);const m=Math.floor(seconds/60),s=seconds%60;$('gwCardTime').textContent=`${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;}

function openPass(data){
  showModal('pass'); $('passLevel').textContent=data.level||1; const p=Number(data.playtime)||0; $('passPlaytime').textContent=`${Math.floor(p/60)}h ${p%60}m`; renderPassTasks(data.tasks||[]); renderPassRewards(data.tasks||[]); startPassReset(data.secondsUntilReset||0);
}
function renderPassTasks(tasks){const root=$('passTasks');root.innerHTML='';tasks.forEach(t=>{const prog=Number(t.progress)||0,target=Math.max(1,Number(t.target)||1),pct=Math.min(100,prog/target*100);const el=document.createElement('div');el.className='task';el.innerHTML=`<div class="top"><strong>${t.label||'Aufgabe'}</strong><small>${t.claimed?'ABGEHOLT':`${prog}/${target}`}</small></div><small>${t.description||''}</small><div class="task-bar"><span style="width:${pct}%"></span></div>`;root.appendChild(el);});}
function rewardText(r){if(!r)return'Belohnung';if(r.type==='cash')return`${money(r.amount)} Bargeld`;if(r.type==='bank')return`${money(r.amount)} Bank`;if(r.type==='coins')return`${r.amount} Coins`;if(r.type==='item')return`${r.amount||1}x ${r.label||r.item}`;return'Belohnung';}
function renderPassRewards(tasks){const root=$('passRewards');root.innerHTML='';tasks.forEach(t=>{const done=(Number(t.progress)||0)>=Math.max(1,Number(t.target)||1);const el=document.createElement('div');el.className='reward'+(done?' done':'');el.innerHTML=`<div><strong>${t.label||'Daily'}</strong><small>${rewardText(t.reward)}</small></div><button ${!done||t.claimed?'disabled':''}>${t.claimed?'Abgeholt':'Abholen'}</button>`;el.querySelector('button').addEventListener('click',()=>post('passClaim',{id:t.id}));root.appendChild(el);});}
function startPassReset(sec){if(passTimer)clearInterval(passTimer);let n=Math.max(0,Number(sec)||0);const tick=()=>{const h=Math.floor(n/3600),m=Math.floor(n%3600/60),s=n%60;$('passReset').textContent=`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;if(n>0)n--;};tick();passTimer=setInterval(tick,1000);}

function openElevator(data){showModal('elevator');$('elevatorName').textContent=data.name||'Wähle eine Etage';const root=$('elevatorStages');root.innerHTML='';(data.stages||[]).forEach(s=>{const b=document.createElement('button');b.textContent=s.label;b.addEventListener('click',()=>post('elevatorSelect',{index:s.index}));root.appendChild(b);});}

window.addEventListener('message',e=>{const m=e.data||{};
  if(m.action==='dmvOpen')renderDMVMenu(m.data||{});
  if(m.action==='dmvTheory')openDMVTheory(m.data||{});
  if(m.action==='dmvClose'){hideModal('dmv');}
  if(m.action==='dmvDriveStart'){hideModal();$('dmvOverlay').classList.remove('hidden');$('dmvOverlayType').textContent=(m.data.label||m.data.type||'Prüfung').toUpperCase();$('dmvOverlayCheckpoint').textContent=`1/${m.data.total||1}`;$('dmvOverlayErrors').textContent=`0/${m.data.maxErrors||0}`;}
  if(m.action==='dmvDriveUpdate'){if(m.data.index)$('dmvOverlayCheckpoint').textContent=`${m.data.index}/${m.data.total||1}`;if(m.data.errors!==undefined)$('dmvOverlayErrors').textContent=`${m.data.errors}/${m.data.maxErrors||0}`;}
  if(m.action==='dmvDriveEnd'){$('dmvOverlay').classList.add('hidden');hideModal('dmv');}
  if(m.action==='moneywashOpen')openMoneywash(m.data||{});
  if(m.action==='moneywashProgress')startMoneywashProgress(m.data||{});
  if(m.action==='moneywashResult')moneywashResult(m.data||{});
  if(m.action==='moneywashClose'){hideModal('moneywash');}
  if(m.action==='trainOpen')openTrain(m.data||{});
  if(m.action==='trainClose'){hideModal('train');$('trainStart').disabled=false;}
  if(m.action==='trainDriveStart'){hideModal('train');$('trainStart').disabled=false;trainOverlay(m.data||{});}
  if(m.action==='trainDriveUpdate')trainOverlay(m.data||{});
  if(m.action==='trainDriveEnd'){$('trainOverlay').classList.add('hidden');}
  if(m.action==='giveawayOpen'){showModal('giveaway');}
  if(m.action==='giveawayClose'){hideModal('giveaway');}
  if(m.action==='giveawayState')giveawayState(m.data);
  if(m.action==='giveawayTime')updateGiveawayTime(m.remaining);
  if(m.action==='passOpen')openPass(m.data||{});
  if(m.action==='passClose'){hideModal('pass');if(passTimer){clearInterval(passTimer);passTimer=null;}}
  if(m.action==='elevatorOpen')openElevator(m.data||{});
  if(m.action==='elevatorClose')hideModal('elevator');
});
