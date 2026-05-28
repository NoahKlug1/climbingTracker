// ============================================================
// SUPABASE
// ============================================================
const SUPABASE_URL = 'https://fdgtzilbwjiuetrheoly.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZkZ3R6aWxid2ppdWV0cmhlb2x5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2NjczOTksImV4cCI6MjA5NDI0MzM5OX0.4SPYm4eypp7o143faPEkLAltsptS6iT1JHAitfhQEfY';
const { createClient } = supabase;
// persistSession:true + localStorage ensures token survives PWA close/reopen on iOS
const db = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: true,
    storage: localStorage,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

let currentUser = null;

// ============================================================
// DATA HELPERS
// ============================================================
function loadData(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
  catch { return fallback; }
}
function saveData(key, data) {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch(e) {}
}

let workouts     = loadData('cl_workouts', []);
let sleepData    = loadData('cl_sleep',    []);
let routeEntries = loadData('cl_routes',   []);

// ============================================================
// EXERCISES CONFIG
// ============================================================
const EXERCISES = {
  pullups: {
    id: 'pullups', name: 'KLIMMZÜGE', icon: '🧗',
    fields: [
      { id:'reps',   label:'Wiederholungen',    type:'stepper', min:1,  max:50,   step:1,   default:8,  unit:'reps' },
      { id:'weight', label:'Zusatzgewicht (kg)', type:'stepper', min:-100,  max:9999, step:2.5, default:0,  unit:'kg'  }
    ]
  },
  hangboard: {
    id: 'hangboard', name: 'FINGERBOARD', icon: '🪨',
    fields: [
      { id:'duration', label:'Haltedauer (Sek.)', type:'stepper', min:1, max:120,  step:1,   default:10, unit:'sek'   },
      { id:'sets',     label:'Sätze',             type:'stepper', min:1, max:20,   step:1,   default:6,  unit:'sätze' },
      { id:'weight',   label:'Zusatzgew. (kg)',   type:'stepper', min:-100, max:9999, step:2.5, default:0,  unit:'kg'   }
    ]
  },
  deadhang: {
    id: 'deadhang', name: 'DEAD HANG', icon: '⏱️',
    fields: [
      { id:'duration', label:'Dauer (Sek.)', type:'stepper', min:1, max:300, step:1, default:30, unit:'sek' }
    ]
  },
  lsit: {
    id: 'lsit', name: 'L-SIT', icon: '💪',
    fields: [
      { id:'duration', label:'Dauer (Sek.)', type:'stepper', min:1, max:120, step:1, default:10, unit:'sek'   },
      { id:'sets',     label:'Sätze',        type:'stepper', min:1, max:10,  step:1, default:3,  unit:'sätze' }
    ]
  }
};

const VIEW_MAP = { pullups:'klimmzuege', hangboard:'fingerboard', deadhang:'deadhang', lsit:'lsit' };

// per-exercise UI state
const viewSteppers = {};
const viewDates    = {};

function today() { return new Date().toISOString().split('T')[0]; }

// ============================================================
// AUTH UI
// ============================================================
function showAuthMode(mode) {
  document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
  event.target.classList.add('active');
  const btn = document.getElementById('authBtn');
  btn.textContent = mode === 'login' ? 'ANMELDEN' : 'REGISTRIEREN';
  btn.dataset.mode = mode;
  document.getElementById('authError').style.display = 'none';
}
function showAuthLoading(show) {
  document.getElementById('authLoading').style.display = show ? 'flex' : 'none';
  document.getElementById('authBtn').style.display     = show ? 'none' : 'block';
}
function showAuthError(msg) {
  const el = document.getElementById('authError');
  el.textContent = msg; el.style.display = 'block';
}
async function handleAuth() {
  const email    = document.getElementById('authEmail').value.trim();
  const password = document.getElementById('authPassword').value;
  const mode     = document.getElementById('authBtn').dataset.mode || 'login';
  if (!email || !password) { showAuthError('Bitte E-Mail und Passwort eingeben.'); return; }
  if (password.length < 6)  { showAuthError('Passwort muss mindestens 6 Zeichen haben.'); return; }
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
      'Email not confirmed':        'Bitte erst die E-Mail bestätigen.',
      'User already registered':    'Diese E-Mail ist bereits registriert.'
    };
    showAuthError(msgs[result.error.message] || result.error.message);
  }
}
async function handleGoogleAuth() {
  const { error } = await db.auth.signInWithOAuth({
    provider: 'google', options: { redirectTo: window.location.href }
  });
  if (error) showAuthError('Google Login fehlgeschlagen: ' + error.message);
}
async function handleLogout() {
  hideUserMenu();
  await db.auth.signOut();
}
function showUserMenu() {
  document.getElementById('userMenu').style.display        = 'block';
  document.getElementById('userMenuOverlay').style.display = 'block';
}
function hideUserMenu() {
  document.getElementById('userMenu').style.display        = 'none';
  document.getElementById('userMenuOverlay').style.display = 'none';
}

// ============================================================
// SHOW APP / SHOW AUTH  (called from multiple places)
// ============================================================
function showApp(user) {
  currentUser = user;
  document.getElementById('authScreen').style.display = 'none';
  document.getElementById('appScreen').style.display  = 'block';
  document.getElementById('userMenuEmail').textContent = user.email || 'Eingeloggt';
  // Always render local data immediately so the UI is never blank
  renderAll();
}
function showAuth() {
  currentUser     = null;
  workouts        = [];
  sleepData       = [];
  routeEntries    = [];
  isLoadingFromDB = false;
  document.getElementById('appScreen').style.display  = 'none';
  document.getElementById('authScreen').style.display = 'flex';
  document.getElementById('authBtn').dataset.mode = 'login';
  setSyncing(false);
}

// ============================================================
// DATABASE
// ============================================================
let isLoadingFromDB = false;

async function loadFromDB() {
  if (!currentUser)      return;
  if (isLoadingFromDB)   return;
  isLoadingFromDB = true;
  setSyncing(true);

  try {
    // workouts
    const wRes = await db.from('workouts').select('*')
      .eq('user_id', currentUser.id).order('workout_date', { ascending: false });
    if (!wRes.error && wRes.data) {
      workouts = wRes.data.map(r => ({
        id: r.id, date: r.workout_date + 'T12:00:00.000Z',
        exerciseId: r.exercise_id, exerciseName: r.exercise_name,
        exerciseIcon: r.exercise_icon, sets: r.sets || [], notes: ''
      }));
      saveData('cl_workouts', workouts);
    }

    // sleep
    const sRes = await db.from('sleep_entries').select('*')
      .eq('user_id', currentUser.id).order('sleep_date', { ascending: false });
    if (!sRes.error && sRes.data) {
      sleepData = sRes.data.map(r => ({
        id: r.id, date: r.sleep_date, hours: parseFloat(r.hours) || 0,
        quality: r.quality || 3, bedtime: r.bedtime, wakeup: r.wakeup,
        hrv: r.hrv, notes: r.notes || ''
      }));
      saveData('cl_sleep', sleepData);
    }

    // routes
    const rRes = await db.from('routes').select('*')
      .eq('user_id', currentUser.id).order('created_at', { ascending: false });
    if (!rRes.error && rRes.data) {
      routeEntries = rRes.data.map(r => ({
        id: r.id, grade: r.grade, flash: !!r.flash, date: r.created_at
      }));
      saveData('cl_routes', routeEntries);
    }
  } catch (err) {
    console.warn('loadFromDB error:', err);
  } finally {
    isLoadingFromDB = false;
    setSyncing(false);
    renderAll();
  }
}

async function saveWorkoutToDB(workout) {
  if (!currentUser) return workout;
  setSyncing(true);
  try {
    const { data, error } = await db.from('workouts').insert({
      user_id:      currentUser.id,
      workout_date: workout.date.split('T')[0],
      exercise_id:  workout.exerciseId,
      exercise_name: workout.exerciseName,
      exercise_icon: workout.exerciseIcon,
      sets:         workout.sets
    }).select().single();
    if (error) { showToast('⚠️ Sync-Fehler: ' + error.message); return workout; }
    return { ...workout, id: data.id };
  } finally { setSyncing(false); }
}

async function saveSleepToDB(entry) {
  if (!currentUser) return entry;
  setSyncing(true);
  try {
    const { data, error } = await db.from('sleep_entries').insert({
      user_id:    currentUser.id, sleep_date: entry.date,
      hours:      entry.hours,   quality:    entry.quality,
      bedtime:    entry.bedtime || null, wakeup: entry.wakeup || null,
      hrv:        entry.hrv || null,     notes:  entry.notes || ''
    }).select().single();
    if (error) { showToast('⚠️ Sync-Fehler: ' + error.message); return entry; }
    return { ...entry, id: data.id };
  } finally { setSyncing(false); }
}

async function saveRouteToDB(entry) {
  if (!currentUser) return entry;
  setSyncing(true);
  try {
    const { data, error } = await db.from('routes').insert({
      user_id: currentUser.id, grade: entry.grade, flash: entry.flash
    }).select().single();
    if (error) {
      showToast('⚠️ Route-Fehler: ' + error.message, 4000);
      return entry;
    }
    return { ...entry, id: data.id, date: data.created_at };
  } finally { setSyncing(false); }
}

function setSyncing(active) {
  const dot = document.getElementById('syncDot');
  if (dot) dot.className = 'sync-dot' + (active ? ' syncing' : '');
}

// ============================================================
// INIT — robust for PWA/iOS background-resume
// ============================================================
document.addEventListener('DOMContentLoaded', async () => {
  // Init per-exercise state
  const t = today();
  Object.entries(EXERCISES).forEach(([exId, ex]) => {
    viewSteppers[exId] = {};
    ex.fields.forEach(f => { viewSteppers[exId][f.id] = f.default; });
    viewDates[exId] = t;
  });
  document.getElementById('sleepDate').value = t;
  initNav();
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});

  // ── Step 1: check for an existing session synchronously from localStorage ──
  // This covers PWA cold-start and background-resume without waiting for network
  const { data: { session: existingSession } } = await db.auth.getSession();
  if (existingSession?.user) {
    showApp(existingSession.user);
    // Load fresh DB data in background — UI already shows local data
    loadFromDB();
  }

  // ── Step 2: subscribe to all future auth events ──
  db.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_OUT') { showAuth(); return; }

    // SIGNED_IN, INITIAL_SESSION, TOKEN_REFRESHED, USER_UPDATED
    if (session?.user) {
      const justLoggedIn = !currentUser || currentUser.id !== session.user.id;
      if (justLoggedIn) {
        showApp(session.user);
        loadFromDB();
      } else {
        // Token refreshed – update user ref, keep UI as-is
        currentUser = session.user;
        setSyncing(false);
      }
    }
  });

  // ── Step 3: on PWA foreground-resume re-fetch data ──
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && currentUser && !isLoadingFromDB) {
      loadFromDB();
    }
  });
});

function initNav() {
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const view = tab.dataset.view;
      document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.view').forEach(v  => v.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById('view-' + view).classList.add('active');
    });
  });
}

// ============================================================
// RENDER ALL
// ============================================================
function renderAll() {
  renderSleepView();
  Object.entries(VIEW_MAP).forEach(([exId, vk]) => renderExerciseView(exId, vk));
  renderRouteWall();
  renderCoaches();
}

// ============================================================
// EXERCISE VIEWS
// ============================================================
function renderExerciseView(exId, viewKey) {
  renderExerciseForm(exId, viewKey);
  renderExercisePR(exId, viewKey);
  renderExerciseChart(exId, viewKey);
}

function renderExerciseForm(exId, viewKey) {
  const container = document.getElementById(viewKey + '-form');
  if (!container) return;
  const ex   = EXERCISES[exId];
  const vals = viewSteppers[exId] || {};
  const date = viewDates[exId] || today();
  const t    = today();

  const fieldHTML = ex.fields.map(f => {
    const val = vals[f.id] !== undefined ? vals[f.id] : f.default;
    return `
    <div class="inline-field">
      <div class="inline-field-label">${f.label}</div>
      <div class="stepper">
        <button class="stepper-btn" onclick="viewStep('${exId}','${f.id}',-${f.step})">−</button>
        <span class="stepper-val" id="vs_${exId}_${f.id}">${fmtVal(val, f)}</span>
        <span class="stepper-unit">${f.unit}</span>
        <button class="stepper-btn" onclick="viewStep('${exId}','${f.id}',${f.step})">+</button>
      </div>
    </div>`;
  }).join('');

  container.innerHTML = `
    <div class="card inline-form-card">
      ${fieldHTML}
      <div class="date-row">
        <input type="date" class="date-input-visible"
          id="datePicker_${exId}" value="${date}" max="${t}"
          onchange="setViewDate('${exId}', this.value)">
        <button class="today-pill" id="todayPill_${exId}"
          style="${date === t ? 'display:none' : ''}"
          onclick="setViewDate('${exId}','${t}')">HEUTE</button>
      </div>
      <button class="btn btn-primary add-entry-btn" onclick="addEntry('${exId}')">
        + EINTRAG HINZUFÜGEN
      </button>
    </div>`;
}

function fmtVal(val, field) {
  if (!field || field.step < 1) return typeof val === 'number' ? val.toFixed(1) : val;
  return val;
}

function setViewDate(exId, val) {
  if (!val) return;
  viewDates[exId] = val;
  const picker = document.getElementById('datePicker_' + exId);
  if (picker && picker.value !== val) picker.value = val;
  const pill = document.getElementById('todayPill_' + exId);
  if (pill) pill.style.display = (val === today()) ? 'none' : '';
}

function viewStep(exId, fId, delta) {
  const field = EXERCISES[exId].fields.find(f => f.id === fId);
  if (!field) return;
  let val = (viewSteppers[exId][fId] !== undefined ? viewSteppers[exId][fId] : field.default) + delta;
  val = Math.min(field.max, Math.max(field.min, val));
  val = Math.round(val / field.step) * field.step;
  if (field.step < 1) val = parseFloat(val.toFixed(1));
  viewSteppers[exId][fId] = val;
  const el = document.getElementById(`vs_${exId}_${fId}`);
  if (el) el.textContent = fmtVal(val, field);
}

async function addEntry(exId) {
  const ex   = EXERCISES[exId];
  const vals = viewSteppers[exId];
  const set  = {};
  ex.fields.forEach(f => { set[f.id] = vals[f.id] !== undefined ? vals[f.id] : f.default; });
  const vk   = VIEW_MAP[exId];
  const date = (viewDates[exId] || today()) + 'T12:00:00.000Z';

  let workout = { id: Date.now(), date, exerciseId: ex.id, exerciseName: ex.name, exerciseIcon: ex.icon, sets: [set], notes: '' };
  workout = await saveWorkoutToDB(workout);
  workouts.unshift(workout);
  saveData('cl_workouts', workouts);
  showToast('✅ Eintrag gespeichert!');
  renderExerciseView(exId, vk);
  renderCoaches();
}

// ---- PR ----
function renderExercisePR(exId, viewKey) {
  const el = document.getElementById(viewKey + '-pr');
  if (!el) return;
  const data = workouts.filter(w => w.exerciseId === exId);
  if (data.length === 0) { el.innerHTML = `<div class="pr-empty">Noch kein Eintrag – leg los! 🏆</div>`; return; }
  const allSets = data.flatMap(w => w.sets || []);
  let parts = [];
  if (allSets.some(s => s.reps     > 0)) parts.push(`<span class="pr-val">${Math.max(...allSets.map(s=>s.reps||0))}</span><span class="pr-unit"> reps</span>`);
  if (allSets.some(s => s.duration > 0)) parts.push(`<span class="pr-val">${Math.max(...allSets.map(s=>s.duration||0))}</span><span class="pr-unit"> sek</span>`);
  if (allSets.some(s => s.weight   > 0)) parts.push(`<span class="pr-val">${Math.max(...allSets.map(s=>s.weight||0))}</span><span class="pr-unit"> kg</span>`);
  el.innerHTML = `
    <div class="card pr-card">
      <div class="pr-label">🏆 BESTLEISTUNG</div>
      <div class="pr-values">${parts.join('<span class="pr-sep"> · </span>')}</div>
      <div class="pr-sub">${data.length} Einträge</div>
    </div>`;
}

// ---- CHART ----
function renderExerciseChart(exId, viewKey) {
  const el   = document.getElementById(viewKey + '-chart');
  if (!el) return;
  const data = workouts.filter(w => w.exerciseId === exId);
  if (data.length < 2) { el.innerHTML = `<div class="chart-empty">Mindestens 2 Einträge für den Verlauf</div>`; return; }

  const points = data.slice().reverse().map(w => {
    const s = w.sets || [];
    let val = 0;
    if      (s.some(x => x.reps))     val = Math.max(...s.map(x => x.reps     || 0));
    else if (s.some(x => x.duration)) val = Math.max(...s.map(x => x.duration || 0));
    else if (s.some(x => x.weight))   val = Math.max(...s.map(x => x.weight   || 0));
    return { label: w.date.split('T')[0].slice(5), val };
  });

  const svgW   = Math.max(300, (window.innerWidth || 400) - 52);
  const svgH   = 100;
  const maxV   = Math.max(...points.map(p => p.val), 1);
  const n      = points.length;
  const coords = points.map((p, i) => ({
    x: 14 + (i / Math.max(n - 1, 1)) * (svgW - 28),
    y: svgH - 22 - (p.val / maxV) * 65, val: p.val, label: p.label
  }));
  const path = coords.map((c, i) => `${i === 0 ? 'M' : 'L'}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ');
  const last  = coords[coords.length - 1];
  const dots  = coords.map(c => `<circle cx="${c.x.toFixed(1)}" cy="${c.y.toFixed(1)}" r="3.5" fill="var(--accent)"/>`).join('');
  const lblStep = Math.max(1, Math.floor(n / 5));

  el.innerHTML = `
    <div class="card">
      <div class="card-title">VERLAUF</div>
      <div class="chart-wrap">
        <svg width="${svgW}" height="${svgH}" viewBox="0 0 ${svgW} ${svgH}">
          <defs><linearGradient id="lg_${viewKey}" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stop-color="var(--accent)" stop-opacity="0.28"/>
            <stop offset="100%" stop-color="var(--accent)" stop-opacity="0"/>
          </linearGradient></defs>
          <path d="${path} L${last.x.toFixed(1)},${svgH-22} L${coords[0].x.toFixed(1)},${svgH-22} Z" fill="url(#lg_${viewKey})"/>
          <path d="${path}" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
          ${dots}
          <text x="${last.x.toFixed(1)}" y="${(last.y-9).toFixed(1)}" text-anchor="middle"
                fill="var(--gold)" font-size="9" font-family="Inter" font-weight="700">${last.val}</text>
          <line x1="14" y1="${svgH-22}" x2="${svgW-14}" y2="${svgH-22}" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>
          ${coords.filter((_,i) => i % lblStep === 0).map(c =>
            `<text x="${c.x.toFixed(1)}" y="${svgH-6}" text-anchor="middle"
                   fill="rgba(255,255,255,0.3)" font-size="7" font-family="Inter">${c.label}</text>`).join('')}
        </svg>
      </div>
    </div>`;
}

// ============================================================
// SLEEP VIEW
// ============================================================
async function saveSleepEntry() {
  const date    = document.getElementById('sleepDate').value;
  const bedtime = document.getElementById('sleepBedtime').value;
  const wakeup  = document.getElementById('sleepWakeup').value;
  const quality = parseInt(document.getElementById('sleepQuality').value);
  const hrv     = parseInt(document.getElementById('sleepHRV').value) || null;
  const notes   = document.getElementById('sleepNotes').value;
  if (!date || !bedtime || !wakeup) { showToast('Bitte Datum & Zeiten eingeben!'); return; }
  const bed = parseTime(bedtime), wake = parseTime(wakeup);
  let hours = (wake - bed) / 3600;
  if (hours < 0) hours += 24;
  let entry = { id: Date.now(), date, bedtime, wakeup, hours: Math.round(hours*10)/10, quality, hrv, notes };
  entry = await saveSleepToDB(entry);
  sleepData = sleepData.filter(s => s.date !== date);
  sleepData.unshift(entry);
  sleepData.sort((a, b) => new Date(b.date) - new Date(a.date));
  saveData('cl_sleep', sleepData);
  showToast('💤 Schlafdaten gespeichert!');
  renderSleepView();
  renderCoaches();
  document.getElementById('sleepNotes').value = '';
  document.getElementById('sleepHRV').value   = '';
}

function parseTime(str) {
  const [h, m] = str.split(':').map(Number);
  return h * 3600 + m * 60;
}

function renderSleepView() {
  renderSleepScoreCard();
  renderSleepStats();
}

function renderSleepScoreCard() {
  const el = document.getElementById('sleepScoreCard');
  if (!el) return;
  if (sleepData.length === 0) { el.innerHTML = ''; return; }
  const recent     = sleepData.slice(0, 7);
  const avgHours   = recent.reduce((a,b)=>a+b.hours,0) / recent.length;
  const avgQuality = recent.reduce((a,b)=>a+b.quality,0) / recent.length;
  const score      = Math.round((avgHours/8)*50 + (avgQuality/5)*50);
  const col        = score>=80?'var(--green)':score>=60?'var(--gold)':score>=40?'var(--warn)':'var(--red)';
  el.innerHTML = `
    <div class="card sleep-score-big">
      <div class="sleep-score-ring">
        <div class="sleep-score-number" style="color:${col}">${score}</div>
        <div class="sleep-score-tag">SCHLAF-SCORE</div>
        <div class="sleep-score-sub">Ø letzte 7 Nächte</div>
      </div>
      <div class="sleep-meta">
        <div class="sleep-meta-item">
          <span class="sleep-meta-val">${avgHours.toFixed(1)}h</span>
          <span class="sleep-meta-label">Ø Dauer</span>
        </div>
        <div class="sleep-meta-sep"></div>
        <div class="sleep-meta-item">
          <span class="sleep-meta-val">${'★'.repeat(Math.round(avgQuality))}</span>
          <span class="sleep-meta-label">Ø Qualität</span>
        </div>
      </div>
    </div>`;
}

function renderSleepStats() {
  const container = document.getElementById('sleepStats');
  if (!container) return;
  if (sleepData.length === 0) {
    container.innerHTML = `<div class="empty-state"><span class="empty-state-icon">🌙</span><div class="empty-state-text">Noch keine Schlafdaten</div></div>`;
    return;
  }
  const recent = sleepData.slice(0, 7).slice().reverse();
  container.innerHTML = `
    <div class="card">
      <div class="card-title">LETZTE 7 NÄCHTE</div>
      <div class="chart-wrap">${renderSleepChart(recent.map(s=>({label:s.date.slice(5),value:s.hours})))}</div>
      <div style="margin-top:10px;">
        ${sleepData.slice(0,10).map(s=>`
          <div class="stat-row">
            <span style="font-size:.75rem;color:var(--t2)">${s.date}</span>
            <span style="display:flex;align-items:center;gap:8px;">
              <span style="font-size:.9rem;font-weight:700;color:var(--t1)">${s.hours}h</span>
              <span style="font-size:.75rem;color:var(--gold)">${'★'.repeat(s.quality)}</span>
            </span>
          </div>`).join('')}
      </div>
    </div>`;
}

function renderSleepChart(data) {
  const svgW = Math.max(300, (window.innerWidth||400)-52);
  const svgH = 100;
  const max  = Math.max(...data.map(d=>d.value), 8);
  const n    = data.length;
  const barW = Math.floor((svgW-20)/Math.max(n,1))-2;
  const bars = data.map((d,i)=>{
    const barH=Math.round((d.value/max)*68);
    const x=10+i*(barW+2), y=svgH-22-barH;
    const col=d.value>=7.5?'#FFD60A':d.value>=6?'#30D158':'#FF6B35';
    return `<rect x="${x}" y="${y}" width="${barW}" height="${barH}" rx="3" fill="${col}" opacity=".85"/>
      <text x="${x+barW/2}" y="${y-3}" text-anchor="middle" fill="rgba(255,255,255,.6)" font-size="8" font-family="Inter">${d.value}h</text>
      <text x="${x+barW/2}" y="${svgH-5}" text-anchor="middle" fill="rgba(255,255,255,.3)" font-size="7" font-family="Inter">${d.label}</text>`;
  }).join('');
  const refY=svgH-22-Math.round((8/max)*68);
  return `<svg width="${svgW}" height="${svgH}" viewBox="0 0 ${svgW} ${svgH}">
    <line x1="10" y1="${refY}" x2="${svgW-10}" y2="${refY}" stroke="#FFD60A" stroke-width="1" stroke-dasharray="4,3" opacity=".35"/>
    <line x1="10" y1="${svgH-22}" x2="${svgW-10}" y2="${svgH-22}" stroke="rgba(255,255,255,.08)" stroke-width="1"/>
    ${bars}</svg>`;
}

// ============================================================
// KLETTERROUTEN
// ============================================================
const GRADE_ORDER = ['9a','8c','8b+','8b','8a+','8a','7c+','7c','7b+','7b','7a+','7a','6c+','6c','6b+','6b','6a+','6a','5c','5b','5a','4'];
const QD_POSITIONS = [
  {x:130,y:460},{x:205,y:445},{x:80,y:425},{x:258,y:408},{x:158,y:390},
  {x:100,y:368},{x:228,y:352},{x:72,y:330},{x:178,y:312},{x:262,y:295},
  {x:118,y:278},{x:198,y:258},{x:78,y:242},{x:248,y:226},{x:152,y:208},
  {x:104,y:188},{x:218,y:172},{x:168,y:148},{x:128,y:126},{x:202,y:106},
  {x:158,y:82},{x:176,y:56}
];

function gradeColor(count, hasFlash) {
  if (hasFlash && count===1) return '#FFD700';
  if (count>=10) return '#FF00FF';
  if (count>=7)  return '#FF3399';
  if (count>=5)  return '#FF6B35';
  if (count>=3)  return '#FFD60A';
  if (count>=2)  return '#30D158';
  return '#6699CC';
}

async function addRoute() {
  const grade = document.getElementById('routeGrade').value;
  const flash = document.getElementById('routeFlash').checked;
  let entry = { id: Date.now(), grade, flash, date: new Date().toISOString() };
  entry = await saveRouteToDB(entry);
  routeEntries.unshift(entry);
  saveData('cl_routes', routeEntries);
  showToast(flash ? `⚡ Flash! ${grade} geloggt!` : `✅ ${grade} geloggt!`);
  document.getElementById('routeFlash').checked = false;
  renderRouteWall();
}

function renderRouteWall() {
  const g = document.getElementById('quickdrawsGroup');
  if (!g) return;

  // Count climbed routes per grade
  const counts = {};
  routeEntries.forEach(r => {
    if (!counts[r.grade]) counts[r.grade] = { total:0, flash:0 };
    counts[r.grade].total++;
    if (r.flash) counts[r.grade].flash++;
  });

  // GRADE_ORDER[0]='4' (easiest) … GRADE_ORDER[21]='9a' (hardest)
  // QD_POSITIONS[0] = topmost position (y=56), QD_POSITIONS[21] = bottom (y=460)
  // So: gradeIndex 0 → positionIndex 21, gradeIndex 21 → positionIndex 0
  // i.e. positionIndex = (GRADE_ORDER.length - 1) - gradeIndex
  const maxIdx = GRADE_ORDER.length - 1;
  let svg = '';

  GRADE_ORDER.forEach((grade, gradeIdx) => {
    const posIdx = maxIdx - gradeIdx; // invert: hardest at top
    const pos    = QD_POSITIONS[posIdx];
    if (!pos) return;

    const info = counts[grade];
    if (!info) {
      // Grade not yet climbed – ghost quickdraw
      svg += `<g transform="translate(${pos.x-8},${pos.y-22})" opacity=".12">
        <ellipse cx="8" cy="4"  rx="6" ry="4" fill="none" stroke="#aaa" stroke-width="2"/>
        <rect x="6" y="8" width="4" height="14" rx="2" fill="#aaa" opacity=".4"/>
        <ellipse cx="8" cy="26" rx="6" ry="4" fill="none" stroke="#aaa" stroke-width="2"/>
      </g>`;
      return;
    }

    const { total, flash } = info;
    const col = gradeColor(total, flash > 0);
    const bw  = 46;
    const fw  = Math.max(2, Math.round(bw * Math.min(100, total * 8 + flash * 14) / 100));
    svg += `
      <g transform="translate(${pos.x-23},${pos.y-30})">
        <ellipse cx="23" cy="5"  rx="7" ry="4.5" fill="none" stroke="${col}" stroke-width="2.5" opacity=".95"/>
        <rect    x="21"  y="9"   width="4" height="18" rx="2" fill="${col}" opacity=".5"/>
        <ellipse cx="23" cy="31" rx="7" ry="4.5" fill="none" stroke="${col}" stroke-width="2.5" opacity=".95"/>
        <rect x="0" y="38" width="${bw}" height="15" rx="4" fill="rgba(0,0,0,.75)"/>
        <text x="${bw/2}" y="49" text-anchor="middle" fill="${col}" font-size="9" font-family="Inter" font-weight="700">${grade}${total>1?` ×${total}`:''}</text>
        ${flash>0?`<text x="${bw-2}" y="38.5" text-anchor="end" fill="#FFD700" font-size="8">⚡</text>`:''}
        <rect x="1" y="55" width="${bw-2}" height="5" rx="2.5" fill="rgba(255,255,255,.1)"/>
        <rect x="1" y="55" width="${fw}"   height="5" rx="2.5" fill="${col}" opacity=".9"/>
      </g>`;
  });

  g.innerHTML = svg;
}

// ============================================================
// KI COACHES
// ============================================================
function renderCoaches() {
  renderSleepCoach();
  Object.keys(EXERCISES).forEach(exId => renderExerciseCoach(exId, VIEW_MAP[exId]));
}

function coachTipHTML(t) {
  return `<div class="coach-tip">
    <span class="coach-tip-icon">${t.icon}</span>
    <div><strong>${t.title}</strong><div class="coach-tip-text">${t.text}</div></div>
  </div>`;
}

function renderSleepCoach() {
  const el = document.getElementById('sleepCoachContent');
  if (!el) return;
  const tips = getSleepTips();
  el.innerHTML = tips.length ? tips.map(coachTipHTML).join('') : `<div class="coach-tip-empty">Tracke deinen Schlaf für Tipps!</div>`;
}

function getSleepTips() {
  const tips = [];
  if (sleepData.length < 2) return tips;
  const recent = sleepData.slice(0,7);
  const avg    = recent.reduce((a,b)=>a+b.hours,0)/recent.length;
  const avgQ   = recent.reduce((a,b)=>a+b.quality,0)/recent.length;
  const score  = Math.round((avg/8)*50+(avgQ/5)*50);
  if (avg  <  7) tips.push({icon:'😴',title:'Mehr Schlaf!',text:`Ø ${avg.toFixed(1)}h – Kletterathlet:innen brauchen 7.5–9h.`});
  else if (avg>=8) tips.push({icon:'🌟',title:'Exzellente Basis!',text:`${avg.toFixed(1)}h – perfekt für intensive Einheiten.`});
  if (avgQ<=2.5) tips.push({icon:'🌿',title:'Qualität verbessern',text:'Kein Bildschirm 1h vorher, Zimmer 16–18°C.'});
  if (score>=80) tips.push({icon:'💪',title:'Perfekter Trainingstag!',text:'Dein Score ist stark – ideal für Max-Effort.'});
  return tips;
}

function renderExerciseCoach(exId, viewKey) {
  const el = document.getElementById(viewKey + '-coach');
  if (!el) return;
  const tips = getExerciseTips(exId);
  el.innerHTML = tips.length ? tips.map(coachTipHTML).join('') : `<div class="coach-tip-empty">Logge mehr Einträge für Tipps!</div>`;
}

function getExerciseTips(exId) {
  const tips  = [];
  const data  = workouts.filter(w => w.exerciseId === exId);
  if (data.length < 2) return tips;
  const all    = data.flatMap(w => w.sets||[]);
  const recent = data.filter(w => (Date.now()-new Date(w.date))/86400000 <= 7);

  if (exId==='pullups') {
    const max=Math.max(...all.map(s=>s.reps||0),0);
    if (max>=15) tips.push({icon:'⚖️',title:'Zeit für Gewicht!',text:`${max} Reps – starte mit +5kg für 5 saubere Reps.`});
    else if (max<5) tips.push({icon:'🎯',title:'Aufbauphase',text:'Negative Klimmzüge und 3–5 Sets täglich helfen.'});
    else tips.push({icon:'📈',title:'Gut dabei!',text:`Max. ${max} Reps – steigere um 1–2 Reps pro Woche.`});
  }
  if (exId==='hangboard') {
    const max=Math.max(...all.map(s=>s.duration||0),0);
    if (max>=20) tips.push({icon:'🏋️',title:'Gewicht hinzufügen',text:`${max}s – versuche schrittweise +2.5kg.`});
    else tips.push({icon:'🪨',title:'Fingerboard Grundsatz',text:'7–10sek auf 20mm Leiste. Qualität vor Quantität.'});
  }
  if (exId==='deadhang') {
    const max=Math.max(...all.map(s=>s.duration||0),0);
    tips.push({icon:'⏱️',title:'Dead Hang Ziel',text:`Rekord: ${max}s. Pro-Ziel: 60s mit Körpergewicht.`});
  }
  if (exId==='lsit') {
    const max=Math.max(...all.map(s=>s.duration||0),0);
    if (max<10) tips.push({icon:'💡',title:'L-Sit Aufbau',text:'Starte mit Tuck-L-Sit. Ziel: 10s gehalten.'});
    else tips.push({icon:'🔥',title:`Starker Kern – ${max}s!`,text:'Versuche L-Sit auf Ringen für mehr Schulteraktivierung.'});
  }
  if (recent.length>=4) tips.push({icon:'⚠️',title:'Erholung!',text:'Viele Einheiten – plane 1–2 Ruhetage ein.'});
  else if (recent.length===0) tips.push({icon:'🔥',title:'Zurück ans Training!',text:'Diese Woche noch nichts – 15 Min reichen.'});
  return tips;
}

// ============================================================
// TOAST
// ============================================================
let _toastTimer;
function showToast(msg, duration=2200) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg; t.style.display = 'block';
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => { t.style.display='none'; }, duration);
}

// PWA install
let deferredPrompt;
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredPrompt=e; });
