'use strict';
// Serveur du jeu « Le téléphone de Théo ». Aucune dépendance : Node 18+ suffit.
//   node server.js        puis ouvrir  http://localhost:3000/gm?token=lykson
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const { phones, MQ, NUM, SECRETS, FIN } = require('./data');
const config = require('./config');

const PORT = +process.env.PORT || 3000;
const PUB = path.join(__dirname, 'public');
const PRIV = path.join(__dirname, 'private');
const PHONES = [1, 2, 3, 4];

try { require('./make-icons').ensure(PUB); } catch (e) { console.error('Icônes non créées :', e.message); }

const norm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z]/g, '').toUpperCase();
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.png': 'image/png', '.mp3': 'audio/mpeg', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.json': 'application/json', '.webmanifest': 'application/manifest+json'
};

const state = {
  deadline: null,
  clients: { 1: new Set(), 2: new Set(), 3: new Set(), 4: new Set() },
  gm: new Set(),
  log: [],
  // Fin : énigme finale trouvée, puis choix commun des joueurs (un seul, définitif).
  won: false,
  choix: null,
  tries: new Map()
};

function json(res, code, obj) {
  res.writeHead(code, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
  res.end(JSON.stringify(obj));
}
function readBody(req) {
  return new Promise((ok, ko) => {
    let b = '';
    req.on('data', c => { b += c; if (b.length > 20000) { req.destroy(); ko(new Error('trop gros')); } });
    req.on('end', () => { try { ok(b ? JSON.parse(b) : {}); } catch (e) { ko(e); } });
    req.on('error', ko);
  });
}
const clientIp = req => String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
function limited(key, max, windowMs) {
  const now = Date.now();
  const a = (state.tries.get(key) || []).filter(t => now - t < windowMs);
  a.push(now);
  state.tries.set(key, a);
  return a.length > max;
}
// Jeton de session d'un téléphone : signé, donc toujours valable après un redémarrage du serveur
// (Railway redéploie à chaque fusion ; avant, les joueurs retombaient sur l'écran verrouillé en pleine partie).
const SESS_SECRET = process.env.SESSION_SECRET || config.gmToken + '|' + PHONES.map(n => config.lockCodes[n]).join('|');
const sessTok = n => crypto.createHmac('sha256', SESS_SECRET).update('session:' + n).digest('hex');
function authPhone(req, u) {
  const s = String(req.headers['x-session'] || u.searchParams.get('s') || '');
  for (const n of PHONES) {
    const t = sessTok(n);
    if (s.length === t.length && crypto.timingSafeEqual(Buffer.from(s), Buffer.from(t))) return n;
  }
  return 0;
}
const gmOK = (req, u) => (req.headers['x-gm-token'] || u.searchParams.get('token')) === config.gmToken;

function addLog(e) {
  e.t = new Date().toISOString();
  state.log.push(e);
  if (state.log.length > 300) state.log.shift();
  for (const r of state.gm) r.write('event: log\ndata: ' + JSON.stringify(e) + '\n\n');
}
function sse(res) {
  res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-cache', connection: 'keep-alive', 'x-accel-buffering': 'no' });
  res.write('retry: 3000\n\n');
}
function toPhones(target, evt) {
  const list = target === 'all' ? PHONES : [+target];
  let n = 0;
  for (const p of list) for (const r of state.clients[p]) { r.write('data: ' + JSON.stringify(evt) + '\n\n'); n++; }
  return n;
}
const stateEvt = () => ({ type: 'state', deadline: state.deadline, now: Date.now() });
// Fin déjà trouvée (page rechargée, autre téléphone) : elle part avec les données, pour s'afficher sur les quatre.
const finPub = () => ({ ecrans: FIN.ecrans, question: FIN.question, consigne: FIN.consigne, choix: FIN.choix.map(c => ({ k: c.k, l: c.l })), deja: state.choix });
const pub = n => Object.assign({}, phones[n].public, { n, num: NUM, mq: MQ, deadline: state.deadline }, state.won ? { fin: finPub() } : {});

function lanIPs() {
  const out = [];
  const ifs = os.networkInterfaces();
  for (const k of Object.keys(ifs)) for (const a of ifs[k] || []) if (a.family === 'IPv4' && !a.internal) out.push(a.address);
  return out;
}

function sendFile(res, file, type, cache) {
  fs.readFile(file, (e, d) => {
    if (e) { res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }); return res.end('Introuvable'); }
    res.writeHead(200, { 'content-type': type, 'cache-control': cache || 'no-cache' });
    res.end(d);
  });
}
function page(res, n) {
  fs.readFile(path.join(PUB, 'index.html'), 'utf8', (e, t) => {
    if (e) { res.writeHead(500); return res.end('index.html manquant'); }
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-cache' });
    res.end(t.replace(/__N__/g, n));
  });
}
// Sons (musiques de Sérénité, vocaux) : Safari sur iPhone exige les requêtes partielles (Range) pour lire un fichier audio.
const AUDIO = { '.mp3': 'audio/mpeg', '.m4a': 'audio/mp4' };
function sendAudio(req, res, file, type) {
  fs.stat(file, (e, st) => {
    if (e || !st.isFile()) { res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }); return res.end('Introuvable'); }
    const h = { 'content-type': type, 'accept-ranges': 'bytes', 'cache-control': 'public, max-age=3600' };
    const m = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || '');
    if (!m || (!m[1] && !m[2])) { res.writeHead(200, { ...h, 'content-length': st.size }); return fs.createReadStream(file).pipe(res); }
    let a = m[1] ? +m[1] : Math.max(0, st.size - +m[2]);
    let b = m[1] && m[2] ? Math.min(+m[2], st.size - 1) : st.size - 1;
    if (a > b || a >= st.size) { res.writeHead(416, { 'content-range': 'bytes */' + st.size }); return res.end(); }
    res.writeHead(206, { ...h, 'content-range': 'bytes ' + a + '-' + b + '/' + st.size, 'content-length': b - a + 1 });
    fs.createReadStream(file, { start: a, end: b }).pipe(res);
  });
}
function serveStatic(req, res, p) {
  const f = path.normalize(path.join(PUB, p));
  if (!f.startsWith(PUB + path.sep)) { res.writeHead(403); return res.end(); }
  const ext = path.extname(f);
  if (AUDIO[ext]) return sendAudio(req, res, f, AUDIO[ext]);
  sendFile(res, f, MIME[ext] || 'application/octet-stream');
}

const ERR = {
  admin: 'Mot de passe incorrect.',
  dossier: 'Mot de passe incorrect.',
  anagram: 'Mot de passe incorrect.',
  final: 'Rémanence insuffisante. Séquence refusée.',
  choix: 'Choix indisponible.',
  spectro: 'Rien à analyser.'
};

const server = http.createServer(async (req, res) => {
  try {
    const u = new URL(req.url, 'http://x');
    const p = u.pathname;
    let m;

    // ----- Pages et fichiers -----
    if ((m = p.match(/^\/t\/([1-4])\/?$/))) return page(res, m[1]);
    if (p === '/') { res.writeHead(200, { 'content-type': 'text/plain; charset=utf-8' }); return res.end('Sérénité'); }
    if (p === '/gm') {
      if (!gmOK(req, u)) { res.writeHead(401, { 'content-type': 'text/plain; charset=utf-8' }); return res.end('Accès réservé aux game masters.'); }
      return sendFile(res, path.join(PRIV, 'gm.html'), MIME['.html']);
    }
    if ((m = p.match(/^\/manifest-([1-4])\.webmanifest$/))) {
      res.writeHead(200, { 'content-type': MIME['.webmanifest'], 'cache-control': 'no-cache' });
      return res.end(JSON.stringify({
        name: 'Téléphone de Théo (' + m[1] + ')', short_name: 'Théo ' + m[1], start_url: '/t/' + m[1], scope: '/',
        display: 'standalone', orientation: 'portrait', background_color: '#05070d', theme_color: '#05070d',
        icons: [{ src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }, { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' }]
      }));
    }

    // ----- API joueurs -----
    if (p === '/api/unlock' && req.method === 'POST') {
      const b = await readBody(req);
      const n = +b.phone;
      if (!PHONES.includes(n)) return json(res, 400, { error: 'Téléphone inconnu' });
      if (limited('u' + clientIp(req) + n, 8, 60000)) return json(res, 429, { error: 'Trop d\'essais. Patientez une minute.' });
      const ok = String(b.code) === config.lockCodes[n];
      addLog({ phone: n, kind: 'lock', ok, v: ok ? '' : String(b.code || '').slice(0, 4) });
      if (!ok) return json(res, 401, { error: 'Code incorrect' });
      return json(res, 200, { session: sessTok(n), data: pub(n) });
    }
    if ((m = p.match(/^\/api\/phone\/([1-4])$/))) {
      const n = +m[1];
      if (authPhone(req, u) !== n) return json(res, 401, { error: 'Session expirée' });
      return json(res, 200, pub(n));
    }
    if (p === '/api/check' && req.method === 'POST') {
      const b = await readBody(req);
      const n = +b.phone;
      const s = authPhone(req, u);
      if (!s || s !== n) return json(res, 401, { error: 'Session expirée' });
      if (limited('c' + (req.headers['x-session'] || ''), 40, 60000)) return json(res, 429, { error: 'Trop d\'essais. Patientez un instant.' });
      const kind = String(b.kind);
      const v = norm(b.value);
      let ok = false;
      const out = {};
      if (kind === 'admin') { ok = v === SECRETS.admin; if (ok) out.data = phones[n].admin; }
      else if (kind === 'dossier') {
        ok = !!phones[n].dossier && SECRETS.dossier.includes(v);
        if (ok) out.data = phones[n].dossier;
        else if (v.startsWith(SECRETS.dossierLatin)) out.error = 'Mot de passe incorrect. Langue du compte : français.';
      }
      else if (kind === 'anagram') { ok = n === 4 && SECRETS.anagram.includes(v); }
      else if (kind === 'final') {
        ok = SECRETS.final.includes(v);
        // La fin s'affiche en même temps sur les quatre téléphones.
        if (ok) { state.won = true; out.fin = finPub(); toPhones('all', { type: 'fin', fin: out.fin }); }
      }
      else if (kind === 'choix') {
        const c = FIN.choix.find(x => x.k === (state.choix || v));
        // Le choix n'est proposé qu'après la fin trouvée ; si le serveur a redémarré entre les deux, on l'accepte quand même.
        ok = !!c;
        if (ok) { state.won = true; const first = !state.choix; state.choix = c.k; out.fin = { k: c.k, l: c.l, b: c.b, m: c.m }; if (first) toPhones('all', { type: 'choix', fin: out.fin }); }
      }
      else if (kind === 'spectro') { ok = n === 2; if (ok) out.text = SECRETS.spectro; }
      else return json(res, 400, { error: 'Vérification inconnue' });
      addLog({ phone: n, kind, ok, v: kind === 'spectro' ? '' : String(b.value || '').slice(0, 40) });
      return json(res, 200, ok ? Object.assign({ ok: true }, out) : { ok: false, error: out.error || ERR[kind] });
    }
    if ((m = p.match(/^\/api\/events\/([1-4])$/))) {
      const n = +m[1];
      if (authPhone(req, u) !== n) return json(res, 401, { error: 'Session expirée' });
      sse(res);
      res.write('data: ' + JSON.stringify(stateEvt()) + '\n\n');
      state.clients[n].add(res);
      req.on('close', () => state.clients[n].delete(res));
      return;
    }

    // ----- API game masters -----
    if (p.startsWith('/api/gm/')) {
      if (!gmOK(req, u)) return json(res, 401, { error: 'Jeton invalide' });
      if (p === '/api/gm/info') {
        return json(res, 200, { ips: lanIPs(), port: PORT, codes: config.lockCodes, hints: config.hints, log: state.log.slice(-80), deadline: state.deadline, clotureMinutes: config.clotureMinutes });
      }
      if (p === '/api/gm/stream') {
        sse(res);
        state.gm.add(res);
        req.on('close', () => state.gm.delete(res));
        return;
      }
      if (p === '/api/gm/push' && req.method === 'POST') {
        const b = await readBody(req);
        const target = b.phone === 'all' ? 'all' : +b.phone;
        if (target !== 'all' && !PHONES.includes(target)) return json(res, 400, { error: 'Téléphone inconnu' });
        const type = String(b.type);
        if (!['banner', 'hint', 'message'].includes(type)) return json(res, 400, { error: 'Type inconnu' });
        const text = String(b.text || '').slice(0, 300);
        if (!text) return json(res, 400, { error: 'Texte vide' });
        const evt = { type, text, title: String(b.title || '').slice(0, 60), thread: String(b.thread || 'Direction').slice(0, 40), from: 'in' };
        const sent = toPhones(target, evt);
        addLog({ phone: target, kind: 'gm-' + type, ok: true, v: text.slice(0, 40) });
        return json(res, 200, { ok: true, sent });
      }
      if (p === '/api/gm/countdown' && req.method === 'POST') {
        const b = await readBody(req);
        state.deadline = b.stop ? null : Date.now() + Math.max(1, +b.minutes || config.clotureMinutes) * 60000;
        toPhones('all', stateEvt());
        addLog({ phone: 'all', kind: 'gm-countdown', ok: true, v: b.stop ? 'arrêt' : (b.minutes || config.clotureMinutes) + ' min' });
        return json(res, 200, { ok: true, deadline: state.deadline });
      }
      // Nouvelle partie : on oublie la fin et le choix, le compte à rebours, et les téléphones effacent leur progression.
      // Les codes de déverrouillage déjà saisis restent valables.
      if (p === '/api/gm/reset' && req.method === 'POST') {
        state.won = false; state.choix = null; state.deadline = null;
        const sent = toPhones('all', { type: 'reset' });
        toPhones('all', stateEvt());
        addLog({ phone: 'all', kind: 'gm-reset', ok: true, v: 'nouvelle partie' });
        return json(res, 200, { ok: true, sent });
      }
      return json(res, 404, { error: 'Inconnu' });
    }

    // ----- Fichiers statiques -----
    if (req.method === 'GET') return serveStatic(req, res, p);
    res.writeHead(404); res.end();
  } catch (e) {
    console.error(e);
    if (!res.headersSent) json(res, 500, { error: 'Erreur du serveur' }); else res.end();
  }
});

setInterval(() => {
  for (const n of PHONES) for (const r of state.clients[n]) r.write(': ping\n\n');
  for (const r of state.gm) r.write(': ping\n\n');
}, 25000);

server.listen(PORT, '0.0.0.0', () => {
  console.log('\nLe téléphone de Théo : serveur démarré sur le port ' + PORT + '\n');
  console.log('Game masters : http://localhost:' + PORT + '/gm?token=' + config.gmToken);
  const ips = lanIPs();
  for (const n of PHONES) {
    console.log('Téléphone ' + n + ' : ' + (ips.length ? ips.map(ip => 'http://' + ip + ':' + PORT + '/t/' + n).join('  ou  ') : 'http://localhost:' + PORT + '/t/' + n));
  }
  console.log('\nLes téléphones doivent être sur le même wifi que ce Mac.\n');
});
