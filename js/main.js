const menu=document.querySelector('.menu-panel');
const menuButton=document.querySelector('.menu-button');
const menuClose=document.querySelector('.menu-close');

function setMenu(open){
  menu.classList.toggle('open',open);
  menu.setAttribute('aria-hidden',String(!open));
  menuButton.setAttribute('aria-expanded',String(open));
  document.body.style.overflow=open?'hidden':'';
}
menuButton.addEventListener('click',()=>setMenu(true));
menuClose.addEventListener('click',()=>setMenu(false));
menu.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>setMenu(false)));
document.addEventListener('keydown',e=>{if(e.key==='Escape')setMenu(false);});

// Language switcher: no reload, so the user stays in the same section.
document.querySelectorAll('.lang-btn').forEach(btn=>btn.addEventListener('click',()=>applyLanguage(btn.dataset.lang)));
applyLanguage(CURRENT_LANG,{syncUrl:false});

function updateBookListLink(){
  const a=document.getElementById('bookListLink');
  if(!a)return;
  const q=LANGUAGE_CONFIG[CURRENT_LANG]?.query||'zh';
  a.href=`book-list.html?lang=${encodeURIComponent(q)}`;
}
updateBookListLink();
window.addEventListener('languagechange',updateBookListLink);


const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if(reduced){
  document.querySelectorAll('.reveal').forEach(el=>el.classList.add('in'));
}else{
  const io=new IntersectionObserver(entries=>entries.forEach(e=>{
    if(e.isIntersecting)e.target.classList.add('in');
  }),{threshold:.14,rootMargin:'0px 0px -7% 0px'});
  document.querySelectorAll('.reveal').forEach(el=>io.observe(el));
}

// Dah Hsian photo chapter: show all four real photos, then let each photo open a short reflection.
const hotspotNote=document.querySelector('.hotspot-note');
const hotspotTitle=document.querySelector('.hotspot-title');
const hotspotIndex=document.querySelector('.hotspot-index');
const hotspotMeta={
  lake:{index:'01',titleKey:'dahhsian.lakeTitle'},
  glass:{index:'02',titleKey:'dahhsian.glassTitle'},
  building:{index:'03',titleKey:'dahhsian.buildingTitle'},
  shore:{index:'04',titleKey:'dahhsian.shoreTitle'}
};
let activeHotspot='lake';
function showHotspot(key){
  if(!hotspotMeta[key])return;
  activeHotspot=key;
  document.querySelectorAll('.dahhsian-card').forEach(card=>card.classList.toggle('active',card.dataset.hotspot===key));
  if(hotspotIndex)hotspotIndex.textContent=hotspotMeta[key].index;
  if(hotspotTitle)hotspotTitle.textContent=t(hotspotMeta[key].titleKey);
  if(hotspotNote)hotspotNote.textContent=HOTSPOT_I18N[CURRENT_LANG][key]||'';
}
document.querySelectorAll('.dahhsian-card').forEach(card=>card.addEventListener('click',()=>showHotspot(card.dataset.hotspot)));
showHotspot(activeHotspot);

// If a Dah Hsian image is missing, hide the broken image icon and keep a graceful color fallback.
document.querySelectorAll('[data-dahhsian-image]').forEach(img=>{
  img.addEventListener('error',()=>{
    img.hidden=true;
    const host=img.closest('.dahhsian-card,.residents-hero');
    if(host)host.classList.add('image-missing');
    console.warn('Dah Hsian image not found:',img.getAttribute('src'));
  });
});

// Choice interaction: each answer opens a different reflection, then all five answers are summarized without scoring.
const choiceState={};
const choiceOrder=['comfort','glass','convenience','technology','future'];
const choiceQuestionKeys={comfort:'choice.q1.title',glass:'choice.q2.title',convenience:'choice.q3.title',technology:'choice.q4.title',future:'choice.q5.title'};
const choiceExploreMeta={
  comfort:{href:'#dahhsian'},
  glass:{href:'#dahhsian'},
  convenience:{href:'#consume'},
  technology:{href:'#future'},
  future:{href:'#future'}
};
const choiceProgress=document.getElementById('choiceProgress');
const choiceProgressBar=document.getElementById('choiceProgressBar');
const choiceSummary=document.getElementById('choiceSummary');
const choiceSummaryList=document.getElementById('choiceSummaryList');
const choiceInsightText=document.getElementById('choiceInsightText');
const choiceReset=document.getElementById('choiceReset');

function renderChoiceFeedback(card,key,option){
  const box=card.querySelector('.choice-feedback');
  const copy=CHOICE_FEEDBACK_I18N[CURRENT_LANG]?.[key]?.[option]||t('choice.feedback');
  box.innerHTML='';
  const label=document.createElement('span');
  label.textContent=t('choice.reflectionLabel');
  const p=document.createElement('p');
  p.textContent=copy;
  box.append(label,p);
  const meta=choiceExploreMeta[key];
  if(meta){
    const a=document.createElement('a');
    a.href=meta.href;
    a.textContent=t('choice.exploreRelated');
    box.append(a);
  }
}

function selectedLabelKey(key){
  const card=document.querySelector(`.choice-card[data-choice="${key}"]`);
  const btn=card?.querySelector('.choice-actions button.selected');
  return btn?.dataset.i18n||'';
}

function renderChoiceSummary(){
  const count=Object.keys(choiceState).length;
  if(choiceProgress)choiceProgress.textContent=`${count} / ${choiceOrder.length}`;
  if(choiceProgressBar)choiceProgressBar.style.width=`${count/choiceOrder.length*100}%`;
  if(!choiceSummary||!choiceSummaryList)return;
  if(count<choiceOrder.length){choiceSummary.hidden=true;return;}
  choiceSummaryList.innerHTML='';
  choiceOrder.forEach(key=>{
    const row=document.createElement('div');
    row.className='choice-summary-row';
    const q=document.createElement('b');
    q.textContent=t(choiceQuestionKeys[key]);
    const a=document.createElement('span');
    const labelKey=selectedLabelKey(key);
    a.textContent=labelKey?t(labelKey):'';
    row.append(q,a);
    choiceSummaryList.append(row);
  });

  // This is intentionally not a score or personality label. It only reflects whether
  // the visitor repeatedly chose combined/redesign paths versus explicit priorities.
  const integrative={comfort:['c'],glass:['b','c'],convenience:['c'],technology:['c'],future:['c']};
  const integrateCount=choiceOrder.reduce((n,key)=>n+(integrative[key]?.includes(choiceState[key])?1:0),0);
  if(choiceInsightText){
    choiceInsightText.textContent=t(integrateCount>=3?'choice.insightIntegrate':'choice.insightPriority');
  }
  choiceSummary.hidden=false;
}

function selectChoice(card,btn,{scrollToSummary=true}={}){
  const key=card.dataset.choice;
  const option=btn.dataset.option;
  card.querySelectorAll('.choice-actions button').forEach(b=>b.classList.toggle('selected',b===btn));
  card.classList.add('answered');
  choiceState[key]=option;
  renderChoiceFeedback(card,key,option);
  const wasComplete=Object.keys(choiceState).length===choiceOrder.length;
  renderChoiceSummary();
  if(wasComplete&&scrollToSummary&&choiceSummary&&!choiceSummary.hidden){
    setTimeout(()=>choiceSummary.scrollIntoView({behavior:reduced?'auto':'smooth',block:'start'}),180);
  }
}

document.querySelectorAll('.choice-card').forEach(card=>{
  card.querySelectorAll('.choice-actions button').forEach(btn=>btn.addEventListener('click',()=>selectChoice(card,btn)));
});

function resetChoices(){
  Object.keys(choiceState).forEach(k=>delete choiceState[k]);
  document.querySelectorAll('.choice-card').forEach(card=>{
    card.classList.remove('answered');
    card.querySelectorAll('.choice-actions button').forEach(b=>b.classList.remove('selected'));
    const feedback=card.querySelector('.choice-feedback');
    if(feedback)feedback.innerHTML='';
  });
  if(choiceSummary)choiceSummary.hidden=true;
  renderChoiceSummary();
}
if(choiceReset)choiceReset.addEventListener('click',()=>{
  resetChoices();
  document.querySelector('#choice')?.scrollIntoView({behavior:reduced?'auto':'smooth',block:'start'});
});

window.addEventListener('languagechange',()=>{
  showHotspot(activeHotspot);
  choiceOrder.forEach(key=>{
    const option=choiceState[key];
    if(!option)return;
    const card=document.querySelector(`.choice-card[data-choice="${key}"]`);
    if(card)renderChoiceFeedback(card,key,option);
  });
  renderChoiceSummary();
});

// Very light hero parallax only; disabled for reduced-motion users.
if(!reduced){
  const hero=document.querySelector('.hero');
  const copy=document.querySelector('.hero-copy');
  window.addEventListener('scroll',()=>{
    const y=Math.min(window.scrollY,window.innerHeight);
    const p=y/window.innerHeight;
    if(copy){
      copy.style.opacity=String(Math.max(.15,1-p*1.35));
      copy.style.transform=`translateY(${-24*p}px)`;
    }
    if(hero)hero.style.setProperty('--hero-scale',String(1+Math.min(.02,p*.02)));
  },{passive:true});
}

// Kiosk idle reset (desktop / touch display only). 120 seconds.
let idleTimer;
function resetIdle(){
  clearTimeout(idleTimer);
  if(window.innerWidth<900)return;
  idleTimer=setTimeout(()=>{
    setMenu(false);
    resetChoices();
    window.scrollTo({top:0,behavior:reduced?'auto':'smooth'});
  },120000);
}
['pointerdown','keydown','wheel','touchstart'].forEach(evt=>window.addEventListener(evt,resetIdle,{passive:true}));
resetIdle();
