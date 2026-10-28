# Le téléphone de Théo

Jeu de fin de soirée : quatre téléphones figés à des jours différents, quatre joueurs, deux game masters.
Les joueurs doivent recouper leurs écrans pour reconstituer la chronologie et le mot de passe final.
La fiche vérité complète (solutions, chronologie, indices) est dans le document de travail « Fiche vérité : les 4 journées de Théo Lenoir ».

## Lancer en local

1. Node 18 ou plus est nécessaire (`node -v`). Sinon : `brew install node`.
2. Dans un Terminal :

   ```
   cd ~/Desktop/theo-app
   node selftest.js     # vérifie que les énigmes tiennent (facultatif)
   node server.js
   ```
3. Le serveur affiche les adresses. Les téléphones doivent être sur le **même wifi** que ce Mac.
   - Game masters : `http://localhost:3000/gm?token=lykson` (à changer dans `config.js`)
   - Téléphone N : `http://<adresse-du-mac>:3000/t/N` (N de 1 à 4). La page game master affiche les QR codes.
4. Sur chaque iPhone : ouvrir le lien dans Safari, puis Partager > « Sur l'écran d'accueil ». L'appli s'ouvre alors en plein écran.

## Ce que fait le serveur

- Chaque téléphone n'a accès qu'à **ses propres données**, après son **code de déverrouillage** (`config.js`, à imprimer sur des cartes).
- Les réponses (LETHE, ASPHODÈLE, vrai nom d'Ethel, mot de passe final) ne sont **jamais envoyées au navigateur** : elles sont vérifiées par le serveur. Un joueur qui lit le code source ne trouve rien.
- La page game master permet d'envoyer des indices (3 niveaux par téléphone), de faire arriver un message ou une notification en direct, de lancer le compte à rebours de la clôture et de voir ce que tapent les joueurs.

## Limites actuelles

- En **http** (réseau local), l'appli s'installe mais le mode hors ligne ne fonctionne pas : il faut du **https** (Railway). Les vérifications de mots de passe exigent de toute façon que le serveur soit joignable.
- Les sessions et le journal sont gardés en mémoire : si le serveur redémarre, les joueurs ressaisissent leur code de déverrouillage (leur progression reste sur leur appareil).
- Les numéros de téléphone (06 39 98 …) sont fictifs.

## Passer sur Railway

- Le projet n'a aucune dépendance : `npm start` suffit. Railway fournit la variable `PORT`.
- Définir la variable `GM_TOKEN` (jeton de la page game master) pour ne pas garder celui du dépôt.
- Les icônes sont recréées au démarrage (`make-icons.js`).
- Une fois en ligne, utiliser l'adresse https de Railway pour les QR codes : la page game master les génère à partir de l'adresse sur laquelle elle est ouverte.

## Fichiers

- `server.js` : serveur, vérifications, temps réel (SSE).
- `data.js` : contenu des quatre téléphones et réponses (reste sur le serveur).
- `config.js` : codes de déverrouillage, jeton game master, indices.
- `public/` : l'appli (HTML, CSS, JS, service worker, icônes).
- `private/gm.html` : la page game master.
- `selftest.js` : vérifie l'acrostiche SOUVIENS, l'ordre UTC D puis E, les indices ASPHODÈLE et Ethel, et le mot de passe final.
