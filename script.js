// ============================================================
// CrimpLog v2.1 – nur Klimmzüge
// ============================================================
const SUPABASE_URL = 'https://fdgtzilbwjiuetrheoly.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZkZ3R6aWxid2ppdWV0cmhlb2x5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2NjczOTksImV4cCI6MjA5NDI0MzM5OX0.4SPYm4eypp7o143faPEkLAltsptS6iT1JHAitfhQEfY';
const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_KEY);

let currentUser = null;
let logs = [];            // pullup_log, neueste zuerst
let settings = { goal: 100, step: 2.5, repStep: 1 };
let isLoading = false;
let logsLoaded = false;   // erst nach dem ersten Laden animieren

// ---------- Helpers ----------
function todayStr() {
  const d = new Date();
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
function fmt(n) { return Number.isInteger(n) ? String(n) : n.toFixed(1); }
function showToast(msg, ms = 1800) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.style.display = 'block';
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => { t.style.display = 'none'; }, ms);
}
function setSyncing(on) {
  const d = document.getElementById('syncDot');
  if (d) d.className = 'sync-dot' + (on ? ' syncing' : '');
}

// ---------- Settings ----------
function loadSettings() {
  try {
    const s = JSON.parse(localStorage.getItem('cl_settings21'));
    if (s) settings = { ...settings, ...s };
  } catch {}
  const m = currentUser?.user_metadata;
  if (m?.cl_goal) settings.goal = m.cl_goal;
  if (m?.cl_step) settings.step = m.cl_step;
}
function persistSettings() {
  localStorage.setItem('cl_settings21', JSON.stringify(settings));
}
function openSettings() {
  hideUserMenu();
  document.getElementById('setGoal').value = settings.goal;
  document.getElementById('setStep').value = settings.step;
  document.getElementById('settingsModal').classList.add('open');
  loadToken();
}
function closeSettings() { document.getElementById('settingsModal').classList.remove('open'); }
async function saveSettings() {
  const goal = parseInt(document.getElementById('setGoal').value);
  const step = parseFloat(document.getElementById('setStep').value);
  if (!goal || goal < 1 || !step || step <= 0) { showToast('Ungültiger Wert'); return; }
  settings.goal = goal; settings.step = step;
  persistSettings();
  db.auth.updateUser({ data: { cl_goal: goal, cl_step: step } }).catch(() => {});
  closeSettings();
  render();
  showToast('Gespeichert');
}

// ---------- Widget token ----------
async function loadToken() {
  const box = document.getElementById('tokenBox');
  box.innerHTML = '<span class="hint">Lade…</span>';
  const { data, error } = await db.from('widget_tokens').select('token').eq('user_id', currentUser.id).maybeSingle();
  if (error) { box.innerHTML = '<span class="hint">Tabelle fehlt – erst setup.sql in Supabase ausführen.</span>'; return; }
  if (!data) {
    box.innerHTML = '<button class="btn btn-secondary" onclick="createToken()">Token erzeugen</button>';
    return;
  }
  box.innerHTML = `<input class="input-field token-field" readonly value="${data.token}" onclick="this.select()">
    <button class="btn btn-secondary" style="margin-top:8px;" onclick="copyToken('${data.token}')">Kopieren</button>`;
}
async function createToken() {
  const { error } = await db.from('widget_tokens').insert({ user_id: currentUser.id });
  if (error) { showToast('Fehler: ' + error.message, 3000); return; }
  loadToken();
}
function copyToken(t) {
  navigator.clipboard?.writeText(t).then(() => showToast('Kopiert'), () => showToast('Lange drücken zum Kopieren'));
}

// ---------- Auth ----------
function showAuthMode(mode, btnEl) {
  document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
  btnEl.classList.add('active');
  const btn = document.getElementById('authBtn');
  btn.textContent = mode === 'login' ? 'ANMELDEN' : 'REGISTRIEREN';
  btn.dataset.mode = mode;
  document.getElementById('authError').style.display = 'none';
}
function showAuthLoading(show) {
  document.getElementById('authLoading').style.display = show ? 'flex' : 'none';
  document.getElementById('authBtn').style.display = show ? 'none' : 'block';
}
function showAuthError(msg) {
  const el = document.getElementById('authError');
  el.textContent = msg; el.style.display = 'block';
}
async function handleAuth() {
  const email = document.getElementById('authEmail').value.trim();
  const password = document.getElementById('authPassword').value;
  const mode = document.getElementById('authBtn').dataset.mode || 'login';
  if (!email || !password) { showAuthError('Bitte E-Mail und Passwort eingeben.'); return; }
  if (password.length < 6) { showAuthError('Passwort muss mindestens 6 Zeichen haben.'); return; }
  showAuthLoading(true);
  document.getElementById('authError').style.display = 'none';
  let result;
  if (mode === 'register') {
    result = await db.auth.signUp({ email, password });
    if (!result.error && result.data.user && !result.data.session) {
      showAuthLoading(false);
      showAuthError('✅ Bestätigungsmail gesendet! Bitte dein Postfach prüfen.');
      return;
    }
  } else {
    result = await db.auth.signInWithPassword({ email, password });
  }
  if (result.error) {
    showAuthLoading(false);
    const msgs = {
      'Invalid login credentials': 'E-Mail oder Passwort falsch.',
      'Email not confirmed': 'Bitte erst die E-Mail bestätigen.',
      'User already registered': 'Diese E-Mail ist bereits registriert.'
    };
    showAuthError(msgs[result.error.message] || result.error.message);
  }
}
async function handleGoogleAuth() {
  const { error } = await db.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.href } });
  if (error) showAuthError('Google Login fehlgeschlagen: ' + error.message);
}
async function handleLogout() { hideUserMenu(); await db.auth.signOut(); }
function showUserMenu() {
  document.getElementById('userMenu').style.display = 'block';
  document.getElementById('userMenuOverlay').style.display = 'block';
}
function hideUserMenu() {
  document.getElementById('userMenu').style.display = 'none';
  document.getElementById('userMenuOverlay').style.display = 'none';
}

// ---------- Data ----------
async function loadLogs() {
  if (!currentUser || isLoading) return;
  isLoading = true; setSyncing(true);
  try {
    const { data, error } = await db.from('pullup_log').select('*')
      .eq('user_id', currentUser.id).order('created_at', { ascending: false }).limit(5000);
    if (error) throw error;
    logs = data.map(r => ({ id: r.id, date: r.log_date, reps: r.reps, weight: parseFloat(r.weight) || 0, created: r.created_at }));
  } catch (e) {
    showToast('⚠️ ' + (e.message || 'Offline'), 3000);
  } finally {
    isLoading = false; setSyncing(false); render(); logsLoaded = true;
  }
}

function stats() {
  const today = todayStr();
  const todayReps = logs.filter(l => l.date === today).reduce((a, l) => a + l.reps, 0);
  const curWeight = logs.length ? logs[0].weight : 0;
  const withReps = logs.filter(l => l.reps > 0);
  const maxW = withReps.length ? Math.max(...withReps.map(l => l.weight)) : null;
  return { todayReps, curWeight, maxW };
}

async function insertLog(reps, weight) {
  const tmp = { id: 'tmp' + Date.now(), date: todayStr(), reps, weight, created: new Date().toISOString() };
  logs.unshift(tmp);
  render();
  setSyncing(true);
  const { data, error } = await db.from('pullup_log')
    .insert({ user_id: currentUser.id, log_date: tmp.date, reps, weight }).select().single();
  setSyncing(false);
  if (error) {
    logs = logs.filter(l => l !== tmp);
    render();
    showToast('⚠️ ' + error.message, 3000);
    return;
  }
  tmp.id = data.id;
}

function addReps() {
  if (!currentUser) return;
  if (navigator.vibrate) navigator.vibrate(10);
  const c = document.getElementById('clicker');
  c.classList.remove('press'); void c.offsetWidth; c.classList.add('press');
  const { curWeight } = stats();
  insertLog(settings.repStep, curWeight);
}
function addWeight(dir) {
  if (!currentUser) return;
  const { curWeight } = stats();
  let w = Math.round((curWeight + dir * settings.step) * 10) / 10;
  if (w < -50) w = -50;
  insertLog(0, w);
}
async function undoLast() {
  if (!logs.length) return;
  const last = logs[0];
  logs.shift(); render();
  if (!String(last.id).startsWith('tmp')) {
    const { error } = await db.from('pullup_log').delete().eq('id', last.id);
    if (error) { logs.unshift(last); render(); showToast('⚠️ ' + error.message, 3000); return; }
  }
  showToast('Rückgängig');
}
function setRepStep(n) { settings.repStep = n; persistSettings(); render(); }

// ---------- Render ----------
function render() {
  const { todayReps, curWeight, maxW } = stats();
  const pct = Math.min(100, (todayReps / settings.goal) * 100);
  const fill = document.getElementById('goalFill');
  fill.style.width = pct + '%';
  fill.classList.toggle('done', todayReps >= settings.goal);
  document.getElementById('goalCount').textContent =
    `${todayReps} / ${settings.goal}` + (todayReps >= settings.goal ? ' 🎉' : '');
  document.getElementById('maxValue').textContent = maxW === null ? '–' : (maxW > 0 ? '+' : '') + fmt(maxW);
  document.getElementById('maxUnit').style.display = maxW === null ? 'none' : 'inline';
  document.getElementById('curWeight').textContent = (curWeight > 0 ? '+' : '') + fmt(curWeight);
  document.getElementById('repStepLabel').textContent = '+' + settings.repStep;
  renderPlates(curWeight);
  renderDigits(todayReps);
  renderStreak();
  document.getElementById('repChips').innerHTML = [1, 2, 3, 5, 10].map(n =>
    `<button class="chip ${settings.repStep === n ? 'active' : ''}" onclick="setRepStep(${n})">${n}</button>`).join('');
}

// ---------- Gewichtsscheiben auf dem Ständer ----------
const MAX_PLATES = 12;
function renderPlates(w) {
  const box = document.getElementById('pinPlates');
  if (!box) return;
  let n = w > 0 ? Math.max(1, Math.round(w / settings.step)) : 0;
  const visible = Math.min(n, MAX_PLATES);
  box.style.setProperty('--h', Math.min(6, 51 / Math.max(visible, 1)) + 'cqw');
  const more = document.getElementById('plateMore');
  more.textContent = n > MAX_PLATES ? '×' + n : '';

  const live = [...box.querySelectorAll('.plate:not(.lifting)')];
  const diff = visible - live.length;
  const animate = logsLoaded && Math.abs(diff) === 1;
  if (diff > 0) {
    for (let i = live.length; i < visible; i++) {
      const p = document.createElement('span');
      p.className = 'plate' + (animate ? ' drop' : '');
      p.style.setProperty('--i', i);
      box.appendChild(p);
    }
    if (animate) {
      if (navigator.vibrate) setTimeout(() => navigator.vibrate(15), 340);
      const sc = document.getElementById('pinScene');
      setTimeout(() => { sc.classList.remove('thud'); void sc.offsetWidth; sc.classList.add('thud'); }, 340);
    }
  } else if (diff < 0) {
    live.slice(visible).forEach(p => {
      if (animate) {
        p.classList.remove('drop'); p.classList.add('lifting');
        setTimeout(() => p.remove(), 380);
      } else p.remove();
    });
  }
}

// ---------- Klick-Zähler ----------
function renderDigits(n) {
  const win = document.getElementById('clkDigits');
  if (!win) return;
  if (!win.children.length) {
    win.innerHTML = Array.from({ length: 4 }, () =>
      `<span class="clk-digit"><span class="clk-strip">${[...'0123456789'].map(d => `<span>${d}</span>`).join('')}</span></span>`).join('');
  }
  const s = String(Math.min(9999, Math.max(0, n))).padStart(4, '0');
  [...win.querySelectorAll('.clk-strip')].forEach((st, i) => {
    st.style.transform = `translateY(-${s[i] * 10}%)`;
  });
}

// ---------- Tabs ----------
function switchTab(name) {
  document.querySelectorAll('.bn-tab').forEach(t => t.classList.toggle('active', t.dataset.view === name));
  document.querySelectorAll('#appScreen .view').forEach(v => v.classList.toggle('active', v.id === 'view-' + name));
  window.scrollTo(0, 0);
}

// ---------- Streak ----------
let calOffset = 0; // Monate relativ zu heute
function dateAdd(str, n) {
  const [y, m, d] = str.split('-').map(Number);
  const dt = new Date(y, m - 1, d + n);
  const p = x => String(x).padStart(2, '0');
  return `${dt.getFullYear()}-${p(dt.getMonth() + 1)}-${p(dt.getDate())}`;
}
function dayTotals() {
  const t = {};
  logs.forEach(l => { if (l.reps > 0) t[l.date] = (t[l.date] || 0) + l.reps; });
  return t;
}
function calMove(d) { calOffset = Math.min(0, calOffset + d); renderStreak(); }
function renderStreak() {
  const el = document.getElementById('calGrid');
  if (!el) return;
  const totals = dayTotals();
  const goal = settings.goal;
  const hit = d => (totals[d] || 0) >= goal;
  const today = todayStr();

  // aktuelle Serie (heute zählt erst, wenn erreicht – bricht aber nicht, solange der Tag läuft)
  let cur = 0;
  let d = hit(today) ? today : dateAdd(today, -1);
  while (hit(d)) { cur++; d = dateAdd(d, -1); }

  // längste Serie + Gesamtzahl
  const days = Object.keys(totals).filter(hit).sort();
  let best = 0, run = 0, prev = null;
  days.forEach(x => {
    run = (prev && dateAdd(prev, 1) === x) ? run + 1 : 1;
    best = Math.max(best, run); prev = x;
  });
  const monthPrefix = today.slice(0, 7);
  const monthCount = days.filter(x => x.startsWith(monthPrefix)).length;

  document.getElementById('streakCur').textContent = cur;
  document.getElementById('streakBest').textContent = Math.max(best, cur);
  document.getElementById('streakTotal').textContent = days.length;
  document.getElementById('streakMonth').textContent = monthCount;
  document.getElementById('streakHint').textContent = hit(today)
    ? 'Heute geschafft 🎉'
    : `Heute noch ${goal - (totals[today] || 0)} Reps bis zum Ziel`;

  // Kalender
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth() + calOffset, 1);
  const y = first.getFullYear(), m = first.getMonth();
  document.getElementById('calTitle').textContent =
    first.toLocaleDateString('de-AT', { month: 'long', year: 'numeric' });
  const lead = (first.getDay() + 6) % 7; // Montag zuerst
  const dim = new Date(y, m + 1, 0).getDate();
  const p = x => String(x).padStart(2, '0');
  let html = '<span></span>'.repeat(lead);
  for (let i = 1; i <= dim; i++) {
    const ds = `${y}-${p(m + 1)}-${p(i)}`;
    const reps = totals[ds] || 0;
    const future = ds > today;
    const pct = Math.min(100, Math.round(reps / goal * 100));
    const cls = future ? 'future' : hit(ds) ? 'done' : reps > 0 ? 'part' : '';
    html += future
      ? `<span class="cal-day future">${i}</span>`
      : `<button class="cal-day ${cls} ${ds === today ? 'today' : ''}" style="--p:${pct}%" onclick="openDay('${ds}')" aria-label="${i}.: ${reps} Reps">${i}</button>`;
  }
  el.innerHTML = html;
}

// ---------- Tagesdetail ----------
function openDay(ds) {
  const entries = logs.filter(l => l.date === ds && l.reps > 0);
  const total = entries.reduce((a, l) => a + l.reps, 0);
  const goal = settings.goal;
  const done = total >= goal;
  const [y, m, d] = ds.split('-').map(Number);
  document.getElementById('dayDate').textContent =
    new Date(y, m - 1, d).toLocaleDateString('de-AT', { weekday: 'long', day: 'numeric', month: 'long' });
  document.getElementById('dayStatus').textContent = done ? 'Ziel erreicht 🎉'
    : total ? `Noch ${goal - total} bis zum Ziel` : 'Kein Training';
  document.getElementById('dayStatus').className = 'day-status' + (done ? ' ok' : '');
  document.getElementById('dayReps').textContent = total;
  document.getElementById('dayGoal').textContent = '/ ' + goal;

  const ring = document.getElementById('dayRingFill');
  const C = 2 * Math.PI * 52;
  ring.style.strokeDasharray = C;
  ring.style.strokeDashoffset = C;
  ring.classList.toggle('ok', done);
  requestAnimationFrame(() => requestAnimationFrame(() => {
    ring.style.strokeDashoffset = C * (1 - Math.min(1, total / goal));
  }));

  document.getElementById('daySets').textContent = entries.length;
  const maxW = entries.length ? Math.max(...entries.map(l => l.weight)) : null;
  document.getElementById('dayMaxW').textContent = maxW === null ? '–' : (maxW > 0 ? '+' : '') + fmt(maxW) + ' kg';
  const times = entries.map(l => new Date(l.created)).filter(t => !isNaN(t)).sort((a, b) => a - b);
  const tf = t => t.toLocaleTimeString('de-AT', { hour: '2-digit', minute: '2-digit' });
  document.getElementById('dayTime').textContent = !times.length ? '–'
    : tf(times[0]) === tf(times[times.length - 1]) ? tf(times[0]) : `${tf(times[0])}–${tf(times[times.length - 1])}`;

  // Aufteilung nach Gewicht
  const byW = {};
  entries.forEach(l => { byW[l.weight] = (byW[l.weight] || 0) + l.reps; });
  const rows = Object.entries(byW).map(([w, r]) => [parseFloat(w), r]).sort((a, b) => b[0] - a[0]);
  const top = Math.max(1, ...rows.map(r => r[1]));
  document.getElementById('dayBreak').innerHTML = rows.length ? `<div class="day-sec">NACH GEWICHT</div>` +
    rows.map(([w, r]) => `<div class="db-row">
      <span class="db-w">${w > 0 ? '+' : ''}${fmt(w)} kg</span>
      <span class="db-bar"><i style="width:${r / top * 100}%"></i></span>
      <span class="db-r">${r}</span></div>`).join('') : '';

  document.getElementById('dayModal').classList.add('open');
}
function closeDay() { document.getElementById('dayModal').classList.remove('open'); }

// ---------- Init ----------
document.addEventListener('DOMContentLoaded', () => {
  loadSettings();
  render();
  db.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_OUT' || !session?.user) {
      currentUser = null; logs = []; logsLoaded = false;
      document.getElementById('appScreen').style.display = 'none';
      document.getElementById('authScreen').style.display = 'flex';
      document.getElementById('authBtn').dataset.mode = 'login';
      showAuthLoading(false);
      return;
    }
    const isNew = event === 'SIGNED_IN' || event === 'INITIAL_SESSION';
    const changed = currentUser?.id !== session.user.id;
    currentUser = session.user;
    if (isNew || changed) {
      document.getElementById('authScreen').style.display = 'none';
      document.getElementById('appScreen').style.display = 'block';
      document.getElementById('userMenuEmail').textContent = currentUser.email || 'Eingeloggt';
      loadSettings();
      if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
      await loadLogs();
    }
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && currentUser) loadLogs();
  });
});
