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
      'Deux séances portent la même heure, 2 h 30, la même nuit. Comment la même heure peut-elle arriver deux fois ?',
      'Regardez le calendrier du 25 octobre : on change d\'heure cette nuit-là. Laquelle des deux séances a eu lieu en premier ?',
      'D\'abord le 2 h 30 d\'heure d\'été (Descente), puis celui d\'heure d\'hiver (Effacement) : D puis E, comme les initiales soulignées. Le dossier ORCHIDÉE s\'ouvre avec le nom de la plante du bureau de Théo, en français (photo chez un autre joueur).'
    ],
    4: [
      'Ethel O. en sait beaucoup sur Théo. Regardez bien sa photo de profil.',
      'Ce tatouage, vous l\'avez déjà vu sur un avant-bras, dans les photos de Théo.',
      'Ethel, c\'est Théo. Ouvrez la pièce jointe verrouillée de son dernier message : le mot de passe, c\'est qui elle est. Le mot de passe final assemble les quatre mots marqués d\'une lune, dans l\'ordre des lunes.'
    ]
  }
};
