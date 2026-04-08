// ══════════════════════════════════════════════════════════════
// Running Coach × Claude IA  –  app.js
// All logic preserved from RunningCoach_Claude.html
// New additions: toggleAcc() for accordion behavior
// ══════════════════════════════════════════════════════════════

// ── CONFIG ──────────────────────────────────────────────────────
var API_URL     = 'https://api.anthropic.com/v1/messages';
var API_VERSION = '2023-06-01';

// ── DATA MAPS ───────────────────────────────────────────────────
var DIST_MAP = {
  'Route':             ['5 km','10 km','Semi-marathon (21,1 km)','Marathon (42,2 km)','50 km route'],
  'Trail court':       ['10 km trail','15 km trail','20 km trail','25 km trail','30 km trail'],
  'Trail long':        ['40 km','50 km','80 km','100 km','Ultra (100 km+)'],
  'Cross':             ['3 km cross','4 km cross','6 km cross','8 km cross','10 km cross'],
  'Piste':             ['800 m','1 500 m','3 000 m','5 000 m','10 000 m'],
  'Course à obstacles':['5 km obstacles','10 km obstacles','20 km obstacles','Spartan Sprint (~8km)','Spartan Super (~13km)','Spartan Beast (~21km)']
};

var MAX_WEEKS_MAP = {
  '5 km':6,'10 km':8,'Semi-marathon (21,1 km)':10,'Marathon (42,2 km)':14,'50 km route':18,
  '10 km trail':8,'15 km trail':10,'20 km trail':12,'25 km trail':14,'30 km trail':16,
  '40 km':16,'50 km':18,'80 km':20,'100 km':22,'Ultra (100 km+)':24,
  '3 km cross':6,'4 km cross':6,'6 km cross':7,'8 km cross':8,'10 km cross':8,
  '800 m':6,'1 500 m':8,'3 000 m':8,'5 000 m':10,'10 000 m':10,
  '5 km obstacles':8,'10 km obstacles':10,'20 km obstacles':12,
  'Spartan Sprint (~8km)':8,'Spartan Super (~13km)':10,'Spartan Beast (~21km)':12
};

var STYLE_HINTS = {
  'Classique FFA':   'Périodisation classique FFA : adaptation → développement → spécifique → affûtage.',
  '80/20 Polarisé':  '80% des séances en EF (Z1-Z2), 20% en haute intensité (Z4-Z5). Très peu de Z3.',
  'Lydiard':         'Longue base aérobie (EF + SL) avant de monter en intensité. Idéal pour les longues distances.',
  'HIIT Intensif':   'VMA et seuil prioritaires, volume modéré, haute intensité. Pour coureurs expérimentés.',
  'Progressif doux': 'Volume +5-10% max/semaine, intensité faible au départ. Idéal pour reprise ou débutant.'
};

var VMA_FACTORS = {'1.5':1.00,'3':1.02,'5':1.06,'10':1.10};

var DAYS = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'];

var BADGE_LABELS = {
  repos:  'Repos',
  course: '🏁 Course',
  vma:    'VMA',
  seuil:  'Seuil',
  sl:     'SL',
  ppg:    'PPG',
  recup:  'Récup',
  ef:     'EF'
};

// ── STATE ───────────────────────────────────────────────────────
var _currentPlan   = null;
var _currentData   = null;
var _regenWeekNum  = 0;
var _progressTimer = null;

// ══════════════════════════════════════════════════════════════
// INIT
// ══════════════════════════════════════════════════════════════
window.addEventListener('DOMContentLoaded', function () {
  updateSlider();
  updateStyleHint();
});

// ══════════════════════════════════════════════════════════════
// ACCORDION
// ══════════════════════════════════════════════════════════════
/**
 * toggleAcc(id)
 * Toggles a single accordion section open/closed.
 * Multiple sections can be open simultaneously.
 * First section (#acc-1) is open by default via HTML class="acc-header open".
 */
function toggleAcc(id) {
  var section = document.getElementById(id);
  if (!section) return;

  var header = section.querySelector('.acc-header');
  var body   = section.querySelector('.acc-body');
  if (!header || !body) return;

  var isOpen = header.classList.contains('open');

  if (isOpen) {
    // Close it
    header.classList.remove('open');
    body.style.display = 'none';
  } else {
    // Open it
    header.classList.add('open');
    body.style.display = 'block';
    // Trigger animation by re-adding the animation class
    body.style.animation = 'none';
    body.offsetHeight; // reflow
    body.style.animation = '';
  }
}

// ══════════════════════════════════════════════════════════════
// UI HELPERS
// ══════════════════════════════════════════════════════════════
function updateSlider() {
  document.getElementById('kmVal').textContent = document.getElementById('kmPerWeek').value + ' km';
}

function updateStyleHint() {
  var v = document.getElementById('planStyle').value;
  document.getElementById('styleHint').textContent = STYLE_HINTS[v] || '';
}

function maskDate(el) {
  var v = el.value.replace(/\D/g, '');
  var out = v.substring(0, 2);
  if (v.length >= 3) out += '/' + v.substring(2, 4);
  if (v.length >= 5) out += '/' + v.substring(4, 8);
  el.value = out;
}

function maskTime(el) {
  var v = el.value.replace(/\D/g, '');
  var out = v.substring(0, 1);
  if (v.length >= 2) out += ':' + v.substring(1, 3);
  if (v.length >= 4) out += ':' + v.substring(3, 5);
  el.value = out;
}

function maskTimeShort(el) {
  var v = el.value.replace(/\D/g, '');
  var out = v.substring(0, 2);
  if (v.length >= 3) out += ':' + v.substring(2, 4);
  el.value = out;
}

function togglePw() {
  var el = document.getElementById('apiKey');
  el.type = (el.type === 'password') ? 'text' : 'password';
}

function syncPill(id, cb) {
  document.getElementById(id).classList.toggle('active', cb.checked);
}

function escHtml(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ══════════════════════════════════════════════════════════════
// DATE & WEEKS
// ══════════════════════════════════════════════════════════════
function parseLocalDate(str) {
  if (!str) return null;
  var m = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (!m) return null;
  return new Date(+m[3], +m[2] - 1, +m[1]);
}

function getMaxWeeks() {
  return MAX_WEEKS_MAP[document.getElementById('distance').value] || 20;
}

function computeWeeks() {
  var badge   = document.getElementById('weeksBadge');
  var dateVal = document.getElementById('raceDate').value;
  if (!dateVal || dateVal.length < 10) { badge.style.display = 'none'; return; }
  var race = parseLocalDate(dateVal);
  if (!race || isNaN(race)) { badge.style.display = 'none'; return; }
  var today = new Date(); today.setHours(0, 0, 0, 0);
  var weeksToRace = Math.ceil((race - today) / 604800000);
  var planW = Math.min(weeksToRace, getMaxWeeks());

  if (weeksToRace <= 0) {
    badge.innerHTML   = '⚠ La date doit être dans le futur';
    badge.className   = 'weeks-badge warn';
  } else if (weeksToRace < 4) {
    badge.innerHTML   = '⚠ ' + weeksToRace + ' sem. – affûtage uniquement';
    badge.className   = 'weeks-badge warn';
  } else {
    badge.innerHTML   = '📅 <b>' + planW + ' semaine' + (planW > 1 ? 's' : '') + ' de préparation</b>'
      + (weeksToRace > getMaxWeeks() ? ' (sur ' + weeksToRace + ' disp.)' : '');
    badge.className   = 'weeks-badge';
  }
  badge.style.display = 'block';
}

function updateDistances() {
  var type = document.getElementById('raceType').value;
  var sel  = document.getElementById('distance');
  sel.innerHTML = '<option value="">— Distance —</option>';
  (DIST_MAP[type] || []).forEach(function (d) {
    var o = document.createElement('option');
    o.value = d;
    o.textContent = d;
    sel.appendChild(o);
  });
}

// ══════════════════════════════════════════════════════════════
// VMA
// ══════════════════════════════════════════════════════════════
function calcVMA() {
  var distVal = document.getElementById('calcDist').value;
  var timeVal = document.getElementById('calcTime').value.trim();
  if (!timeVal) { alert('Saisissez un chrono (MM:SS)'); return; }
  var p = timeVal.split(':');
  var totalMin = (p.length === 2)
    ? +p[0] + +p[1] / 60
    : +p[0] * 60 + +p[1] + +(p[2] || 0) / 60;
  if (isNaN(totalMin) || totalMin <= 0) { alert('Chrono invalide'); return; }
  var vma = Math.round(parseFloat(distVal) / (totalMin / 60) * (VMA_FACTORS[distVal] || 1.06) * 10) / 10;
  vma = Math.min(25, Math.max(8, vma));
  var res = document.getElementById('vmaResult');
  res.innerHTML   = 'VMA estimée : <b>' + vma + ' km/h</b>';
  res.style.display = 'block';
  var el = document.getElementById('vma');
  el.value = vma;
  validateVMA(el);
  checkValidity();
}

function validateVMA(el) {
  var v   = parseFloat(el.value);
  var err = document.getElementById('vmaErr');
  if (!el.value) {
    el.classList.remove('is-invalid', 'is-valid');
    err.style.display = 'none';
  } else if (isNaN(v) || v < 8 || v > 25) {
    el.classList.remove('is-valid');
    el.classList.add('is-invalid');
    err.style.display = 'block';
  } else {
    el.classList.remove('is-invalid');
    el.classList.add('is-valid');
    err.style.display = 'none';
  }
}

function vmaToAllure(vma, pct) {
  var pace = 60 / (+vma * pct);
  var min  = Math.floor(pace);
  var sec  = Math.round((pace - min) * 60);
  if (sec === 60) { min++; sec = 0; }
  return min + ':' + (sec < 10 ? '0' : '') + sec;
}

// ══════════════════════════════════════════════════════════════
// VALIDATION
// ══════════════════════════════════════════════════════════════
function checkValidity() {
  var key      = document.getElementById('apiKey').value.trim();
  var type     = document.getElementById('raceType').value;
  var dist     = document.getElementById('distance').value;
  var date     = document.getElementById('raceDate').value;
  var level    = document.getElementById('level').value;
  var sessions = document.getElementById('sessionsPerWeek').value;
  var vmaEl    = document.getElementById('vma');
  var vmaOk    = !vmaEl.value || vmaEl.classList.contains('is-valid');
  var dateOk   = false;
  if (date && date.length === 10) {
    var p = parseLocalDate(date);
    var t = new Date(); t.setHours(0, 0, 0, 0);
    dateOk = p && !isNaN(p) && p > t;
  }
  document.getElementById('btnGenerate').disabled =
    !(key && type && dist && dateOk && level && sessions && vmaOk);
}

// ══════════════════════════════════════════════════════════════
// COLLECT DATA
// ══════════════════════════════════════════════════════════════
function collectData() {
  var injuries = [];
  document.querySelectorAll('#pillsGroup input:checked').forEach(function (cb) {
    injuries.push(cb.value);
  });
  var detail = document.getElementById('injuriesDetail').value.trim();
  if (detail) injuries.push(detail);

  var dateVal     = document.getElementById('raceDate').value;
  var today       = new Date(); today.setHours(0, 0, 0, 0);
  var raceDate    = parseLocalDate(dateVal);
  var weeksToRace = Math.max(1, Math.ceil((raceDate - today) / 604800000));
  var weeks       = Math.min(weeksToRace, getMaxWeeks());
  var dateFR      = raceDate
    ? raceDate.toLocaleDateString('fr-FR', { weekday:'long', year:'numeric', month:'long', day:'numeric' })
    : dateVal;

  return {
    apiKey:          document.getElementById('apiKey').value.trim(),
    apiModel:        document.getElementById('apiModel').value,
    raceType:        document.getElementById('raceType').value,
    distance:        document.getElementById('distance').value,
    raceDate:        dateVal,
    raceDateFR:      dateFR,
    level:           document.getElementById('level').value,
    vma:             document.getElementById('vma').value,
    sessionsPerWeek: document.getElementById('sessionsPerWeek').value,
    kmPerWeek:       document.getElementById('kmPerWeek').value,
    targetTime:      document.getElementById('targetTime').value,
    planStyle:       document.getElementById('planStyle').value,
    detailLevel:     document.getElementById('detailLevel').value,
    injuries:        injuries.length ? injuries.join(' ; ') : 'Aucune blessure ni contre-indication',
    weeks:           weeks
  };
}

// ══════════════════════════════════════════════════════════════
// BUILD PROMPT
// ══════════════════════════════════════════════════════════════
function buildPrompt(d, isRegen, regenWeekNum, regenNote) {
  var allures = d.vma
    ? 'VMA=' + d.vma + 'km/h → EF:' + vmaToAllure(d.vma, .65) + '-' + vmaToAllure(d.vma, .72) + '/km · SL:' + vmaToAllure(d.vma, .62) + '-' + vmaToAllure(d.vma, .70) + '/km · Seuil:' + vmaToAllure(d.vma, .83) + '-' + vmaToAllure(d.vma, .88) + '/km · VMA:' + vmaToAllure(d.vma, 1.00) + '-' + vmaToAllure(d.vma, 1.07) + '/km · Récup:' + vmaToAllure(d.vma, .60) + '/km'
    : 'VMA non renseignée – utiliser des allures relatives ("allure EF confortable", etc.) sans inventer de min/km.';

  var forceCompact = d.weeks >= 8;
  var detailInstr  = (forceCompact || d.detailLevel === 'concis')
    ? 'IMPÉRATIF taille : MAX 15 mots par séance. Format : "TYPE durée | séquence courte". Ex: "EF 45min | 10 éch + 25 EF + 10 RC".'
    : (d.detailLevel === 'standard')
      ? 'MAX 25 mots par séance : type + durée + séquence (éch. / cœur / RC).'
      : 'MAX 40 mots par séance : type, durée, allures si VMA connue, séquence détaillée.';

  var styleMap = {
    'Classique FFA':   'périodisation FFA : adaptation → développement → spécifique → affûtage.',
    '80/20 Polarisé':  '80% EF (Z1-Z2), 20% haute intensité (Z4-Z5), éviter Z3.',
    'Lydiard':         'longue base aérobie (EF+SL) en premier, puis montée progressive en intensité.',
    'HIIT Intensif':   'VMA et seuil prioritaires, volume modéré, pour coureurs expérimentés.',
    'Progressif doux': 'volume +5-10% max/sem, intensité faible au départ, idéal reprise.'
  };

  if (isRegen) {
    var existingWeek = '';
    if (_currentPlan && _currentPlan.weeks) {
      _currentPlan.weeks.forEach(function (w) {
        if (w.weekNum == regenWeekNum) existingWeek = JSON.stringify(w);
      });
    }
    return 'Tu es un coach running expert FFA. Régénère UNIQUEMENT la semaine ' + regenWeekNum + '. Réponds avec un objet JSON pur, sans markdown.\n\n'
      + 'Contexte : ' + d.raceType + ' · ' + d.distance + ' · Niveau ' + d.level + ' · Style ' + (styleMap[d.planStyle] || d.planStyle) + '\n'
      + 'Allures : ' + allures + '\n'
      + d.sessionsPerWeek + ' séances/sem max · Blessures : ' + d.injuries + '\n'
      + (regenNote ? 'Consigne spéciale : ' + regenNote + '\n' : '')
      + 'Semaine actuelle : ' + existingWeek + '\n\n'
      + 'Format JSON strict (une seule semaine) :\n'
      + '{"weekNum":' + regenWeekNum + ',"weekLabel":"Phase · Objectif","weeklyVolume":"~XX km","Lundi":"...","Mardi":"...","Mercredi":"...","Jeudi":"...","Vendredi":"...","Samedi":"...","Dimanche":"..."}';
  }

  return 'Tu es un coach running expert FFA. Génère un plan complet en JSON pur. AUCUN texte, AUCUN markdown.\n\n'
    + '## PROFIL\n'
    + '- Course : ' + d.raceType + ' · ' + d.distance + '\n'
    + '- Date J : ' + d.raceDateFR + '\n'
    + '- Durée prépa : ' + d.weeks + ' semaine' + (d.weeks > 1 ? 's' : '') + '\n'
    + '- Niveau : ' + d.level + '\n'
    + '- Kilométrage actuel : ~' + d.kmPerWeek + ' km/sem\n'
    + '- Séances / semaine : ' + d.sessionsPerWeek + '\n'
    + '- Style : ' + (styleMap[d.planStyle] || d.planStyle) + '\n'
    + '- Objectif chrono : ' + (d.targetTime || 'non précisé') + '\n'
    + '- ' + allures + '\n'
    + '- Blessures / santé : ' + d.injuries + '\n\n'
    + '## RÈGLES IMPÉRATIVES\n'
    + '1. Exactement ' + d.weeks + ' semaines (S1 à S' + d.weeks + ').\n'
    + '2. ' + d.sessionsPerWeek + ' séances max/semaine. Jours libres = "Repos".\n'
    + '3. Jamais 2 séances intenses consécutives (VMA, Seuil). Intercaler EF ou Repos.\n'
    + '4. Progression logique des phases selon la durée disponible.\n'
    + '5. Dernière séance = jour de course : "🏁 COURSE - ' + d.distance + ' · Jour J !".\n'
    + '6. ' + detailInstr + '\n'
    + '7. weeklyVolume = volume estimé en km (ex : "~45 km").\n\n'
    + '## FORMAT JSON STRICT\n'
    + '{"planTitle":"...","totalWeeks":' + d.weeks + ',"weeks":['
    + '{"weekNum":1,"weekLabel":"Phase · Objectif","weeklyVolume":"~XX km",'
    + '"Lundi":"...","Mardi":"...","Mercredi":"...","Jeudi":"...","Vendredi":"...","Samedi":"...","Dimanche":"..."},'
    + '...toutes les semaines jusqu\'à S' + d.weeks + ']}';
}

// ══════════════════════════════════════════════════════════════
// CALL CLAUDE API
// ══════════════════════════════════════════════════════════════
function callAPI(apiKey, model, prompt, onSuccess, onError) {
  var xhr = new XMLHttpRequest();
  xhr.open('POST', API_URL, true);
  xhr.setRequestHeader('Content-Type',                     'application/json');
  xhr.setRequestHeader('x-api-key',                        apiKey);
  xhr.setRequestHeader('anthropic-version',                API_VERSION);
  xhr.setRequestHeader('anthropic-dangerous-allow-browser','true');
  xhr.timeout = 180000;

  xhr.onreadystatechange = function () {
    if (xhr.readyState !== 4) return;
    if (xhr.status === 200) {
      try {
        var res = JSON.parse(xhr.responseText);
        if (res.stop_reason === 'max_tokens') {
          onError('Réponse tronquée (limite de tokens atteinte).\nEssayez : moins de semaines, niveau de détail "Concis", ou une distance plus courte.');
          return;
        }
        if (!res.content || !res.content[0] || !res.content[0].text) {
          onError('Structure de réponse inattendue :\n' + xhr.responseText.substring(0, 300));
          return;
        }
        onSuccess(res.content[0].text);
      } catch (e) {
        onError('Erreur lecture réponse : ' + e.message + '\n' + xhr.responseText.substring(0, 300));
      }
    } else {
      var msg = 'Erreur HTTP ' + xhr.status;
      try {
        var o = JSON.parse(xhr.responseText);
        if (o.error) msg += ' – ' + (o.error.message || JSON.stringify(o.error));
      } catch (e) {
        msg += '\n' + xhr.responseText.substring(0, 200);
      }
      onError(msg);
    }
  };

  xhr.onerror   = function () { onError('Erreur réseau. Vérifiez votre connexion internet.'); };
  xhr.ontimeout = function () { onError('Délai dépassé (3 min). Essayez avec moins de semaines.'); };

  xhr.send(JSON.stringify({
    model:       model,
    max_tokens:  8192,
    temperature: 0.3,
    system: 'Tu es un coach running expert FFA. RÈGLE ABSOLUE : réponds UNIQUEMENT avec du JSON brut valide. Commence directement par { et termine par }. Aucun texte avant ou après, aucune balise markdown, aucun bloc de code.',
    messages: [{ role: 'user', content: prompt }]
  }));
}

// ══════════════════════════════════════════════════════════════
// PARSE JSON RESPONSE
// ══════════════════════════════════════════════════════════════
function parseResponse(raw) {
  var s = raw.trim()
    .replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```\s*$/i, '');
  var start = s.indexOf('{');
  var end   = s.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('Pas de JSON valide dans la réponse.\nDébut : ' + raw.substring(0, 200));
  }
  s = s.substring(start, end + 1);
  try {
    return JSON.parse(s);
  } catch (e1) {
    // Sanitize newlines inside string values
    var s2 = s.replace(/"((?:[^"\\]|\\.)*)"/g, function (m) {
      return m.replace(/\n/g, '\\n').replace(/\r/g, '\\r');
    });
    try {
      return JSON.parse(s2);
    } catch (e2) {
      throw new Error('JSON invalide : ' + e2.message + '\nDébut : ' + raw.substring(0, 300));
    }
  }
}

// ══════════════════════════════════════════════════════════════
// DETECT SESSION TYPE
// ══════════════════════════════════════════════════════════════
function detectType(text) {
  if (!text) return 'repos';
  var t = text.toLowerCase();
  if (t === 'repos') return 'repos';
  if (t.includes('🏁') || (t.includes('jour j') && t.includes('course'))) return 'course';
  if (t.includes('vma') || t.includes('30/30') || t.includes('fractionn') || t.includes('intervalles')) return 'vma';
  if (t.includes('seuil') || t.includes('tempo')) return 'seuil';
  if (t.includes('sortie longue') || /\bsl\b/.test(t)) return 'sl';
  if (t.includes('ppg') || t.includes('renforcement') || t.includes('gainage') || t.includes('plyom')) return 'ppg';
  if (t.includes('récup') || t.includes('recup') || t.includes('footing l')) return 'recup';
  return 'ef';
}

// ══════════════════════════════════════════════════════════════
// RENDER TABLE
// ══════════════════════════════════════════════════════════════
function renderTable(plan) {
  var tbody = document.getElementById('planBody');
  tbody.innerHTML = '';
  plan.weeks.forEach(function (week) { renderWeekRow(week, tbody); });
}

function renderWeekRow(week, tbody) {
  var tr = document.createElement('tr');
  tr.id  = 'week-row-' + week.weekNum;

  // ── Week cell ──
  var tdW = document.createElement('td');
  tdW.className = 'cell-week';

  var btnRegen = document.createElement('button');
  btnRegen.className = 'btn-regen-week';
  btnRegen.textContent = '🔄 Regen';
  btnRegen.dataset.week = week.weekNum;
  btnRegen.addEventListener('click', function () { openRegen(+this.dataset.week); });

  tdW.innerHTML = '<span class="week-num">S' + week.weekNum + '</span>'
    + '<span class="week-phase">' + escHtml(week.weekLabel || '') + '</span>'
    + (week.weeklyVolume ? '<span class="week-vol">' + escHtml(week.weeklyVolume) + '</span>' : '');
  tdW.appendChild(btnRegen);
  tr.appendChild(tdW);

  // ── Day cells ──
  DAYS.forEach(function (day, di) {
    var text  = week[day] || 'Repos';
    var type  = detectType(text);
    var td    = document.createElement('td');
    td.className = 'cell-session' + (di >= 5 ? ' cell-weekend' : '');

    var inner = document.createElement('div');
    inner.className = 'session-inner t-' + type;

    var badge = document.createElement('span');
    badge.className = 's-badge';
    badge.textContent = BADGE_LABELS[type] || 'EF';

    var stxt = document.createElement('div');
    stxt.className = 's-text';
    stxt.textContent = text;

    var btnInfo = document.createElement('button');
    btnInfo.className = 'btn-cell-info';
    btnInfo.textContent = 'i';
    btnInfo.title = 'Glossaire';
    btnInfo.addEventListener('click', openGlossary);

    inner.appendChild(badge);
    inner.appendChild(stxt);
    inner.appendChild(btnInfo);
    td.appendChild(inner);
    tr.appendChild(td);
  });

  tbody.appendChild(tr);
}

// ══════════════════════════════════════════════════════════════
// GENERATE PLAN
// ══════════════════════════════════════════════════════════════
function generatePlan() {
  _currentData = collectData();

  document.getElementById('welcomeState').style.display  = 'none';
  document.getElementById('planContainer').style.display = 'none';
  document.getElementById('errorBox').style.display      = 'none';
  document.getElementById('loadingState').style.display  = 'flex';
  document.getElementById('btnGenerate').disabled        = true;
  document.getElementById('btnLabel').textContent        = 'Génération en cours…';
  startProgress();

  callAPI(
    _currentData.apiKey,
    _currentData.apiModel,
    buildPrompt(_currentData, false, 0, ''),
    function (raw) {
      stopProgress();
      document.getElementById('loadingState').style.display = 'none';
      try {
        _currentPlan = parseResponse(raw);
        document.getElementById('planMainTitle').textContent =
          _currentPlan.planTitle || ('Plan ' + _currentData.raceType + ' ' + _currentData.distance);
        document.getElementById('planSubtitle').textContent =
          _currentPlan.totalWeeks + ' sem. · '
          + _currentData.sessionsPerWeek + ' séances/sem · '
          + _currentData.level + ' · '
          + _currentData.planStyle
          + (_currentData.vma ? ' · VMA ' + _currentData.vma + ' km/h' : '');
        renderTable(_currentPlan);
        document.getElementById('planContainer').style.display = 'block';
        document.getElementById('btnGenerate').disabled = false;
        document.getElementById('btnLabel').textContent = 'Régénérer le plan';
      } catch (e) {
        showError('Erreur parsing : ' + e.message);
      }
    },
    function (msg) {
      stopProgress();
      document.getElementById('loadingState').style.display = 'none';
      showError(msg);
    }
  );
}

// ══════════════════════════════════════════════════════════════
// REGEN WEEK
// ══════════════════════════════════════════════════════════════
function openRegen(weekNum) {
  _regenWeekNum = weekNum;
  document.getElementById('regenWeekNum').textContent = weekNum;
  document.getElementById('regenNote').value = '';
  document.getElementById('modalRegen').classList.add('open');
}

function confirmRegen() {
  closeModal('modalRegen');
  if (!_currentData || !_currentPlan) return;
  var note = document.getElementById('regenNote').value.trim();

  // Visual feedback – show pending state on all session cells in this week row
  var row = document.getElementById('week-row-' + _regenWeekNum);
  if (row) {
    row.querySelectorAll('.cell-session').forEach(function (td) {
      td.innerHTML = '<div class="session-inner t-ef" style="display:flex;align-items:center;justify-content:center;"><span style="font-size:11px;color:#f773b4;font-weight:700;">⏳ Régénération…</span></div>';
    });
  }

  callAPI(
    _currentData.apiKey,
    _currentData.apiModel,
    buildPrompt(_currentData, true, _regenWeekNum, note),
    function (raw) {
      try {
        var s  = raw.trim()
          .replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/, '');
        var si = s.indexOf('{');
        var ei = s.lastIndexOf('}');
        var newWeek = JSON.parse(s.substring(si, ei + 1));
        _currentPlan.weeks = _currentPlan.weeks.map(function (w) {
          return (w.weekNum == _regenWeekNum) ? newWeek : w;
        });
        renderTable(_currentPlan);
      } catch (e) {
        alert('Erreur régénération : ' + e.message);
        renderTable(_currentPlan);
      }
    },
    function (msg) {
      alert('Erreur API : ' + msg);
      renderTable(_currentPlan);
    }
  );
}

// ══════════════════════════════════════════════════════════════
// EXPORT CSV
// ══════════════════════════════════════════════════════════════
function exportCSV() {
  if (!_currentPlan) { alert('Générez d\'abord un plan.'); return; }
  var lines = ['Semaine;Phase;Volume;Lundi;Mardi;Mercredi;Jeudi;Vendredi;Samedi;Dimanche'];
  _currentPlan.weeks.forEach(function (w) {
    var row = ['S' + w.weekNum, w.weekLabel || '', w.weeklyVolume || ''];
    DAYS.forEach(function (d) {
      row.push('"' + (w[d] || 'Repos').replace(/"/g, "'") + '"');
    });
    lines.push(row.join(';'));
  });
  var blob = new Blob(['\uFEFF' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
  var url  = URL.createObjectURL(blob);
  var a    = document.createElement('a');
  a.href     = url;
  a.download = 'plan_running_' + (_currentData.distance || '').replace(/\s/g, '_').replace(/[^\w\-]/g, '') + '.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
}

// ══════════════════════════════════════════════════════════════
// PRINT / PDF
// ══════════════════════════════════════════════════════════════
function buildPrintHTML() {
  var BG = {
    repos:'#ffffff', ef:'#fde8f3', sl:'#f7bfd9', vma:'#f773b4',
    seuil:'#fbd0e8', ppg:'#000000', recup:'#fce4f1', course:'#f773b4'
  };
  var BC = {
    repos: {bg:'#f7bfd9',tx:'#000'}, ef:    {bg:'#f773b4',tx:'#fff'},
    sl:    {bg:'#000',tx:'#f7bfd9'}, vma:   {bg:'#000',tx:'#f773b4'},
    seuil: {bg:'#f773b4',tx:'#fff'}, ppg:   {bg:'#f773b4',tx:'#fff'},
    recup: {bg:'#f7bfd9',tx:'#000'}, course:{bg:'#000',tx:'#f773b4'}
  };
  var TC = { vma:'#fff', ppg:'#f7bfd9', course:'#fff' };
  var BL = { repos:'Repos', ef:'EF', sl:'SL', vma:'VMA', seuil:'Seuil', ppg:'PPG', recup:'Récup', course:'🏁' };

  function dt(t) {
    if (!t || t.toLowerCase() === 'repos') return 'repos';
    t = t.toLowerCase();
    if (t.includes('🏁') || (t.includes('jour j') && t.includes('course'))) return 'course';
    if (t.includes('vma') || t.includes('30/30') || t.includes('fractionn')) return 'vma';
    if (t.includes('seuil') || t.includes('tempo')) return 'seuil';
    if (t.includes('sortie longue') || /\bsl\b/.test(t)) return 'sl';
    if (t.includes('ppg') || t.includes('renforcement') || t.includes('gainage')) return 'ppg';
    if (t.includes('récup') || t.includes('recup')) return 'recup';
    return 'ef';
  }

  var rows = '';
  _currentPlan.weeks.forEach(function (w) {
    var cells = '';
    DAYS.forEach(function (day, di) {
      var text   = w[day] || 'Repos';
      var type   = dt(text);
      var border = (type === 'course') ? 'border:2px solid #000;' : '';
      var weBg   = (di >= 5) ? 'background:rgba(247,191,217,.15);' : '';
      cells += '<td style="border:1px solid #f7bfd9;padding:0;vertical-align:top;' + weBg + '">'
        + '<div style="background:' + BG[type] + ';' + border + 'padding:4px;height:100%;min-height:55px;">'
        + '<span style="display:inline-block;background:' + BC[type].bg + ';color:' + BC[type].tx + ';font-size:6.5px;font-weight:900;padding:1px 4px;border-radius:7px;text-transform:uppercase;margin-bottom:2px;">'
        + (BL[type] || 'EF') + '</span>'
        + '<div style="font-size:7.5px;line-height:1.35;color:' + (TC[type] || '#000') + ';">' + escHtml(text) + '</div>'
        + '</div></td>';
    });
    rows += '<tr>'
      + '<td style="background:#000;border:1px solid #222;padding:5px;text-align:center;vertical-align:middle;">'
      + '<span style="font-size:14px;font-weight:900;color:#f773b4;display:block;">S' + w.weekNum + '</span>'
      + '<span style="font-size:7px;color:#f7bfd9;display:block;text-transform:uppercase;">'
      + (w.weekLabel || '').replace(/&/g, '&amp;') + '</span>'
      + (w.weeklyVolume
          ? '<span style="background:#f773b4;color:#fff;font-size:7px;font-weight:900;border-radius:6px;padding:1px 4px;display:inline-block;margin-top:2px;">'
            + w.weeklyVolume + '</span>'
          : '')
      + '</td>' + cells + '</tr>';
  });

  var title = escHtml(document.getElementById('planMainTitle').textContent);
  var sub   = escHtml(document.getElementById('planSubtitle').textContent);
  var today = new Date().toLocaleDateString('fr-FR');

  return '<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8">'
    + '<title>' + title + '</title>'
    + '<style>'
    + '*{box-sizing:border-box;margin:0;padding:0;}'
    + '@page{size:A3 landscape;margin:7mm;}'
    + 'body{font-family:Segoe UI,Arial,sans-serif;background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact;}'
    + '.no-print{text-align:center;padding:8px 12px;background:#f7bfd9;margin-bottom:5mm;}'
    + '.header{background:#000;color:#fff;padding:8px 14px;display:flex;align-items:center;gap:12px;margin-bottom:5mm;}'
    + 'table{width:100%;border-collapse:collapse;table-layout:fixed;}'
    + 'th{background:#000;color:#fff;padding:6px 4px;font-size:8px;font-weight:900;text-transform:uppercase;letter-spacing:.7px;border:1px solid #222;text-align:center;}'
    + 'th:first-child,th:nth-child(7),th:nth-child(8){background:#f773b4;}'
    + 'th:first-child{width:68px;}'
    + '@media print{.no-print{display:none;}}'
    + '</style></head><body>'
    + '<div class="no-print">'
    + '<button onclick="window.print()" style="background:#f773b4;color:#fff;border:none;padding:9px 22px;border-radius:7px;font-size:13px;font-weight:900;cursor:pointer;">🖨 Imprimer / Enregistrer en PDF</button>'
    + '  <span style="font-size:11px;color:#555;">Format A3 Paysage · Dans la boîte d\'impression → Enregistrer en PDF · Cocher "Graphiques d\'arrière-plan"</span>'
    + '</div>'
    + '<div class="header">'
    + '<div style="width:40px;height:40px;background:#f773b4;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0;">🏃</div>'
    + '<div>'
    + '<div style="font-size:14px;font-weight:900;">Running Coach <span style="color:#f773b4;">×</span> Claude IA</div>'
    + '<div style="font-size:9px;color:#f7bfd9;margin-top:1px;">' + sub + '</div>'
    + '</div>'
    + '<div style="margin-left:auto;text-align:right;font-size:8px;color:#f7bfd9;line-height:1.6;">'
    + '<b style="color:#f773b4;">' + title + '</b><br>Généré le ' + today
    + '</div>'
    + '</div>'
    + '<table>'
    + '<thead><tr>'
    + '<th>Semaine</th><th>Lundi</th><th>Mardi</th><th>Mercredi</th><th>Jeudi</th><th>Vendredi</th><th>Samedi</th><th>Dimanche</th>'
    + '</tr></thead>'
    + '<tbody>' + rows + '</tbody>'
    + '</table>'
    + '<div style="margin-top:4mm;padding:3mm 4mm;border:1px solid #f773b4;border-radius:3px;background:#f7bfd9;font-size:7px;color:#333;-webkit-print-color-adjust:exact;print-color-adjust:exact;">'
    + '<b style="color:#f773b4;">Légende :</b> EF=Endurance Fondamentale (60-70% FCM) · SL=Sortie Longue · VMA=Intervalles (100-110% VMA) · Seuil=Anaérobie (85-90% FCM) · PPG=Renforcement musculaire · Récup=Récupération active'
    + '</div>'
    + '</body></html>';
}

function printPlan() {
  if (!_currentPlan) { alert('Générez d\'abord un plan.'); return; }
  var html = buildPrintHTML();
  var blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  var url  = URL.createObjectURL(blob);
  var win  = window.open(url, '_blank');
  if (!win) {
    alert('Pop-up bloquée par le navigateur.\nAutorisez les pop-ups pour cette page et réessayez.');
    URL.revokeObjectURL(url);
    return;
  }
  win.addEventListener('load', function () {
    setTimeout(function () { URL.revokeObjectURL(url); }, 10000);
  });
}

// ══════════════════════════════════════════════════════════════
// PROGRESS BAR
// ══════════════════════════════════════════════════════════════
function startProgress() {
  var prog = 0;
  document.getElementById('progressFill').style.width = '0%';
  _progressTimer = setInterval(function () {
    prog += Math.random() * 2;
    if (prog > 90) prog = 90;
    document.getElementById('progressFill').style.width = prog + '%';
  }, 700);
}

function stopProgress() {
  clearInterval(_progressTimer);
  document.getElementById('progressFill').style.width = '100%';
}

// ══════════════════════════════════════════════════════════════
// ERROR & RESET
// ══════════════════════════════════════════════════════════════
function showError(msg) {
  document.getElementById('errorMsg').textContent         = msg;
  document.getElementById('errorBox').style.display       = 'flex';
  document.getElementById('welcomeState').style.display   = 'flex';
  document.getElementById('btnGenerate').disabled         = false;
  document.getElementById('btnLabel').textContent         = 'Générer mon plan d\'entraînement';
}

function resetPlan() {
  _currentPlan = null;
  document.getElementById('planContainer').style.display = 'none';
  document.getElementById('errorBox').style.display      = 'none';
  document.getElementById('welcomeState').style.display  = 'flex';
  document.getElementById('btnLabel').textContent        = 'Générer mon plan d\'entraînement';
}

// ══════════════════════════════════════════════════════════════
// MODALS
// ══════════════════════════════════════════════════════════════
function openGlossary() {
  document.getElementById('modalGlossary').classList.add('open');
}

function closeModal(id) {
  document.getElementById(id).classList.remove('open');
}

function overlayClose(e, id) {
  if (e.target === document.getElementById(id)) closeModal(id);
}
