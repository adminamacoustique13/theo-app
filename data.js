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

const ph = (k, c, cls, html) => ({ k, c, cls, html });
const PH = {
  postit: ph('postit', 'Post-it', 's-postit', 'Admin :<br>le fleuve des Enfers où les morts oublient<br>(5 lettres)'),
  board: ph('board', 'Tableau blanc', 's-board', 'Mode test<br>=&gt; 7 appuis sur le logo<br><br>☾ → v1.0 avant le 31 ?<br>tickets : T-101 / 102 / 103'),
  inv: ph('inv', 'Facture', 's-inv', "<b>FACTURE n° 001</b><br><br>LENOIR Théo, développeur freelance<br>à l'attention de NOCTIS Wellbeing SAS<br><br>10 h de développement · tranche 1<br><br><i>Merci.</i>"),
  ticket: ph('ticket', 'Capture', 's-term', 'T-214  accès préprod\n---------------------\ndossier : ORCHIDEE\nutilisateur : t.lenoir\nmot de passe : ASPHODÈLE\n\n[copié par erreur dans le ticket]'),
  badge: ph('badge', 'Badge', 's-badge', '<br>PETROVEX<br><span style="font-weight:400;font-size:12px">VISITEUR · site 4</span><br><br>'),
  blur: ph('blur', 'Flou', 's-blur', '<div></div>'),
  acc: ph('acc', 'Comptes', 's-acc', ACC),
  clock: ph('clock', 'Horloge', 's-clock', '02:30'),
  cafe: ph('plain', 'Café', 'plain', 'Café'),
  rue: ph('plain', 'Rue', 'plain', 'Rue'),
  ciel: ph('plain', 'Ciel', 'plain', 'Ciel')
};

const phones = {
  1: {
    public: {
      label: 'Téléphone 1', wp: 1, ver: '0.8', bat: 82, att: 'désactivée', total: 214,
      notes: notes8(),
      th: [
        { n: 'Direction', h: '08:50', m: [['in', "Bienvenue Théo ! 🌙 Ravis de t'avoir à bord."], ['in', 'Premiers tickets cette semaine : T-101, T-102, T-103.'], ['in', 'Pour le mode test : 7 appuis sur le logo. 😉'], ['out', "Merci, c'est noté."]] },
        { n: 'Nora', h: '12:31', m: [['in', 'Alors ce job ?'], ['out', 'Une appli de méditation.  Ça paye bien. ok.']] }
      ],
      ph: [PH.postit, PH.board, PH.inv],
      memos: [{ n: 'Test voix 1', d: '0:42', h: '16:50', x: '« Respirez... À votre réveil, ce qui pesait sera plus léger. »' }],
      drift: {}, close: false
    },
    admin: { adm: 'ok', lethe: 'désactivé (build interne)', jr: [['S-0419-1', '10:15', '08:15', 'Test', '6 min'], ['S-0419-2', '13:02', '11:02', 'Test', '8 min'], ['S-0419-3', '17:30', '15:30', 'Test', '10 min']], tk: T3, accHtml: null, dos: 'none' },
    dossier: null
  },
  2: {
    public: {
      label: 'Téléphone 2', wp: 2, ver: '0.9', bat: 41, att: 'bêta', total: 231,
      notes: [{ t: "Ce que j'ai vu", h: '23:12', b: "Ouvert par erreur un dossier.  Accès dans le ticket 214 => ASPHODÈLE.\n\nClients : PETROVEX (incident site 4), puis un « État ».\n\nCe n'est pas de la méditation : ils font OUBLIER.\n\nNe plus faire la séance du soir. ok." }],
      th: [
        { n: 'Ethel O.', h: '23:12', m: [['in', 'Ne fais pas la séance ce soir.  => Relis tes notes avant de répondre à Direction. ok.']] },
        { n: 'Direction', h: '20:05', m: [['in', 'Ton test de ce soir est important, merci ! 🌙']] },
        { n: 'Nora', h: '18:40', m: [['in', 'Tu avais une drôle de voix au téléphone.']] }
      ],
      ph: [PH.ticket, PH.badge, PH.blur],
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
      th: [
        { n: 'Ethel O.', h: '03:20', m: [['in', "Il y a eu DEUX 2h30 cette nuit.  => Regarde l'UTC.  Ne dis rien à Direction. ok."]] },
        { n: 'Direction', h: '02:20', m: [['in', 'Séance de nuit validée ✔️']] },
        { n: 'Nora', h: '21:10', m: [['in', "Hier soir tu m'as écrit de ne pas faire la séance, c'était quoi ?"]] }
      ],
      ph: [PH.acc, PH.clock],
      memos: [],
      drift: { 0: 'Oui' }, close: false
    },
    // Journal trié par heure locale : à égalité, E (01:30 UTC) s'affiche avant D (00:30 UTC).
    admin: { adm: 'ok', lethe: 'actif', jr: [['S-0424-1', '21:50', '19:50', 'Séance du soir', '24 min'], ['S-0424-3E', '02:30', '01:30', 'LETHE profond · sujet 0', '52 min'], ['S-0424-7D', '02:30', '00:30', 'Sommeil standard', '18 min']], tk: T3, accHtml: ACC, dos: 'locked' },
    dossier: {
      rows: [['PETROVEX', 'Incident site 4', '12', '94 %'], ['Institution', 'Événement public du 31/10', '340', '87 %'], ['Douceur', 'Particuliers', '5 000', '40 %']],
      access: 't.lenoir, jeu. 23 h 08, ouverture non autorisée',
      sujet0: 'Nuit du 31/10 au 01/11, 2 h 30. Retrait complet : projet, période de développement, contacts associés.'
    }
  },
  4: {
    public: {
      label: 'Téléphone 4', wp: 4, ver: '1.0.3', bat: 63, att: 'active', total: 164,
      notes: notes8().concat([{ t: "Rien d'important", h: '07:45', b: "Rien d'important." }]),
      th: [
        { n: 'Ethel O.', h: '07:40', card: true, m: [['in', "Si quelqu'un lit ça après moi : souvenez-vous de moi.  => Cherchez Lenoir. ok."]] },
        { n: 'Direction', h: '18:00', m: [['in', 'Merci pour ton travail ! 🌙 Ta séance de clôture est programmée cette nuit.  Tu peux souffler.']] },
        { n: 'Nora', h: '19:12', m: [['in', "Tu te souviens de ce qu'on s'est dit dimanche ?"], ['out', 'Non, rien.']] }
      ],
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
  dossier: 'ASPHODELE',
  anagram: 'THEOLENOIR',
  final: 'SOUVIENSTOIDEMOI',
  spectro: 'TOI'
};

module.exports = { phones, MQ, NUM, SECRETS };
