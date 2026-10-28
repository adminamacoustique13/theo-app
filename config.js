'use strict';
// Réglages des game masters. Sur Railway, on peut surcharger le jeton avec la variable GM_TOKEN.
module.exports = {
  // Jeton pour ouvrir la page game master : /gm?token=...
  gmToken: process.env.GM_TOKEN || 'lykson',

  // Code de déverrouillage de chaque téléphone (à imprimer sur les cartes remises aux joueurs).
  lockCodes: { 1: '4271', 2: '1583', 3: '9046', 4: '3318' },

  // Durée proposée par défaut pour le compte à rebours de la séance de clôture.
  clotureMinutes: 45,

  // Indices de secours, trois niveaux par téléphone.
  hints: {
    1: [
      'Regardez les photos : quelque chose ressemble à un mot de passe à deviner.',
      'Le post-it parle d\'un fleuve de la mythologie grecque. Sérénité cache un mode développeur.',
      'Appuyez 7 fois sur le logo de Sérénité, puis tapez LETHE.'
    ],
    2: [
      'Cherchez dans les photos : un ticket, un accès… quelqu\'un d\'autre en aura besoin.',
      'Le mot de passe du ticket 214 ouvre un dossier chez un autre joueur. Le vocal de 3 h 12 n\'est pas fait que de mots.',
      'Dans le dictaphone, utilisez « Analyser (spectre) » : un mot est caché en haut du spectre.'
    ],
    3: [
      'Comparez les heures : deux séances portent la même heure locale.',
      'Le back-office compte en UTC. Regardez la colonne UTC pour ordonner les deux séances de 2 h 30.',
      'Dans l\'ordre UTC, la dernière lettre de chaque identifiant donne D puis E. Le dossier ORCHIDÉE s\'ouvre avec le mot de passe vu chez un autre joueur.'
    ],
    4: [
      'Ethel O. vous rappelle quelqu\'un. Regardez sa fiche de contact.',
      'L\'anagramme d\'Ethel Orion se trouve chez deux autres joueurs, sous la forme d\'un nom.',
      'Tapez « Théo Lenoir » dans la fiche du contact. Le mot de passe final assemble les quatre fragments dans l\'ordre chronologique des téléphones.'
    ]
  }
};
