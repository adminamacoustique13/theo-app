'use strict';
// Toutes les données du jeu. Ce fichier reste sur le serveur : seul ce qui est « public »
// part vers un téléphone, et seulement après le code de déverrouillage. Les réponses
// (SECRETS) et le contenu protégé (admin, dossier) ne sortent qu'après une vérification.

const NUM = '06 39 98 12 31'; // numéro fictif

const MQ = [
  { q: 'La queue de Pikachu a-t-elle une pointe noire ?', t: 'Non' },
  { q: 'Monsieur Monopoly porte-t-il un monocle ?', t: 'Non' },
  { q: 'Oscar Mayer ou Oscar Meyer ?', t: 'Mayer' },
  { q: 'Nelson Mandela est-il mort en prison ?', t: 'Non' }
];

// Huit notes « Choses autrement » : leurs initiales, dans l'ordre d'écriture, donnent SOUVIENS.
const M8 = [
  ['Silver : la jambe de C-3PO', '08:12', 'Je le croyais tout doré. Sa jambe droite est argentée.'],
  ['Oscar Mayer (pas Meyer)', '09:30', "Mayer, avec un A. Toute ma vie j'ai lu Meyer."],
  ['Un monocle ? (Monopoly)', '10:45', "Le Monsieur Monopoly n'a jamais eu de monocle."],
  ['Vador : « No, I am your father »', '12:20', 'Dans la version originale, pas « Luke, I am your father ».'],
  ['Interview with the Vampire', '14:05', 'Pas « with a Vampire ».'],
  ['Éclair : la queue de Pikachu', '16:30', 'Aucune pointe noire à la queue. Seules les oreilles.'],
  ['Nelson Mandela, mort en prison ?', '18:15', 'Non : mort en 2013, libre.'],
  ['Sex and the City', '21:40', 'Pas « Sex in the City ».']
];
const notes8 = () => M8.map(n => ({ t: n[0], h: n[1], b: n[2] }));

const T3 = [
  ['T-101', "Phase d'atténuation après la séance"],
  ['T-102', 'La voix ne mentionne jamais la date'],
  ['T-103', 'Rémanence cible : 2 %']
];

const ACC = '<b>Comptes actifs</b><div>d.marchal · Direction produit</div><div>n.aubry · Opérations</div><div><b>t.lenoir · LENOIR Théo</b> · développeur freelance</div>';

// Le tatouage de Théo (avant-bras) : sur les portraits A et H de la pellicule (tous les téléphones)
// et la photo de profil d'Ethel O. (tél. 2 à 4) est le symbole lui-même. C'est ce qui trahit Ethel.
const AV_ETHEL = '<img src="/photos/ethel.jpg" alt="">';

const ph = (k, c, cls, html) => ({ k, c, cls, html });
const IMG = f => '<img src="/photos/' + f + '.jpg" alt="">';
// Pellicule d'avant l'histoire (portraits de Théo), la même sur les quatre téléphones (B et G : avec Nora), avant les photos de l'histoire.
// Le tél. 4 n'a plus que celle-ci : tout ce qui date de la période NOCTIS a disparu (compteur à 164).
const ROLL = ['e', 'b', 'g', 'a', 'j', 'f', 'd', 'h', 'c'].map(l => '/photos/vie-' + l + '.jpg');
const PH = {
  // Vraie photo du post-it : même texte qu'avant, l'énigme LETHE ne bouge pas.
  postit: ph('postit', 'Lundi 19 octobre · 08:41', 's-img', IMG('postit')),
  board: ph('board', 'Tableau blanc', 's-board', 'Mode test<br>=&gt; 7 appuis sur le logo<br><br>☾ → v1.0 avant le 31 ?<br>tickets : T-101 / 102 / 103'),
  inv: ph('inv', 'Facture', 's-inv', "<b>FACTURE n° 001</b><br><br>LENOIR Théo, développeur freelance<br>à l'attention de NOCTIS Wellbeing SAS<br><br>10 h de développement · tranche 1<br><br><i>Merci.</i>"),
  ticket: ph('ticket', 'Capture', 's-term', 'T-214  accès préprod\n---------------------\ndossier : ORCHIDEE\nutilisateur : t.lenoir\nmot de passe : *********\n\n[mot de passe modifié par t.lenoir · 22/10 23:18]'),
  // Le nouveau mot de passe d'ORCHIDÉE : la plante du bureau, dont seule l'étiquette latine (lisible en zoomant) donne le nom.
  desk: ph('desk', 'Jeudi 22 octobre · 23:16', 's-img', IMG('bureau-nuit')),
  badge: ph('badge', 'Badge', 's-badge', '<br>PETROVEX<br><span style="font-weight:400;font-size:12px">VISITEUR · site 4 · Martigues</span><br><br><span style="font-weight:400;font-size:9px;opacity:.6">14/09</span>'),
  blur: ph('blur', 'Flou', 's-blur', '<div></div>'),
  acc: ph('acc', 'Comptes', 's-acc', ACC),
  clock: ph('clock', 'Horloge', 's-clock', '02:30'),
  // Vraies photos sans indice.
  live: ph('live', 'Samedi 17 octobre · 22:47', 's-img', IMG('concert')),
  jour: ph('jour', 'Lundi 19 octobre · 09:12', 's-img', IMG('bureau-jour')),
  chat: ph('chat', 'Vendredi 23 octobre · 18:20', 's-img', IMG('biscotte')),
  cine: ph('cine', 'Samedi 24 octobre · 19:52', 's-img', IMG('cinema'))
};

// Conversations. Chaque contact a un segment par téléphone (1 à 4) : le téléphone N affiche
// les segments 1 à N, donc l'historique se garde d'un téléphone à l'autre.
// Message : ['in' | 'out', texte, auteur (groupes)] ; séparateur : ['day', 'Jeudi 22 octobre · 21:05'].
// h : heure affichée dans la liste quand le contact a écrit sur ce téléphone.
const day = s => ['day', s];
const CONV = {
  'Direction': {
    1: { h: '08:50', m: [day('Lundi 19 octobre · 08:50'), ['in', "Bienvenue Théo ! 🌙 Ravis de t'avoir à bord."], ['in', 'Premiers tickets cette semaine : T-101, T-102, T-103.'], ['in', 'Pour le mode test : 7 appuis sur le logo. 😉'], ['out', "merci, c'est noté"]] },
    2: { h: '20:05', m: [day('Jeudi 22 octobre · 20:05'), ['in', 'Ton test de ce soir est important, merci ! 🌙']] },
    3: { h: '02:20', m: [day('Dimanche 25 octobre · 02:20'), ['in', 'Séance de nuit validée ✔️']] },
    4: { h: '18:00', m: [day('Vendredi 30 octobre · 18:00'), ['in', 'Merci pour ton travail ! 🌙 Ta séance de clôture est programmée cette nuit.  Tu peux souffler.']] }
  },
  'Ethel O.': {
    num: 'Numéro masqué', av: AV_ETHEL,
    2: { h: '23:12', m: [day('Jeudi 22 octobre · 23:12'), ['in', 'ne fais pas la séance ce soir. relis tes notes avant de répondre à direction']] },
    3: { h: '03:20', m: [day('Dimanche 25 octobre · 03:20'), ['in', "il y a eu deux 2h30 cette nuit. regarde l'utc. ne dis rien à direction"]] },
    4: { h: '07:40', m: [day('Vendredi 30 octobre · 07:40'), ['in', "si quelqu'un lit ça après moi : souvenez-vous de moi. cherchez lenoir"]] }
  },
  'Nora': {
    num: '06 39 98 41 07',
    1: { h: '21:58', m: [day('Dimanche 18 octobre · 19:02'), ['in', 'Brunch dimanche prochain chez moi, tu ramènes les croissants.'], ['out', 'oui chef'],
      ['in', "Nouveau jeu cette semaine : l'effet Mandela. Les trucs dont tout le monde se souvient… de travers."], ['in', 'Chacun note les siens. Celui qui en a le moins paie les croissants.'], ['out', 'pari tenu'],
      day('Lundi 19 octobre · 12:31'), ['in', 'Alors ce job ?'], ['out', 'une appli de méditation. ça paye bien'], ['in', 'Toi. Méditer.'], ['out', 'je la code, je la fais pas 😅'], ['in', 'Le moine.'],
      ['in', 'Je suis de nuit jeudi et vendredi, tu peux nourrir Biscotte ?'], ['out', 'ok vendredi'],
      day('21:52'), ['out', 'bilan de la journée : 8. tout est dans mes notes'], ['in', '8 ?! Tu triches.'], ['in', "Moi j'en ai 3. Ok, je paie les croissants 🥐"]] },
    2: { h: '23:31', m: [day('Jeudi 22 octobre · 18:40'), ['in', 'Tu avais une drôle de voix au téléphone.'], ['out', 'fatigué. rien de grave'],
      day('23:20'), ['out', 'tu bosses ?'], ['in', "Oui, nuit calme pour l'instant. Pourquoi ?"], ['out', "je peux te déposer un truc demain ? tu le gardes, c'est tout"], ['in', "C'est quoi ?"],
      ['out', 'rien. tu me le rendras quand je te le demanderai'], ['in', 'Mystérieux. Ok.']] },
    3: { h: '21:14', m: [day('Vendredi 23 octobre · 09:15'), ['in', 'Ton truc est dans mon tiroir. Biscotte te dit merci.'],
      day('Vendredi 23 octobre · 22:47'), ['out', "si je te parle d'une séance ce soir, dis-moi de pas la faire"],
      day('Samedi 24 octobre · 21:10'), ['in', "Hier soir tu m'as écrit de ne pas faire la séance, c'était quoi ?"], ['out', "ah. j'étais crevé, laisse"], ['in', 'Brunch demain 11 h ?'], ['out', 'ok']] },
    4: { h: '19:20', m: [day('Lundi 26 octobre · 08:05'), ['in', "T'étais bizarre au brunch hier."], ['out', 'fatigué'],
      day('Mardi 27 octobre · 20:10'), ['in', 'Effet Mandela du jour : Oscar Mayer ou Meyer ?'], ['out', 'meyer, évidemment'], ['in', 'Toi qui en avais trouvé 8…'],
      day('Jeudi 29 octobre · 13:40'), ['in', "J'ai pris rdv pour toi mardi 9 h. Pas de discussion."], ['out', 'pour quoi ?'], ['in', 'Pour me faire plaisir.'],
      day('Vendredi 30 octobre · 19:12'), ['in', "Tu te souviens de ce qu'on s'est dit dimanche ?"], ['out', 'non, rien'], ['in', "Je passe demain matin après ma garde. J'ai un truc à toi."]] }
  },
  'Maman': {
    num: '06 39 98 22 65',
    1: { h: '18:41', m: [day('Lundi 19 octobre · 09:02'), ['in', 'Mon chéri, ton premier jour ? 😘🌸🙏'], ['out', "tranquille. ils ont l'air sympas"],
      day('18:30'), ['in', 'Pense à appeler mamie, elle a demandé « le petit » trois fois cette semaine.'], ['in', 'Et dimanche 1er on va voir papy au cimetière, tu viens ?'], ['out', 'je verrai selon le boulot']] },
    2: { h: '17:20', m: [day('Jeudi 22 octobre · 17:15'), ['in', "Mamie t'a pris pour ton père hier. Ça m'a fait drôle 😕"], ['out', "je l'appelle ce week-end"]] },
    3: { h: '16:02', m: [day('Samedi 24 octobre · 16:02'), ['in', 'Mamie a eu une bonne journée, elle a chanté avec moi 🎶']] },
    4: { h: '17:52', m: [day('Mardi 27 octobre · 12:10'), ['in', 'Alors, dimanche ?'], ['out', 'oui, je viens'],
      day('Vendredi 30 octobre · 17:45'), ['in', 'Papa passe te prendre dimanche à 10 h, tu m\'as dit oui mardi 😘'], ['out', "j'ai dit oui ?"], ['in', 'Oui mon chéri.']] }
  },
  'Coinche du jeudi': {
    num: 'Groupe · Sami, Hugo, vous',
    1: { h: '11:26', m: [day('Lundi 19 octobre · 11:20'), ['in', 'Jeudi 21 h chez moi. Hugo ramène la bière, Théo ramène son argent.', 'Sami'], ['in', 'Il a un vrai job maintenant, il peut perdre plus 😂', 'Hugo'], ['out', 'je vais vous plumer']] },
    2: { h: '23:30', m: [day('Jeudi 22 octobre · 21:05'), ['in', 'On commence sans toi ?', 'Sami'], day('21:40'), ['in', 'Il nous lâche pour sa secte zen 🧘', 'Hugo'], day('22:30'), ['in', "Bon. Hugo a triché, comme d'hab.", 'Sami'],
      day('23:30'), ['out', 'désolé, boulot. la semaine pro']] },
    3: { h: '14:20', m: [day('Samedi 24 octobre · 14:12'), ['in', 'Rattrapage le 31 : Halloween chez Hugo, déguisement obligatoire 🎃', 'Sami'], ['in', 'Pas de déguisement = pas de bière', 'Hugo'], ['out', 'je note']] },
    4: { h: '20:15', m: [day('Vendredi 30 octobre · 20:03'), ['in', "Demain 21 h, t'as ton costume ?", 'Hugo'], ['out', 'quel costume ?']] }
  },
  'Lucile': {
    num: '06 39 98 77 30',
    1: { h: '20:55', m: [day('Dimanche 18 octobre · 22:14'), ['in', "C'était cool de te croiser au concert hier 🙂"], ['out', "carrément. t'as d'autres groupes du genre ?"], ['in', 'Plein. Je te fais une playlist, à condition que tu la juges pas.'],
      day('Lundi 19 octobre · 20:48'), ['out', 'toujours pas de playlist. je juge déjà'], ['in', 'Patience 😏'], ['out', 'on se voit un de ces jours ?'], ['in', 'Samedi ?']] },
    2: { h: '00:15', m: [day('Mercredi 21 octobre · 19:30'), ['in', 'Playlist envoyée 🎧'], ['out', 'écoutée deux fois. samedi 20 h, ciné ?'], ['in', 'Deal. Tu choisis le film.'],
      day('Jeudi 22 octobre · 23:50'), ['out', 'tu dors ?'], day('Vendredi 23 octobre · 00:12'), ['in', 'Non. Ça va ?'], ['out', "oui. envie de parler à quelqu'un, c'est tout"]] },
    3: { h: '00:11', m: [day('Samedi 24 octobre · 19:58'), ['in', "Devant le ciné, t'es où ?"], ['out', '2 min !'],
      day('Samedi 24 octobre · 23:58'), ['in', 'Merci pour ce soir. Vraiment.'], day('Dimanche 25 octobre · 00:10'), ['out', 'moi aussi'], ['in', 'Bonne nuit Théo 🙂']] },
    4: { h: 'mer.', m: [day('Lundi 26 octobre · 18:30'), ['in', 'Deuxième round ce week-end ? 🙂'], day('Mercredi 28 octobre · 22:05'), ['in', "Ok, j'ai compris."]] }
  },
  'Nicolas Aubry': {
    num: '01 39 98 50 12',
    1: { h: '17:10', m: [day('Lundi 19 octobre · 17:05'), ['in', 'Bonjour Théo. Accès préprod demain 9 h. Les tests audio se font le soir, sur ton téléphone.'], ['out', 'bien noté']] },
    2: { h: '20:12', m: [day('Jeudi 22 octobre · 20:10'), ['in', 'Test longue durée ce soir 22 h 40. Casque, téléphone en charge.'], ['out', 'ok']] },
    3: { h: '18:05', m: [day('Samedi 24 octobre · 18:02'), ['in', 'Connexion inhabituelle sur ton compte jeudi soir. Rien de grave.'], ['in', "J'ai programmé une séance de nuit pour recalibrer ton profil."], ['out', 'ok']] },
    4: { h: '18:20', m: [day('Vendredi 30 octobre · 18:20'), ['in', 'Compte t.lenoir révoqué. Séance de clôture cette nuit, 2 h 30. Appareil en charge, casque.'], ['in', 'Merci pour ta contribution.']] }
  },
  'M. Fabre': {
    num: '06 39 98 03 58',
    1: { h: '10:30', m: [day('Lundi 19 octobre · 10:02'), ['in', "Bonjour Théo, le loyer d'octobre n'est toujours pas arrivé."], ['out', "fin de semaine, promis. j'ai un nouveau client"]] },
    3: { h: '11:00', m: [day('Samedi 24 octobre · 11:00'), ['in', 'Bien reçu le virement, merci.']] }
  },
  'Banque': {
    num: 'Service client',
    2: { h: '09:00', m: [day('Jeudi 22 octobre · 09:00'), ['in', 'Virement reçu : NOCTIS WELLBEING SAS, +1 200,00 €.']] },
    3: { h: 'ven.', m: [day('Vendredi 23 octobre · 10:12'), ['in', 'Virement émis : M. FABRE, loyer octobre, −780,00 €.']] },
    4: { h: '16:00', m: [day('Vendredi 30 octobre · 16:00'), ['in', 'Virement reçu : NOCTIS WELLBEING SAS, +4 800,00 €. Libellé : solde de tout compte.']] }
  },
  'Doctolib': {
    num: 'Notification',
    4: { h: 'jeu.', m: [day('Jeudi 29 octobre · 13:42'), ['in', 'Rendez-vous confirmé : mardi 3 novembre à 9 h 00, Dr Vasseur, neurologie. Pris pour vous par Nora B.']] }
  }
};
// Ordre de la liste des conversations sur chaque téléphone (la plus récente en haut).
const ORDER = {
  1: ['Nora', 'Lucile', 'Maman', 'Nicolas Aubry', 'Coinche du jeudi', 'M. Fabre', 'Direction'],
  2: ['Lucile', 'Nora', 'Coinche du jeudi', 'Ethel O.', 'Nicolas Aubry', 'Direction', 'Maman', 'Banque', 'M. Fabre'],
  3: ['Ethel O.', 'Direction', 'Lucile', 'Nora', 'Nicolas Aubry', 'Maman', 'Coinche du jeudi', 'M. Fabre', 'Banque'],
  4: ['Coinche du jeudi', 'Nora', 'Nicolas Aubry', 'Direction', 'Maman', 'Banque', 'Ethel O.', 'Doctolib', 'Lucile', 'M. Fabre']
};
// Fils du téléphone N : segments 1 à N de chaque contact.
const threads = N => ORDER[N].map(n => {
  const c = CONV[n], seg = [1, 2, 3, 4].filter(i => i <= N && c[i]), m = [].concat(...seg.map(i => c[i].m));
  const last = seg[seg.length - 1];
  let h = c[last].h;
  if (last < N) { const d = m.filter(x => x[0] === 'day' && / \d+ /.test(x[1])).pop(); h = d ? d[1].match(/ (\d+) /)[1] + '/10' : h; }
  const t = { n, h, m };
  if (c.num) t.num = c.num;
  if (c.av) t.av = c.av;
  if (n === 'Ethel O.' && N === 4) t.card = true;
  return t;
});

// Calendrier. p : premier téléphone où l'événement existe (il reste ensuite sur les suivants).
// d : date et heure locales (AAAA-MM-JJ HH:MM, ou AAAA-MM-JJ pour la journée entière).
// by : qui l'a ajouté, quand ce n'est pas Théo. sys : note du téléphone lui-même.
const CAL = [
  { p: 1, d: '2026-10-17 20:30', t: 'Concert, Les Nuits Molles' },
  { p: 1, d: '2026-10-19 09:00', t: 'NOCTIS : accueil' },
  { p: 1, d: '2026-10-19 19:00', t: 'Appeler mamie' },
  { p: 1, d: '2026-10-20 09:00', t: 'NOCTIS : accès préprod', by: 'n.aubry' },
  { p: 1, d: '2026-10-22 21:00', t: 'Coinche chez Sami' },
  { p: 1, d: '2026-10-23 12:00', t: 'Loyer M. Fabre !!' },
  { p: 1, d: '2026-10-23 18:00', t: 'Nourrir Biscotte' },
  { p: 1, d: '2026-10-25 11:00', t: 'Brunch chez Nora (croissants)' },
  { p: 1, d: '2026-10-29 21:00', t: 'Coinche chez Sami' },
  { p: 1, d: '2026-10-31', t: 'NOCTIS : livraison v1.0' },
  { p: 1, d: '2026-11-01', t: 'Toussaint', sys: true },
  { p: 2, d: '2026-10-22 22:40', t: 'Séance Sérénité : test longue durée', by: 'n.aubry' },
  { p: 2, d: '2026-10-24 20:00', t: 'Ciné avec Lucile' },
  { p: 3, d: '2026-10-24 21:50', t: 'Séance Sérénité : séance du soir', by: 'n.aubry' },
  { p: 3, d: '2026-10-25 02:30', t: 'Séance Sérénité : séance de nuit', by: 'n.aubry' },
  { p: 3, d: '2026-10-25 03:00', t: "Passage à l'heure d'hiver : 3 h 00 devient 2 h 00", sys: true },
  { p: 3, d: '2026-10-31 21:00', t: 'Halloween chez Hugo (déguisé !)' },
  { p: 4, d: '2026-10-28 19:00', t: 'Appeler mamie' },
  { p: 4, d: '2026-10-31 02:30', t: 'Séance Sérénité : clôture', by: 'n.aubry' },
  { p: 4, d: '2026-11-01 10:00', t: 'Cimetière avec papa et maman' },
  { p: 4, d: '2026-11-03 09:00', t: 'Dr Vasseur', by: 'Nora B.' }
];
// Appels récents. dir : 'out' (sortant), 'in' (entrant), 'miss' (manqué). dur en minutes.
const CALLS = [
  { p: 1, d: '2026-10-18 19:40', n: 'Maman', dir: 'out', dur: 12 },
  { p: 1, d: '2026-10-19 12:35', n: 'Nora', dir: 'in', dur: 6 },
  { p: 1, d: '2026-10-19 17:20', n: 'Nicolas Aubry', dir: 'in', dur: 2 },
  { p: 1, d: '2026-10-19 18:50', n: 'EHPAD Les Tilleuls', dir: 'miss' },
  { p: 2, d: '2026-10-21 20:10', n: 'Lucile', dir: 'out', dur: 24 },
  { p: 2, d: '2026-10-22 18:32', n: 'Nora', dir: 'out', dur: 4 },
  { p: 2, d: '2026-10-22 21:12', n: 'Coinche du jeudi', dir: 'miss' },
  { p: 2, d: '2026-10-23 02:41', n: 'Nora', dir: 'out', dur: 0 },
  { p: 3, d: '2026-10-24 11:05', n: 'Maman', dir: 'miss' },
  { p: 3, d: '2026-10-24 18:10', n: 'Nicolas Aubry', dir: 'in', dur: 3 },
  { p: 3, d: '2026-10-24 19:59', n: 'Lucile', dir: 'out', dur: 1 },
  { p: 4, d: '2026-10-26 19:02', n: 'Lucile', dir: 'miss' },
  { p: 4, d: '2026-10-26 19:05', n: 'Lucile', dir: 'miss' },
  { p: 4, d: '2026-10-26 19:30', n: 'Lucile', dir: 'miss' },
  { p: 4, d: '2026-10-27 12:05', n: 'Maman', dir: 'in', dur: 8 },
  { p: 4, d: '2026-10-28 18:45', n: 'EHPAD Les Tilleuls', dir: 'miss' },
  { p: 4, d: '2026-10-29 13:35', n: 'Nora', dir: 'in', dur: 11 },
  { p: 4, d: '2026-10-30 18:22', n: 'Nicolas Aubry', dir: 'in', dur: 1 },
  { p: 4, d: '2026-10-30 19:15', n: 'Nora', dir: 'miss' }
];
// Calendrier du téléphone N dans l'ordre chronologique ; appels du plus récent au plus ancien.
const cal = N => CAL.filter(e => e.p <= N).sort((a, b) => a.d.localeCompare(b.d)).map(({ p, ...e }) => e);
const calls = N => CALLS.filter(c => c.p <= N).sort((a, b) => b.d.localeCompare(a.d)).map(({ p, ...c }) => c);

// Appli Banque. Remplace la capture « Comptes » du tél. 3. p : premier téléphone où l'opération existe.
// a : montant en euros (négatif = dépense). Le titulaire « M. Théo Lenoir » s'affiche sur les tél. 1 à 3,
// pas sur le tél. 4 (le nom ne doit pas y apparaître, à cause de l'anagramme).
const BANK_START = -144.84; // solde au 1er octobre : à découvert, le loyer attend
const BANK = [
  { p: 1, d: '2026-10-02', t: 'VIR CAF · APL octobre', a: 212.00 },
  { p: 1, d: '2026-10-05', t: 'PRLV Spotify', a: -10.99 },
  { p: 1, d: '2026-10-08', t: 'CB Carrefour City', a: -23.40 },
  { p: 1, d: '2026-10-10', t: 'PRLV Free Mobile', a: -15.99 },
  { p: 1, d: '2026-10-12', t: 'CB Biocoop', a: -38.60 },
  { p: 1, d: '2026-10-15', t: 'PRLV EDF', a: -46.00 },
  { p: 1, d: '2026-10-17', t: 'CB Billetterie · Les Nuits Molles', a: -18.00 },
  { p: 1, d: '2026-10-17', t: 'CB Bar Le Comptoir', a: -14.50 },
  { p: 1, d: '2026-10-18', t: 'CB Boulangerie du Marché', a: -4.20 },
  { p: 1, d: '2026-10-19', t: 'CB Carrefour City', a: -17.85 },
  { p: 2, d: '2026-10-20', t: "CB Monop' Daily", a: -8.90 },
  { p: 2, d: '2026-10-21', t: 'CB Pharmacie des Lices', a: -6.30 },
  { p: 2, d: '2026-10-22', t: 'VIR NOCTIS WELLBEING SAS · tranche 1', a: 1200.00 },
  { p: 2, d: '2026-10-22', t: 'CB Pizza Da Marco', a: -13.00 },
  { p: 3, d: '2026-10-23', t: 'VIR M. FABRE · loyer octobre', a: -780.00 },
  { p: 3, d: '2026-10-23', t: 'CB Animalerie · croquettes', a: -11.90 },
  { p: 3, d: '2026-10-24', t: 'CB Cinéma Le Méliès · 2 places', a: -19.80 },
  { p: 3, d: '2026-10-24', t: 'CB Bar Le Comptoir', a: -22.00 },
  { p: 4, d: '2026-10-25', t: 'CB Boulangerie du Marché', a: -6.40 },
  { p: 4, d: '2026-10-26', t: 'CB Pharmacie des Lices', a: -12.90 },
  { p: 4, d: '2026-10-27', t: 'CB Carrefour City', a: -31.20 },
  { p: 4, d: '2026-10-28', t: 'CB Carrefour City', a: -31.20 },
  { p: 4, d: '2026-10-29', t: 'CB Carrefour City', a: -29.85 },
  { p: 4, d: '2026-10-30', t: 'VIR NOCTIS WELLBEING SAS · solde de tout compte', a: 4800.00 }
];
// Banque du téléphone N : titulaire, solde, opérations de la plus récente à la plus ancienne.
const bank = N => {
  const ops = BANK.filter(o => o.p <= N);
  const solde = Math.round((BANK_START + ops.reduce((s, o) => s + o.a, 0)) * 100) / 100;
  return { holder: N < 4 ? 'M. Théo Lenoir' : null, solde, ops: ops.slice().reverse().map(({ p, ...o }) => o) };
};

// Appli Mail. p : premier téléphone où le mail existe ; gone : téléphone à partir duquel il a disparu
// (les mails NOCTIS, qui montrent l'adresse et le nom de Théo, ne sont plus là au tél. 4).
// box : 'in' (reçu) ou 'sent' (envoyé). att : pièces jointes ({ n: nom, k: type }). Aucun mail visible au tél. 4 ne contient « Lenoir ».
const MAIL = [
  { p: 1, d: '2026-10-16 10:12', box: 'in', gone: 4, from: 'Delphine Marchal · NOCTIS', addr: 'd.marchal@noctis-wellbeing.fr', to: 'theo.lenoir.dev@gmail.com', subj: 'Bienvenue chez NOCTIS 🌙',
    body: "Bonjour Théo,\n\nToute l'équipe est ravie de t'accueillir. Rendez-vous lundi 19 à 9 h pour ton premier jour : Nicolas t'ouvrira tes accès.\n\nNotre mission tient en une phrase : alléger ce qui pèse.\n\nPetit rappel, le projet est confidentiel. Merci de n'en parler à personne, même à tes proches.\n\nÀ lundi !\nDelphine" },
  { p: 1, d: '2026-10-17 09:00', box: 'in', from: 'Spotify', addr: 'no-reply@spotify.com', to: 'moi', subj: 'Ta sélection de la semaine est prête',
    body: "30 titres choisis pour toi, d'après ce que tu as écouté cette semaine." },
  { p: 1, d: '2026-10-18 11:30', box: 'in', from: 'Les Nuits Molles', addr: 'contact@lesnuitsmolles.fr', to: 'moi', subj: 'Merci pour samedi !',
    body: "Vous étiez nombreux hier soir, merci !\n\nLes photos du concert sont en ligne sur notre page. Vous vous reconnaîtrez peut-être dans la foule.\n\nProchaine date annoncée bientôt." },
  { p: 1, d: '2026-10-19 07:30', box: 'in', from: 'La Matinale', addr: 'newsletter@lamatinale.fr', to: 'moi', subj: "Lundi 19 octobre : l'essentiel de l'actualité",
    body: "Météo : gris et doux, 14 °C.\nÀ la une : les préparatifs de la cérémonie du 31 octobre s'accélèrent.\nRégion : à Martigues, la pêche reste interdite au nord de l'étang jusqu'à nouvel ordre.\nCulture : le retour des films d'horreur en salle avant Halloween." },
  { p: 1, d: '2026-10-19 18:05', box: 'sent', gone: 4, from: 'Théo Lenoir', addr: 'theo.lenoir.dev@gmail.com', to: 'compta@noctis-wellbeing.fr', subj: 'Facture n° 2026-001',
    body: 'Bonjour,\n\nVeuillez trouver ci-joint ma facture pour la tranche 1.\n\nBonne soirée,\nThéo Lenoir', att: [{ n: 'Facture_001.pdf', k: 'inv' }] },
  { p: 2, d: '2026-10-20 08:52', box: 'in', gone: 4, from: 'Nicolas Aubry · NOCTIS', addr: 'n.aubry@noctis-wellbeing.fr', to: 'theo.lenoir.dev@gmail.com', subj: 'Accès préprod',
    body: "Bonjour,\n\nTes identifiants préprod t'arrivent par un autre canal.\n\nLes séances de test se font le soir, hors des heures de bureau, casque sur les oreilles et téléphone en charge. Pense à ne pas couper la séance avant la fin.\n\nN. Aubry\nOpérations" },
  { p: 2, d: '2026-10-21 08:15', box: 'in', from: 'Biocoop', addr: 'infos@biocoop.fr', to: 'moi', subj: 'Les courges sont arrivées 🎃',
    body: "Potimarron, butternut, pâtisson : c'est la saison. -10 % sur les soupes toute la semaine." },
  { p: 2, d: '2026-10-22 14:02', box: 'in', gone: 4, from: 'Comptabilité NOCTIS', addr: 'compta@noctis-wellbeing.fr', to: 'theo.lenoir.dev@gmail.com', subj: 'RE: Facture n° 2026-001',
    body: 'Bonjour,\n\nLe virement de 1 200,00 € a été émis ce jour.\n\nCordialement,\nService comptabilité' },
  { p: 3, d: '2026-10-23 10:15', box: 'in', from: 'Cinéma Le Méliès', addr: 'billetterie@lemelies.fr', to: 'moi', subj: 'Vos billets : samedi 24 octobre, 20:00',
    body: "Séance de 20:00, salle 2.\n2 places plein tarif.\n\nPrésentez ce mail à l'entrée. Bonne séance !" },
  { p: 3, d: '2026-10-24 09:00', box: 'in', from: 'Déguiz’Express', addr: 'promo@deguizexpress.fr', to: 'moi', subj: 'Halloween : -20 % sur tous les costumes',
    body: "Vampire, zombie, momie… Il vous reste une semaine pour trouver le vôtre. Livraison en 48 h." },
  { p: 3, d: '2026-10-24 17:40', box: 'in', gone: 4, from: 'Nicolas Aubry · NOCTIS', addr: 'n.aubry@noctis-wellbeing.fr', to: 'theo.lenoir.dev@gmail.com', subj: "Mise à jour de ton profil d'écoute",
    body: "Bonjour,\n\nSuite à une connexion inhabituelle sur ton compte, une séance de recalibrage est programmée cette nuit sur ton appareil.\n\nAucune action n'est requise de ta part.\n\nN. Aubry" },
  { p: 4, d: '2026-10-26 08:00', box: 'in', from: 'Sérénité', addr: 'bonjour@serenite.app', to: 'moi', subj: 'Votre bilan de la semaine 🌙',
    body: "Bonjour Théo,\n\nCette semaine : 4 séances, dont 2 séances de nuit.\nVotre sommeil : +38 %.\nCe qui pesait : -61 %.\n\nBravo, vous avez allégé votre semaine." },
  { p: 4, d: '2026-10-27 15:20', box: 'in', from: 'EHPAD Les Tilleuls', addr: 'accueil@ehpad-lestilleuls.fr', to: 'moi', subj: 'Programme de la Toussaint',
    body: "Chères familles,\n\nUne messe sera célébrée dimanche 1er novembre à 11 h dans la salle commune. Les familles sont les bienvenues.\n\nCette semaine, l'atelier chant a eu beaucoup de succès. Madame Odette nous a même appris une chanson de sa jeunesse.\n\nL'équipe des Tilleuls" },
  { p: 4, d: '2026-10-28 07:30', box: 'in', from: 'La Matinale', addr: 'newsletter@lamatinale.fr', to: 'moi', subj: "Mercredi 28 octobre : l'essentiel de l'actualité",
    body: "Météo : pluie en fin de journée, 12 °C.\nÀ la une : cérémonie du 31 octobre, le parcours dévoilé.\nJustice : étang de Berre, l'affaire de la pollution de juin classée sans suite, faute de témoins.\nSport : l'OM s'impose à domicile." },
  { p: 4, d: '2026-10-28 10:00', box: 'in', from: 'Les Nuits Molles', addr: 'contact@lesnuitsmolles.fr', to: 'moi', subj: 'Nouvelle date : 12 décembre',
    body: 'On remet ça le samedi 12 décembre, même salle. Billetterie ouverte !' },
  { p: 4, d: '2026-10-29 13:42', box: 'in', from: 'Doctolib', addr: 'no-reply@doctolib.fr', to: 'moi', subj: 'Rendez-vous confirmé : mardi 3 novembre à 09:00',
    body: "Votre rendez-vous est confirmé.\n\nDr Claire Vasseur, neurologue\nMardi 3 novembre 2026 à 09:00\n\nRéservé pour vous par Nora Benali.\n\nPensez à apporter vos derniers examens." },
  { p: 4, d: '2026-10-30 16:02', box: 'in', from: 'Ma Banque', addr: 'alertes@mabanque.fr', to: 'moi', subj: 'Vous avez reçu un virement',
    body: 'Un virement de 4 800,00 € a été crédité sur votre compte courant.\nÉmetteur : NOCTIS WELLBEING SAS.' }
];
// Mails du téléphone N, du plus récent au plus ancien.
const mails = N => MAIL.filter(m => m.p <= N && !(m.gone && N >= m.gone)).sort((a, b) => b.d.localeCompare(a.d)).map(({ p, gone, ...m }) => m);

const phones = {
  1: {
    public: {
      label: 'Téléphone 1', wp: 1, ver: '0.8', bat: 82, att: 'désactivée', total: 214,
      notes: notes8(),
      th: threads(1),
      cal: cal(1), calls: calls(1), bank: bank(1), mail: mails(1),
      ph: [PH.live, PH.postit, PH.jour, PH.board], roll: ROLL,
      memos: [{ n: 'Test voix 1', d: '0:42', h: '16:50', x: '« Respirez... À votre réveil, ce qui pesait sera plus léger. »' }],
      drift: {}, close: false
    },
    admin: { adm: 'ok', lethe: 'désactivé (build interne)', jr: [['S-0419-1', '10:15', '08:15', 'Test', '6 min'], ['S-0419-2', '13:02', '11:02', 'Test', '8 min'], ['S-0419-3', '17:30', '15:30', 'Test', '10 min']], tk: T3, accHtml: null, dos: 'none' },
    dossier: null
  },
  2: {
    public: {
      label: 'Téléphone 2', wp: 2, ver: '0.9', bat: 41, att: 'bêta', total: 231,
      notes: [{ t: "Ce que j'ai vu", h: '23:12', b: "ouvert par erreur un dossier. j'ai changé son mot de passe : un mot que j'ai sous les yeux tous les jours\n\nclients : PETROVEX (incident site 4), puis un « état »\n\nce n'est pas de la méditation. ils font oublier\n\nne plus faire la séance du soir" }],
      th: threads(2),
      cal: cal(2), calls: calls(2), bank: bank(2), mail: mails(2),
      ph: [PH.ticket, PH.desk, PH.badge, PH.blur], roll: ROLL,
      memos: [{ n: 'Mémo 3:12', d: '1:08', h: '03:12', sp: true, x: '(chuchoté) Je crois que j\'ai vu quelque chose.  Je ne sais plus quoi.' }],
      drift: {}, close: false
    },
    admin: { adm: 'ok', lethe: 'actif en test', jr: [['S-0422-1', '22:40', '20:40', 'Test LETHE-ALPHA · sujet 0 · rémanence mesurée 31 %', '25 min']], tk: T3.concat([['T-214', 'Accès préprod (restreint)']]), accHtml: null, dos: 'none' },
    dossier: null
  },
  3: {
    public: {
      label: 'Téléphone 3', wp: 3, ver: '1.0', bat: 17, att: 'active', total: 238,
      notes: [
        { t: "Ce que j'ai vu", h: '23:12', b: 'ouvert par erreur un dossier. ce sont des gens bien' },
        { t: '2 h 30', h: '02:30', b: 'Séance.  Tout est calme.' },
        { t: '2 h 30 (bis)', h: '02:30', b: "J'ai l'impression d'avoir déjà écrit ça." }
      ],
      th: threads(3),
      cal: cal(3), calls: calls(3), bank: bank(3), mail: mails(3),
      ph: [PH.chat, PH.cine, PH.clock], roll: ROLL,
      memos: [],
      drift: { 0: 'Oui' }, close: false
    },
    // Journal trié par heure locale : à égalité, E (01:30 UTC) s'affiche avant D (00:30 UTC).
    admin: { adm: 'ok', lethe: 'actif', jr: [['S-0914-4', '23:00', '21:00', 'Séance collective · lot P4 · 12 sujets · cible : nuit du 14/06', '40 min'], ['S-0424-1', '21:50', '19:50', 'Séance du soir', '24 min'], ['S-0424-3E', '02:30', '01:30', 'LETHE profond · sujet 0', '52 min'], ['S-0424-7D', '02:30', '00:30', 'Sommeil standard', '18 min']], tk: T3, accHtml: ACC, dos: 'locked', dosHint: 'la plante du bureau', dosMod: 't.lenoir, jeu. 22/10 23 h 18' },
    dossier: {
      rows: [['PETROVEX', 'Incident site 4', '12', '94 %'], ['Institution', 'Événement public du 31/10', '340', '87 %'], ['Douceur', 'Particuliers', '5 000', '40 %']],
      access: 't.lenoir, jeu. 23 h 08, ouverture non autorisée',
      sujet0: 'Nuit du 30 au 31/10, 2 h 30. Retrait complet : projet, période de développement, contacts associés.'
    }
  },
  4: {
    public: {
      label: 'Téléphone 4', wp: 4, ver: '1.0.3', bat: 63, att: 'active', total: 164,
      notes: notes8().concat([{ t: "Rien d'important", h: '07:45', b: "Rien d'important." }]),
      th: threads(4),
      cal: cal(4), calls: calls(4), bank: bank(4), mail: mails(4),
      ph: [], roll: ROLL,
      memos: [{ n: 'Mémo 23:50', d: '0:31', h: '23:50', x: "Je ne sais pas pourquoi j'enregistre ça..." }],
      drift: { 0: 'Oui', 1: 'Oui', 2: 'Meyer' }, close: true
    },
    admin: { adm: 'revoked', lethe: '', jr: [], tk: [], accHtml: null, dos: 'revoked' },
    dossier: null
  }
};

const SECRETS = {
  admin: 'LETHE',
  // Le dossier s'ouvre avec le nom français de la plante ; le nom latin reçoit un refus à part.
  dossier: ['ASPHODELE', 'ASPHODELES'],
  dossierLatin: 'ASPHODELUS',
  // Le contact Ethel O. se renomme quand on lui donne le vrai nom de Théo (ou « moi »).
  anagram: ['THEOLENOIR', 'LENOIRTHEO', 'THEOL', 'THEO', 'LENOIR', 'MOI', 'MOIMEME'],
  final: 'SOUVIENSTOIDEMOI',
  spectro: 'TOI'
};

module.exports = { phones, MQ, NUM, SECRETS };
