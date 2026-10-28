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
  const hhmm = () => { const d = new Date(); return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); };
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
    $('screen').innerHTML = '<div class="lock"><div class="lk-moon">☾</div><div class="lk-t">Entrez le code</div>' +
      '<div class="dots" id="dots"><i></i><i></i><i></i><i></i></div><div id="lmsg" class="lk-m"></div>' +
      '<div class="pad">' + [1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, '⌫'].map(k => k === '' ? '<span></span>' : '<button data-k="' + k + '">' + k + '</button>').join('') + '</div></div>';
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
      banner(e.thread || 'Message', e.text);
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
  function banner(title, text) {
    const b = $('banner');
    b.innerHTML = '<div class="nb"><b>' + esc(title) + '</b><span>' + esc(text) + '</span></div>';
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
  function wall(s) {
    let f = '';
    const c = '#d9a8ff';
    if (s === 1) f = '<ellipse cx="144" cy="230" rx="13" ry="30" fill="' + c + '"/>';
    if (s === 2) f = '<ellipse cx="144" cy="225" rx="23" ry="44" fill="' + c + '"/><path d="M144 185V265" stroke="#8a5bb8" stroke-width="2"/>';
    if (s === 3) { [-48, 0, 48].forEach(a => { f += '<ellipse cx="144" cy="195" rx="22" ry="44" fill="' + c + '" opacity=".95" transform="rotate(' + a + ' 144 235)"/>'; }); f += '<circle cx="144" cy="235" r="9" fill="#ffd36b"/>'; }
    if (s === 4) { [0, 72, 144, 216, 288].forEach(a => { f += '<ellipse cx="144" cy="190" rx="26" ry="50" fill="' + c + '" opacity=".93" transform="rotate(' + a + ' 144 235)"/>'; }); f += '<circle cx="144" cy="235" r="13" fill="#ffd36b"/>'; }
    return '<svg class="wp" viewBox="0 0 288 596" preserveAspectRatio="xMidYMid slice"><defs><radialGradient id="g' + s + '" cx="50%" cy="38%" r="80%"><stop offset="0" stop-color="#27214a"/><stop offset="1" stop-color="#05070d"/></radialGradient></defs><rect width="288" height="596" fill="url(#g' + s + ')"/><path d="M144 235V410" stroke="#3f8f66" stroke-width="3"/><path d="M144 340C110 320 95 330 82 350C112 356 130 352 144 340Z" fill="#3f8f66"/>' + f + '</svg>';
  }
  const sb = () => '<div class="notch"></div><div class="sb"><span>●●●○</span><span>' + D.bat + ' %</span></div>';
  const hd = t => '<div class="hd"><button data-act="back">‹</button><span>' + esc(t) + '</span></div>';
  const ICON = { postit: '🟨', board: '⬜', inv: '🧾', ticket: '💻', badge: '🪪', blur: '🌸', clock: '⏰', acc: '📋', plain: '🖼️', desk: '🖥️', concert: '🎸' };

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
      if (n.view === 'item') { const x = D.notes[n.i]; return hd(x.t) + '<div class="body"><div class="paper"><h3>' + esc(x.t) + '</h3><span style="opacity:.6">' + x.h + '</span>\n\n' + esc(x.b) + '</div></div>'; }
      const list = D.notes.map((x, i) => ({ x, i })).sort((a, b) => b.x.h.localeCompare(a.x.h));
      return hd('Notes') + '<div class="body">' + list.map(o => '<div class="item" data-act="view" data-i="' + o.i + '"><b>' + esc(o.x.t) + '</b><span>' + o.x.h + '</span><small>' + esc(o.x.b.split('\n')[0]) + '</small></div>').join('') + '</div>';
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
      return hd('Messages') + '<div class="body">' + D.th.map((t, i) => '<div class="item" data-act="view" data-i="' + i + '"><b>' + esc(nm(t)) + '</b><span>' + t.h + '</span><small>' + esc((t.m.filter(m => m[0] !== 'day').pop() || ['', ''])[1]) + '</small></div>').join('') + '</div>';
    }
    if (n.app === 'photos') {
      if (n.view === 'item') { const x = D.ph[n.i]; return hd(x.c) + '<div class="body"><div class="scene ' + x.cls + '">' + x.html + '</div></div>'; }
      const fill = Array.from({ length: 6 }, () => '<div class="th plain">▫️</div>').join('');
      return hd('Photos') + '<div class="body"><div class="grid">' + D.ph.map((x, i) => '<div class="th" data-act="view" data-i="' + i + '">' + ICON[x.k] + '</div>').join('') + fill + '</div><div class="mut" style="text-align:center;margin-top:10px">' + D.total + ' photos</div></div>';
    }
    if (n.app === 'dicta') {
      if (n.view === 'item') {
        const x = D.memos[n.i];
        return hd(x.n) + '<div class="body"><div class="cardx"><b>' + esc(x.n) + '</b><small>' + x.d + ' · ' + x.h + '</small></div><div class="cardx" style="font-style:italic">' + esc(x.x) + '</div>' +
          (x.sp ? '<button class="go alt" data-act="spectro">Analyser (spectre)</button><div style="margin-top:8px">' + (S.sp ? '<canvas id="cv" width="300" height="150"></canvas><div class="axis"><span>20 kHz</span><span>temps →</span><span>0</span></div>' : '<span class="bad">' + esc(msg) + '</span>') + '</div>' : '') + '</div>';
      }
      return hd('Dictaphone') + '<div class="body">' + (D.memos.length ? D.memos.map((x, i) => '<div class="item" data-act="view" data-i="' + i + '"><b>🎙️ ' + esc(x.n) + '</b><span>' + x.d + ' · ' + x.h + '</span></div>').join('') : '<div class="mut">Aucun enregistrement.</div>') + '</div>';
    }
    if (n.app === 'sereni') return sereni();
    if (n.app === 'admin') return admin();
    if (n.app === 'set') return hd('Réglages') + '<div class="body"><div class="cardx"><b>Mon numéro</b><small>' + D.num + '</small></div><div class="cardx"><b>Nom de l\'appareil</b><small>iPhone de Théo</small></div><div class="cardx"><b>Sérénité</b><small>Version ' + D.ver + '</small></div><div class="cardx"><b>Photos</b><small>' + D.total + ' éléments</small></div></div>';
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
      el.innerHTML = '<div class="home">' + wall(D.wp) + sb() + '<div class="icons">' +
        [['notes', '📝', 'Notes'], ['msg', '💬', 'Messages'], ['photos', '🖼️', 'Photos'], ['dicta', '🎙️', 'Dictaphone'], ['sereni', '🌙', 'Sérénité'], ['set', '⚙️', 'Réglages']]
          .map(a => '<div class="ic" data-act="open" data-app="' + a[0] + '">' + (a[0] === 'sereni' ? '<i class="ic-ser">' + SVG_MOON + '</i>' : '<i>' + a[1] + '</i>') + a[2] + '</div>').join('') + '</div></div>';
    } else {
      el.innerHTML = sb() + '<div class="app' + (ser ? ' ser' : '') + '">' + renderApp() + '</div><div class="hbar" data-act="home"></div>';
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
