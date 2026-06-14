// Game logic for FLAGGER. Depends on COUNTRY_TIERS (countries.js).
const flagUrl = code => `https://flagcdn.com/w640/${code}.png`;
const bestKey = diff => `flagger_best_${diff}`;

let difficulty = (localStorage.getItem('flagger_diff') === 'hard') ? 'hard' : 'easy';
let countries = COUNTRY_TIERS[difficulty];
let streak = 0;
let best = parseInt(localStorage.getItem(bestKey(difficulty)) || '0', 10);
let answer = null, locked = false, recent = [];

const el = id => document.getElementById(id);
const optionsEl = el('options'), flagImg = el('flagImg'), flagWrap = el('flagWrap');
const streakVal = el('streakVal'), bestVal = el('bestVal'), promptSub = el('promptSub');
const nextBtn = el('nextBtn'), streakStrip = el('streakStrip'), diffEl = el('diff');
bestVal.textContent = best;

function shuffle(a){ a=a.slice(); for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }
function pickCountry(){
  let c; do { c = countries[Math.floor(Math.random()*countries.length)]; } while (recent.includes(c[0]));
  recent.push(c[0]); if (recent.length > 18) recent.shift(); return c;
}

function setDifficulty(diff){
  if (diff === difficulty || !COUNTRY_TIERS[diff]) return;
  difficulty = diff;
  localStorage.setItem('flagger_diff', diff);
  countries = COUNTRY_TIERS[diff];
  best = parseInt(localStorage.getItem(bestKey(diff)) || '0', 10);
  bestVal.textContent = best;
  streak = 0; streakVal.textContent = 0; recent = [];
  syncDiffUI();
  clearTimeout(window.__adv);
  newRound();
}

function syncDiffUI(){
  [...diffEl.children].forEach(b => b.classList.toggle('active', b.dataset.diff === difficulty));
}

function newRound(){
  locked = false;
  answer = pickCountry();
  const pool = shuffle(countries.filter(c => c[0] !== answer[0])).slice(0,3);
  const choices = shuffle([answer, ...pool]);

  flagWrap.classList.add('swap');
  const img = new Image();
  const done = () => { flagImg.src = img.src; flagWrap.classList.remove('swap'); };
  img.onload = done; img.onerror = done; img.src = flagUrl(answer[0]);
  flagImg.alt = 'Flag of the country to guess';

  optionsEl.innerHTML = '';
  choices.forEach((c, i) => {
    const b = document.createElement('button');
    b.className = 'opt';
    b.innerHTML = `<span class="key">${i+1}</span><span class="name">${c[1]}</span>`;
    b.onclick = () => choose(b, c);
    b.dataset.code = c[0];
    optionsEl.appendChild(b);
  });

  promptSub.textContent = 'Tap your answer';
  nextBtn.hidden = true;
}

function choose(btn, country){
  if (locked) return;
  locked = true;
  const buttons = [...optionsEl.children];
  buttons.forEach(b => b.disabled = true);
  const correct = country[0] === answer[0];

  if (correct){
    btn.classList.add('correct');
    streak++;
    bumpStreak();
    promptSub.textContent = niceCorrect();
    if (streak > best){ best = streak; localStorage.setItem(bestKey(difficulty), best); bestVal.textContent = best; celebrate(); }
    nextBtn.hidden = false;
    clearTimeout(window.__adv);
    window.__adv = setTimeout(newRound, 1150);
  } else {
    btn.classList.add('wrong');
    buttons.forEach(b => {
      if (b.dataset.code === answer[0]) b.classList.add('correct');
      else if (b !== btn) b.classList.add('dim');
    });
    streak = 0;
    nextBtn.hidden = false;
  }
  streakVal.textContent = streak;
}

function niceCorrect(){
  const m = ['Nice one','Correct','Spot on','You got it','Sharp eye','Exactly'];
  return m[Math.floor(Math.random()*m.length)];
}
function bumpStreak(){
  streakVal.textContent = streak;
  streakStrip.classList.remove('bump'); void streakStrip.offsetWidth; streakStrip.classList.add('bump');
}

let toastTimer;
function showToast(msg){
  const t = el('toast'); el('toastMsg').textContent = msg; t.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(()=>t.classList.remove('show'), 2200);
}
function celebrate(){
  showToast(`New best · ${best}`);
  const c = el('confetti');
  const colors = ['#f5402c','#ff6a1a','#f364a2','#5b3df0','#1aae66','#74d4bf','#ffc01e'];
  for (let i=0;i<80;i++){
    const p = document.createElement('i');
    p.style.left = Math.random()*100 + 'vw';
    p.style.background = colors[Math.floor(Math.random()*colors.length)];
    p.style.borderRadius = Math.random() > .5 ? '50%' : '2px';
    p.style.animationDuration = (1.6 + Math.random()*1.4) + 's';
    p.style.animationDelay = (Math.random()*.3) + 's';
    c.appendChild(p);
    setTimeout(()=>p.remove(), 3200);
  }
}

nextBtn.onclick = () => { clearTimeout(window.__adv); newRound(); };
diffEl.addEventListener('click', e => {
  const b = e.target.closest('.diff-btn');
  if (b) setDifficulty(b.dataset.diff);
});
document.addEventListener('keydown', e => {
  if (e.key >= '1' && e.key <= '4'){ const b = optionsEl.children[+e.key - 1]; if (b && !locked) b.click(); }
  else if ((e.key === 'Enter' || e.key === ' ') && !nextBtn.hidden){ e.preventDefault(); nextBtn.click(); }
});

syncDiffUI();
newRound();
