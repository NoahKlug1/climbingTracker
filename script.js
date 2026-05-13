// ============================================================
// DATA & STATE
// ============================================================
const EXERCISES = [
  {
    id: 'pullups',
    name: 'KLIMMZÜGE',
    icon: '🧗',
    desc: 'Körpergewicht, klassisch',
    tags: ['reps', 'sets'],
    animClass: 'anim-pullup',
    fields: [
      { id: 'reps', label: 'Wiederholungen', type: 'stepper', min: 1, max: 50, step: 1, default: 8, unit: 'reps' },
      { id: 'sets', label: 'Sätze', type: 'stepper', min: 1, max: 20, step: 1, default: 3, unit: 'sets' }
    ]
  },
  {
    id: 'pullups_weight',
    name: 'KLIMMZÜGE + GEWICHT',
    icon: '⚖️',
    desc: 'Mit Zusatzgewicht',
    tags: ['reps', 'sets', 'weight'],
    animClass: 'anim-weight',
    fields: [
      { id: 'weight', label: 'Zusatzgewicht (kg)', type: 'stepper', min: 0, max: 9999, step: 2.5, default: 10, unit: 'kg' },
      { id: 'reps', label: 'Wiederholungen', type: 'stepper', min: 1, max: 30, step: 1, default: 5, unit: 'reps' },
      { id: 'sets', label: 'Sätze', type: 'stepper', min: 1, max: 15, step: 1, default: 4, unit: 'sets' }
    ]
  },
  {
    id: 'hangboard',
    name: 'HANGBOARD HÄNGEN',
    icon: '🪨',
    desc: 'Fingerboard, maximale Kraft',
    tags: ['time', 'sets'],
    animClass: 'anim-hang',
    fields: [
      { id: 'duration', label: 'Haltedauer (Sek.)', type: 'stepper', min: 5, max: 120, step: 5, default: 10, unit: 'sek' },
      { id: 'sets', label: 'Sätze', type: 'stepper', min: 1, max: 20, step: 1, default: 6, unit: 'sets' },
      { id: 'rest', label: 'Pause (Sek.)', type: 'stepper', min: 30, max: 300, step: 10, default: 60, unit: 'sek' }
    ]
  },
  {
    id: 'hangboard_weight',
    name: 'HANGBOARD + GEWICHT',
    icon: '🏋️',
    desc: 'Mit Zusatzgewicht hängen',
    tags: ['time', 'weight'],
    animClass: 'anim-weight',
    fields: [
      { id: 'weight', label: 'Zusatzgewicht (kg)', type: 'stepper', min: 0, max: 9999, step: 2.5, default: 5, unit: 'kg' },
      { id: 'duration', label: 'Haltedauer (Sek.)', type: 'stepper', min: 5, max: 60, step: 5, default: 7, unit: 'sek' },
      { id: 'sets', label: 'Sätze', type: 'stepper', min: 1, max: 15, step: 1, default: 5, unit: 'sets' }
    ]
  },
  {
    id: 'deadhang',
    name: 'DEAD HANG',
    icon: '⏱️',
    desc: 'Maximale Haltedauer',
    tags: ['time'],
    animClass: 'anim-hang',
    fields: [
      { id: 'duration', label: 'Dauer (Sek.)', type: 'stepper', min: 5, max: 300, step: 5, default: 30, unit: 'sek' }
    ]
  },
  {
    id: 'one_arm_hang',
    name: 'EINARMIGER HANG',
    icon: '💪',
    desc: 'Einarmiges Hängen',
    tags: ['time', 'sets'],
    animClass: 'anim-hang',
    fields: [
      { id: 'arm', label: 'Arm', type: 'select', options: ['Links', 'Rechts', 'Beide'], default: 0 },
      { id: 'duration', label: 'Dauer (Sek.)', type: 'stepper', min: 1, max: 60, step: 1, default: 5, unit: 'sek' },
      { id: 'sets', label: 'Sätze', type: 'stepper', min: 1, max: 10, step: 1, default: 3, unit: 'sets' }
    ]
  },
  {
    id: 'muscle_up',
    name: 'MUSCLE UP',
    icon: '🔥',
    desc: 'Kombibewegung',
    tags: ['reps', 'sets'],
    animClass: 'anim-pullup',
    fields: [
      { id: 'reps', label: 'Wiederholungen', type: 'stepper', min: 1, max: 20, step: 1, default: 3, unit: 'reps' },
      { id: 'sets', label: 'Sätze', type: 'stepper', min: 1, max: 10, step: 1, default: 3, unit: 'sets' }
    ]
  },
  {
    id: 'board_climb',
    name: 'KLETTERBRETT',
    icon: '🏔️',
    desc: 'Systemboard / Moon Board',
    tags: ['reps', 'sets'],
    animClass: 'anim-pullup',
    fields: [
      { id: 'grade', label: 'Schwierigkeitsgrad', type: 'select', options: ['V0-V1','V2-V3','V4-V5','V6-V7','V8-V9','V10+'], default: 2 },
      { id: 'problems', label: 'Routen', type: 'stepper', min: 1, max: 50, step: 1, default: 5, unit: 'ruten' },
      { id: 'attempts', label: 'Versuche/Route', type: 'stepper', min: 1, max: 20, step: 1, default: 3, unit: 'versuche' }
    ]
  },
  {
    id: 'custom',
    name: 'EIGENE ÜBUNG',
    icon: '✏️',
    desc: 'Benutzerdefiniert',
    tags: ['reps', 'time', 'weight'],
    animClass: 'anim-static',
    fields: [
      { id: 'customName', label: 'Name der Übung', type: 'text', placeholder: 'z.B. Ring Pushups', default: '' },
      { id: 'reps', label: 'Wiederholungen', type: 'stepper', min: 0, max: 100, step: 1, default: 10, unit: 'reps' },
      { id: 'duration', label: 'Dauer (Sek.)', type: 'stepper', min: 0, max: 300, step: 5, default: 0, unit: 'sek' },
      { id: 'weight', label: 'Gewicht (kg)', type: 'stepper', min: 0, max: 9999, step: 2.5, default: 0, unit: 'kg' }
    ]
  }
];

// State
let selectedExercise = null;
let currentSets = [];
let stepperValues = {};
let selectValues = {};

// Load data
function loadData(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch { return fallback; }
}
function saveData(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

let workouts = loadData('cl_workouts', []);
let sleepData = loadData('cl_sleep', []);
let workoutDate = new Date().toISOString().split('T')[0]; // selected workout date, default today

// ============================================================
// INIT
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  // Set date display with picker
  renderWorkoutDateDisplay();

  // Default sleep date
  document.getElementById('sleepDate').value = workoutDate;

  renderExerciseList();
  renderHistory();
  renderStats();
  renderSleepStats();
  renderCoach();

  // Nav tabs
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const view = tab.dataset.view;
      document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById('view-' + view).classList.add('active');
      if (view === 'stats') renderStats();
      if (view === 'sleep') renderSleepStats();
      if (view === 'coach') renderCoach();
      if (view === 'history') renderHistory();
    });
  });

  // Register service worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
});

// ============================================================
// EXERCISE LIST
// ============================================================
function renderExerciseList() {
  const container = document.getElementById('exerciseList');
  container.innerHTML = EXERCISES.map(ex => `
    <div class="exercise-card ${selectedExercise?.id === ex.id ? 'selected' : ''}"
         onclick="selectExercise('${ex.id}')">
      <span class="exercise-icon">${ex.icon}</span>
      <div class="exercise-name">${ex.name}</div>
      <div class="exercise-desc">${ex.desc}</div>
      <div class="exercise-tags">
        ${ex.tags.map(t => `<span class="tag tag-${t}">${t.toUpperCase()}</span>`).join('')}
      </div>
    </div>
  `).join('');
}

function selectExercise(id) {
  selectedExercise = EXERCISES.find(e => e.id === id);
  currentSets = [];
  stepperValues = {};
  selectValues = {};

  // Reset defaults
  selectedExercise.fields.forEach(f => {
    if (f.type === 'stepper') stepperValues[f.id] = f.default;
    if (f.type === 'select') selectValues[f.id] = f.default;
  });

  renderExerciseList();
  showLogForm();
}

function showLogForm() {
  const form = document.getElementById('logForm');
  form.style.display = 'block';
  form.scrollIntoView({ behavior: 'smooth', block: 'start' });

  document.getElementById('logFormTitle').textContent = selectedExercise.name;

  // Animation
  const fig = document.getElementById('animFigure');
  fig.textContent = selectedExercise.icon;
  fig.className = 'anim-figure ' + selectedExercise.animClass;

  // Check PR
  checkAndShowPR();

  renderDynamicInputs();
  renderSetsTable();
}

function cancelLog() {
  selectedExercise = null;
  currentSets = [];
  document.getElementById('logForm').style.display = 'none';
  renderExerciseList();
}

// ============================================================
// DYNAMIC INPUTS
// ============================================================
function renderDynamicInputs() {
  const container = document.getElementById('dynamicInputs');
  if (!selectedExercise) return;

  container.innerHTML = selectedExercise.fields.map(f => {
    if (f.type === 'stepper') {
      const val = stepperValues[f.id];
      const isWeight = f.id === 'weight';
      const valDisplay = isWeight
        ? `<span class="stepper-val stepper-val-editable" id="sv_${f.id}" onclick="openWeightInput('${f.id}')" title="Antippen zum Eingeben">${formatStepperVal(val, f)}</span>`
        : `<span class="stepper-val" id="sv_${f.id}">${formatStepperVal(val, f)}</span>`;
      return `
        <div class="input-group">
          <label class="input-label">${f.label}${isWeight ? ' <span style="font-size:0.65rem;opacity:0.6;font-weight:400;">(✎ antippen)</span>' : ''}</label>
          <div class="stepper">
            <button class="stepper-btn" onclick="stepChange('${f.id}', -${f.step})">−</button>
            ${valDisplay}
            <span class="stepper-unit">${f.unit}</span>
            <button class="stepper-btn" onclick="stepChange('${f.id}', ${f.step})">+</button>
          </div>
        </div>`;
    }
    if (f.type === 'select') {
      return `
        <div class="input-group">
          <label class="input-label">${f.label}</label>
          <select class="input-field" id="sel_${f.id}" onchange="selectValues['${f.id}']=this.selectedIndex">
            ${f.options.map((o, i) => `<option value="${i}" ${i === (selectValues[f.id]||0) ? 'selected' : ''}>${o}</option>`).join('')}
          </select>
        </div>`;
    }
    if (f.type === 'text') {
      return `
        <div class="input-group">
          <label class="input-label">${f.label}</label>
          <input type="text" class="input-field" id="txt_${f.id}" placeholder="${f.placeholder||''}" value="${f.default||''}">
        </div>`;
    }
    return '';
  }).join('');
}

function formatStepperVal(val, field) {
  if (field.step < 1) return val.toFixed(1);
  return val;
}

function stepChange(fieldId, delta) {
  const field = selectedExercise.fields.find(f => f.id === fieldId);
  let val = stepperValues[fieldId] + delta;
  val = Math.min(field.max, Math.max(field.min, val));
  // Round to step
  val = Math.round(val / field.step) * field.step;
  if (field.step < 1) val = parseFloat(val.toFixed(1));
  stepperValues[fieldId] = val;

  const el = document.getElementById('sv_' + fieldId);
  if (el) {
    el.textContent = formatStepperVal(val, field);
    el.style.animation = 'none';
    requestAnimationFrame(() => { el.style.animation = 'popInSimple 0.2s ease'; });
  }

  // Animate weight PR check
  if (fieldId === 'weight') {
    const fig = document.getElementById('animFigure');
    fig.style.animation = 'none';
    requestAnimationFrame(() => { fig.style.animation = 'weightPulse 0.5s ease'; });
    checkAndShowPR();
  }
}

// Direct weight input via prompt
function openWeightInput(fieldId) {
  const field = selectedExercise.fields.find(f => f.id === fieldId);
  const current = stepperValues[fieldId];
  const input = prompt(`Gewicht direkt eingeben (kg):`, current);
  if (input === null) return;
  let val = parseFloat(input.replace(',', '.'));
  if (isNaN(val) || val < 0) { showToast('Ungültiger Wert!'); return; }
  val = Math.round(val * 10) / 10; // round to 1 decimal
  stepperValues[fieldId] = val;
  const el = document.getElementById('sv_' + fieldId);
  if (el) {
    el.textContent = val % 1 === 0 ? val : val.toFixed(1);
    el.style.animation = 'none';
    requestAnimationFrame(() => { el.style.animation = 'popInSimple 0.2s ease'; });
  }
  if (fieldId === 'weight') checkAndShowPR();
}

// Workout date display & picker
function renderWorkoutDateDisplay() {
  const container = document.getElementById('currentDateDisplay');
  const d = new Date(workoutDate + 'T12:00:00');
  const label = d.toLocaleDateString('de-AT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const today = new Date().toISOString().split('T')[0];
  const isToday = workoutDate === today;
  container.innerHTML = `
    <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;position:relative;">
      <label style="cursor:pointer;display:flex;align-items:center;gap:6px;position:relative;">
        <span class="date-label-text">📅 ${isToday ? 'Heute – ' : ''}${label} <span style="font-size:0.65rem;opacity:0.5;">▼</span></span>
        <input type="date" value="${workoutDate}" max="${today}"
          style="position:absolute;inset:0;width:100%;height:100%;opacity:0;cursor:pointer;font-size:16px;"
          onchange="setWorkoutDate(this.value)">
      </label>
      ${!isToday ? `<button onclick="setWorkoutDate('${today}')" class="today-btn">HEUTE</button>` : ''}
    </div>`;
}

function setWorkoutDate(val) {
  workoutDate = val;
  renderWorkoutDateDisplay();
}

function getFieldValue(field) {
  if (field.type === 'stepper') return stepperValues[field.id];
  if (field.type === 'select') {
    const idx = selectValues[field.id] || 0;
    return field.options[idx];
  }
  if (field.type === 'text') {
    const el = document.getElementById('txt_' + field.id);
    return el ? el.value : '';
  }
  return '';
}

// ============================================================
// SETS
// ============================================================
function addSet() {
  if (!selectedExercise) return;

  const set = { id: Date.now() };
  selectedExercise.fields.forEach(f => {
    set[f.id] = getFieldValue(f);
  });
  currentSets.push(set);
  renderSetsTable();

  // Animate add
  const rows = document.querySelectorAll('#setsTableBody tr');
  const last = rows[rows.length - 1];
  if (last) { last.style.animation = 'none'; requestAnimationFrame(() => last.style.animation = 'popInSimple 0.3s ease'); }

  showToast(`Set ${currentSets.length} gespeichert!`);
  checkAndShowPR();
}

function deleteSet(idx) {
  currentSets.splice(idx, 1);
  renderSetsTable();
}

function renderSetsTable() {
  const container = document.getElementById('setsContainer');
  const tbody = document.getElementById('setsTableBody');
  const thead = document.getElementById('setsTableHeader');

  if (currentSets.length === 0) {
    container.style.display = 'none';
    return;
  }
  container.style.display = 'block';

  // Header
  const headers = ['#', ...selectedExercise.fields.map(f => f.label.split(' ')[0]), ''];
  thead.innerHTML = headers.map(h => `<th>${h}</th>`).join('');

  // Rows
  tbody.innerHTML = currentSets.map((set, i) => {
    const cells = selectedExercise.fields.map(f => {
      const v = set[f.id];
      if (f.type === 'stepper' && f.unit) return `<td>${v}<small style="color:var(--chalk2);font-size:0.65rem"> ${f.unit}</small></td>`;
      return `<td>${v}</td>`;
    }).join('');
    return `<tr><td style="color:var(--chalk2)">${i+1}</td>${cells}<td><button class="delete-set-btn" onclick="deleteSet(${i})">✕</button></td></tr>`;
  }).join('');
}

// ============================================================
// SAVE WORKOUT
// ============================================================
function saveWorkout() {
  if (!selectedExercise || currentSets.length === 0) {
    showToast('Füge zuerst mindestens 1 Set hinzu!');
    return;
  }

  const workout = {
    id: Date.now(),
    date: workoutDate + 'T12:00:00.000Z',
    exerciseId: selectedExercise.id,
    exerciseName: selectedExercise.name,
    exerciseIcon: selectedExercise.icon,
    sets: [...currentSets],
    notes: ''
  };

  workouts.unshift(workout);
  saveData('cl_workouts', workouts);

  // Big animation
  const fig = document.getElementById('animFigure');
  fig.style.animation = 'none';
  requestAnimationFrame(() => { fig.style.animation = 'weightPulse 0.6s ease'; });

  showToast('💪 WORKOUT GESPEICHERT!');
  cancelLog();
  renderHistory();
}

// ============================================================
// HISTORY
// ============================================================
function renderHistory(filter = 'all') {
  const container = document.getElementById('historyList');
  let data = [...workouts];

  if (filter === 'week') {
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 7);
    data = data.filter(w => new Date(w.date) >= cutoff);
  } else if (filter === 'month') {
    const cutoff = new Date(); cutoff.setMonth(cutoff.getMonth() - 1);
    data = data.filter(w => new Date(w.date) >= cutoff);
  }

  if (data.length === 0) {
    container.innerHTML = `<div class="empty-state">
      <span class="empty-state-icon">🧗</span>
      <div class="empty-state-text">Noch keine Workouts – Zeit zu trainieren!</div>
    </div>`;
    return;
  }

  // Group by date
  const grouped = {};
  data.forEach(w => {
    const d = new Date(w.date).toLocaleDateString('de-AT', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
    if (!grouped[d]) grouped[d] = [];
    grouped[d].push(w);
  });

  container.innerHTML = Object.entries(grouped).map(([date, ws]) => `
    <div style="margin-bottom:16px;">
      <div style="font-size:0.72rem; font-weight:600; color:var(--t3); margin-bottom:8px; text-transform:uppercase; letter-spacing:1px;">${date}</div>
      ${ws.map(w => `
        <div class="history-item">
          <div style="font-size:1.5rem; width:42px; height:42px; background:var(--bg4); border-radius:10px; display:flex; align-items:center; justify-content:center; flex-shrink:0;">${w.exerciseIcon}</div>
          <div style="flex:1; min-width:0;">
            <div class="history-exercise">${w.exerciseName}</div>
            <div class="history-detail">${summarizeSets(w)}</div>
          </div>
          <button onclick="deleteWorkout(${w.id})" style="background:none;border:none;color:var(--t3);font-size:1.1rem;padding:2px 6px;cursor:pointer;flex-shrink:0;">✕</button>
        </div>
      `).join('')}
    </div>
  `).join('');
}

function summarizeSets(workout) {
  const ex = EXERCISES.find(e => e.id === workout.exerciseId);
  if (!ex || workout.sets.length === 0) return `${workout.sets.length} Sets`;
  const s = workout.sets;
  const parts = [];
  parts.push(`${s.length} Sets`);
  if (s[0].reps !== undefined) {
    const total = s.reduce((a, b) => a + (b.reps || 0), 0);
    parts.push(`${total} Reps`);
  }
  if (s[0].weight !== undefined && s[0].weight > 0) {
    const maxW = Math.max(...s.map(x => x.weight || 0));
    parts.push(`Max ${maxW}kg`);
  }
  if (s[0].duration !== undefined) {
    const total = s.reduce((a, b) => a + (b.duration || 0), 0);
    parts.push(`${total}sek total`);
  }
  return parts.join(' · ');
}

function deleteWorkout(id) {
  workouts = workouts.filter(w => w.id !== id);
  saveData('cl_workouts', workouts);
  renderHistory();
  showToast('Workout gelöscht');
}

function filterHistory(type, btn) {
  document.querySelectorAll('#view-history .toggle-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderHistory(type);
}

// ============================================================
// STATS
// ============================================================
let currentStatsFilter = 'all';

function renderStats() {
  const tabsContainer = document.getElementById('statsExerciseTabs');
  const exIds = [...new Set(workouts.map(w => w.exerciseId))];

  tabsContainer.innerHTML = `<div class="toggle-group" style="flex-wrap:wrap;">` +
    exIds.map(id => {
      const ex = EXERCISES.find(e => e.id === id);
      return `<button class="toggle-btn ${currentStatsFilter === id ? 'active' : ''}" onclick="setStatsFilter('${id}', this)">${ex?.exerciseIcon||''} ${ex?.name.split(' ')[0]||id}</button>`;
    }).join('') + `</div>`;

  renderStatsContent();
}

function setStatsFilter(id, btn) {
  currentStatsFilter = id;
  document.querySelectorAll('#statsExerciseTabs .toggle-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderStatsContent();
}

function selectStatsExercise(btn) {
  currentStatsFilter = 'all';
  document.querySelectorAll('#statsExerciseTabs .toggle-btn').forEach(b => b.classList.remove('active'));
  renderStatsContent();
}

function renderStatsContent() {
  const container = document.getElementById('statsContent');
  let data = workouts;
  if (currentStatsFilter !== 'all') {
    data = workouts.filter(w => w.exerciseId === currentStatsFilter);
  }

  if (data.length === 0) {
    container.innerHTML = `<div class="empty-state"><span class="empty-state-icon">📊</span><div class="empty-state-text">Noch keine Daten vorhanden</div></div>`;
    return;
  }

  // Overall stats
  const totalWorkouts = data.length;
  const totalSets = data.reduce((a, w) => a + w.sets.length, 0);
  const totalReps = data.reduce((a, w) => a + w.sets.reduce((b, s) => b + (s.reps || 0), 0), 0);
  const weights = data.flatMap(w => w.sets.map(s => s.weight)).filter(w => w > 0);
  const maxWeight = weights.length ? Math.max(...weights) : 0;

  // Volume over last 14 days
  const last14 = getLast14DaysVolume(data);

  container.innerHTML = `
    <div class="card">
      <div class="card-title">ÜBERSICHT</div>
      <div class="stat-row"><span class="stat-label">WORKOUTS GESAMT</span><span class="stat-value highlight">${totalWorkouts}</span></div>
      <div class="stat-row"><span class="stat-label">SETS GESAMT</span><span class="stat-value">${totalSets}</span></div>
      <div class="stat-row"><span class="stat-label">REPS GESAMT</span><span class="stat-value">${totalReps}</span></div>
      ${maxWeight > 0 ? `<div class="stat-row"><span class="stat-label">MAX. GEWICHT</span><span class="stat-value gold">${maxWeight} kg 🏆</span></div>` : ''}
    </div>

    <div class="card">
      <div class="card-title">VOLUMEN – LETZTE 14 TAGE</div>
      <div class="chart-wrap">${renderBarChart(last14)}</div>
    </div>

    ${renderExercisePRs(data)}
    ${renderWeightProgression(data)}
  `;
}

function getLast14DaysVolume(data) {
  const result = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const ds = d.toISOString().split('T')[0];
    const dayWorkouts = data.filter(w => w.date.split('T')[0] === ds);
    const vol = dayWorkouts.reduce((a, w) => a + w.sets.reduce((b, s) => b + (s.reps || s.duration || 1), 0), 0);
    result.push({ date: ds, label: d.toLocaleDateString('de-AT', { day: 'numeric', month: 'numeric' }), value: vol });
  }
  return result;
}

function renderBarChart(data) {
  const max = Math.max(...data.map(d => d.value), 1);
  const w = Math.max(320, window.innerWidth - 52);
  const h = 100;
  const barW = Math.floor((w - 20) / data.length) - 2;

  const bars = data.map((d, i) => {
    const barH = max > 0 ? Math.round((d.value / max) * 70) : 0;
    const x = 10 + i * (barW + 2);
    const y = h - 20 - barH;
    const color = barH > 50 ? '#e85a1a' : barH > 20 ? '#d4a520' : '#3a2a1a';
    return `
      <rect x="${x}" y="${y}" width="${barW}" height="${barH}" rx="2" fill="${color}" opacity="0.85"/>
      ${d.value > 0 ? `<text x="${x + barW/2}" y="${y - 3}" text-anchor="middle" fill="#b8a88a" font-size="8" font-family="Oswald">${d.value}</text>` : ''}
      <text x="${x + barW/2}" y="${h - 4}" text-anchor="middle" fill="#6b5a42" font-size="7" font-family="Oswald">${d.label}</text>
    `;
  }).join('');

  return `<svg class="chart-svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <line x1="10" y1="${h-20}" x2="${w-10}" y2="${h-20}" stroke="#3a2a1a" stroke-width="1"/>
    ${bars}
  </svg>`;
}

function renderExercisePRs(data) {
  // Find best performance per exercise
  const prMap = {};
  data.forEach(w => {
    if (!prMap[w.exerciseId]) prMap[w.exerciseId] = { name: w.exerciseName, icon: w.exerciseIcon, maxReps: 0, maxWeight: 0, maxDuration: 0 };
    w.sets.forEach(s => {
      if (s.reps > prMap[w.exerciseId].maxReps) prMap[w.exerciseId].maxReps = s.reps;
      if ((s.weight || 0) > prMap[w.exerciseId].maxWeight) prMap[w.exerciseId].maxWeight = s.weight;
      if ((s.duration || 0) > prMap[w.exerciseId].maxDuration) prMap[w.exerciseId].maxDuration = s.duration;
    });
  });

  const entries = Object.entries(prMap);
  if (entries.length === 0) return '';

  return `<div class="card">
    <div class="card-title">🏆 PERSONAL RECORDS</div>
    ${entries.map(([id, pr]) => `
      <div class="stat-row">
        <span class="stat-label">${pr.icon} ${pr.name}</span>
        <span style="text-align:right; font-size:0.8rem; color:var(--gold2); font-family:var(--font-b); font-weight:600;">
          ${pr.maxReps > 0 ? `${pr.maxReps} reps` : ''}
          ${pr.maxWeight > 0 ? ` · ${pr.maxWeight}kg` : ''}
          ${pr.maxDuration > 0 ? ` · ${pr.maxDuration}sek` : ''}
        </span>
      </div>
    `).join('')}
  </div>`;
}

function renderWeightProgression(data) {
  const weightData = data.filter(w => w.sets.some(s => s.weight > 0));
  if (weightData.length < 2) return '';

  const points = weightData.map(w => ({
    date: w.date,
    maxWeight: Math.max(...w.sets.map(s => s.weight || 0))
  })).sort((a, b) => new Date(a.date) - new Date(b.date));

  const svgW = Math.max(300, window.innerWidth - 52);
  const svgH = 80;
  const maxW = Math.max(...points.map(p => p.maxWeight));
  const n = points.length;

  const coords = points.map((p, i) => {
    const x = 10 + (i / Math.max(n - 1, 1)) * (svgW - 20);
    const y = svgH - 20 - ((p.maxWeight / maxW) * 50);
    return { x, y, w: p.maxWeight };
  });

  const path = coords.map((c, i) => `${i === 0 ? 'M' : 'L'}${c.x},${c.y}`).join(' ');
  const dots = coords.map(c => `<circle cx="${c.x}" cy="${c.y}" r="3" fill="var(--rust2)"><title>${c.w}kg</title></circle>`).join('');

  return `<div class="card">
    <div class="card-title">GEWICHTS-VERLAUF</div>
    <div class="chart-wrap">
      <svg class="chart-svg" width="${svgW}" height="${svgH}" viewBox="0 0 ${svgW} ${svgH}">
        <path d="${path}" fill="none" stroke="var(--rust)" stroke-width="2"/>
        ${dots}
        <text x="${coords[coords.length-1].x}" y="${coords[coords.length-1].y - 8}" text-anchor="middle" fill="var(--gold2)" font-size="9" font-family="Oswald">${coords[coords.length-1].w}kg</text>
      </svg>
    </div>
  </div>`;
}

// ============================================================
// PR CHECK
// ============================================================
function checkAndShowPR() {
  if (!selectedExercise) return;
  const prFlash = document.getElementById('prFlash');
  prFlash.style.display = 'none';

  const prev = workouts.filter(w => w.exerciseId === selectedExercise.id);
  if (prev.length === 0) return;

  const weight = stepperValues['weight'] || 0;
  if (weight > 0) {
    const prevMax = Math.max(...prev.flatMap(w => w.sets.map(s => s.weight || 0)));
    if (weight > prevMax) {
      prFlash.style.display = 'block';
    }
  }
}

// ============================================================
// SLEEP
// ============================================================
function saveSleepEntry() {
  const date = document.getElementById('sleepDate').value;
  const bedtime = document.getElementById('sleepBedtime').value;
  const wakeup = document.getElementById('sleepWakeup').value;
  const quality = parseInt(document.getElementById('sleepQuality').value);
  const hrv = parseInt(document.getElementById('sleepHRV').value) || null;
  const notes = document.getElementById('sleepNotes').value;

  if (!date || !bedtime || !wakeup) { showToast('Bitte Datum & Zeiten eingeben!'); return; }

  // Calculate hours
  const bed = parseTime(bedtime);
  const wake = parseTime(wakeup);
  let hours = (wake - bed) / 3600;
  if (hours < 0) hours += 24;

  const entry = { id: Date.now(), date, bedtime, wakeup, hours: Math.round(hours * 10) / 10, quality, hrv, notes };

  // Remove existing entry for same date
  sleepData = sleepData.filter(s => s.date !== date);
  sleepData.unshift(entry);
  sleepData.sort((a, b) => new Date(b.date) - new Date(a.date));
  saveData('cl_sleep', sleepData);

  showToast('💤 Schlafdaten gespeichert!');
  renderSleepStats();

  // Reset
  document.getElementById('sleepNotes').value = '';
  document.getElementById('sleepHRV').value = '';
}

function parseTime(str) {
  const [h, m] = str.split(':').map(Number);
  return h * 3600 + m * 60;
}

function importSleepCSV(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    const lines = e.target.result.split('\n').filter(l => l.trim());
    let count = 0;
    lines.forEach(line => {
      const parts = line.split(',');
      if (parts.length >= 2) {
        const date = parts[0].trim();
        const hours = parseFloat(parts[1].trim());
        const quality = parseInt(parts[2]?.trim()) || 3;
        if (date && !isNaN(hours)) {
          sleepData = sleepData.filter(s => s.date !== date);
          sleepData.push({ id: Date.now() + count, date, hours, quality, notes: 'Importiert' });
          count++;
        }
      }
    });
    sleepData.sort((a, b) => new Date(b.date) - new Date(a.date));
    saveData('cl_sleep', sleepData);
    showToast(`${count} Einträge importiert!`);
    renderSleepStats();
  };
  reader.readAsText(file);
}

function renderSleepStats() {
  const container = document.getElementById('sleepStats');
  if (sleepData.length === 0) {
    container.innerHTML = `<div class="empty-state"><span class="empty-state-icon">🌙</span><div class="empty-state-text">Noch keine Schlafdaten</div></div>`;
    return;
  }

  const recent = sleepData.slice(0, 7);
  const avgHours = recent.reduce((a, b) => a + b.hours, 0) / recent.length;
  const avgQuality = recent.reduce((a, b) => a + b.quality, 0) / recent.length;
  const lastEntry = sleepData[0];
  const sleepScore = Math.round((avgHours / 8) * 50 + (avgQuality / 5) * 50);
  const scoreClass = sleepScore >= 80 ? 'great' : sleepScore >= 60 ? 'good' : sleepScore >= 40 ? 'warn' : 'bad';

  const chartData = recent.map(s => ({ label: s.date.slice(5), value: s.hours })).reverse();

  container.innerHTML = `
    <div class="card">
      <div class="sleep-score">
        <div class="sleep-score-val">${sleepScore}</div>
        <div class="sleep-score-label">SCHLAF-SCORE (7-TAGE)</div>
      </div>
      <div class="stat-row"><span class="stat-label">Ø SCHLAFDAUER</span><span class="stat-value ${scoreClass === 'great' ? 'gold' : ''}">${avgHours.toFixed(1)}h</span></div>
      <div class="stat-row"><span class="stat-label">Ø QUALITÄT</span><span class="stat-value">
        ${'★'.repeat(Math.round(avgQuality))}${'☆'.repeat(5 - Math.round(avgQuality))}
      </span></div>
      ${lastEntry.hrv ? `<div class="stat-row"><span class="stat-label">LETZTER HRV</span><span class="stat-value">${lastEntry.hrv} ms</span></div>` : ''}
    </div>

    <div class="card">
      <div class="card-title">SCHLAF – LETZTE 7 NÄCHTE</div>
      <div class="chart-wrap">${renderSleepChart(chartData)}</div>
    </div>

    <div class="card">
      <div class="card-title">VERLAUF</div>
      ${sleepData.slice(0, 10).map(s => `
        <div class="stat-row">
          <span style="font-family:var(--font-s); font-size:0.75rem; color:var(--chalk2)">${s.date}</span>
          <span style="display:flex; align-items:center; gap:8px;">
            <span style="font-family:var(--font-b); font-size:0.9rem; color:var(--chalk)">${s.hours}h</span>
            <span style="font-size:0.75rem; color:var(--gold)">${'★'.repeat(s.quality)}</span>
          </span>
        </div>
      `).join('')}
    </div>
  `;
}

function renderSleepChart(data) {
  const svgW = Math.max(300, window.innerWidth - 52);
  const svgH = 90;
  const max = Math.max(...data.map(d => d.value), 8);
  const barW = Math.floor((svgW - 20) / data.length) - 2;

  const bars = data.map((d, i) => {
    const barH = Math.round((d.value / max) * 65);
    const x = 10 + i * (barW + 2);
    const y = svgH - 20 - barH;
    const color = d.value >= 7.5 ? '#d4a520' : d.value >= 6 ? '#2a5c3f' : '#c0440a';
    return `
      <rect x="${x}" y="${y}" width="${barW}" height="${barH}" rx="2" fill="${color}" opacity="0.85"/>
      <text x="${x + barW/2}" y="${y - 3}" text-anchor="middle" fill="#b8a88a" font-size="8" font-family="Oswald">${d.value}h</text>
      <text x="${x + barW/2}" y="${svgH - 4}" text-anchor="middle" fill="#6b5a42" font-size="7" font-family="Oswald">${d.label}</text>
    `;
  }).join('');

  // 8h reference line
  const refY = svgH - 20 - Math.round((8 / max) * 65);
  return `<svg class="chart-svg" width="${svgW}" height="${svgH}" viewBox="0 0 ${svgW} ${svgH}">
    <line x1="10" y1="${refY}" x2="${svgW-10}" y2="${refY}" stroke="#d4a520" stroke-width="1" stroke-dasharray="4,3" opacity="0.4"/>
    <text x="${svgW-12}" y="${refY-3}" text-anchor="end" fill="#d4a520" font-size="7" font-family="Oswald" opacity="0.6">8h ZIEL</text>
    <line x1="10" y1="${svgH-20}" x2="${svgW-10}" y2="${svgH-20}" stroke="#3a2a1a" stroke-width="1"/>
    ${bars}
  </svg>`;
}

// ============================================================
// COACH / AI ANALYSIS
// ============================================================
function renderCoach() {
  const container = document.getElementById('coachContent');
  const recommendations = generateRecommendations();

  if (recommendations.length === 0) {
    container.innerHTML = `<div class="empty-state">
      <span class="empty-state-icon">⚡</span>
      <div class="empty-state-text">Starte mit dem Training und dem Schlaf-Tracking – dann bekommst du hier personalisierte Empfehlungen!</div>
    </div>`;
    return;
  }

  container.innerHTML = recommendations.map(r => `
    <div class="rec-card anim-slide">
      <div class="rec-icon">${r.icon}</div>
      <div class="rec-title">${r.title}</div>
      <div class="rec-text">${r.text}</div>
    </div>
  `).join('');
}

function generateRecommendations() {
  const recs = [];
  const now = new Date();

  // Sleep analysis
  if (sleepData.length >= 3) {
    const recent7 = sleepData.slice(0, 7);
    const avgHours = recent7.reduce((a, b) => a + b.hours, 0) / recent7.length;
    const avgQuality = recent7.reduce((a, b) => a + b.quality, 0) / recent7.length;

    if (avgHours < 7) {
      recs.push({
        icon: '😴',
        title: 'SCHLAF VERBESSERN',
        text: `Du schläfst durchschnittlich nur ${avgHours.toFixed(1)} Stunden – zu wenig für optimale Regeneration! Kletterathlet:innen brauchen 7.5–9h. Deine Fingersehnen regenerieren hauptsächlich im Schlaf. Versuche, 30 Min früher ins Bett zu gehen.`
      });
    } else if (avgHours >= 8) {
      recs.push({
        icon: '🌟',
        title: 'SUPER SCHLAF-BASIS',
        text: `Dein Ø-Schlaf von ${avgHours.toFixed(1)}h ist exzellent! Das gibt dir eine starke Basis für intensive Trainingseinheiten. Nutze diesen Vorteil für anspruchsvolle Übungen wie Hangboard oder Zusatzgewicht.`
      });
    }

    if (avgQuality <= 2.5) {
      recs.push({
        icon: '🌿',
        title: 'SCHLAFQUALITÄT OPTIMIEREN',
        text: 'Deine Schlafqualität ist niedrig. Tipps: Kein Bildschirm 1h vor dem Schlafen, Zimmertemperatur 16-18°C, kein intensives Training 3h vor dem Schlafen. Magnesium kann Muskelentspannung fördern.'
      });
    }
  }

  // Training frequency analysis
  if (workouts.length >= 3) {
    const last7Days = workouts.filter(w => {
      const d = new Date(w.date);
      const diff = (now - d) / (1000 * 60 * 60 * 24);
      return diff <= 7;
    });

    const last14Days = workouts.filter(w => {
      const d = new Date(w.date);
      const diff = (now - d) / (1000 * 60 * 60 * 24);
      return diff <= 14;
    });

    if (last7Days.length >= 5) {
      recs.push({
        icon: '⚠️',
        title: 'ÜBERTRAINING WARNUNG',
        text: `Du hast ${last7Days.length}x in den letzten 7 Tagen trainiert! Für Kletterer gilt: Fingersehnen brauchen 48-72h Regeneration. Plane mindestens 2 Ruhetage pro Woche ein, sonst riskierst du Ringbandverletzungen.`
      });
    } else if (last7Days.length === 0 && workouts.length > 0) {
      recs.push({
        icon: '🔥',
        title: 'ZURÜCK AN DEN BOARD!',
        text: 'Du hast diese Woche noch nicht trainiert. Selbst ein kurzes 20-Min Hangboard-Session hält die Fingerkraft aufrecht. Dranbleiben ist der Schlüssel zum Fortschritt!'
      });
    }

    // Progression check
    const hangboardWorkouts = workouts.filter(w => w.exerciseId === 'hangboard' || w.exerciseId === 'hangboard_weight' || w.exerciseId === 'deadhang');
    const pullupWorkouts = workouts.filter(w => w.exerciseId === 'pullups' || w.exerciseId === 'pullups_weight');

    if (hangboardWorkouts.length >= 3) {
      const last = hangboardWorkouts[0].sets;
      const maxDur = Math.max(...last.map(s => s.duration || 0));
      recs.push({
        icon: '🪨',
        title: 'HANGBOARD PROGRESSION',
        text: `Deine längste Hangezeit: ${maxDur} Sekunden. Das Ziel für Fortgeschrittene: 10-sek Hängen mit Körpergewicht + 50% auf einer 20mm Leiste. Steigere schrittweise um 2.5kg oder 2-3sek alle 2 Wochen.`
      });
    }

    if (pullupWorkouts.length >= 3) {
      const weightedPullups = workouts.filter(w => w.exerciseId === 'pullups_weight');
      if (weightedPullups.length >= 2) {
        const maxWeights = weightedPullups.map(w => Math.max(...w.sets.map(s => s.weight || 0)));
        const trend = maxWeights[0] > maxWeights[maxWeights.length - 1];
        if (trend) {
          recs.push({
            icon: '📈',
            title: 'GEWICHT STEIGT – TOP!',
            text: `Dein Gewicht bei Klimmzügen steigt – das ist ein klares Zeichen für echte Kraftzunahme! Für maximale Kletterperformance: 1-5 Reps mit schwerem Gewicht für relative Kraft (Gewicht/Körpergewicht).`
          });
        }
      }
    }
  }

  // Sleep + Training correlation
  if (sleepData.length >= 3 && workouts.length >= 3) {
    const last3Sleep = sleepData.slice(0, 3);
    const avgRecentSleep = last3Sleep.reduce((a, b) => a + b.hours, 0) / last3Sleep.length;

    if (avgRecentSleep < 6.5) {
      recs.push({
        icon: '🔄',
        title: 'SCHLAF-TRAINING BALANCE',
        text: 'Dein Schlaf war zuletzt knapp. Empfehlung: Reduziere heute die Trainingsintensität um 30%. Statt schwerem Hangboard lieber lockeres Klettern oder Mobilitätsarbeit. Qualität über Quantität!'
      });
    } else if (avgRecentSleep >= 8) {
      recs.push({
        icon: '💪',
        title: 'PERFEKTER ZEITPUNKT',
        text: `Mit ${avgRecentSleep.toFixed(1)}h Schlaf bist du top erholt! Heute ist der ideale Tag für ein Maximum-Effort Training: Hangboard, schwere Klimmzüge oder einen schwierigen Boulder-Durchstieg. Du bist bereit!`
      });
    }
  }

  // General tips if not much data
  if (workouts.length < 3) {
    recs.push({
      icon: '🎯',
      title: 'STARTE DEIN TRACKING',
      text: 'Logge mindestens 5 Workouts, damit CrimpLog dir präzise Empfehlungen geben kann. Tipp: Starte mit dem Deadhang-Test – halte so lange wie möglich – und tracke diese Zahl alle 2 Wochen.'
    });
  }

  return recs;
}

// ============================================================
// TOAST
// ============================================================
function showToast(msg, duration = 2000) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.style.display = 'block';
  setTimeout(() => { toast.style.display = 'none'; }, duration);
}

// ============================================================
// INSTALL PROMPT (PWA)
// ============================================================
let deferredPrompt;
window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  deferredPrompt = e;
});

import { createClient }
from 'https://esm.sh/@supabase/supabase-js'
const supabaseUrl = "https://fdgtzilbwjiuetrheoly.supabase.co"
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZkZ3R6aWxid2ppdWV0cmhlb2x5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2NjczOTksImV4cCI6MjA5NDI0MzM5OX0.4SPYm4eypp7o143faPEkLAltsptS6iT1JHAitfhQEfY"

const supabase = createClient(
  supabaseUrl,
  supabaseKey
)

const status = document.getElementById("status")

document
.getElementById("registerBtn")
.addEventListener("click", register)

document
.getElementById("loginBtn")
.addEventListener("click", login)

document
.getElementById("logoutBtn")
.addEventListener("click", logout)

async function register(){

  const email =
    document.getElementById("email").value

  const password =
    document.getElementById("password").value

  const { data, error } =
    await supabase.auth.signUp({
      email,
      password
    })

  if(error){
    status.innerText = error.message
    return
  }

  status.innerText =
    "Registrierung erfolgreich!"
}

async function login(){

  const email =
    document.getElementById("email").value

  const password =
    document.getElementById("password").value

  const { data, error } =
    await supabase.auth.signInWithPassword({
      email,
      password
    })
  }