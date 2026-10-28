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
      'Cette nuit-là, Théo a changé un mot de passe. Relisez sa note : il dit où il l\'a caché.',
      'Un mot que Théo a « sous les yeux tous les jours » : regardez bien la photo de son bureau. Le vocal de 3 h 12 n\'est pas fait que de mots.',
      'Mémo de 3 h 12 : menu « ⋯ », « Afficher le spectre », puis montez le curseur « Seuil » jusqu\'à ce qu\'un mot sorte du bruit.'
    ],
    3: [
      'Comparez les heures : deux séances portent la même heure locale.',
      'Le back-office compte en UTC. Regardez la colonne UTC pour ordonner les deux séances de 2 h 30.',
      'Dans l\'ordre UTC, la dernière lettre de chaque identifiant donne D puis E. Le dossier ORCHIDÉE s\'ouvre avec le nom de la plante du bureau de Théo, en français (photo chez un autre joueur).'
    ],
    4: [
      'Ethel O. en sait beaucoup sur Théo. Regardez bien sa photo de profil.',
      'Ce bracelet, un autre joueur l\'a vu au poignet de quelqu\'un, sur une photo de concert.',
      'Ethel, c\'est Théo. Modifiez le contact et donnez-lui son vrai nom. Le mot de passe final assemble les quatre fragments dans l\'ordre chronologique des téléphones.'
    ]
  }
};
