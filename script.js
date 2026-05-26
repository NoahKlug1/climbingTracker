// ============================================================
// SUPABASE SETUP
// ============================================================
const SUPABASE_URL = 'https://fdgtzilbwjiuetrheoly.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZkZ3R6aWxid2ppdWV0cmhlb2x5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2NjczOTksImV4cCI6MjA5NDI0MzM5OX0.4SPYm4eypp7o143faPEkLAltsptS6iT1JHAitfhQEfY';
const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_KEY);

let currentUser = null;

// ============================================================
// AUTH
// ============================================================
function showAuthMode(mode) {
  document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
  event.target.classList.add('active');
  const btn = document.getElementById('authBtn');
  btn.textContent = mode === 'login' ? 'ANMELDEN' : 'REGISTRIEREN';
  btn.onclick = mode === 'login' ? handleAuth : handleAuth;
  document.getElementById('authError').style.display = 'none';
  // Store mode
  btn.dataset.mode = mode;
}

function showAuthLoading(show) {
  document.getElementById('authLoading').style.display = show ? 'flex' : 'none';
  document.getElementById('authBtn').style.display = show ? 'none' : 'block';
}

function showAuthError(msg) {
  const el = document.getElementById('authError');
  el.textContent = msg;
  el.style.display = 'block';
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
  // If success: onAuthStateChange fires automatically
}

async function handleGoogleAuth() {
  const { error } = await db.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.href }
  });
  if (error) showAuthError('Google Login fehlgeschlagen: ' + error.message);
}

async function handleLogout() {
  hideUserMenu();
  await db.auth.signOut();
  // onAuthStateChange SIGNED_OUT handles the rest
}

function showUserMenu() {
  document.getElementById('userMenu').style.display = 'block';
  document.getElementById('userMenuOverlay').style.display = 'block';
}
function hideUserMenu() {
  document.getElementById('userMenu').style.display = 'none';
  document.getElementById('userMenuOverlay').style.display = 'none';
}

// ============================================================
// DATABASE – robust, separate fetches so one failure ≠ total fail
// ============================================================
let isLoadingFromDB = false;

async function loadFromDB(force = false) {
  if (!currentUser) return;
  if (isLoadingFromDB) return; // prevent concurrent loads
  isLoadingFromDB = true;
  setSyncing(true);

  try {
    const [wRes, sRes, rRes] = await Promise.all([
      db.from('workouts').select('*').eq('user_id', currentUser.id).order('workout_date', { ascending: false }),
      db.from('sleep_entries').select('*').eq('user_id', currentUser.id).order('sleep_date', { ascending: false }),
      db.from('routes').select('*').eq('user_id', currentUser.id).order('created_at', { ascending: false })
    ]);

    if (wRes.error) throw wRes.error;
    if (sRes.error) throw sRes.error;
    if (rRes.error) throw rRes.error;

    workouts = wRes.data.map(row => ({
      id: row.id,
      date: row.workout_date + 'T12:00:00.000Z',
      exerciseId: row.exercise_id,
      exerciseName: row.exercise_name,
      exerciseIcon: row.exercise_icon,
      sets: row.sets,
      notes: ''
    }));

    sleepData = sRes.data.map(row => ({
      id: row.id,
      date: row.sleep_date,
      hours: parseFloat(row.hours) || 0,
      quality: row.quality || 3,
      bedtime: row.bedtime,
      wakeup: row.wakeup,
      hrv: row.hrv,
      notes: row.notes || ''
    }));

    routes = rRes.data.map(row => ({
      id: row.id,
      grade: row.grade,
      flash: row.flash,
    }));

    renderAll();
  } catch (err) {
    // Offline: keep whatever data we already have in memory
    if (workouts.length === 0 && sleepData.length === 0 && routes.length === 0) {
      showToast('\u26a0\ufe0f Offline \u2013 keine Daten verf\u00fcgbar');
    }
    renderAll();
  } finally {
    setSyncing(false);
    isLoadingFromDB = false;
  }
}

async function saveWorkoutToDB(workout) {
  if (!currentUser) return workout;
  setSyncing(true);
  const { data, error } = await db.from('workouts').insert({
    user_id: currentUser.id,
    workout_date: workout.date.split('T')[0],
    exercise_id: workout.exerciseId,
    exercise_name: workout.exerciseName,
    exercise_icon: workout.exerciseIcon,
    sets: workout.sets
  }).select().single();
  setSyncing(false);
  if (error) { showToast('⚠️ Sync-Fehler: ' + error.message); return workout; }
  return { ...workout, id: data.id };
}

async function deleteWorkoutFromDB(id) {
  if (!currentUser) return;
  setSyncing(true);
  await db.from('workouts').delete().eq('id', id);
  setSyncing(false);
}

async function saveSleepToDB(entry) {
  if (!currentUser) return entry;
  setSyncing(true);
  const { data, error } = await db.from('sleep_entries').insert({
    user_id: currentUser.id,
    sleep_date: entry.date,
    hours: entry.hours,
    quality: entry.quality,
    bedtime: entry.bedtime || null,
    wakeup: entry.wakeup || null,
    hrv: entry.hrv || null,
    notes: entry.notes || ''
  }).select().single();
  setSyncing(false);
  if (error) { showToast('⚠️ Sync-Fehler: ' + error.message); return entry; }
  return { ...entry, id: data.id };
}

async function saveRouteToDB(entry) {
  if (!currentUser) return entry;
  setSyncing(true);
  const { data, error } = await db.from('routes').insert({
    user_id: currentUser.id,
    grade: entry.grade,
    flash: entry.flash
  }).select().single();
  setSyncing(false);
  if (error) {
    // table likely doesn't exist – save local only
    console.warn('routes table missing:', error.message);
    return entry;
  }
  return { ...entry, id: data.id, date: data.created_at };
}

function setSyncing(active) {
  const dot = document.getElementById('syncDot');
  if (dot) dot.className = 'sync-dot' + (active ? ' syncing' : '');
}

function renderAll() {
  renderSleepView();
  renderExerciseView('pullups',  'klimmzuege');
  renderExerciseView('hangboard','fingerboard');
  renderExerciseView('deadhang', 'deadhang');
  renderExerciseView('lsit',     'lsit');
  renderRouteWall();
  renderCoaches();
}

// ============================================================
// DATA & STATE
// ============================================================
const EXERCISES = {
  pullups: {
    id: 'pullups', name: 'KLIMMZÜGE', icon: '🧗',
    fields: [
      { id: 'reps',   label: 'Wiederholungen',    type: 'stepper', min: 1,  max: 50,   step: 1,   default: 8,  unit: 'reps' },
      { id: 'weight', label: 'Zusatzgewicht (kg)', type: 'stepper', min: 0,  max: 9999, step: 2.5, default: 0,  unit: 'kg'   }
    ]
  },
  hangboard: {
    id: 'hangboard', name: 'FINGERBOARD', icon: '🪨',
    fields: [
      { id: 'duration', label: 'Haltedauer (Sek.)', type: 'stepper', min: 1,  max: 120,  step: 1,   default: 10, unit: 'sek' },
      { id: 'sets',     label: 'Sätze',             type: 'stepper', min: 1,  max: 20,   step: 1,   default: 6,  unit: 'sätze' },
      { id: 'weight',   label: 'Zusatzgew. (kg)',   type: 'stepper', min: 0,  max: 9999, step: 2.5, default: 0,  unit: 'kg'  }
    ]
  },
  deadhang: {
    id: 'deadhang', name: 'DEAD HANG', icon: '⏱️',
    fields: [
      { id: 'duration', label: 'Dauer (Sek.)', type: 'stepper', min: 1, max: 300, step: 1, default: 30, unit: 'sek' }
    ]
  },
  lsit: {
    id: 'lsit', name: 'L-SIT', icon: '💪',
    fields: [
      { id: 'duration', label: 'Dauer (Sek.)', type: 'stepper', min: 1, max: 120, step: 1, default: 10, unit: 'sek' },
      { id: 'sets',     label: 'Sätze',        type: 'stepper', min: 1, max: 10,  step: 1, default: 3,  unit: 'sätze' }
    ]
  }
};

// per-view stepper state
const viewSteppers = {};

function loadData(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch { return fallback; }
}
function saveData(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

let workouts    = loadData('cl_workouts', []);
let sleepData   = loadData('cl_sleep', []);
let routeEntries = loadData('cl_routes', []);

// ============================================================
// INIT
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initViewSteppers();
  document.getElementById('sleepDate').value = new Date().toISOString().split('T')[0];

  db.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_OUT' || !session?.user) {
      currentUser = null;
      workouts = []; sleepData = []; routeEntries = [];
      isLoadingFromDB = false;
      document.getElementById('appScreen').style.display = 'none';
      document.getElementById('authScreen').style.display = 'flex';
      document.getElementById('authBtn').dataset.mode = 'login';
      setSyncing(false);
      return;
    }

    const isNewLogin  = event === 'SIGNED_IN' || event === 'INITIAL_SESSION';
    const userChanged = currentUser?.id !== session.user.id;

    if (isNewLogin || userChanged) {
      currentUser = session.user;
      document.getElementById('authScreen').style.display = 'none';
      document.getElementById('appScreen').style.display  = 'block';
      document.getElementById('userMenuEmail').textContent = currentUser.email || 'Eingeloggt';
      if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
      await loadFromDB();
    } else {
      currentUser = session.user;
    }
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && currentUser) loadFromDB();
  });
});

function initNav() {
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const view = tab.dataset.view;
      document.querySelectorAll('.nav-tab').forEach(t  => t.classList.remove('active'));
      document.querySelectorAll('.view').forEach(v     => v.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById('view-' + view).classList.add('active');
    });
  });
}

function initViewSteppers() {
  Object.entries(EXERCISES).forEach(([exId, ex]) => {
    viewSteppers[exId] = {};
    ex.fields.forEach(f => { viewSteppers[exId][f.id] = f.default; });
  });
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

  let entry = { id: Date.now(), date, bedtime, wakeup, hours: Math.round(hours * 10) / 10, quality, hrv, notes };
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
  if (sleepData.length === 0) { el.innerHTML = ''; return; }
  const recent    = sleepData.slice(0, 7);
  const avgHours  = recent.reduce((a, b) => a + b.hours, 0) / recent.length;
  const avgQuality= recent.reduce((a, b) => a + b.quality, 0) / recent.length;
  const sleepScore= Math.round((avgHours / 8) * 50 + (avgQuality / 5) * 50);
  const scoreColor= sleepScore >= 80 ? 'var(--green)' : sleepScore >= 60 ? 'var(--gold)' : sleepScore >= 40 ? 'var(--warn)' : 'var(--red)';
  el.innerHTML = `
    <div class="card sleep-score-big">
      <div class="sleep-score-ring">
        <div class="sleep-score-number" style="color:${scoreColor}">${sleepScore}</div>
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
  if (sleepData.length === 0) {
    container.innerHTML = `<div class="empty-state"><span class="empty-state-icon">🌙</span><div class="empty-state-text">Noch keine Schlafdaten – füge deinen ersten Eintrag hinzu!</div></div>`;
    return;
  }
  const recent = sleepData.slice(0, 7).slice().reverse();
  container.innerHTML = `
    <div class="card">
      <div class="card-title">LETZTE 7 NÄCHTE</div>
      <div class="chart-wrap">${renderSleepChart(recent.map(s => ({ label: s.date.slice(5), value: s.hours })))}</div>
      <div style="margin-top:10px;">
        ${sleepData.slice(0, 10).map(s => `
          <div class="stat-row">
            <span style="font-size:0.75rem;color:var(--t2)">${s.date}</span>
            <span style="display:flex;align-items:center;gap:8px;">
              <span style="font-size:0.9rem;font-weight:700;color:var(--t1)">${s.hours}h</span>
              <span style="font-size:0.75rem;color:var(--gold)">${'★'.repeat(s.quality)}</span>
            </span>
          </div>`).join('')}
      </div>
    </div>`;
}

function renderSleepChart(data) {
  const svgW = Math.max(300, (window.innerWidth || 400) - 52);
  const svgH = 100;
  const max  = Math.max(...data.map(d => d.value), 8);
  const n    = data.length;
  const barW = Math.floor((svgW - 20) / Math.max(n, 1)) - 2;
  const bars = data.map((d, i) => {
    const barH = Math.round((d.value / max) * 68);
    const x = 10 + i * (barW + 2);
    const y = svgH - 22 - barH;
    const col = d.value >= 7.5 ? '#FFD60A' : d.value >= 6 ? '#30D158' : '#FF6B35';
    return `<rect x="${x}" y="${y}" width="${barW}" height="${barH}" rx="3" fill="${col}" opacity="0.85"/>
      <text x="${x+barW/2}" y="${y-3}" text-anchor="middle" fill="rgba(255,255,255,0.6)" font-size="8" font-family="Inter">${d.value}h</text>
      <text x="${x+barW/2}" y="${svgH-5}" text-anchor="middle" fill="rgba(255,255,255,0.3)" font-size="7" font-family="Inter">${d.label}</text>`;
  }).join('');
  const refY = svgH - 22 - Math.round((8 / max) * 68);
  return `<svg width="${svgW}" height="${svgH}" viewBox="0 0 ${svgW} ${svgH}">
    <line x1="10" y1="${refY}" x2="${svgW-10}" y2="${refY}" stroke="#FFD60A" stroke-width="1" stroke-dasharray="4,3" opacity="0.35"/>
    <text x="${svgW-12}" y="${refY-3}" text-anchor="end" fill="#FFD60A" font-size="7" font-family="Inter" opacity="0.5">8h</text>
    <line x1="10" y1="${svgH-22}" x2="${svgW-10}" y2="${svgH-22}" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>
    ${bars}</svg>`;
}

// ============================================================
// EXERCISE VIEWS – inline stepper form + log list
// ============================================================
const VIEW_MAP = { pullups: 'klimmzuege', hangboard: 'fingerboard', deadhang: 'deadhang', lsit: 'lsit' };

function renderExerciseView(exId, viewKey) {
  renderExerciseForm(exId, viewKey);
  renderExercisePR(exId, viewKey);
  renderExerciseChart(exId, viewKey);
}

// ---- INLINE FORM ----
function renderExerciseForm(exId, viewKey) {
  const container = document.getElementById(viewKey + '-form');
  if (!container) return;
  const ex = EXERCISES[exId];
  const vals = viewSteppers[exId];

  const fields = ex.fields.map(f => `
    <div class="inline-field">
      <div class="inline-field-label">${f.label}</div>
      <div class="stepper">
        <button class="stepper-btn" onclick="viewStep('${exId}','${f.id}',-${f.step})">−</button>
        <span class="stepper-val" id="vs_${exId}_${f.id}">${fmtVal(vals[f.id], f)}</span>
        <span class="stepper-unit">${f.unit}</span>
        <button class="stepper-btn" onclick="viewStep('${exId}','${f.id}',${f.step})">+</button>
      </div>
    </div>`).join('');

  container.innerHTML = `
    <div class="card inline-form-card">
      <div class="inline-fields-wrap">${fields}</div>
      <button class="btn btn-primary add-entry-btn" onclick="addEntry('${exId}')">+ EINTRAG HINZUFÜGEN</button>
    </div>`;
}

function fmtVal(val, field) {
  if (field && field.step < 1) return val.toFixed(1);
  return val;
}

function viewStep(exId, fId, delta) {
  const ex    = EXERCISES[exId];
  const field = ex.fields.find(f => f.id === fId);
  let val     = (viewSteppers[exId][fId] || 0) + delta;
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
  const set  = { id: Date.now() };
  ex.fields.forEach(f => { set[f.id] = vals[f.id]; });

  const vk   = VIEW_MAP[exId];
  let workout = {
    id: Date.now(),
    date: new Date().toISOString().split('T')[0] + 'T12:00:00.000Z',
    exerciseId:   ex.id,
    exerciseName: ex.name,
    exerciseIcon: ex.icon,
    sets: [set],
    notes: ''
  };
  workout = await saveWorkoutToDB(workout);
  workouts.unshift(workout);
  saveData('cl_workouts', workouts);
  showToast('✅ Eintrag gespeichert!');
  renderExerciseView(exId, vk);
  renderCoaches();
}

// ---- PR ----
function renderExercisePR(exId, viewKey) {
  const el   = document.getElementById(viewKey + '-pr');
  if (!el) return;
  const data = workouts.filter(w => w.exerciseId === exId);
  if (data.length === 0) {
    el.innerHTML = `<div class="pr-empty">Noch kein Eintrag – leg los! 🏆</div>`;
    return;
  }
  const allSets = data.flatMap(w => w.sets || []);
  let prParts = [];
  if (allSets.some(s => s.reps > 0))     prParts.push(`<span class="pr-val">${Math.max(...allSets.map(s=>s.reps||0))}</span><span class="pr-unit"> reps</span>`);
  if (allSets.some(s => s.duration > 0)) prParts.push(`<span class="pr-val">${Math.max(...allSets.map(s=>s.duration||0))}</span><span class="pr-unit"> sek</span>`);
  if (allSets.some(s => s.weight > 0))   prParts.push(`<span class="pr-val">${Math.max(...allSets.map(s=>s.weight||0))}</span><span class="pr-unit"> kg</span>`);
  el.innerHTML = `
    <div class="card pr-card">
      <div class="pr-label">🏆 BESTLEISTUNG</div>
      <div class="pr-values">${prParts.join('<span class="pr-sep"> · </span>')}</div>
      <div class="pr-sub">${data.length} Einträge</div>
    </div>`;
}

// ---- CHART ----
function renderExerciseChart(exId, viewKey) {
  const el   = document.getElementById(viewKey + '-chart');
  if (!el) return;
  const data = workouts.filter(w => w.exerciseId === exId);
  if (data.length < 2) {
    el.innerHTML = `<div class="chart-empty">Mindestens 2 Einträge für den Verlauf</div>`;
    return;
  }
  const points = data.slice().reverse().map(w => {
    const s = w.sets || [];
    let val = 0;
    if (s.some(x => x.reps))     val = Math.max(...s.map(x => x.reps     || 0));
    else if (s.some(x => x.duration)) val = Math.max(...s.map(x => x.duration || 0));
    else if (s.some(x => x.weight))   val = Math.max(...s.map(x => x.weight   || 0));
    return { label: w.date.split('T')[0].slice(5), val };
  });

  const svgW = Math.max(300, (window.innerWidth || 400) - 52);
  const svgH = 100;
  const maxV = Math.max(...points.map(p => p.val), 1);
  const n    = points.length;
  const coords = points.map((p, i) => ({
    x: 14 + (i / Math.max(n - 1, 1)) * (svgW - 28),
    y: svgH - 22 - (p.val / maxV) * 65,
    val: p.val, label: p.label
  }));
  const path = coords.map((c, i) => `${i === 0 ? 'M' : 'L'}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ');
  const last = coords[coords.length - 1];
  const dots = coords.map(c =>
    `<circle cx="${c.x.toFixed(1)}" cy="${c.y.toFixed(1)}" r="3.5" fill="var(--accent)"/>`).join('');
  const labelStep = Math.max(1, Math.floor(n / 5));

  el.innerHTML = `
    <div class="card">
      <div class="card-title">VERLAUF</div>
      <div class="chart-wrap">
        <svg width="${svgW}" height="${svgH}" viewBox="0 0 ${svgW} ${svgH}">
          <defs>
            <linearGradient id="lg_${viewKey}" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="var(--accent)" stop-opacity="0.28"/>
              <stop offset="100%" stop-color="var(--accent)" stop-opacity="0"/>
            </linearGradient>
          </defs>
          <path d="${path} L${last.x.toFixed(1)},${svgH-22} L${coords[0].x.toFixed(1)},${svgH-22} Z"
                fill="url(#lg_${viewKey})"/>
          <path d="${path}" fill="none" stroke="var(--accent)" stroke-width="2.5"
                stroke-linecap="round" stroke-linejoin="round"/>
          ${dots}
          <text x="${last.x.toFixed(1)}" y="${(last.y-9).toFixed(1)}" text-anchor="middle"
                fill="var(--gold)" font-size="9" font-family="Inter" font-weight="700">${last.val}</text>
          <line x1="14" y1="${svgH-22}" x2="${svgW-14}" y2="${svgH-22}"
                stroke="rgba(255,255,255,0.08)" stroke-width="1"/>
          ${coords.filter((_, i) => i % labelStep === 0).map(c =>
            `<text x="${c.x.toFixed(1)}" y="${svgH-6}" text-anchor="middle"
                   fill="rgba(255,255,255,0.3)" font-size="7" font-family="Inter">${c.label}</text>`).join('')}
        </svg>
      </div>
    </div>`;
}

// ============================================================
// KLETTERROUTEN
// ============================================================
const GRADE_ORDER = ['4','5a','5b','5c','6a','6a+','6b','6b+','6c','6c+','7a','7a+','7b','7b+','7c','7c+','8a','8a+','8b','8b+','8c','9a'];

const QUICKDRAW_POSITIONS = [
  { x:130,y:460 },{ x:205,y:445 },{ x:80,y:425 },
  { x:258,y:408 },{ x:158,y:390 },{ x:100,y:368 },
  { x:228,y:352 },{ x:72,y:330 },{ x:178,y:312 },
  { x:262,y:295 },{ x:118,y:278 },{ x:198,y:258 },
  { x:78,y:242 },{ x:248,y:226 },{ x:152,y:208 },
  { x:104,y:188 },{ x:218,y:172 },{ x:168,y:148 },
  { x:128,y:126 },{ x:202,y:106 },{ x:158,y:82 },{ x:176,y:56 }
];

function gradeColor(count, hasFlash) {
  if (hasFlash && count === 1) return '#FFD700';
  if (count >= 10) return '#FF00FF';
  if (count >= 7)  return '#FF3399';
  if (count >= 5)  return '#FF6B35';
  if (count >= 3)  return '#FFD60A';
  if (count >= 2)  return '#30D158';
  return '#6699CC';
}

function flashFillPct(total, flashCount) {
  return Math.min(100, total * 8 + flashCount * 14);
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

  const counts = {};
  routeEntries.forEach(r => {
    if (!counts[r.grade]) counts[r.grade] = { total: 0, flash: 0 };
    counts[r.grade].total++;
    if (r.flash) counts[r.grade].flash++;
  });

  const gradesDone  = GRADE_ORDER.filter(gr => counts[gr]);
  const gradesEmpty = GRADE_ORDER.filter(gr => !counts[gr]);
  let svg = '';

  gradesDone.forEach((grade, idx) => {
    if (idx >= QUICKDRAW_POSITIONS.length) return;
    const pos  = QUICKDRAW_POSITIONS[idx];
    const { total, flash } = counts[grade];
    const col  = gradeColor(total, flash > 0);
    const fill = flashFillPct(total, flash);
    const bw   = 46;
    const fw   = Math.max(2, Math.round(bw * fill / 100));

    svg += `
      <g transform="translate(${pos.x - 23},${pos.y - 30})">
        <ellipse cx="23" cy="5"  rx="7" ry="4.5" fill="none" stroke="${col}" stroke-width="2.5" opacity="0.95"/>
        <rect    x="21"  y="9"   width="4" height="18" rx="2" fill="${col}" opacity="0.5"/>
        <ellipse cx="23" cy="31" rx="7" ry="4.5" fill="none" stroke="${col}" stroke-width="2.5" opacity="0.95"/>
        <rect x="0" y="38" width="${bw}" height="15" rx="4" fill="rgba(0,0,0,0.75)"/>
        <text x="${bw/2}" y="49" text-anchor="middle" fill="${col}" font-size="9" font-family="Inter" font-weight="700">${grade}${total>1?` ×${total}`:''}</text>
        ${flash>0 ? `<text x="${bw-2}" y="38.5" text-anchor="end" fill="#FFD700" font-size="8">⚡</text>` : ''}
        <rect x="1" y="55" width="${bw-2}" height="5" rx="2.5" fill="rgba(255,255,255,0.1)"/>
        <rect x="1" y="55" width="${fw}"   height="5" rx="2.5" fill="${col}" opacity="0.9"/>
      </g>`;
  });

  // ghost quickdraws for empty slots
  gradesEmpty.slice(0, Math.max(0, QUICKDRAW_POSITIONS.length - gradesDone.length)).forEach((_, i) => {
    const pos = QUICKDRAW_POSITIONS[gradesDone.length + i];
    if (!pos) return;
    svg += `
      <g transform="translate(${pos.x-8},${pos.y-22})" opacity="0.12">
        <ellipse cx="8" cy="4"  rx="6" ry="4" fill="none" stroke="#aaa" stroke-width="2"/>
        <rect x="6"   y="8"   width="4" height="14" rx="2" fill="#aaa" opacity="0.4"/>
        <ellipse cx="8" cy="26" rx="6" ry="4" fill="none" stroke="#aaa" stroke-width="2"/>
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

function renderSleepCoach() {
  const el = document.getElementById('sleepCoachContent');
  if (!el) return;
  const tips = getSleepTips();
  if (tips.length === 0) {
    el.innerHTML = `<div class="coach-tip-empty">Tracke deinen Schlaf – dann gibt es hier personalisierte Tipps!</div>`;
    return;
  }
  el.innerHTML = tips.map(t => coachTipHTML(t)).join('');
}

function getSleepTips() {
  const tips = [];
  if (sleepData.length < 2) return tips;
  const recent   = sleepData.slice(0, 7);
  const avg      = recent.reduce((a, b) => a + b.hours, 0) / recent.length;
  const avgQ     = recent.reduce((a, b) => a + b.quality, 0) / recent.length;
  const score    = Math.round((avg / 8) * 50 + (avgQ / 5) * 50);
  if (avg < 7)
    tips.push({ icon:'😴', title:'Mehr Schlaf!', text:`Ø ${avg.toFixed(1)}h – Kletterathlet:innen brauchen 7.5–9h. Fingersehnen regenerieren hauptsächlich im Schlaf.` });
  else if (avg >= 8)
    tips.push({ icon:'🌟', title:'Exzellente Basis!', text:`${avg.toFixed(1)}h Ø-Schlaf – top! Nutze diese Energie für intensive Trainingseinheiten.` });
  if (avgQ <= 2.5)
    tips.push({ icon:'🌿', title:'Qualität verbessern', text:'Kein Bildschirm 1h vor dem Schlafen, Zimmer 16–18°C, kein Training 3h vor dem Einschlafen.' });
  if (score >= 80)
    tips.push({ icon:'💪', title:'Perfekter Trainingstag!', text:'Dein Score ist stark – heute ideal für ein Max-Effort Workout.' });
  return tips;
}

function renderExerciseCoach(exId, viewKey) {
  const el = document.getElementById(viewKey + '-coach');
  if (!el) return;
  const tips = getExerciseTips(exId);
  if (tips.length === 0) {
    el.innerHTML = `<div class="coach-tip-empty">Logge mehr Einträge für personalisierte Tipps!</div>`;
    return;
  }
  el.innerHTML = tips.map(t => coachTipHTML(t)).join('');
}

function coachTipHTML(t) {
  return `<div class="coach-tip">
    <span class="coach-tip-icon">${t.icon}</span>
    <div><strong>${t.title}</strong><div class="coach-tip-text">${t.text}</div></div>
  </div>`;
}

function getExerciseTips(exId) {
  const tips = [];
  const data = workouts.filter(w => w.exerciseId === exId);
  if (data.length < 2) return tips;
  const allSets = data.flatMap(w => w.sets || []);
  const recent7 = data.filter(w => (Date.now() - new Date(w.date)) / 86400000 <= 7);

  if (exId === 'pullups') {
    const maxReps = Math.max(...allSets.map(s => s.reps || 0), 0);
    if (maxReps >= 15)
      tips.push({ icon:'⚖️', title:'Zeit für Gewicht!', text:`${maxReps} Reps – starte mit +5kg für 5 saubere Reps.` });
    else if (maxReps < 5)
      tips.push({ icon:'🎯', title:'Aufbauphase', text:'Fokus auf negative Klimmzüge und 3–5 Sets täglich.' });
    else
      tips.push({ icon:'📈', title:'Gut dabei!', text:`Max. ${maxReps} Reps – steigere schrittweise um 1–2 Reps pro Woche.` });
  }
  if (exId === 'hangboard') {
    const maxDur = Math.max(...allSets.map(s => s.duration || 0), 0);
    if (maxDur >= 20)
      tips.push({ icon:'🏋️', title:'Gewicht hinzufügen', text:`${maxDur}s – versuche schrittweise +2.5kg.` });
    else
      tips.push({ icon:'🪨', title:'Fingerboard Grundsatz', text:'7–10sek auf 20mm Leiste mit Pause. Qualität vor Quantität.' });
  }
  if (exId === 'deadhang') {
    const maxDur = Math.max(...allSets.map(s => s.duration || 0), 0);
    tips.push({ icon:'⏱️', title:'Dead Hang Ziel', text:`Dein Rekord: ${maxDur}s. Pro-Ziel: 60s mit Körpergewicht.` });
  }
  if (exId === 'lsit') {
    const maxDur = Math.max(...allSets.map(s => s.duration || 0), 0);
    if (maxDur < 10)
      tips.push({ icon:'💡', title:'L-Sit Aufbau', text:'Starte mit Tuck-L-Sit (Knie angezogen). Ziel: 10s gehalten.' });
    else
      tips.push({ icon:'🔥', title:`Starker Kern – ${maxDur}s!`, text:'Versuche L-Sit auf Ringen für mehr Schulteraktivierung.' });
  }

  if (recent7.length >= 4)
    tips.push({ icon:'⚠️', title:'Erholung!', text:'Viele Einheiten diese Woche – plane 1–2 Ruhetage ein.' });
  else if (recent7.length === 0 && data.length > 0)
    tips.push({ icon:'🔥', title:'Zurück ans Training!', text:'Diese Woche noch nichts – selbst 15 Min halten die Kraft.' });

  return tips;
}

// ============================================================
// TOAST
// ============================================================
function showToast(msg, duration = 2200) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.style.display = 'block';
  clearTimeout(toast._t);
  toast._t = setTimeout(() => { toast.style.display = 'none'; }, duration);
}

// PWA
let deferredPrompt;
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredPrompt = e; });
