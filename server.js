'use strict';
// Serveur du jeu « Le téléphone de Théo ». Aucune dépendance : Node 18+ suffit.
//   node server.js        puis ouvrir  http://localhost:3000/gm?token=lykson
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const { phones, MQ, NUM, SECRETS } = require('./data');
const config = require('./config');

const PORT = +process.env.PORT || 3000;
const PUB = path.join(__dirname, 'public');
const PRIV = path.join(__dirname, 'private');
const PHONES = [1, 2, 3, 4];

try { require('./make-icons').ensure(PUB); } catch (e) { console.error('Icônes non créées :', e.message); }

const norm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z]/g, '').toUpperCase();
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json', '.webmanifest': 'application/manifest+json'
};

const state = {
  deadline: null,
  sessions: { 1: new Set(), 2: new Set(), 3: new Set(), 4: new Set() },
  clients: { 1: new Set(), 2: new Set(), 3: new Set(), 4: new Set() },
  gm: new Set(),
  log: [],
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
function authPhone(req, u) {
  const s = req.headers['x-session'] || u.searchParams.get('s') || '';
  for (const n of PHONES) if (state.sessions[n].has(s)) return n;
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
const pub = n => Object.assign({}, phones[n].public, { n, num: NUM, mq: MQ, deadline: state.deadline });

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
function serveStatic(res, p) {
  const f = path.normalize(path.join(PUB, p));
  if (!f.startsWith(PUB + path.sep)) { res.writeHead(403); return res.end(); }
  sendFile(res, f, MIME[path.extname(f)] || 'application/octet-stream');
}

const ERR = {
  admin: 'Mot de passe incorrect.',
  dossier: 'Mot de passe incorrect.',
  anagram: "Ce n'est pas la bonne combinaison.",
  final: 'Rémanence insuffisante. Séquence refusée.',
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
      const s = crypto.randomBytes(12).toString('hex');
      state.sessions[n].add(s);
      return json(res, 200, { session: s, data: pub(n) });
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
      else if (kind === 'dossier') { ok = !!phones[n].dossier && v === SECRETS.dossier; if (ok) out.data = phones[n].dossier; }
      else if (kind === 'anagram') { ok = v === SECRETS.anagram; }
      else if (kind === 'final') { ok = v === SECRETS.final; }
      else if (kind === 'spectro') { ok = n === 2; if (ok) out.text = SECRETS.spectro; }
      else return json(res, 400, { error: 'Vérification inconnue' });
      addLog({ phone: n, kind, ok, v: kind === 'spectro' ? '' : String(b.value || '').slice(0, 40) });
      return json(res, 200, ok ? Object.assign({ ok: true }, out) : { ok: false, error: ERR[kind] });
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
      return json(res, 404, { error: 'Inconnu' });
    }

    // ----- Fichiers statiques -----
    if (req.method === 'GET') return serveStatic(res, p);
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
