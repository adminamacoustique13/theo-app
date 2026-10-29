(function () {
  'use strict';
  const N = +((location.pathname.match(/\/t\/(\d)/) || [])[1]) || 1;
  const KEY = 'theo' + N;
  let S = {};
  try { S = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { S = {}; }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };

  let D = null, nav = { app: null }, taps = 0, msg = '', es = null, deadline = null, skew = 0, code = '', toastT = null, fw = [], player = null, devOk = false; // devOk : la console développeur redemande LETHE à chaque ouverture.
  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  const hhmm = () => clock();
  const nm = t => (t.n === 'Ethel O.' && S.ana) ? 'Moi (Théo Lenoir)' : t.n;
  // Une phase de lune par mot du mot de passe final : à côté du mot à trouver, puis sur sa case.
  const MOON = ['', '🌑', '🌒', '🌓', '🌕'];
  const mk = i => i ? '<i class="mk">' + MOON[i] + '</i>' : '';

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
        // Nouveau déverrouillage = nouvelle partie côté serveur : on oublie une fin restée d'une partie précédente.
        if (r.ok) { S.sess = r.j.session; delete S.fin; delete S.fs; delete S.end; delete S.win; save(); start(r.j.data); return; }
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
    // « Nouvelle partie » lancée pendant que l'appli était fermée : on efface la progression restée sur l'appareil.
    if ((D.ep || 0) > (S.ep || 0)) { S = { sess: S.sess, intro: S.intro, ep: D.ep }; save(); }
    (S.live || []).forEach(addMsg);
    nav = { app: null };
    draw();
    // Fin déjà trouvée (page rechargée, ou trouvée sur un autre téléphone) : on l'affiche ici aussi.
    if (D.fin && !S.fin && !S.end) won(D.fin); else fin();
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
    // Fin trouvée sur le tél. 4 : elle s'affiche sur les quatre téléphones ; puis le choix commun, puis la fin choisie.
    if (e.type === 'fin') { if (!S.fin && !S.end) won(e.fin); return; }
    if (e.type === 'choix') { if (!S.end) { S.end = e.fin; save(); fin(); } return; }
    // Nouvelle partie lancée par les game masters : on oublie toute la progression, sauf le déverrouillage.
    if (e.type === 'reset') { S = { sess: S.sess, intro: S.intro, ep: e.ep || S.ep }; save(); devOk = false; taps = 0; fw = []; nav = { app: null }; draw(); fin(); return; }
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
  // Le tél. 4 s'ouvre à 1 h 45, la nuit du 30 au 31 : le compte à rebours de 45 min des game masters tombe sur 2 h 30.
  const CLOCK = { 1: ['Lundi 19 octobre', 22 * 60 + 14, '2026-10-19'], 2: ['Vendredi 23 octobre', 3 * 60 + 26, '2026-10-23'], 3: ['Dimanche 25 octobre', 3 * 60 + 41, '2026-10-25'], 4: ['Samedi 31 octobre', 1 * 60 + 45, '2026-10-31'] }[N] || ['', 0, '2026-10-19'];
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
  IC.tel = '<svg viewBox="0 0 60 60"><defs><linearGradient id="ict" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6bf27c"/><stop offset="1" stop-color="#0dbd2d"/></linearGradient></defs><rect width="60" height="60" fill="url(#ict)"/><path d="M21.5 14.5c1.4-.9 3.2-.5 4.1.9l3.3 5c.8 1.3.6 3-.6 4l-2.6 2.1c1.8 4 4.6 6.9 8.6 8.8l2.1-2.6c1-1.2 2.7-1.5 4-.6l5 3.3c1.4.9 1.8 2.7.9 4.1l-2 3c-1.3 1.9-3.6 2.8-5.8 2.2C26.9 42.300 17.7 33.100 15.3 21.500c-.5-2.200.4-4.500 2.300-5.800Z" fill="#fff"/></svg>';
  IC.bank = '<svg viewBox="0 0 60 60"><defs><linearGradient id="icb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1f8a6b"/><stop offset="1" stop-color="#0b4a3a"/></linearGradient></defs><rect width="60" height="60" fill="url(#icb)"/><g fill="#fff"><path d="M30 12 47 21H13Z"/><rect x="13" y="22.5" width="34" height="3" rx="1"/><rect x="16" y="28" width="4" height="13"/><rect x="24" y="28" width="4" height="13"/><rect x="32" y="28" width="4" height="13"/><rect x="40" y="28" width="4" height="13"/><rect x="12" y="43" width="36" height="4" rx="1"/></g></svg>';
  IC.mail = '<svg viewBox="0 0 60 60"><defs><linearGradient id="icl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5ac8fa"/><stop offset="1" stop-color="#0a6cff"/></linearGradient></defs><rect width="60" height="60" fill="url(#icl)"/><rect x="11" y="18" width="38" height="25" rx="3" fill="#fff"/><path d="M12 20 30 33l18-13" fill="none" stroke="#2b8cff" stroke-width="2.4" stroke-linejoin="round"/></svg>';
  const icCal = () => { const d = dOf(CLOCK[2]); return '<svg viewBox="0 0 60 60"><rect width="60" height="60" fill="#fff"/><text x="30" y="17" text-anchor="middle" font-size="9.5" font-weight="600" fill="#ff3b30" font-family="-apple-system,Helvetica,Arial">' + JOURS[d.getDay()].slice(0, 3).toUpperCase() + '.</text><text x="30" y="48" text-anchor="middle" font-size="32" font-weight="300" fill="#111" font-family="-apple-system,Helvetica,Arial">' + d.getDate() + '</text></svg>'; };
  const icon = k => '<i class="ico">' + (k === 'sereni' ? '<b class="ico-ser">' + SVG_MOON + '</b>' : k === 'cal' ? icCal() : IC[k]) + '</i>';
  const SIG = '<svg viewBox="0 0 18 12" width="18" height="12"><rect x="0" y="8" width="3" height="4" rx="1"/><rect x="5" y="5.5" width="3" height="6.5" rx="1"/><rect x="10" y="3" width="3" height="9" rx="1"/><rect x="15" y="0" width="3" height="12" rx="1" opacity=".35"/></svg>';
  const WIFI = '<svg viewBox="0 0 16 12" width="16" height="12"><path d="M8 11.5 5.6 9a3.4 3.4 0 0 1 4.8 0Z"/><path d="M3.6 7a6.3 6.3 0 0 1 8.8 0l1.4-1.4a8.3 8.3 0 0 0-11.6 0Z"/><path d="M1.4 4.8a9.4 9.4 0 0 1 13.2 0L16 3.4a11.4 11.4 0 0 0-16 0Z"/></svg>';
  const batt = b => '<svg viewBox="0 0 27 13" width="27" height="13"><rect x=".5" y=".5" width="23" height="12" rx="3.5" fill="none" stroke="currentColor" opacity=".4"/><rect x="2" y="2" width="' + Math.max(1.5, 20 * b / 100) + '" height="9" rx="2" fill="' + (b <= 20 ? '#ff453a' : 'currentColor') + '"/><path d="M25 4.5v4c.8-.3 1.3-1 1.3-2s-.5-1.7-1.3-2Z" opacity=".4"/></svg>';
  const sbar = (time, bat) => '<div class="notch"></div><div class="sb"><span class="sb-t">' + (time ? '<span class="clk">' + clock() + '</span>' : '') + '</span><span class="sb-r">' + SIG + WIFI + (bat != null ? batt(bat) : '') + '</span></div>';

  // Fond d'écran : la même photo sur les quatre téléphones (public/wallpaper.jpg), fond sombre si elle manque.
  const wall = () => '<div class="wp"></div>';
  const sb = () => sbar(true, D.bat);
  const APPN = { bank: 'Comptes', mail: 'Mail', notes: 'Notes', msg: 'Messages', photos: 'Photos', dicta: 'Dictaphone', set: 'Réglages', tel: 'Récents' };
  const hd = t => '<div class="hd"><button data-act="back">‹<em>' + (nav.view && nav.view !== 'list' ? (nav.view === 'card' ? '' : APPN[nav.app] || '') : '') + '</em></button><span>' + esc(t) + '</span></div>';
  const LOCK_IC = '<svg viewBox="0 0 14 18" width="14" height="18"><path d="M3 8V5.5a4 4 0 0 1 8 0V8" fill="none" stroke="currentColor" stroke-width="1.8"/><rect x="0" y="8" width="14" height="10" rx="2.5" fill="currentColor"/></svg>';
  const ini = s => s.replace(/\(.*\)/, '').split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
  const wave = s => { let h = 0, o = ''; for (let i = 0; i < 64; i++) { h = (h * 31 + s.charCodeAt(i % s.length) + i * 7) % 997; o += '<i style="height:' + (12 + (h % 70)) + '%"></i>'; } return o; };

  // ---------- Sérénité ----------
  // Textes de l'appli propres à chaque téléphone (salutation, séance mise en avant, statistiques).
  const SER = {
    1: { hi: 'Bonjour, Théo', sub: 'Une pause de quelques minutes ?', hero: ['Respiration guidée', 'Détente · 10 min', 'p2'], st: [['1', 'séance'], ['10', 'minutes'], ['—', 'série']] },
    2: { hi: 'Bonne nuit, Théo', sub: 'Laissez la journée derrière vous.', hero: ['Séance du soir', 'Lâcher prise · 25 min', 'p2'], st: [['4', 'séances'], ['96', 'minutes'], ['3', 'nuits']] },
    3: { hi: 'Bonne nuit, Théo', sub: 'Tout est calme.', hero: ['Séance de nuit', 'Sommeil profond · 52 min', 'p1'], st: [['7', 'séances'], ['212', 'minutes'], ['5', 'nuits']] },
    4: { hi: 'Bonsoir, Théo', sub: 'Vous pouvez souffler.', hero: ['Séance du soir', 'Tourner la page · 24 min', 'p4'], st: [['14', 'séances'], ['418', 'minutes'], ['11', 'nuits']] }
  }[N] || {};
  const PROGS = [
    ['Sommeil profond', '8 séances', 'p1'], ['Lâcher prise', '6 séances', 'p2'], ['Oublier le stress', '10 séances', 'p3'], ['Repartir à zéro', '5 séances', 'p4']
  ];
  const EXPLO = [
    ['Sommeil', 'p1'], ['Anxiété', 'p3'], ['Respiration', 'p2'], ['Tourner la page', 'p4'], ['Concentration', 'p3'], ['Oublier une rupture', 'p2']
  ];
  // Musique de chaque séance, selon sa couleur : fichiers dans public/musique/ (rien ne joue tant qu'ils manquent).
  const MUSIC = { p1: 'sommeil', p2: 'respiration', p3: 'calme', p4: 'page' };
  let music = null;
  function musicFor(p) {
    if (!music) { music = new Audio(); music.loop = true; }
    const src = '/musique/' + (MUSIC[p] || 'calme') + '.mp3';
    if (!music.src.endsWith(src)) music.src = src;
    music.play().catch(() => {});
  }
  const MOODS = ['Serein', 'Fatigué', 'Tendu', 'Agité', 'Vide'];
  const SVG_MOON = '<svg viewBox="0 0 40 40"><path d="M25.5 6.5A14 14 0 1 0 33.5 27 11.5 11.5 0 0 1 25.5 6.5Z" fill="currentColor"/><circle cx="30" cy="10" r="1.3" fill="currentColor"/><circle cx="34" cy="16" r=".9" fill="currentColor"/></svg>';
  const SVG_HERO = '<svg class="ser-hero-art" viewBox="0 0 300 120" preserveAspectRatio="xMidYMax slice"><circle cx="232" cy="38" r="20" fill="#fff6e9" opacity=".9"/><path d="M0 92C50 70 90 72 150 88S250 104 300 82V120H0Z" fill="#fff" opacity=".16"/><path d="M0 104C60 88 110 94 170 104S260 112 300 100V120H0Z" fill="#fff" opacity=".22"/></svg>';

  function serTabs(cur) {
    return '<nav class="ser-tab">' + [['home', 'Accueil', '<path d="M4 11.5 12 5l8 6.5V20h-5v-5H9v5H4Z"/>'], ['explore', 'Explorer', '<circle cx="12" cy="12" r="8"/><path d="m15 9-2 4-4 2 2-4Z"/>'], ['profile', 'Profil', '<circle cx="12" cy="9" r="3.5"/><path d="M5 20c1-4 4-5.5 7-5.5s6 1.5 7 5.5"/>']]
      .map(t => '<span class="' + (t[0] === cur ? 'on' : '') + '" data-act="stab" data-t="' + t[0] + '"><svg viewBox="0 0 24 24">' + t[2] + '</svg>' + t[1] + '</span>').join('') + '</nav>';
  }
  function serTop() {
    return '<div class="ser-top"><button class="ser-x" data-act="home" aria-label="Quitter Sérénité">‹</button><div class="ser-logo" data-act="logo">' + SVG_MOON + '</div><div class="ser-word">sérénité<small>par NOCTIS</small></div><div class="ser-av" data-act="stab" data-t="profile">T</div></div>';
  }
  function serHome() {
    const clos = D.close ? '<div class="ser-close"><div class="ser-close-h"><span class="ser-pill">Programmée</span><b>Séance de clôture</b></div>' +
      '<div class="ser-close-t">Cette nuit, 2 h 30. Une dernière séance pour refermer ce chapitre en douceur.</div><div class="ser-cd" id="cd">Programmée cette nuit</div>' +
      '<div class="ser-lbl">Mot de passe de neutralisation · 4 mots</div><div class="ser-words">' + [1, 2, 3, 4].map(i => '<label>' + MOON[i] + '</label><input type="text" placeholder="mot ' + i + '" value="' + esc(fw[i - 1] || '').replace(/"/g, '&quot;') + '" autocapitalize="off" autocorrect="off" spellcheck="false">').join('') + '</div><button class="ser-btn" data-act="neutral">Neutraliser</button>' +
      '<div class="ser-res">' + '<span class="bad">' + esc(msg) + '</span>' + '</div></div>' : '';
    const moods = MOODS.map(m => '<span class="' + (S.mood === m ? 'on' : '') + '" data-act="mood" data-m="' + m + '">' + m + '</span>').join('');
    return '<div class="ser-body">' + serTop() +
      '<h1 class="ser-hi">' + SER.hi + '</h1><div class="ser-sub">' + SER.sub + '</div>' + clos +
      '<div class="ser-h2">Comment vous sentez-vous ?</div><div class="ser-moods">' + moods + '</div>' +
      '<div class="ser-hero" data-act="play" data-p="' + esc(SER.hero[0]) + '" data-m="' + SER.hero[2] + '">' + SVG_HERO + '<small>Recommandé pour vous</small><b>' + SER.hero[0] + '</b><span>' + SER.hero[1] + '</span><i>▶</i></div>' +
      '<div class="ser-stats">' + SER.st.map(s => '<div><b>' + s[0] + '</b><span>' + s[1] + '</span></div>').join('') + '</div>' +
      '<div class="ser-h2">Programmes</div><div class="ser-row">' + PROGS.map(p => '<div class="ser-prog ' + p[2] + '" data-act="play" data-p="' + p[0] + '" data-m="' + p[2] + '"><b>' + p[0] + '</b><span>' + p[1] + '</span></div>').join('') + '</div>' +
      '<div class="ser-foot">Version ' + D.ver + ' · atténuation ' + D.att + '<br>NOCTIS Wellbeing SAS</div></div>' + serTabs('home');
  }
  function serExplore() {
    return '<div class="ser-body">' + serTop() + '<h1 class="ser-hi">Explorer</h1><div class="ser-sub">Des séances pour chaque moment.</div>' +
      '<div class="ser-grid">' + EXPLO.map(e => '<div class="ser-prog ' + e[1] + '" data-act="play" data-p="' + e[0] + '" data-m="' + e[1] + '"><b>' + e[0] + '</b></div>').join('') + '</div></div>' + serTabs('explore');
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
  // Identifiant du compte dans la console : jamais « t.lenoir » sur le tél. 4 (le nom est une réponse d'énigme).
  const USER = N === 4 ? 'compte révoqué' : 't.lenoir';
  function admin() {
    const top = '<div class="dev-top"><button data-act="back">‹ Sérénité</button><span class="dev-pill">DEV</span></div>';
    if (!S.adm || !devOk) {
      return top + '<div class="dev-body"><div class="dev-brand">NOCTIS<span>console développeur</span></div>' +
        '<div class="dev-kv"><span>environnement</span><b>préprod</b></div><div class="dev-kv"><span>utilisateur</span><b>' + USER + '</b></div>' +
        '<div class="dev-lbl">Mot de passe administrateur</div><input type="text" placeholder="••••••" autocapitalize="off" autocorrect="off"><button class="dev-btn" data-act="adminlogin">Connexion</button><div class="bad dev-err">' + esc(msg) + '</div></div>';
    }
    const A = S.adm, tab = nav.tab || 'journal';
    const tabs = ['journal', 'tickets', 'comptes', 'dossiers'].map(t => '<span class="' + (t === tab ? 'on' : '') + '" data-act="tab" data-t="' + t + '">' + t + '</span>').join('');
    let b = '';
    if (A.adm === 'revoked') b = '<div class="dev-box err"><b>Accès révoqué</b><small>Ce compte n\'a plus de droits sur cet environnement.</small></div>';
    else if (tab === 'journal') b = '<div class="dev-mod">module LETHE : <b>' + esc(A.lethe) + '</b></div><table class="dev-t"><tr><th>ID</th><th>Heure</th><th>Séance</th></tr>' + A.jr.map(r => '<tr><td>' + r[0] + '</td><td>' + r[1] + (r[6] ? '<br><span class="mut">' + esc(r[6]) + '</span>' : '') + '</td><td>' + (r[5] ? ul(r[3]) + ' ' + mk(r[5]) : esc(r[3])) + '<br><span class="mut">' + r[4] + '</span></td></tr>').join('') + '</table>';
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
    return top + '<div class="dev-body"><div class="dev-brand sm">NOCTIS<span>préprod · ' + USER + '</span></div><div class="dev-tabs">' + tabs + '</div>' + b + '</div>';
  }
  // ---------- Calendrier et Téléphone ----------
  const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  const JOURS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
  const ymd = (y, m, d) => y + '-' + String(m + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
  const dOf = iso => { const p = iso.slice(0, 10).split('-').map(Number); return new Date(p[0], p[1] - 1, p[2]); };
  const longDay = iso => { const x = dOf(iso); return cap(JOURS[x.getDay()]) + ' ' + x.getDate() + ' ' + MOIS[x.getMonth()]; };
  const evColor = e => e.sys ? '#8e8e93' : e.by === 'n.aubry' ? '#bf5af2' : e.by ? '#ff9f0a' : '#0a84ff';
  function evRow(e) {
    const h = e.d.length > 10 ? e.d.slice(11) : 'journée';
    return '<div class="ev"><span class="ev-h">' + h + '</span><i style="background:' + evColor(e) + '"></i><div><b>' + esc(e.t) + '</b>' +
      (e.by ? '<small>Ajouté par ' + esc(e.by) + '</small>' : e.sys ? '<small>' + (/heure/i.test(e.t) ? 'iPhone' : 'Jours fériés') + '</small>' : '') + '</div></div>';
  }
  function calApp() {
    const ev = D.cal || [], today = CLOCK[2];
    if (nav.list) {
      let last = '', o = '';
      ev.forEach(e => { const k = e.d.slice(0, 10); if (k !== last) { o += '<div class="ev-day' + (k === today ? ' now' : '') + '">' + longDay(k) + (k === today ? ' · Aujourd\'hui' : '') + '</div>'; last = k; } o += evRow(e); });
      return hd('Événements') + '<div class="cal-tb"><span data-act="callist">Mois</span></div><div class="body">' + (o || '<div class="foot">Aucun événement</div>') + '</div>';
    }
    const t = dOf(today), mo = nav.mo != null ? nav.mo : t.getMonth(), y = t.getFullYear();
    const sel = nav.sel || today;
    const first = (new Date(y, mo, 1).getDay() + 6) % 7, nd = new Date(y, mo + 1, 0).getDate();
    let g = '';
    for (let i = 0; i < first; i++) g += '<span></span>';
    for (let d = 1; d <= nd; d++) {
      const k = ymd(y, mo, d), has = ev.some(e => e.d.startsWith(k));
      g += '<span class="' + (k === today ? 'today ' : '') + (k === sel ? 'sel ' : '') + '" data-act="calday" data-d="' + k + '">' + d + (has ? '<i></i>' : '') + '</span>';
    }
    const day = ev.filter(e => e.d.startsWith(sel));
    return hd('') + '<div class="cal-tb"><span data-act="calmo" data-m="-1">‹</span><b>' + cap(MOIS[mo]) + ' ' + y + '</b><span data-act="calmo" data-m="1">›</span><span data-act="callist">Liste</span></div>' +
      '<div class="body"><div class="cal-w">' + ['L', 'M', 'M', 'J', 'V', 'S', 'D'].map(x => '<span>' + x + '</span>').join('') + '</div><div class="cal-g">' + g + '</div>' +
      '<div class="ev-day">' + longDay(sel) + '</div>' + (day.length ? day.map(evRow).join('') : '<div class="foot">Aucun événement</div>') + '</div>';
  }
  function callWhen(iso) {
    const k = iso.slice(0, 10), diff = Math.round((dOf(CLOCK[2]) - dOf(k)) / 864e5);
    if (diff === 0) return iso.slice(11);
    if (diff === 1) return 'Hier';
    if (diff > 1 && diff < 7) return cap(JOURS[dOf(k).getDay()]);
    return k.slice(8) + '/' + k.slice(5, 7) + '/' + k.slice(0, 4);
  }
  const callTxt = c => c.dir === 'miss' ? 'Appel manqué' : (c.dir === 'out' ? 'Appel sortant' : 'Appel entrant') + (c.dur === 0 ? ' · annulé' : c.dur != null ? ' · ' + c.dur + ' min' : '');
  function telApp() {
    const all = D.calls || [];
    // Seul l'onglet Récents existe : les autres sont grisés.
    const tabs = '<nav class="tel-tab">' + [['☆', 'Favoris'], ['◷', 'Récents'], ['◉', 'Contacts'], ['⠿', 'Clavier'], ['◎', 'Messagerie']].map(x => '<span class="' + (x[1] === 'Récents' ? 'on' : 'off') + '"><i>' + x[0] + '</i>' + x[1] + '</span>').join('') + '</nav>';
    if (nav.view === 'item') {
      const g = nav.grp || [], c = g[0] || {}, av = (D.th.find(t => t.n === c.n) || {}).av;
      return hd('') + '<div class="body"><div class="tel-me"><i class="av-l big">' + (av || esc(ini(c.n || ''))) + '</i><b>' + esc(c.n || '') + '</b><small>mobile</small></div>' +
        '<div class="grp"><div class="row tel-d">' + longDay(c.d) + '</div>' + g.map(x => '<div class="row"><span>' + x.d.slice(11) + '</span><b class="' + (x.dir === 'miss' ? 'bad' : '') + '">' + callTxt(x) + '</b></div>').join('') + '</div></div>' + tabs;
    }
    // Appels consécutifs du même contact, même sens et même jour : regroupés comme sur iPhone.
    const grps = [];
    all.filter(c => !nav.miss || c.dir === 'miss').forEach(c => {
      const l = grps[grps.length - 1];
      if (l && l[0].n === c.n && l[0].dir === c.dir && l[0].d.slice(0, 10) === c.d.slice(0, 10)) l.push(c); else grps.push([c]);
    });
    nav.grps = grps;
    return hd('Récents') + '<div class="seg"><span class="' + (nav.miss ? '' : 'on') + '" data-act="telmiss" data-v="0">Tous</span><span class="' + (nav.miss ? 'on' : '') + '" data-act="telmiss" data-v="1">Manqués</span></div>' +
      '<div class="body">' + grps.map((g, i) => '<div class="item call" data-act="callgrp" data-i="' + i + '"><div><b class="' + (g[0].dir === 'miss' ? 'bad' : '') + '">' + esc(g[0].n) + (g.length > 1 ? ' (' + g.length + ')' : '') + '</b>' +
        '<small>' + (g[0].dir === 'out' ? '↗ ' : g[0].dir === 'in' ? '↙ ' : '') + callTxt(g[0]).replace('Appel manqué', 'mobile') + '</small></div><span>' + callWhen(g[0].d) + ' <em>ⓘ</em></span></div>').join('') + '</div>' + tabs;
  }
  // Banque : un compte courant, opérations groupées par jour, de la plus récente à la plus ancienne.
  // Le titulaire n'est pas affiché sur le tél. 4 (le nom LENOIR y gâcherait l'anagramme).
  const eur = a => (a < 0 ? '−' : a > 0 ? '+' : '') + Math.abs(a).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+,)/g, ' ') + ' €';
  function bankApp() {
    const B = D.bank || { ops: [], solde: 0 };
    const days = [];
    B.ops.forEach(o => { const l = days[days.length - 1]; if (l && l[0].d === o.d) l.push(o); else days.push([o]); });
    const card = '<div class="bk-card"><small>Compte courant</small>' + (B.holder ? '<span>' + esc(B.holder) + '</span>' : '') + '<em>FR76 •••• •••• •••• 4821</em>' +
      '<small>Solde disponible</small><b class="' + (B.solde < 0 ? 'neg' : '') + '">' + eur(B.solde).replace('+', '') + '</b></div>';
    return hd('Comptes') + '<div class="body">' + card + '<div class="bk-h">Opérations</div>' +
      days.map(g => '<div class="bk-day">' + longDay(g[0].d) + '</div><div class="grp">' + g.map(o => '<div class="row"><span>' + esc(o.t) + '</span><b class="' + (o.a > 0 ? 'pos' : '') + '">' + eur(o.a) + '</b></div>').join('') + '</div>').join('') + '</div>';
  }
  // Mail : reçus et envoyés, du plus récent au plus ancien ; une pièce jointe s'ouvre comme un PDF.
  function mailApp() {
    const box = nav.box || 'in', all = D.mail || [];
    const list = all.map((m, i) => ({ m, i })).filter(o => (o.m.box || 'in') === box);
    const who = m => m.box === 'sent' ? 'À : ' + (m.to || '') : m.from || m.addr || '';
    if (nav.view === 'att') {
      const m = all[nav.i], a = (m.att || [])[nav.att] || {};
      return hd(a.n || '') + '<div class="body"><div class="ml-pdf' + (nav.zoom ? ' zoom' : '') + '" data-act="zoom">' + (a.html || esc(a.n || '')) + '</div></div>';
    }
    if (nav.view === 'item') {
      const m = all[nav.i];
      return hd('') + '<div class="body"><div class="ml-v"><h2>' + esc(m.subj || '(Sans objet)') + '</h2>' +
        '<div class="ml-from"><i class="av-l">' + esc(ini(m.box === 'sent' ? (m.to || '') : (m.from || m.addr || ''))) + '</i><div><b>' + esc(m.box === 'sent' ? 'Moi' : (m.from || m.addr || '')) + '</b>' +
        (m.addr && m.box !== 'sent' ? '<small>' + esc(m.addr) + '</small>' : '') + (m.to ? '<small>À : ' + esc(m.to) + '</small>' : '') + '</div><span>' + esc(longDay(m.d)) + (m.d.length > 10 ? ' · ' + m.d.slice(11, 16) : '') + '</span></div>' +
        '<div class="ml-body">' + esc(m.body || '').replace(/\n/g, '<br>') + '</div>' +
        (m.att || []).map((a, k) => '<div class="ml-att" data-act="att" data-i="' + k + '"><i>PDF</i><div><b>' + esc(a.n) + '</b><small>' + esc(a.sz || 'Document PDF') + '</small></div></div>').join('') + '</div></div>';
    }
    return hd(box === 'sent' ? 'Envoyés' : 'Réception') + '<div class="seg"><span class="' + (box === 'in' ? 'on' : '') + '" data-act="mailbox" data-v="in">Reçus</span><span class="' + (box === 'sent' ? 'on' : '') + '" data-act="mailbox" data-v="sent">Envoyés</span></div>' +
      '<div class="body">' + (list.length ? list.map(o => '<div class="item ml" data-act="view" data-i="' + o.i + '">' + (o.m.unread ? '<em class="ml-dot"></em>' : '') +
        '<b>' + esc(who(o.m)) + '<span>' + callWhen(o.m.d) + ' ›</span></b><div class="ml-s">' + esc(o.m.subj || '(Sans objet)') + (o.m.att && o.m.att.length ? ' 📎' : '') + '</div>' +
        '<small>' + esc((o.m.body || '').replace(/\s+/g, ' ')) + '</small></div>').join('') : '<div class="foot">Aucun message</div>') + '</div>';
  }
  // Première lettre soulignée dans les titres de notes (signale l'acrostiche SOUVIENS, sur le tél. 1 seulement).
  function ul(t) { return '<u>' + esc(t.charAt(0)) + '</u>' + esc(t.slice(1)); }
  const nt = x => x.ul ? ul(x.t) : esc(x.t);
  // Date d'une note dans la liste : l'heure si elle est du jour, sinon le jour (comme sur iPhone).
  const ntWhen = x => (!x.d || x.d === CLOCK[2]) ? x.h : x.d.slice(8) + '/' + x.d.slice(5, 7);
  // Pièce jointe verrouillée d'Ethel : le mot de passe est « qui je suis » (moi, Théo, Théo Lenoir).
  // Ouverte, elle ne dit que « c'est moi » : le quatrième mot, marqué de sa lune.
  function lockBub(m) {
    if (S.ana) return '<div class="bub in lockb"><small>🔓 ' + mk(4) + ' pièce jointe</small>c\'est moi</div>';
    return '<div class="bub in lockb" data-act="lockopen"><small>🔒 ' + mk(4) + ' pièce jointe verrouillée</small>' + esc(m[1]) +
      (nav.lock ? '<input type="text" placeholder="mot de passe" autocapitalize="off" autocorrect="off"><button class="go alt" data-act="anagram">Ouvrir</button><span class="bad">' + esc(msg) + '</span>' : '') + '</div>';
  }
  function renderApp() {
    const n = nav;
    if (n.app === 'notes') {
      if (n.view === 'item') { const x = D.notes[n.i]; return hd('') + '<div class="body"><div class="paper"><span class="nt-d">' + (x.d ? longDay(x.d) + ' · ' : '') + x.h + '</span><h3>' + nt(x) + ' ' + mk(x.mk) + '</h3>' + esc(x.b) + '</div></div>'; }
      const key = x => (x.d || CLOCK[2]) + ' ' + x.h;
      const list = D.notes.map((x, i) => ({ x, i })).sort((a, b) => key(b.x).localeCompare(key(a.x)));
      return hd('Notes') + '<div class="body"><div class="grp">' + list.map(o => '<div class="item" data-act="view" data-i="' + o.i + '"><b>' + nt(o.x) + ' ' + mk(o.x.mk) + '</b><small><span>' + ntWhen(o.x) + '</span>' + esc(o.x.b.split('\n')[0]) + '</small></div>').join('') + '</div><div class="foot">' + D.notes.length + ' notes</div></div>';
    }
    if (n.app === 'msg') {
      if (n.view === 'card') {
        const t = D.th[n.i];
        return hd('Contact') + '<div class="body">' + (t.av ? '<div class="av">' + t.av + '</div>' : '') + '<div class="cardx"><b>' + esc(nm(t)) + '</b><small>' + esc(t.num || 'Numéro masqué') + '</small></div></div>';
      }
      if (n.view === 'item') {
        const t = D.th[n.i];
        return '<div class="hd"><button data-act="back">‹</button><span data-act="card" style="cursor:pointer;display:flex;align-items:center;gap:8px">' + (t.av ? '<i class="av-s">' + t.av + '</i>' : '') + esc(nm(t)) + ' ⓘ</span></div><div class="body">' + (t.m[0] && t.m[0][0] === 'day' ? '' : '<div class="tm">' + t.h + '</div>') + t.m.map(m => m[0] === 'day' ? '<div class="tm">' + esc(m[1]) + '</div>' : m[0] === 'lock' ? lockBub(m) : '<div class="bub ' + m[0] + '">' + (m[2] ? '<span class="au">' + esc(m[2]) + '</span>' : '') + esc(m[1]) + '</div>').join('') + '</div>';
      }
      return hd('Messages') + '<div class="body">' + D.th.map((t, i) => '<div class="item mi" data-act="view" data-i="' + i + '"><i class="av-l">' + (t.av || esc(ini(nm(t)))) + '</i><div><b>' + esc(nm(t)) + '<span>' + t.h + ' ›</span></b><small>' + esc((t.m.filter(m => m[0] !== 'day').pop() || ['', ''])[1]) + '</small></div></div>').join('') + '</div>';
    }
    if (n.app === 'photos') {
      const roll = D.roll || [];
      if (n.view === 'item') {
        // Les vraies photos s'agrandissent d'un appui (le zoom du navigateur est bloqué).
        if (n.i < 0) return hd('') + '<div class="body"><div class="scene s-img' + (n.zoom ? ' zoom' : '') + '" data-act="zoom"><img src="' + roll[-1 - n.i] + '" alt=""></div></div>';
        const x = D.ph[n.i];
        return hd(x.c) + '<div class="body"><div class="scene ' + x.cls + (n.zoom ? ' zoom' : '') + '"' + (x.cls === 's-img' ? ' data-act="zoom"' : '') + '>' + x.html + '</div></div>';
      }
      // La pellicule d'abord, puis les photos de l'histoire, sans case vide de remplissage.
      const fill = roll.map((u, i) => '<div class="th" data-act="view" data-i="' + (-1 - i) + '"><img src="' + u + '" alt="" loading="lazy"></div>').join('');
      return hd('Photos') + '<div class="body"><div class="grid">' + fill + D.ph.map((x, i) => '<div class="th" data-act="view" data-i="' + i + '"><div class="mini scene ' + x.cls + '">' + x.html + '</div></div>').join('') + '</div><div class="foot">' + D.total + ' photos</div></div>';
    }
    if (n.app === 'dicta') {
      if (n.view === 'item') {
        const x = D.memos[n.i];
        const more = '<button class="vm-more" data-act="vmore">⋯</button></div>';
        const sheet = n.more ? '<div class="sheet" data-act="vmore"><div>' + ['Partager', 'Modifier l\'enregistrement', 'Dupliquer', 'Afficher le spectre', 'Copier la transcription'].map(t => '<span data-act="' + (t === 'Afficher le spectre' ? 'spectro' : 'vnone') + '">' + t + '</span>').join('') + '<span class="del" data-act="vnone">Supprimer</span></div><div><span data-act="vmore"><b>Annuler</b></span></div></div>' : '';
        return hd('').replace(/<\/div>$/, more) + sheet + '<div class="body"><div class="vm-h"><b>' + esc(x.n) + '</b><small>' + CLOCK[0] + ' · ' + x.h + '</small></div><div class="wave">' + wave(x.n) + '</div><div class="vm-t"><span>0:00</span><span>-' + x.d + '</span></div><div class="vm-c"><span>↺</span><b' + (x.a ? ' data-act="vplay" style="cursor:pointer"' : '') + '>' + (player && !player.paused ? '❚❚' : '▶') + '</b><span>↻</span></div><div class="cardx tr"><small>Transcription</small>' + esc(x.x) + '</div>' +
          (n.spec ? '<div class="cardx spec"><small>Spectre · 0 – 20 kHz' + (x.sp ? ' ' + mk(2) : '') + '</small><canvas id="cv" width="300" height="150"></canvas><div class="axis"><span>20 kHz</span><span>temps →</span><span>0</span></div>' +
            '<label class="seuil"><span>Seuil</span><input id="seuil" type="range" min="0" max="100" value="' + (n.seuil || 0) + '"></label></div>' : '') + '</div>';
      }
      return hd('Dictaphone') + '<div class="body">' + (D.memos.length ? D.memos.map((x, i) => '<div class="item" data-act="view" data-i="' + i + '"><b>' + esc(x.n) + '</b><small><span>' + x.h + '</span><span>' + x.d + '</span></small></div>').join('') : '<div class="foot">Aucun enregistrement</div>') + '</div>';
    }
    if (n.app === 'cal') return calApp();
    if (n.app === 'tel') return telApp();
    if (n.app === 'bank') return bankApp();
    if (n.app === 'mail') return mailApp();
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
  // Spectre : chaque point a une énergie e et un grain g (bruit fixe, tiré une fois). On affiche le grain
  // des points dont l'énergie dépasse le seuil. À 0, tout est du bruit uniforme ; en montant le seuil,
  // le bruit s'éteint et seul le mot caché (énergie plus forte) reste allumé.
  function spectro(c, text, seuil) {
    const x = c.getContext('2d'), w = c.width, h = c.height;
    let r = 12345; const rnd = () => (r = (r * 16807) % 2147483647) / 2147483647;
    let td = null;
    if (text) {
      const t = document.createElement('canvas'); t.width = w; t.height = h;
      const tx = t.getContext('2d');
      tx.fillStyle = '#000'; tx.fillRect(0, 0, w, h); tx.fillStyle = '#fff'; tx.font = 'bold 66px sans-serif'; tx.textAlign = 'center'; tx.fillText(text, w / 2, h * .46);
      td = tx.getImageData(0, 0, w, h).data;
    }
    const th = seuil / 100, img = x.createImageData(w, h);
    for (let i = 0; i < w * h; i++) {
      const y = Math.floor(i / w), g = 0.35 + rnd() * 0.65, hot = rnd() < 0.015;
      const e = rnd() * 0.75 + (hot ? 0.3 : 0) + (td && td[i * 4] > 128 ? 0.45 : 0);
      const b = e > th * 0.95 ? (20 + g * 60 + (1 - y / h) * 14) : 4;
      img.data[i * 4] = b * .4; img.data[i * 4 + 1] = b * .9; img.data[i * 4 + 2] = b * 2.2; img.data[i * 4 + 3] = 255;
    }
    x.putImageData(img, 0, 0);
  }
  function toast(t) {
    let x = $('toast');
    if (!x) { x = document.createElement('div'); x.id = 'toast'; $('phone').appendChild(x); }
    x.textContent = t;
    x.className = 'show';
    clearTimeout(toastT);
    toastT = setTimeout(() => { x.className = ''; }, 1800);
  }
  // ---------- Fin du jeu ----------
  // Plein écran de nuit par-dessus tout le téléphone : écran 1, écran 2, la question, puis la fin choisie.
  // S.fin = ce que renvoie le serveur pour « final », S.fs = l'écran affiché, S.end = la fin choisie (définitive).
  // Espaces insécables de la typographie française : jamais de « ou de : seul en bout de ligne.
  const fr = t => esc(t).replace(/ ([:;?!»%])/g, '\u00a0$1').replace(/« /g, '«\u00a0');
  const fx = d => ' class="fx" style="animation-delay:' + d.toFixed(1) + 's"';
  const paras = (b, d0, lead) => b.split('\n\n').map((p, i) => {
    let h = fr(p).replace(/\n/g, '<br>');
    if (lead) h = h.replace(/^([A-ZÀ-Ÿa-zà-ÿ]+)\. /, '<b>$1.</b> ');
    return '<p' + fx(d0 + i * 1.1) + '>' + h + '</p>';
  });
  const LOCK_OPEN = '<svg viewBox="0 0 24 24"><rect x="4.5" y="10.5" width="15" height="10" rx="2.5"/><path d="M8 10.5V7a4 4 0 0 1 7.6-1.7"/><circle cx="12" cy="15.5" r="1.3"/></svg>';
  function fin() {
    const el = $('fin');
    if (!S.fin && !S.end) { el.className = ''; el.innerHTML = ''; return; }
    const n = S.fin ? S.fin.ecrans.length : 2, step = S.end ? n + 1 : Math.min(S.fs || 0, n);
    let h, p;
    if (S.end) {
      p = paras(S.end.b, 1.6);
      const d = 1.6 + p.length * 1.1;
      h = '<div class="fin-k fx" style="animation-delay:.3s">Votre choix</div>' +
        '<h2 class="fin-h2 fx" style="animation-delay:.8s">' + fr(S.end.l) + '</h2>' +
        '<div class="fin-card">' + p.join('') + '</div>' +
        '<div class="fin-m fx" style="animation-delay:' + (d + 0.6).toFixed(1) + 's"><i></i><p>' + fr(S.end.m) + '</p></div>' +
        '<div class="fin-end fx" style="animation-delay:' + (d + 2).toFixed(1) + 's"><span class="fin-orb sm"></span>Fin</div>';
    } else if (step < n) {
      const x = S.fin.ecrans[step];
      if (step === 0) {
        p = paras(x.b, 2.4);
        h = '<div class="fin-orb fx" style="animation-delay:.2s"></div>' +
          '<h1 class="fin-h1 fx" style="animation-delay:.7s">Bravo, vous avez résolu l\'enquête de Théo Lenoir\u00a0!</h1>' +
          '<div class="fin-pill fx" style="animation-delay:1.5s"><i></i>' + fr(x.t) + '</div>';
      } else {
        p = paras(x.b, 1.4, true);
        h = '<div class="fin-ic fx" style="animation-delay:.2s">' + LOCK_OPEN + '</div>' +
          '<div class="fin-t fx" style="animation-delay:.6s">' + fr(x.t) + '</div>';
      }
      const d = (step === 0 ? 2.4 : 1.4) + p.length * 1.1;
      h += '<div class="fin-card">' + p.join('') + '</div><div class="fin-go fx" style="animation-delay:' + (d + 0.4).toFixed(1) + 's">Toucher pour continuer</div>';
    } else {
      h = '<div class="fin-q"><h2 class="fin-h2 fx" style="animation-delay:.5s">' + fr(S.fin.question) + '</h2><p class="fx" style="animation-delay:1.4s">' + fr(S.fin.consigne) + '</p>' +
        '<div class="fin-ch">' + S.fin.choix.map((c, i) => '<button class="fx" style="animation-delay:' + (2.3 + i * 0.35).toFixed(2) + 's" data-fin="' + esc(c.k) + '">' + fr(c.l) + '</button>').join('') + '</div></div>';
    }
    el.className = 'on';
    // Retour à l'écran précédent tant que le choix n'est pas fait (le choix, lui, est définitif).
    el.innerHTML = '<div class="fin-sky"></div>' + (!S.end && step > 0 ? '<button class="fin-back" data-fin="back" aria-label="Écran précédent">‹</button>' : '') +
      '<div class="fin-in" data-fin="next"><div class="fin-col">' + h + '</div></div>' +
      '<div class="fin-dots">' + Array.from({ length: n + 2 }, (_, i) => '<i class="' + (i === step ? 'on' : i < step ? 'done' : '') + '"></i>').join('') + '</div>';
  }
  let finBusy = false;
  async function finAct(k) {
    const box = $('fin').querySelector('.fin-in');
    if (k === 'next') {
      // Premier appui : tout le texte apparaît d'un coup ; appui suivant : écran suivant.
      if (!box.classList.contains('all')) { box.classList.add('all'); return; }
      if (S.end || !S.fin || (S.fs || 0) >= S.fin.ecrans.length) return;
      S.fs = (S.fs || 0) + 1; save(); push(); fin(); return;
    }
    if (k === 'back') { if (hdepth > 0) history.back(); else goBack(); return; }
    if (finBusy || S.end) return;
    finBusy = true;
    $('fin').querySelectorAll('button').forEach(b => { b.disabled = true; b.classList.toggle('sel', b.dataset.fin === k); });
    const r = await check('choix', k);
    finBusy = false;
    if (r && r.j.ok && r.j.fin) { S.end = r.j.fin; save(); }
    else $('fin').querySelectorAll('button').forEach(b => { b.disabled = false; b.classList.remove('sel'); });
    fin();
  }
  async function won(f) {
    S.win = true; S.fin = f; S.fs = S.fs || 0;
    // Page rechargée ou autre appareil : le choix est déjà fait, on va droit à la fin.
    if (f.deja) { const r = await check('choix', f.deja); if (r && r.j.ok && r.j.fin) S.end = r.j.fin; }
    save(); fin();
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
        '<div class="wid"><div class="w-cal" data-act="open" data-app="cal"><small>' + day[0].toUpperCase() + '</small><b>' + day[1] + '</b><span>' + day[2] + '</span></div>' +
        '<div class="w-ser" data-act="open" data-app="sereni"><i>' + SVG_MOON + '</i><small>Sérénité</small><b>' + (D.close ? 'Séance de clôture' : SER.hero[0]) + '</b><span>' + (D.close ? 'Cette nuit, 2 h 30' : SER.hero[1]) + '</span></div></div>' +
        '<div class="icons">' + [['cal', 'Calendrier'], ['notes', 'Notes'], ['photos', 'Photos'], ['dicta', 'Dictaphone'], ['mail', 'Mail'], ['bank', 'Banque']].map(ic).join('') + '</div>' +
        '<div class="pdots"><i class="on"></i><i></i></div><div class="dock">' + [['tel', 'Téléphone'], ['msg', 'Messages'], ['sereni', 'Sérénité'], ['set', 'Réglages']].map(ic).join('') + '</div></div>';
    } else {
      el.innerHTML = sb() + '<div class="app' + (ser ? ' ser' : ' a-' + nav.app + (!nav.view || nav.view === 'list' ? ' lv' : '')) + '">' + renderApp() + '</div><div class="hbar" data-act="home"></div>';
    }
    const cv = $('cv'); if (cv) spectro(cv, D.memos[nav.i] && D.memos[nav.i].sp ? S.sp : '', nav.seuil || 0);
    refreshCd();
  }

  // ---------- Retour ----------
  // Chaque écran ouvert (appli, note, conversation, photo, séance…) ajoute une entrée à l'historique du navigateur.
  // Le bouton ‹ de l'appli, le bouton retour d'Android et le geste de retour de Safari font donc tous la même chose :
  // revenir d'un écran, sans jamais quitter le jeu tant qu'on n'est pas sur l'écran d'accueil.
  let hdepth = 0, popSkip = 0;
  function push() { hdepth++; try { history.pushState({ d: hdepth }, ''); } catch (e) {} }
  function goBack() {
    const n = nav;
    if (S.fin && !S.end && (S.fs || 0) > 0 && $('fin').className === 'on') { S.fs--; save(); fin(); return; }
    if (n.app === 'admin') nav = { app: 'sereni', view: 'list' };
    else if (n.app === 'msg' && n.view === 'card') n.view = 'item';
    else if (n.app === 'mail' && n.view === 'att') n.view = 'item';
    else if (n.app === 'cal' && n.list) n.list = false;
    else if (n.view && n.view !== 'list') n.view = 'list';
    else nav = { app: null };
    if (player) { player.pause(); player = null; }
    if (music && !music.paused && !(nav.app === 'sereni' && nav.view === 'play')) music.pause();
    draw();
  }
  function goHome() {
    nav = { app: null };
    if (player) { player.pause(); player = null; }
    if (music && !music.paused) music.pause();
    if (hdepth > 0) { popSkip = 1; const d = hdepth; hdepth = 0; try { history.go(-d); } catch (e) {} }
    draw();
  }
  try { history.replaceState({ d: 0 }, ''); } catch (e) {}
  window.addEventListener('popstate', e => {
    const d = (e.state && e.state.d) || 0;
    if (popSkip) { popSkip = 0; hdepth = d; return; }
    if (d < hdepth && D) { hdepth = d; goBack(); } else hdepth = d;
  });

  // ---------- Actions ----------
  // Curseur Seuil du spectre : on redessine seulement le canvas.
  document.addEventListener('input', e => {
    if (e.target.id !== 'seuil') return;
    nav.seuil = +e.target.value;
    const cv = $('cv'); if (cv) spectro(cv, D.memos[nav.i] && D.memos[nav.i].sp ? S.sp : '', nav.seuil);
  });
  document.addEventListener('click', async e => {
    const f = e.target.closest('[data-fin]');
    if (f) { finAct(f.dataset.fin); return; }
    const k = e.target.closest('[data-k]');
    if (k && $('lmsg')) { padKey(k.dataset.k); return; }
    const el = e.target.closest('[data-act]');
    if (!el || !D) return;
    const a = el.dataset.act, n = nav;
    const inp = $('screen').querySelector('input');
    const val = inp ? inp.value : '';
    msg = '';
    if (a === 'home') { goHome(); return; }
    if (a === 'back') { if (hdepth > 0) history.back(); else goBack(); return; }
    if (player && a === 'open') { player.pause(); player = null; }
    if (a === 'vplay') {
      const x = D.memos[n.i];
      if (!player) { player = new Audio(x.a); player.onended = () => { player = null; draw(); }; }
      if (player.paused) player.play().catch(() => {}); else player.pause();
    }
    else if (a === 'open') { nav = { app: el.dataset.app, view: 'list', i: 0, tab: 'journal' }; push(); }
    else if (a === 'view') { n.view = 'item'; n.i = +el.dataset.i; n.zoom = false; push(); }
    else if (a === 'zoom') { n.zoom = !n.zoom; }
    else if (a === 'card') { n.view = 'card'; push(); }
    else if (a === 'lockopen') { if (n.lock) return; n.lock = true; }
    else if (a === 'logo') {
      taps++;
      if (taps >= 7) { taps = 0; devOk = false; toast('Vous êtes maintenant en mode développeur.'); nav = { app: 'admin', view: 'main', tab: 'journal' }; push(); }
      else if (taps >= 3) { toast('Encore ' + (7 - taps) + ' appui' + (7 - taps > 1 ? 's' : '') + ' pour passer en mode développeur.'); return; }
      else return;
    }
    else if (a === 'calday') n.sel = el.dataset.d;
    else if (a === 'calmo') { const t = dOf(CLOCK[2]); n.mo = Math.min(11, Math.max(9, (n.mo != null ? n.mo : t.getMonth()) + +el.dataset.m)); }
    else if (a === 'callist') { if (n.list) { if (hdepth > 0) { history.back(); return; } n.list = false; } else { n.list = true; push(); } }
    else if (a === 'telmiss') n.miss = el.dataset.v === '1';
    else if (a === 'mailbox') { n.box = el.dataset.v; n.view = 'list'; }
    else if (a === 'att') { n.view = 'att'; n.att = +el.dataset.i; n.zoom = false; push(); }
    else if (a === 'callgrp') { n.grp = n.grps[+el.dataset.i]; n.view = 'item'; push(); }
    else if (a === 'dev') { devOk = false; nav = { app: 'admin', view: 'main', tab: 'journal' }; push(); }
    else if (a === 'stab') { n.tab = el.dataset.t; n.view = 'list'; }
    else if (a === 'play') { n.view = 'play'; n.prog = el.dataset.p; S.pause = false; musicFor(el.dataset.m); push(); }
    else if (a === 'pause') { S.pause = !S.pause; if (music) { if (S.pause) music.pause(); else music.play().catch(() => {}); } }
    else if (a === 'mood') { S.mood = S.mood === el.dataset.m ? '' : el.dataset.m; save(); }
    else if (a === 'tab') n.tab = el.dataset.t;
    else if (a === 'adminlogin') {
      const r = await check('admin', val);
      if (r && r.j.ok) { S.adm = r.j.data; devOk = true; save(); } else if (r) msg = r.j.error || 'Mot de passe incorrect.';
    }
    else if (a === 'doslogin') {
      const r = await check('dossier', val);
      if (r && r.j.ok) { S.dos = r.j.data; save(); } else if (r) msg = r.j.error || 'Mot de passe incorrect.';
    }
    else if (a === 'neutral') {
      fw = Array.from($('screen').querySelectorAll('.ser-words input')).map(i => i.value.trim());
      const r = await check('final', fw.join(' '));
      if (r && r.j.ok) { if (r.j.fin) await won(r.j.fin); else { S.win = true; save(); } } else if (r) msg = r.j.error || 'Rémanence insuffisante.';
    }
    else if (a === 'anagram') {
      const r = await check('anagram', val);
      if (r && r.j.ok) { S.ana = true; n.lock = false; save(); } else if (r) msg = r.j.error || 'Mot de passe incorrect.';
    }
    else if (a === 'vmore') { n.more = !n.more; }
    else if (a === 'vnone') { n.more = false; toast('Indisponible pendant la séance de test.'); }
    else if (a === 'spectro') {
      n.more = false; n.spec = true; n.seuil = 0;
      if (D.memos[n.i] && D.memos[n.i].sp && !S.sp) { const r = await check('spectro'); if (r && r.j.ok) { S.sp = r.j.text; save(); } }
    }
    if (music && !music.paused && !(nav.app === 'sereni' && nav.view === 'play')) music.pause();
    if (D) draw();
  });

  // ---------- Accueil (ouvert dans le navigateur) ----------
  // Avant l'installation sur l'écran d'accueil : titre du jeu + marche à suivre pour le plein écran.
  const installed = () => navigator.standalone === true || ['standalone', 'fullscreen'].some(m => matchMedia('(display-mode: ' + m + ')').matches);
  const SHARE_IC = '<svg viewBox="0 0 24 24" width="15" height="15"><path d="M12 3v12M7.5 7.5 12 3l4.5 4.5M6 11H5v10h14V11h-1" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  function intro() {
    const android = /android/i.test(navigator.userAgent);
    const ios = '<div class="in-c' + (android ? '' : ' on') + '"><b>iPhone</b><ol><li>Ouvrez ce lien dans <em>Safari</em></li><li>Touchez Partager ' + SHARE_IC + '</li><li>Choisissez <em>Sur l\'écran d\'accueil</em></li><li>Ouvrez l\'icône <em>Théo ' + N + '</em></li></ol></div>';
    const and = '<div class="in-c' + (android ? ' on' : '') + '"><b>Android</b><ol><li>Ouvrez ce lien dans <em>Chrome</em></li><li>Touchez le menu ⋮</li><li>Choisissez <em>Installer l\'appli</em> ou <em>Ajouter à l\'écran d\'accueil</em></li><li>Ouvrez l\'icône <em>Théo ' + N + '</em></li></ol></div>';
    $('screen').className = 'screen';
    $('screen').innerHTML = '<div class="intro">' + wall(N) + '<div class="in-in"><div class="in-k">Téléphone ' + N + '</div><h1>Bienvenue sur le téléphone de Théo.</h1>' +
      '<ul class="in-r"><li>Ce jeu est coopératif : chacun a un téléphone, parlez-vous et comparez vos écrans.</li><li>Il n\'y a pas de limite de temps.</li><li>L\'utilisation d\'internet est autorisée.</li><li>En cas de blocage, les maîtres du jeu sont là.</li></ul>' +
      '<p>Pour jouer en plein écran, comme sur un vrai téléphone, installez-le d\'abord sur votre écran d\'accueil.</p>' + (android ? and + ios : ios + and) +
      '<button class="in-skip" data-intro="1">Continuer dans le navigateur</button></div></div>';
  }

  // ---------- Démarrage ----------
  document.addEventListener('click', e => { if (e.target.closest('[data-intro]')) { S.intro = 1; save(); boot(); } });
  (async function () {
    if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
    if (!installed() && !S.intro) intro(); else boot();
  })();
  async function boot() {
    if (S.sess) {
      try {
        const r = await api('/api/phone/' + N);
        if (r.ok) { start(r.j); return; }
        if (r.status === 401) { S.sess = ''; save(); }
      } catch (e) {}
    }
    lock();
  }
})();
