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
    isLoading = false; setSyncing(false); render();
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
  document.getElementById('repChips').innerHTML = [1, 2, 3, 5, 10].map(n =>
    `<button class="chip ${settings.repStep === n ? 'active' : ''}" onclick="setRepStep(${n})">${n}</button>`).join('');
}

// ---------- Init ----------
document.addEventListener('DOMContentLoaded', () => {
  loadSettings();
  render();
  db.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_OUT' || !session?.user) {
      currentUser = null; logs = [];
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
