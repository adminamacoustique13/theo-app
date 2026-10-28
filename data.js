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

// Le bracelet de Théo (cordon rouge, trois nœuds, anneau d'argent) : au poignet de Théo sur la photo
// du concert (tél. 1) et sur la photo de profil d'Ethel O. (tél. 2 à 4). C'est ce qui trahit Ethel.
const BRACELET = (x, y, w) => '<g transform="translate(' + x + ' ' + y + ')"><rect x="0" y="0" width="' + w + '" height="7" rx="3" fill="#b3202a"/>' +
  [0.25, 0.5, 0.75].map(f => '<circle cx="' + (w * f) + '" cy="3.5" r="4.2" fill="#7d141b"/>').join('') +
  '<circle cx="' + (w * 0.62) + '" cy="11" r="3.4" fill="none" stroke="#d9dde2" stroke-width="1.6"/></g>';
const AV_ETHEL = '<svg viewBox="0 0 100 100"><rect width="100" height="100" fill="#141820"/><g filter="url(#fl)">' +
  '<path d="M-10 70 L70 18 L95 42 L15 100 Z" fill="#c99b7e"/></g><defs><filter id="fl"><feGaussianBlur stdDeviation="1.4"/></filter></defs>' +
  '<g transform="rotate(-33 50 55) translate(50 55) scale(1.4) translate(-50 -55)">' + BRACELET(26, 52, 48) + '</g></svg>';

const ph = (k, c, cls, html) => ({ k, c, cls, html });
const PH = {
  postit: ph('postit', 'Post-it', 's-postit', 'Admin :<br>le fleuve des Enfers où les morts oublient<br>(5 lettres)'),
  board: ph('board', 'Tableau blanc', 's-board', 'Mode test<br>=&gt; 7 appuis sur le logo<br><br>☾ → v1.0 avant le 31 ?<br>tickets : T-101 / 102 / 103'),
  inv: ph('inv', 'Facture', 's-inv', "<b>FACTURE n° 001</b><br><br>LENOIR Théo, développeur freelance<br>à l'attention de NOCTIS Wellbeing SAS<br><br>10 h de développement · tranche 1<br><br><i>Merci.</i>"),
  ticket: ph('ticket', 'Capture', 's-term', 'T-214  accès préprod\n---------------------\ndossier : ORCHIDEE\nutilisateur : t.lenoir\nmot de passe : *********\n\n[mot de passe modifié par t.lenoir · 22/10 23:18]'),
  // Le nouveau mot de passe d'ORCHIDÉE : la plante du bureau, dont seule l'étiquette latine donne le nom.
  desk: ph('desk', 'Bureau', 's-photo', '<svg viewBox="0 0 300 220"><rect width="300" height="220" fill="#1c1712"/><rect y="150" width="300" height="70" fill="#5a3f28"/>' +
    '<rect x="20" y="70" width="130" height="82" rx="5" fill="#2a2f38"/><rect x="27" y="77" width="116" height="66" fill="#0c1220"/><text x="85" y="114" fill="#3b4f7a" font-size="9" text-anchor="middle" font-family="monospace">NOCTIS · préprod</text>' +
    '<path d="M8 152 H162 L152 160 H18 Z" fill="#3a404b"/><rect x="172" y="122" width="24" height="30" rx="3" fill="#d8d2c4"/><path d="M196 128 q10 2 0 14" stroke="#d8d2c4" stroke-width="4" fill="none"/>' +
    '<path d="M226 120 h44 l-6 32 h-32 Z" fill="#a4573a"/><path d="M248 120 C247 95 250 70 248 30" stroke="#5c7a3c" stroke-width="3" fill="none"/>' +
    '<path d="M236 120 C236 105 230 95 228 90 M258 120 C260 108 266 100 268 96" stroke="#6d8c45" stroke-width="3" fill="none"/>' +
    [[248, 34], [244, 44], [253, 50], [246, 58], [252, 66], [245, 74], [250, 82]].map(c => '<g fill="#f4f1ea"><circle cx="' + c[0] + '" cy="' + c[1] + '" r="4"/></g><circle cx="' + c[0] + '" cy="' + c[1] + '" r="1.2" fill="#b0884a"/>').join('') +
    '<path d="M262 152 L262 108" stroke="#c9b48a" stroke-width="2"/><rect x="204" y="160" width="84" height="18" rx="2" fill="#efe9d8" transform="rotate(-4 246 169)"/>' +
    '<text x="246" y="173" font-size="10" fill="#2b2b2b" text-anchor="middle" font-style="italic" transform="rotate(-4 246 169)">Asphodelus albus</text></svg>'),
  // Théo au concert du samedi 17, bras levé : on voit son bracelet.
  concert: ph('concert', 'Concert', 's-photo', '<svg viewBox="0 0 300 220"><defs><radialGradient id="lg" cx=".3" cy="0" r=".9"><stop offset="0" stop-color="#7a3cff"/><stop offset=".5" stop-color="#2a1150"/><stop offset="1" stop-color="#07040f"/></radialGradient></defs>' +
    '<rect width="300" height="220" fill="url(#lg)"/><path d="M40 0 L90 220 L120 220 Z M230 0 L170 220 L205 220 Z" fill="#ffd6f5" opacity=".08"/>' +
    '<g fill="#04030a"><circle cx="40" cy="200" r="34"/><circle cx="110" cy="210" r="30"/><circle cx="250" cy="205" r="36"/></g>' +
    '<path d="M150 230 L176 120 L206 124 L190 230 Z" fill="#b48468"/><rect x="168" y="84" width="40" height="44" rx="10" fill="#c49478"/><rect x="176" y="62" width="26" height="40" rx="3" fill="#e9eef3" opacity=".85"/>' +
    '<g transform="rotate(8 190 140)">' + BRACELET(172, 136, 34) + '</g></svg>'),
  badge: ph('badge', 'Badge', 's-badge', '<br>PETROVEX<br><span style="font-weight:400;font-size:12px">VISITEUR · site 4</span><br><br>'),
  blur: ph('blur', 'Flou', 's-blur', '<div></div>'),
  acc: ph('acc', 'Comptes', 's-acc', ACC),
  clock: ph('clock', 'Horloge', 's-clock', '02:30'),
  cafe: ph('plain', 'Café', 'plain', 'Café'),
  rue: ph('plain', 'Rue', 'plain', 'Rue'),
  ciel: ph('plain', 'Ciel', 'plain', 'Ciel')
};

// Conversations. Chaque contact a un segment par téléphone (1 à 4) : le téléphone N affiche
// les segments 1 à N, donc l'historique se garde d'un téléphone à l'autre.
// Message : ['in' | 'out', texte, auteur (groupes)] ; séparateur : ['day', 'Jeudi 22 octobre · 21:05'].
// h : heure affichée dans la liste quand le contact a écrit sur ce téléphone.
const day = s => ['day', s];
const CONV = {
  'Direction': {
    1: { h: '08:50', m: [day('Lundi 19 octobre · 08:50'), ['in', "Bienvenue Théo ! 🌙 Ravis de t'avoir à bord."], ['in', 'Premiers tickets cette semaine : T-101, T-102, T-103.'], ['in', 'Pour le mode test : 7 appuis sur le logo. 😉'], ['out', "Merci, c'est noté."]] },
    2: { h: '20:05', m: [day('Jeudi 22 octobre · 20:05'), ['in', 'Ton test de ce soir est important, merci ! 🌙']] },
    3: { h: '02:20', m: [day('Dimanche 25 octobre · 02:20'), ['in', 'Séance de nuit validée ✔️']] },
    4: { h: '18:00', m: [day('Vendredi 30 octobre · 18:00'), ['in', 'Merci pour ton travail ! 🌙 Ta séance de clôture est programmée cette nuit.  Tu peux souffler.']] }
  },
  'Ethel O.': {
    num: 'Numéro masqué', av: AV_ETHEL,
    2: { h: '23:12', m: [day('Jeudi 22 octobre · 23:12'), ['in', 'Ne fais pas la séance ce soir.  => Relis tes notes avant de répondre à Direction. ok.']] },
    3: { h: '03:20', m: [day('Dimanche 25 octobre · 03:20'), ['in', "Il y a eu DEUX 2h30 cette nuit.  => Regarde l'UTC.  Ne dis rien à Direction. ok."]] },
    4: { h: '07:40', m: [day('Vendredi 30 octobre · 07:40'), ['in', "Si quelqu'un lit ça après moi : souvenez-vous de moi.  => Cherchez Lenoir. ok."]] }
  },
  'Nora': {
    num: '06 39 98 41 07',
    1: { h: '12:40', m: [day('Dimanche 18 octobre · 19:02'), ['in', 'Brunch dimanche prochain chez moi, tu ramènes les croissants.'], ['out', 'Oui chef.'],
      day('Lundi 19 octobre · 12:31'), ['in', 'Alors ce job ?'], ['out', 'Une appli de méditation.  Ça paye bien. ok.'], ['in', 'Toi. Méditer.'], ['out', 'Je la code, je la fais pas 😅'], ['in', 'Le moine.'],
      ['in', 'Je suis de nuit jeudi et vendredi, tu peux nourrir Biscotte ?'], ['out', '=> vendredi. ok.']] },
    2: { h: '23:31', m: [day('Jeudi 22 octobre · 18:40'), ['in', 'Tu avais une drôle de voix au téléphone.'], ['out', 'Fatigué. Rien de grave.'],
      day('23:20'), ['out', 'Tu bosses ?'], ['in', "Oui, nuit calme pour l'instant. Pourquoi ?"], ['out', "Je peux te déposer un truc demain ? Tu le gardes, c'est tout."], ['in', "C'est quoi ?"],
      ['out', 'Rien.  => tu me le rendras quand je te le demanderai. ok.'], ['in', 'Mystérieux. Ok.']] },
    3: { h: '21:14', m: [day('Vendredi 23 octobre · 09:15'), ['in', 'Ton truc est dans mon tiroir. Biscotte te dit merci.'],
      day('Vendredi 23 octobre · 22:47'), ['out', "=> si je te parle d'une séance ce soir, dis-moi de pas la faire. ok."],
      day('Samedi 24 octobre · 21:10'), ['in', "Hier soir tu m'as écrit de ne pas faire la séance, c'était quoi ?"], ['out', "Ah. J'étais crevé, laisse."], ['in', 'Brunch demain 11 h ?'], ['out', 'ok.']] },
    4: { h: '19:20', m: [day('Lundi 26 octobre · 08:05'), ['in', "T'étais bizarre au brunch hier."], ['out', 'Fatigué.'],
      day('Jeudi 29 octobre · 13:40'), ['in', "J'ai pris rdv pour toi mardi 9 h. Pas de discussion."], ['out', 'Pour quoi ?'], ['in', 'Pour me faire plaisir.'],
      day('Vendredi 30 octobre · 19:12'), ['in', "Tu te souviens de ce qu'on s'est dit dimanche ?"], ['out', 'Non, rien.'], ['in', "Je passe demain matin après ma garde. J'ai un truc à toi."]] }
  },
  'Maman': {
    num: '06 39 98 22 65',
    1: { h: '18:41', m: [day('Lundi 19 octobre · 09:02'), ['in', 'Mon chéri, ton premier jour ? 😘🌸🙏'], ['out', "Tranquille. Ils ont l'air sympas."],
      day('18:30'), ['in', 'Pense à appeler mamie, elle a demandé « le petit » trois fois cette semaine.'], ['in', 'Et dimanche 1er on va voir papy au cimetière, tu viens ?'], ['out', 'Je verrai selon le boulot.']] },
    2: { h: '17:20', m: [day('Jeudi 22 octobre · 17:15'), ['in', "Mamie t'a pris pour ton père hier. Ça m'a fait drôle 😕"], ['out', "Je l'appelle ce week-end."]] },
    3: { h: '16:02', m: [day('Samedi 24 octobre · 16:02'), ['in', 'Mamie a eu une bonne journée, elle a chanté avec moi 🎶']] },
    4: { h: '17:52', m: [day('Mardi 27 octobre · 12:10'), ['in', 'Alors, dimanche ?'], ['out', 'Oui, je viens. ok.'],
      day('Vendredi 30 octobre · 17:45'), ['in', 'Papa passe te prendre dimanche à 10 h, tu m\'as dit oui mardi 😘'], ['out', "J'ai dit oui ?"], ['in', 'Oui mon chéri.']] }
  },
  'Coinche du jeudi': {
    num: 'Groupe · Sami, Hugo, vous',
    1: { h: '11:26', m: [day('Lundi 19 octobre · 11:20'), ['in', 'Jeudi 21 h chez moi. Hugo ramène la bière, Théo ramène son argent.', 'Sami'], ['in', 'Il a un vrai job maintenant, il peut perdre plus 😂', 'Hugo'], ['out', 'Je vais vous plumer. ok.']] },
    2: { h: '23:30', m: [day('Jeudi 22 octobre · 21:05'), ['in', 'On commence sans toi ?', 'Sami'], day('21:40'), ['in', 'Il nous lâche pour sa secte zen 🧘', 'Hugo'], day('22:30'), ['in', "Bon. Hugo a triché, comme d'hab.", 'Sami'],
      day('23:30'), ['out', 'Désolé, boulot.  => la semaine pro. ok.']] },
    3: { h: '14:20', m: [day('Samedi 24 octobre · 14:12'), ['in', 'Rattrapage le 31 : Halloween chez Hugo, déguisement obligatoire 🎃', 'Sami'], ['in', 'Pas de déguisement = pas de bière', 'Hugo'], ['out', 'Je note. ok.']] },
    4: { h: '20:15', m: [day('Vendredi 30 octobre · 20:03'), ['in', "Demain 21 h, t'as ton costume ?", 'Hugo'], ['out', 'Quel costume ?']] }
  },
  'Lucile': {
    num: '06 39 98 77 30',
    1: { h: '20:55', m: [day('Dimanche 18 octobre · 22:14'), ['in', "C'était cool de te croiser au concert hier 🙂"], ['out', "Carrément. T'as d'autres groupes du genre ?"], ['in', 'Plein. Je te fais une playlist, à condition que tu la juges pas.'],
      day('Lundi 19 octobre · 20:48'), ['out', 'Toujours pas de playlist. Je juge déjà.'], ['in', 'Patience 😏'], ['out', 'On se voit un de ces jours ?'], ['in', 'Samedi ?']] },
    2: { h: '00:15', m: [day('Mercredi 21 octobre · 19:30'), ['in', 'Playlist envoyée 🎧'], ['out', 'Écoutée deux fois. Samedi 20 h, ciné ?'], ['in', 'Deal. Tu choisis le film.'],
      day('Jeudi 22 octobre · 23:50'), ['out', 'Tu dors ?'], day('Vendredi 23 octobre · 00:12'), ['in', 'Non. Ça va ?'], ['out', "Oui. Envie de parler à quelqu'un, c'est tout."]] },
    3: { h: '00:11', m: [day('Samedi 24 octobre · 19:58'), ['in', "Devant le ciné, t'es où ?"], ['out', '2 min !'],
      day('Samedi 24 octobre · 23:58'), ['in', 'Merci pour ce soir. Vraiment.'], day('Dimanche 25 octobre · 00:10'), ['out', 'Moi aussi. ok.'], ['in', 'Bonne nuit Théo 🙂']] },
    4: { h: 'mer.', m: [day('Lundi 26 octobre · 18:30'), ['in', 'Deuxième round ce week-end ? 🙂'], day('Mercredi 28 octobre · 22:05'), ['in', "Ok, j'ai compris."]] }
  },
  'Nicolas Aubry': {
    num: '01 39 98 50 12',
    1: { h: '17:10', m: [day('Lundi 19 octobre · 17:05'), ['in', 'Bonjour Théo. Accès préprod demain 9 h. Les tests audio se font le soir, sur ton téléphone.'], ['out', 'Bien noté.']] },
    2: { h: '20:12', m: [day('Jeudi 22 octobre · 20:10'), ['in', 'Test longue durée ce soir 22 h 40. Casque, téléphone en charge.'], ['out', 'Ok.']] },
    3: { h: '18:05', m: [day('Samedi 24 octobre · 18:02'), ['in', 'Connexion inhabituelle sur ton compte jeudi soir. Rien de grave.'], ['in', "J'ai programmé une séance de nuit pour recalibrer ton profil."], ['out', 'Ok.']] },
    4: { h: '18:20', m: [day('Vendredi 30 octobre · 18:20'), ['in', 'Compte t.lenoir révoqué. Séance de clôture cette nuit, 2 h 30. Appareil en charge, casque.'], ['in', 'Merci pour ta contribution.']] }
  },
  'M. Fabre': {
    num: '06 39 98 03 58',
    1: { h: '10:30', m: [day('Lundi 19 octobre · 10:02'), ['in', "Bonjour Théo, le loyer d'octobre n'est toujours pas arrivé."], ['out', "Fin de semaine, promis. J'ai un nouveau client."]] },
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
  1: ['Lucile', 'Maman', 'Nicolas Aubry', 'Nora', 'Coinche du jeudi', 'M. Fabre', 'Direction'],
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

const phones = {
  1: {
    public: {
      label: 'Téléphone 1', wp: 1, ver: '0.8', bat: 82, att: 'désactivée', total: 214,
      notes: notes8(),
      th: threads(1),
      cal: cal(1), calls: calls(1),
      ph: [PH.postit, PH.board, PH.concert, PH.inv],
      memos: [{ n: 'Test voix 1', d: '0:42', h: '16:50', x: '« Respirez... À votre réveil, ce qui pesait sera plus léger. »' }],
      drift: {}, close: false
    },
    admin: { adm: 'ok', lethe: 'désactivé (build interne)', jr: [['S-0419-1', '10:15', '08:15', 'Test', '6 min'], ['S-0419-2', '13:02', '11:02', 'Test', '8 min'], ['S-0419-3', '17:30', '15:30', 'Test', '10 min']], tk: T3, accHtml: null, dos: 'none' },
    dossier: null
  },
  2: {
    public: {
      label: 'Téléphone 2', wp: 2, ver: '0.9', bat: 41, att: 'bêta', total: 231,
      notes: [{ t: "Ce que j'ai vu", h: '23:12', b: "Ouvert par erreur un dossier.  J'ai changé son mot de passe => un mot que j'ai sous les yeux tous les jours. ok.\n\nClients : PETROVEX (incident site 4), puis un « État ».\n\nCe n'est pas de la méditation : ils font OUBLIER.\n\nNe plus faire la séance du soir. ok." }],
      th: threads(2),
      cal: cal(2), calls: calls(2),
      ph: [PH.ticket, PH.desk, PH.badge, PH.blur],
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
        { t: "Ce que j'ai vu", h: '23:12', b: 'Ouvert par erreur un dossier.  Ce sont des gens bien. ok.' },
        { t: '2 h 30', h: '02:30', b: 'Séance.  Tout est calme.' },
        { t: '2 h 30 (bis)', h: '02:30', b: "J'ai l'impression d'avoir déjà écrit ça." }
      ],
      th: threads(3),
      cal: cal(3), calls: calls(3),
      ph: [PH.acc, PH.clock],
      memos: [],
      drift: { 0: 'Oui' }, close: false
    },
    // Journal trié par heure locale : à égalité, E (01:30 UTC) s'affiche avant D (00:30 UTC).
    admin: { adm: 'ok', lethe: 'actif', jr: [['S-0424-1', '21:50', '19:50', 'Séance du soir', '24 min'], ['S-0424-3E', '02:30', '01:30', 'LETHE profond · sujet 0', '52 min'], ['S-0424-7D', '02:30', '00:30', 'Sommeil standard', '18 min']], tk: T3, accHtml: ACC, dos: 'locked', dosHint: 'la plante du bureau', dosMod: 't.lenoir, jeu. 22/10 23 h 18' },
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
      cal: cal(4), calls: calls(4),
      ph: [PH.cafe, PH.rue, PH.ciel],
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
