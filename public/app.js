(function () {
  'use strict';
  const N = +((location.pathname.match(/\/t\/(\d)/) || [])[1]) || 1;
  const KEY = 'theo' + N;
  let S = {};
  try { S = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { S = {}; }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };

  let D = null, nav = { app: null }, taps = 0, msg = '', es = null, deadline = null, skew = 0, code = '', toastT = null;
  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  const hhmm = () => clock();
  const nm = t => (t.n === 'Ethel O.' && S.ana) ? 'Moi (Théo Lenoir)' : t.n;

  async function api(path, opt) {
    opt = opt || {};
    const r = await fetch(path, {
      method: opt.body ? 'POST' : 'GET',
      headers: { 'content-type': 'application/json', 'x-session': S.sess || '' },
      body: opt.body ? JSON.stringify(opt.body) : undefined
    });
    let j = {};
    try { j = await r.json(); } catch (e) {}
    return { status: r.status, ok: r.ok, j };
  }
  async function check(kind, value) {
    try {
      const r = await api('/api/check', { body: { phone: N, kind, value } });
      if (r.status === 401) { S.sess = ''; save(); lock(); return null; }
      return r;
    } catch (e) {
      return { ok: false, j: { ok: false, error: 'Réseau indisponible : reconnectez-vous au wifi du jeu.' } };
    }
  }

  // ---------- Verrouillage ----------
  function lock() {
    code = '';
    D = null;
    const L = ['', '', 'ABC', 'DEF', 'GHI', 'JKL', 'MNO', 'PQRS', 'TUV', 'WXYZ'];
    $('screen').className = 'screen';
    $('screen').innerHTML = '<div class="lock">' + wall(N) + sbar(false, null) + '<div class="lk-in"><div class="lk-ic">' + LOCK_IC + '</div><div class="lk-d">' + CLOCK[0] + '</div><div class="lk-h clk">' + clock() + '</div>' +
      '<div class="lk-t">Saisissez le code</div><div class="dots" id="dots"><i></i><i></i><i></i><i></i></div><div id="lmsg" class="lk-m"></div>' +
      '<div class="pad">' + [1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, '⌫'].map(k => k === '' ? '<span></span>' : k === '⌫' ? '<button class="txt" data-k="⌫">Effacer</button>' : '<button data-k="' + k + '">' + k + '<small>' + L[k] + '</small></button>').join('') + '</div></div></div>';
  }
  async function padKey(k) {
    const m = $('lmsg');
    if (k === '⌫') code = code.slice(0, -1); else if (code.length < 4) code += k;
    Array.from($('dots').children).forEach((d, i) => { d.className = i < code.length ? 'on' : ''; });
    if (code.length === 4) {
      try {
        const r = await api('/api/unlock', { body: { phone: N, code } });
        if (r.ok) { S.sess = r.j.session; save(); start(r.j.data); return; }
        m.textContent = r.j.error || 'Code incorrect';
      } catch (e) { m.textContent = 'Réseau indisponible. Reconnectez-vous au wifi du jeu.'; }
      code = '';
      const d = $('dots');
      d.classList.add('shake');
      setTimeout(() => { const x = $('dots'); if (x) { x.classList.remove('shake'); Array.from(x.children).forEach(i => { i.className = ''; }); } }, 450);
    }
  }

  // ---------- Démarrage et temps réel ----------
  function start(data) {
    D = data; deadline = D.deadline; skew = 0;
    (S.live || []).forEach(addMsg);
    nav = { app: null };
    draw();
    connect();
  }
  function connect() {
    if (es) es.close();
    es = new EventSource('/api/events/' + N + '?s=' + encodeURIComponent(S.sess));
    es.onmessage = ev => { let e; try { e = JSON.parse(ev.data); } catch (x) { return; } handle(e); };
  }
  function handle(e) {
    if (e.type === 'state') { deadline = e.deadline; skew = e.now ? e.now - Date.now() : 0; refreshCd(); return; }
    if (e.type === 'banner') { banner(e.title || 'Notification', e.text); return; }
    if (e.type === 'hint') { banner('Indice', e.text); return; }
    if (e.type === 'message') {
      e.h = e.h || hhmm();
      addMsg(e);
      S.live = (S.live || []).concat([e]); save();
      banner(e.thread || 'Message', e.text, 'msg');
      if (nav.app === 'msg') draw();
    }
  }
  function addMsg(e) {
    let t = D.th.find(x => x.n === e.thread);
    if (!t) { t = { n: e.thread || 'Inconnu', h: e.h || hhmm(), m: [] }; D.th.unshift(t); }
    t.m.push([e.from || 'in', e.text]);
    t.h = e.h || t.h;
  }
  let bt = 0;
  function banner(title, text, ic) {
    const b = $('banner');
    b.innerHTML = '<div class="nb">' + (ic ? icon(ic) : '<i class="ico ico-gen">!</i>') + '<div><b>' + esc(title) + '<em>maintenant</em></b><span>' + esc(text) + '</span></div></div>';
    b.classList.add('show');
    if (navigator.vibrate) navigator.vibrate(120);
    clearTimeout(bt);
    bt = setTimeout(() => b.classList.remove('show'), 9000);
  }
  function refreshCd() {
    const el = $('cd');
    if (!el) return;
    if (!deadline) { el.textContent = 'Programmée cette nuit'; return; }
    const s = Math.max(0, Math.round((deadline - (Date.now() + skew)) / 1000));
    el.textContent = s === 0 ? 'Séance en cours…' : 'Dans ' + Math.floor(s / 60) + ' min ' + String(s % 60).padStart(2, '0') + ' s';
  }
  setInterval(refreshCd, 1000);

  // ---------- Rendu ----------
  // ---------- Téléphone : horloge, icônes, fond d'écran ----------
  // Date et heure affichées par chaque téléphone au moment où on le déverrouille ; l'heure avance ensuite normalement.
  const CLOCK = { 1: ['Lundi 19 octobre', 22 * 60 + 14], 2: ['Vendredi 23 octobre', 3 * 60 + 26], 3: ['Dimanche 25 octobre', 3 * 60 + 41], 4: ['Vendredi 30 octobre', 23 * 60 + 58] }[N] || ['', 0];
  const T0 = Date.now();
  const clock = () => { const m = (CLOCK[1] + Math.floor((Date.now() - T0) / 60000)) % 1440; return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); };
  setInterval(() => { document.querySelectorAll('.clk').forEach(e => { e.textContent = clock(); }); }, 1000);
  const IC = {
    notes: '<svg viewBox="0 0 60 60"><rect width="60" height="60" fill="#fdfdfb"/><rect width="60" height="17" fill="#f6c443"/><path d="M0 17h60" stroke="#e0a92c" stroke-width="1.5"/><path d="M9 27h42M9 35h42M9 43h42M9 51h30" stroke="#d6d4cf" stroke-width="1.6"/></svg>',
    msg: '<svg viewBox="0 0 60 60"><defs><linearGradient id="icm" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6bf27c"/><stop offset="1" stop-color="#0dbd2d"/></linearGradient></defs><rect width="60" height="60" fill="url(#icm)"/><path d="M30 13c-11.6 0-21 7.4-21 16.5 0 5.2 3 9.8 7.8 12.8-.5 2.9-2 5.6-4.3 7.2 4.4.3 8.3-1.3 10.8-3.6 2.1.5 4.4.8 6.7.8 11.6 0 21-7.4 21-16.5S41.6 13 30 13Z" fill="#fff"/></svg>',
    photos: '<svg viewBox="0 0 60 60"><rect width="60" height="60" fill="#fff"/>' + ['#f9a13c', '#f6d33b', '#9fd047', '#47c3a6', '#3d8ff2', '#8e6ae6', '#e45b9e', '#f15b4a'].map((c, i) => '<ellipse cx="30" cy="18.5" rx="6.3" ry="11.5" fill="' + c + '" opacity=".82" transform="rotate(' + (i * 45) + ' 30 30)" style="mix-blend-mode:multiply"/>').join('') + '</svg>',
    dicta: '<svg viewBox="0 0 60 60"><rect width="60" height="60" fill="#111"/>' + [6, 12, 20, 30, 16, 24, 34, 22, 12, 18, 8].map((h, i) => '<rect x="' + (8.5 + i * 4) + '" y="' + (30 - h / 2) + '" width="2.2" height="' + h + '" rx="1.1" fill="' + (i === 5 ? '#ff3b30' : '#f2f2f2') + '"/>').join('') + '</svg>',
    set: '<svg viewBox="0 0 60 60"><defs><linearGradient id="ics" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d4d7dc"/><stop offset="1" stop-color="#8f949b"/></linearGradient></defs><rect width="60" height="60" fill="url(#ics)"/><g fill="#4b4f55">' + Array.from({ length: 12 }, (_, i) => '<rect x="27.5" y="8" width="5" height="9" rx="1.5" transform="rotate(' + (i * 30) + ' 30 30)"/>').join('') + '<circle cx="30" cy="30" r="15.5"/></g><circle cx="30" cy="30" r="11" fill="#a9adb3"/><circle cx="30" cy="30" r="5.5" fill="#4b4f55"/></svg>'
  };
  const icon = k => '<i class="ico">' + (k === 'sereni' ? '<b class="ico-ser">' + SVG_MOON + '</b>' : IC[k]) + '</i>';
  const SIG = '<svg viewBox="0 0 18 12" width="18" height="12"><rect x="0" y="8" width="3" height="4" rx="1"/><rect x="5" y="5.5" width="3" height="6.5" rx="1"/><rect x="10" y="3" width="3" height="9" rx="1"/><rect x="15" y="0" width="3" height="12" rx="1" opacity=".35"/></svg>';
  const WIFI = '<svg viewBox="0 0 16 12" width="16" height="12"><path d="M8 11.5 5.6 9a3.4 3.4 0 0 1 4.8 0Z"/><path d="M3.6 7a6.3 6.3 0 0 1 8.8 0l1.4-1.4a8.3 8.3 0 0 0-11.6 0Z"/><path d="M1.4 4.8a9.4 9.4 0 0 1 13.2 0L16 3.4a11.4 11.4 0 0 0-16 0Z"/></svg>';
  const batt = b => '<svg viewBox="0 0 27 13" width="27" height="13"><rect x=".5" y=".5" width="23" height="12" rx="3.5" fill="none" stroke="currentColor" opacity=".4"/><rect x="2" y="2" width="' + Math.max(1.5, 20 * b / 100) + '" height="9" rx="2" fill="' + (b <= 20 ? '#ff453a' : 'currentColor') + '"/><path d="M25 4.5v4c.8-.3 1.3-1 1.3-2s-.5-1.7-1.3-2Z" opacity=".4"/></svg>';
  const sbar = (time, bat) => '<div class="notch"></div><div class="sb"><span class="sb-t">' + (time ? '<span class="clk">' + clock() + '</span>' : '') + '</span><span class="sb-r">' + SIG + WIFI + (bat != null ? batt(bat) : '') + '</span></div>';

  // Fond d'écran : une orchidée qui s'ouvre un peu plus d'un téléphone à l'autre (bouton au tél. 1, pleine floraison au tél. 4).
  function orchid(x, y, s, r) {
    const p = (rx, ry, cx, cy, a, f) => '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + rx + '" ry="' + ry + '" fill="' + f + '" transform="rotate(' + a + ' ' + cx + ' ' + cy + ')"/>';
    return '<g transform="translate(' + x + ' ' + y + ') rotate(' + r + ') scale(' + s + ')">' +
      p(8, 17, 0, -16, 0, 'url(#op2)') + p(7.5, 16, -10, 12, 35, 'url(#op2)') + p(7.5, 16, 10, 12, -35, 'url(#op2)') +
      p(17, 15, -15, -1, -20, 'url(#op1)') + p(17, 15, 15, -1, 20, 'url(#op1)') +
      '<path d="M-6 4C-9 12-5 20 0 21 5 20 9 12 6 4 3 1-3 1-6 4Z" fill="#8a1d72"/><path d="M-4 3C-7 -1-10 -2-12 0M4 3C7 -1 10 -2 12 0" stroke="#c43f8f" stroke-width="2" fill="none" stroke-linecap="round"/>' +
      '<ellipse cx="0" cy="1" rx="3.2" ry="4" fill="#fff4d8"/><circle cx="0" cy="3.5" r="1.6" fill="#f2b33d"/></g>';
  }
  function bud(x, y, s, open) {
    return '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')"><path d="M0 -12C' + (7 + open * 4) + ' -10 ' + (9 + open * 6) + ' 2 0 10C' + (-9 - open * 6) + ' 2 ' + (-7 - open * 4) + ' -10 0 -12Z" fill="' + (open ? 'url(#op2)' : 'url(#ob)') + '"/>' +
      (open ? '<path d="M0 -10C3 -4 3 4 0 9" stroke="#b77ad9" stroke-width="1" fill="none"/>' : '') + '</g>';
  }
  function wall(s) {
    s = Math.min(4, Math.max(1, +s || 1));
    const stem = '<path d="M118 600C112 520 118 430 140 350C158 290 186 248 222 214" stroke="#4f7a4a" stroke-width="3.2" fill="none" stroke-linecap="round"/>' +
      '<path d="M140 350l-6 8M168 290l-7 7M196 246l-6 7" stroke="#4f7a4a" stroke-width="2"/>';
    const spots = [[134, 368], [161, 306], [190, 262], [222, 218]];
    const st = [[0, 0, 0, 0], [1, 1, 0, 0], [2, 1, 1, 0], [2, 2, 2, 1]][s - 1];
    const fl = spots.map((q, i) => {
      const k = st[i], sc = 1.25 - i * .12;
      if (k === 2) return orchid(q[0], q[1] + 4, sc, -8 + i * 6);
      return bud(q[0], q[1] + 6, sc * (k ? .95 : .7), k);
    }).join('');
    const bokeh = [[40, 120, 46, .06], [250, 90, 30, .05], [60, 300, 22, .05], [240, 420, 40, .04], [200, 150, 14, .07]].map(b => '<circle cx="' + b[0] + '" cy="' + b[1] + '" r="' + b[2] + '" fill="#c9a6ff" opacity="' + b[3] + '"/>').join('');
    return '<svg class="wp" viewBox="0 0 288 596" preserveAspectRatio="xMidYMid slice"><defs>' +
      '<radialGradient id="wbg" cx="55%" cy="45%" r="85%"><stop offset="0" stop-color="#2d1f4f"/><stop offset=".55" stop-color="#140f27"/><stop offset="1" stop-color="#05040b"/></radialGradient>' +
      '<radialGradient id="op1" cx="50%" cy="40%" r="70%"><stop offset="0" stop-color="#fbeaff"/><stop offset=".55" stop-color="#e2b5f5"/><stop offset="1" stop-color="#a967d6"/></radialGradient>' +
      '<radialGradient id="op2" cx="50%" cy="35%" r="75%"><stop offset="0" stop-color="#f4dcff"/><stop offset="1" stop-color="#b47ae0"/></radialGradient>' +
      '<linearGradient id="ob" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a97cc4"/><stop offset="1" stop-color="#5e7a4f"/></linearGradient></defs>' +
      '<rect width="288" height="596" fill="url(#wbg)"/>' + bokeh + stem + fl +
      '<path d="M118 560C80 540 40 548 14 580 52 590 92 584 118 560Z" fill="#2f5a36"/><path d="M122 566C160 538 210 540 250 566 210 586 160 588 122 566Z" fill="#3a6b40"/><path d="M118 560C80 540 40 548 14 580" stroke="#4d8452" stroke-width="1.2" fill="none"/></svg>';
  }
  const sb = () => sbar(true, D.bat);
  const APPN = { notes: 'Notes', msg: 'Messages', photos: 'Photos', dicta: 'Dictaphone', set: 'Réglages' };
  const hd = t => '<div class="hd"><button data-act="back">‹<em>' + (nav.view && nav.view !== 'list' ? (nav.view === 'card' ? '' : APPN[nav.app] || '') : '') + '</em></button><span>' + esc(t) + '</span></div>';
  const LOCK_IC = '<svg viewBox="0 0 14 18" width="14" height="18"><path d="M3 8V5.5a4 4 0 0 1 8 0V8" fill="none" stroke="currentColor" stroke-width="1.8"/><rect x="0" y="8" width="14" height="10" rx="2.5" fill="currentColor"/></svg>';
  const ini = s => s.replace(/\(.*\)/, '').split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
  const wave = s => { let h = 0, o = ''; for (let i = 0; i < 64; i++) { h = (h * 31 + s.charCodeAt(i % s.length) + i * 7) % 997; o += '<i style="height:' + (12 + (h % 70)) + '%"></i>'; } return o; };

  // ---------- Sérénité ----------
  // Textes de l'appli propres à chaque téléphone (salutation, séance mise en avant, statistiques).
  const SER = {
    1: { hi: 'Bonjour, Théo', sub: 'Une pause de quelques minutes ?', hero: ['Respiration guidée', 'Détente · 10 min'], st: [['1', 'séance'], ['10', 'minutes'], ['—', 'série']] },
    2: { hi: 'Bonne nuit, Théo', sub: 'Laissez la journée derrière vous.', hero: ['Séance du soir', 'Lâcher prise · 25 min'], st: [['4', 'séances'], ['96', 'minutes'], ['3', 'nuits']] },
    3: { hi: 'Bonne nuit, Théo', sub: 'Tout est calme.', hero: ['Séance de nuit', 'Sommeil profond · 52 min'], st: [['7', 'séances'], ['212', 'minutes'], ['5', 'nuits']] },
    4: { hi: 'Bonsoir, Théo', sub: 'Vous pouvez souffler.', hero: ['Séance du soir', 'Tourner la page · 24 min'], st: [['14', 'séances'], ['418', 'minutes'], ['11', 'nuits']] }
  }[N] || {};
  const PROGS = [
    ['Sommeil profond', '8 séances', 'p1'], ['Lâcher prise', '6 séances', 'p2'], ['Oublier le stress', '10 séances', 'p3'], ['Repartir à zéro', '5 séances', 'p4']
  ];
  const EXPLO = [
    ['Sommeil', 'p1'], ['Anxiété', 'p3'], ['Respiration', 'p2'], ['Tourner la page', 'p4'], ['Concentration', 'p3'], ['Oublier une rupture', 'p2']
  ];
  const MOODS = ['Serein', 'Fatigué', 'Tendu', 'Agité', 'Vide'];
  const SVG_MOON = '<svg viewBox="0 0 40 40"><path d="M25.5 6.5A14 14 0 1 0 33.5 27 11.5 11.5 0 0 1 25.5 6.5Z" fill="currentColor"/><circle cx="30" cy="10" r="1.3" fill="currentColor"/><circle cx="34" cy="16" r=".9" fill="currentColor"/></svg>';
  const SVG_HERO = '<svg class="ser-hero-art" viewBox="0 0 300 120" preserveAspectRatio="xMidYMax slice"><circle cx="232" cy="38" r="20" fill="#fff6e9" opacity=".9"/><path d="M0 92C50 70 90 72 150 88S250 104 300 82V120H0Z" fill="#fff" opacity=".16"/><path d="M0 104C60 88 110 94 170 104S260 112 300 100V120H0Z" fill="#fff" opacity=".22"/></svg>';

  function serTabs(cur) {
    return '<nav class="ser-tab">' + [['home', 'Accueil', '<path d="M4 11.5 12 5l8 6.5V20h-5v-5H9v5H4Z"/>'], ['explore', 'Explorer', '<circle cx="12" cy="12" r="8"/><path d="m15 9-2 4-4 2 2-4Z"/>'], ['profile', 'Profil', '<circle cx="12" cy="9" r="3.5"/><path d="M5 20c1-4 4-5.5 7-5.5s6 1.5 7 5.5"/>']]
      .map(t => '<span class="' + (t[0] === cur ? 'on' : '') + '" data-act="stab" data-t="' + t[0] + '"><svg viewBox="0 0 24 24">' + t[2] + '</svg>' + t[1] + '</span>').join('') + '</nav>';
  }
  function serTop() {
    return '<div class="ser-top"><div class="ser-logo" data-act="logo">' + SVG_MOON + '</div><div class="ser-word">sérénité<small>par NOCTIS</small></div><div class="ser-av" data-act="stab" data-t="profile">T</div></div>';
  }
  function mandela() {
    return D.mq.map((x, i) => {
      const d = D.drift[i];
      return '<div class="ser-q"><span>' + esc(x.q) + '</span><b class="' + (d ? 'drift' : '') + '">' + esc(d || x.t) + '</b></div>';
    }).join('');
  }
  function serHome() {
    const clos = D.close ? '<div class="ser-close"><div class="ser-close-h"><span class="ser-pill">Programmée</span><b>Séance de clôture</b></div>' +
      '<div class="ser-close-t">Cette nuit, 2 h 30. Une dernière séance pour refermer ce chapitre en douceur.</div><div class="ser-cd" id="cd">Programmée cette nuit</div>' +
      '<input type="text" placeholder="Mot de passe de neutralisation" autocapitalize="off" autocorrect="off"><button class="ser-btn" data-act="neutral">Neutraliser</button>' +
      '<div class="ser-res">' + (S.win ? '<b class="ok">Rémanence : 100 %. Séance reportée. Vous vous souviendrez de Théo.</b>' : '<span class="bad">' + esc(msg) + '</span>') + '</div></div>' : '';
    const moods = MOODS.map(m => '<span class="' + (S.mood === m ? 'on' : '') + '" data-act="mood" data-m="' + m + '">' + m + '</span>').join('');
    return '<div class="ser-body">' + serTop() +
      '<h1 class="ser-hi">' + SER.hi + '</h1><div class="ser-sub">' + SER.sub + '</div>' + clos +
      '<div class="ser-h2">Comment vous sentez-vous ?</div><div class="ser-moods">' + moods + '</div>' +
      '<div class="ser-hero" data-act="play" data-p="' + esc(SER.hero[0]) + '">' + SVG_HERO + '<small>Recommandé pour vous</small><b>' + SER.hero[0] + '</b><span>' + SER.hero[1] + '</span><i>▶</i></div>' +
      '<div class="ser-stats">' + SER.st.map(s => '<div><b>' + s[0] + '</b><span>' + s[1] + '</span></div>').join('') + '</div>' +
      '<div class="ser-h2">Programmes</div><div class="ser-row">' + PROGS.map(p => '<div class="ser-prog ' + p[2] + '" data-act="play" data-p="' + p[0] + '"><b>' + p[0] + '</b><span>' + p[1] + '</span></div>').join('') + '</div>' +
      '<div class="ser-h2">Test de rémanence</div><div class="ser-card"><div class="ser-mut">Quelques questions pour mesurer ce que votre mémoire garde après chaque séance.</div>' + mandela() + '</div>' +
      '<div class="ser-foot">Version ' + D.ver + ' · atténuation ' + D.att + '<br>NOCTIS Wellbeing SAS</div></div>' + serTabs('home');
  }
  function serExplore() {
    return '<div class="ser-body">' + serTop() + '<h1 class="ser-hi">Explorer</h1><div class="ser-sub">Des séances pour chaque moment.</div>' +
      '<div class="ser-grid">' + EXPLO.map(e => '<div class="ser-prog ' + e[1] + '" data-act="play" data-p="' + e[0] + '"><b>' + e[0] + '</b></div>').join('') + '</div></div>' + serTabs('explore');
  }
  function serProfile() {
    const rows = [['Rappel du soir', '22:00'], ['Voix du guide', 'Douce'], ['Atténuation', D.att], ['Version', D.ver]];
    return '<div class="ser-body">' + serTop() + '<div class="ser-me"><div class="ser-av big">T</div><b>Théo</b><span>Compte testeur · NOCTIS</span></div>' +
      '<div class="ser-card ser-list">' + rows.map(r => '<div><span>' + r[0] + '</span><b>' + esc(r[1]) + '</b></div>').join('') +
      (S.adm ? '<div data-act="dev" class="ser-link"><span>Mode développeur</span><b>›</b></div>' : '') + '</div>' +
      '<div class="ser-foot">NOCTIS Wellbeing SAS · Conditions d\'utilisation</div></div>' + serTabs('profile');
  }
  function serPlay() {
    return '<div class="ser-play' + (S.pause ? ' paused' : '') + '"><div class="ser-play-top"><span data-act="back">⌄</span><b>' + esc(nav.prog || 'Séance') + '</b><span></span></div>' +
      '<div class="ser-breath"><div class="ser-ring"></div><div class="ser-ring r2"></div><div class="ser-core"><span class="in">Inspirez</span><span class="out">Expirez</span></div></div>' +
      '<div class="ser-voice">« Respirez… À votre réveil, ce qui pesait sera plus léger. »</div>' +
      '<div class="ser-prog-bar"><i></i></div><div class="ser-ctrl"><span>↺</span><b data-act="pause">' + (S.pause ? '▶' : '❙❙') + '</b><span>☾</span></div></div>';
  }
  function sereni() {
    if (nav.view === 'play') return serPlay();
    if (nav.tab === 'explore') return serExplore();
    if (nav.tab === 'profile') return serProfile();
    return serHome();
  }
  function admin() {
    const top = '<div class="dev-top"><button data-act="back">‹ Sérénité</button><span class="dev-pill">DEV</span></div>';
    if (!S.adm) {
      return top + '<div class="dev-body"><div class="dev-brand">NOCTIS<span>console développeur</span></div>' +
        '<div class="dev-kv"><span>environnement</span><b>préprod</b></div><div class="dev-kv"><span>utilisateur</span><b>t.lenoir</b></div>' +
        '<div class="dev-lbl">Mot de passe administrateur</div><input type="text" placeholder="••••••" autocapitalize="off" autocorrect="off"><button class="dev-btn" data-act="adminlogin">Connexion</button><div class="bad dev-err">' + esc(msg) + '</div></div>';
    }
    const A = S.adm, tab = nav.tab || 'journal';
    const tabs = ['journal', 'tickets', 'comptes', 'dossiers'].map(t => '<span class="' + (t === tab ? 'on' : '') + '" data-act="tab" data-t="' + t + '">' + t + '</span>').join('');
    let b = '';
    if (A.adm === 'revoked') b = '<div class="dev-box err"><b>Accès révoqué</b><small>Le compte t.lenoir n\'a plus de droits sur cet environnement.</small></div>';
    else if (tab === 'journal') b = '<div class="dev-mod">module LETHE : <b>' + esc(A.lethe) + '</b></div><table class="dev-t"><tr><th>ID</th><th>Local</th><th>UTC</th><th>Type</th></tr>' + A.jr.map(r => '<tr><td>' + r[0] + '</td><td>' + r[1] + '</td><td>' + r[2] + ' Z</td><td>' + esc(r[3]) + '<br><span class="mut">' + r[4] + '</span></td></tr>').join('') + '</table>';
    else if (tab === 'tickets') b = '<table class="dev-t">' + A.tk.map(r => '<tr><td><b>' + r[0] + '</b></td><td>' + esc(r[1]) + '</td></tr>').join('') + '</table>';
    else if (tab === 'comptes') b = A.accHtml ? '<div class="dev-box dev-acc">' + A.accHtml + '</div>' : '<div class="mut">Section réservée aux administrateurs système.</div>';
    else if (A.dos === 'locked') {
      if (S.dos) {
        const d = S.dos;
        b = '<div class="dev-box"><b>ORCHIDÉE</b></div><table class="dev-t"><tr><th>Client</th><th>Événement</th><th>Sujets</th><th>Oubli</th></tr>' + d.rows.map(r => '<tr>' + r.map(c => '<td>' + esc(c) + '</td>').join('') + '</tr>').join('') + '</table>' +
          '<div class="dev-box" style="margin-top:10px"><small>Accès : ' + esc(d.access) + '</small></div><div class="dev-box err"><b>Sujet 0 : fin de mission</b><small>' + esc(d.sujet0) + '</small></div>';
      } else {
        b = '<div class="dev-box"><b>ORCHIDÉE</b><small>Dossier protégé' + (A.dosMod ? ' · mot de passe modifié par ' + esc(A.dosMod) : '') + '</small>' + (A.dosHint ? '<small>Indice : ' + esc(A.dosHint) + '</small>' : '') + '</div><input type="text" placeholder="Mot de passe du dossier" autocapitalize="off" autocorrect="off"><button class="dev-btn" data-act="doslogin">Ouvrir</button><div class="bad dev-err">' + esc(msg) + '</div>';
      }
    } else b = '<div class="mut">Aucun dossier partagé.</div>';
    return top + '<div class="dev-body"><div class="dev-brand sm">NOCTIS<span>préprod · t.lenoir</span></div><div class="dev-tabs">' + tabs + '</div>' + b + '</div>';
  }
  function renderApp() {
    const n = nav;
    if (n.app === 'notes') {
      if (n.view === 'item') { const x = D.notes[n.i]; return hd('') + '<div class="body"><div class="paper"><span class="nt-d">' + x.h + '</span><h3>' + esc(x.t) + '</h3>' + esc(x.b) + '</div></div>'; }
      const list = D.notes.map((x, i) => ({ x, i })).sort((a, b) => b.x.h.localeCompare(a.x.h));
      return hd('Notes') + '<div class="body"><div class="grp">' + list.map(o => '<div class="item" data-act="view" data-i="' + o.i + '"><b>' + esc(o.x.t) + '</b><small><span>' + o.x.h + '</span>' + esc(o.x.b.split('\n')[0]) + '</small></div>').join('') + '</div><div class="foot">' + D.notes.length + ' notes</div></div>';
    }
    if (n.app === 'msg') {
      if (n.view === 'card') {
        const t = D.th[n.i];
        return hd('Contact') + '<div class="body">' + (t.av ? '<div class="av">' + t.av + '</div>' : '') + '<div class="cardx"><b>' + esc(nm(t)) + '</b><small>' + esc(t.num || 'Numéro masqué') + '</small></div>' + (t.card ? '<div class="cardx"><small style="margin:0 0 6px">Modifier le contact</small>' + (S.ana ? '<b class="ok">Contact enregistré : « Moi (Théo Lenoir) »</b>' : '<input type="text" placeholder="' + esc(t.n) + '" autocapitalize="off" autocorrect="off"><button class="go alt" data-act="anagram">Enregistrer</button><div style="margin-top:8px"><span class="bad">' + esc(msg) + '</span></div>') + '</div>' : '') + '</div>';
      }
      if (n.view === 'item') {
        const t = D.th[n.i];
        return '<div class="hd"><button data-act="back">‹</button><span data-act="card" style="cursor:pointer;display:flex;align-items:center;gap:8px">' + (t.av ? '<i class="av-s">' + t.av + '</i>' : '') + esc(nm(t)) + ' ⓘ</span></div><div class="body">' + (t.m[0] && t.m[0][0] === 'day' ? '' : '<div class="tm">' + t.h + '</div>') + t.m.map(m => m[0] === 'day' ? '<div class="tm">' + esc(m[1]) + '</div>' : '<div class="bub ' + m[0] + '">' + (m[2] ? '<span class="au">' + esc(m[2]) + '</span>' : '') + esc(m[1]) + '</div>').join('') + '</div>';
      }
      return hd('Messages') + '<div class="body">' + D.th.map((t, i) => '<div class="item mi" data-act="view" data-i="' + i + '"><i class="av-l">' + (t.av || esc(ini(nm(t)))) + '</i><div><b>' + esc(nm(t)) + '<span>' + t.h + ' ›</span></b><small>' + esc((t.m.filter(m => m[0] !== 'day').pop() || ['', ''])[1]) + '</small></div></div>').join('') + '</div>';
    }
    if (n.app === 'photos') {
      if (n.view === 'item') { const x = D.ph[n.i]; return hd(x.c) + '<div class="body"><div class="scene ' + x.cls + '">' + x.html + '</div></div>'; }
      const fill = Array.from({ length: 12 - (D.ph.length % 3) }, (_, i) => '<div class="th plain f' + ((i * 5 + N) % 6) + '"></div>').join('');
      return hd('Photos') + '<div class="body"><div class="grid">' + fill + D.ph.map((x, i) => '<div class="th" data-act="view" data-i="' + i + '"><div class="mini scene ' + x.cls + '">' + x.html + '</div></div>').join('') + '</div><div class="foot">' + D.total + ' photos</div></div>';
    }
    if (n.app === 'dicta') {
      if (n.view === 'item') {
        const x = D.memos[n.i];
        return hd('') + '<div class="body"><div class="vm-h"><b>' + esc(x.n) + '</b><small>' + CLOCK[0] + ' · ' + x.h + '</small></div><div class="wave">' + wave(x.n) + '</div><div class="vm-t"><span>0:00</span><span>-' + x.d + '</span></div><div class="vm-c"><span>↺</span><b>▶</b><span>↻</span></div><div class="cardx tr"><small>Transcription</small>' + esc(x.x) + '</div>' +
          (x.sp ? '<button class="go alt" data-act="spectro">Analyser (spectre)</button><div style="margin-top:8px">' + (S.sp ? '<canvas id="cv" width="300" height="150"></canvas><div class="axis"><span>20 kHz</span><span>temps →</span><span>0</span></div>' : '<span class="bad">' + esc(msg) + '</span>') + '</div>' : '') + '</div>';
      }
      return hd('Dictaphone') + '<div class="body">' + (D.memos.length ? D.memos.map((x, i) => '<div class="item" data-act="view" data-i="' + i + '"><b>' + esc(x.n) + '</b><small><span>' + x.h + '</span><span>' + x.d + '</span></small></div>').join('') : '<div class="foot">Aucun enregistrement</div>') + '</div>';
    }
    if (n.app === 'sereni') return sereni();
    if (n.app === 'admin') return admin();
    if (n.app === 'set') {
      const row = (ic, c, k, v) => '<div class="row"><i class="si" style="background:' + c + '">' + ic + '</i><span>' + k + '</span><b>' + v + '</b></div>';
      return hd('Réglages') + '<div class="body"><div class="grp me"><i class="av-l big">T</i><div><b>Théo</b><small>Identifiant, iCloud et plus</small></div></div>' +
        '<div class="grp">' + row('✆', '#34c759', 'Mon numéro', D.num) + row('ⓘ', '#8e8e93', 'Nom de l\'appareil', 'iPhone de Théo') + row('▮', '#34c759', 'Batterie', D.bat + ' %') + '</div>' +
        '<div class="grp">' + row(SVG_MOON, 'linear-gradient(160deg,#8f7bff,#4b3a9e 55%,#e9a6b8)', 'Sérénité', 'Version ' + D.ver) + row('✿', '#ff9f0a', 'Photos', D.total + ' éléments') + '</div></div>';
    }
    return '';
  }
  function spectro(c, text) {
    const x = c.getContext('2d'), w = c.width, h = c.height, img = x.createImageData(w, h);
    for (let i = 0; i < w * h; i++) { const y = Math.floor(i / w), b = 20 + Math.random() * 38 + (1 - y / h) * 14; img.data[i * 4] = b * .4; img.data[i * 4 + 1] = b * .9; img.data[i * 4 + 2] = b * 2.2; img.data[i * 4 + 3] = 255; }
    x.putImageData(img, 0, 0);
    const t = document.createElement('canvas'); t.width = w; t.height = h;
    const tx = t.getContext('2d');
    tx.fillStyle = '#000'; tx.fillRect(0, 0, w, h); tx.fillStyle = '#fff'; tx.font = 'bold 66px sans-serif'; tx.textAlign = 'center'; tx.fillText(text, w / 2, h * .46);
    const td = tx.getImageData(0, 0, w, h).data, id = x.getImageData(0, 0, w, h);
    for (let i = 0; i < w * h; i++) if (td[i * 4] > 128) { id.data[i * 4] = Math.min(255, id.data[i * 4] + 170); id.data[i * 4 + 1] = Math.min(255, id.data[i * 4 + 1] + 150); id.data[i * 4 + 2] = Math.min(255, id.data[i * 4 + 2] + 50); }
    x.putImageData(id, 0, 0);
  }
  function toast(t) {
    let x = $('toast');
    if (!x) { x = document.createElement('div'); x.id = 'toast'; $('phone').appendChild(x); }
    x.textContent = t;
    x.className = 'show';
    clearTimeout(toastT);
    toastT = setTimeout(() => { x.className = ''; }, 1800);
  }
  function draw() {
    if (!D) return;
    const el = $('screen');
    const ser = nav.app === 'sereni' || nav.app === 'admin';
    el.className = 'screen' + (nav.app === 'sereni' ? ' ser-on' : nav.app === 'admin' ? ' dev-on' : '');
    if (!nav.app) {
      const ic = a => '<div class="ic" data-act="open" data-app="' + a[0] + '">' + icon(a[0]) + '<span>' + a[1] + '</span></div>';
      const day = CLOCK[0].split(' ');
      el.innerHTML = '<div class="home">' + wall(D.wp) + sb() +
        '<div class="wid"><div class="w-cal"><small>' + day[0].toUpperCase() + '</small><b>' + day[1] + '</b><span>' + day[2] + '</span></div>' +
        '<div class="w-ser" data-act="open" data-app="sereni"><i>' + SVG_MOON + '</i><small>Sérénité</small><b>' + (D.close ? 'Séance de clôture' : SER.hero[0]) + '</b><span>' + (D.close ? 'Cette nuit, 2 h 30' : SER.hero[1]) + '</span></div></div>' +
        '<div class="icons">' + [['notes', 'Notes'], ['photos', 'Photos'], ['dicta', 'Dictaphone'], ['set', 'Réglages']].map(ic).join('') + '</div>' +
        '<div class="pdots"><i class="on"></i><i></i></div><div class="dock">' + [['msg', 'Messages'], ['sereni', 'Sérénité']].map(ic).join('') + '</div></div>';
    } else {
      el.innerHTML = sb() + '<div class="app' + (ser ? ' ser' : ' a-' + nav.app + (!nav.view || nav.view === 'list' ? ' lv' : '')) + '">' + renderApp() + '</div><div class="hbar" data-act="home"></div>';
    }
    const cv = $('cv'); if (cv && S.sp) spectro(cv, S.sp);
    refreshCd();
  }

  // ---------- Actions ----------
  document.addEventListener('click', async e => {
    const k = e.target.closest('[data-k]');
    if (k && $('lmsg')) { padKey(k.dataset.k); return; }
    const el = e.target.closest('[data-act]');
    if (!el || !D) return;
    const a = el.dataset.act, n = nav;
    const inp = $('screen').querySelector('input');
    const val = inp ? inp.value : '';
    msg = '';
    if (a === 'open') { nav = { app: el.dataset.app, view: 'list', i: 0, tab: 'journal' }; }
    else if (a === 'home') nav = { app: null };
    else if (a === 'back') {
      if (n.app === 'admin') nav = { app: 'sereni', view: 'list' };
      else if (n.app === 'msg' && n.view === 'card') n.view = 'item';
      else if (n.view && n.view !== 'list') n.view = 'list';
      else nav = { app: null };
    }
    else if (a === 'view') { n.view = 'item'; n.i = +el.dataset.i; }
    else if (a === 'card') { n.view = 'card'; }
    else if (a === 'logo') {
      taps++;
      if (taps >= 7) { taps = 0; toast('Vous êtes maintenant en mode développeur.'); nav = { app: 'admin', view: 'main', tab: 'journal' }; }
      else if (taps >= 3) { toast('Encore ' + (7 - taps) + ' appui' + (7 - taps > 1 ? 's' : '') + ' pour passer en mode développeur.'); return; }
      else return;
    }
    else if (a === 'dev') nav = { app: 'admin', view: 'main', tab: 'journal' };
    else if (a === 'stab') { n.tab = el.dataset.t; n.view = 'list'; }
    else if (a === 'play') { n.view = 'play'; n.prog = el.dataset.p; S.pause = false; }
    else if (a === 'pause') { S.pause = !S.pause; }
    else if (a === 'mood') { S.mood = S.mood === el.dataset.m ? '' : el.dataset.m; save(); }
    else if (a === 'tab') n.tab = el.dataset.t;
    else if (a === 'adminlogin') {
      const r = await check('admin', val);
      if (r && r.j.ok) { S.adm = r.j.data; save(); } else if (r) msg = r.j.error || 'Mot de passe incorrect.';
    }
    else if (a === 'doslogin') {
      const r = await check('dossier', val);
      if (r && r.j.ok) { S.dos = r.j.data; save(); } else if (r) msg = r.j.error || 'Mot de passe incorrect.';
    }
    else if (a === 'neutral') {
      const r = await check('final', val);
      if (r && r.j.ok) { S.win = true; save(); } else if (r) msg = r.j.error || 'Rémanence insuffisante.';
    }
    else if (a === 'anagram') {
      const r = await check('anagram', val);
      if (r && r.j.ok) { S.ana = true; save(); } else if (r) msg = r.j.error || "Ce n'est pas la bonne combinaison.";
    }
    else if (a === 'spectro') {
      const r = await check('spectro');
      if (r && r.j.ok) { S.sp = r.j.text; save(); } else if (r) msg = r.j.error || 'Rien à analyser.';
    }
    if (D) draw();
  });

  // ---------- Démarrage ----------
  (async function boot() {
    if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
    if (S.sess) {
      try {
        const r = await api('/api/phone/' + N);
        if (r.ok) { start(r.j); return; }
        if (r.status === 401) { S.sess = ''; save(); }
      } catch (e) {}
    }
    lock();
  })();
})();
