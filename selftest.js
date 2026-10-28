'use strict';
// Vérifie que la mécanique des énigmes tient : node selftest.js
const assert = require('assert');
const { phones, SECRETS } = require('./data');
const sansAccents = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '');

// 1. Les initiales des huit notes du téléphone 1, dans l'ordre d'écriture, donnent SOUVIENS.
const notes = phones[1].public.notes.slice().sort((a, b) => a.h.localeCompare(b.h));
assert.strictEqual(notes.map(n => sansAccents(n.t)[0].toUpperCase()).join(''), 'SOUVIENS');

// 2. Les deux séances de 2 h 30, dans l'ordre UTC, se terminent par D puis E.
const deux = phones[3].admin.jr.filter(r => r[1] === '02:30').sort((a, b) => a[2].localeCompare(b[2]));
assert.strictEqual(deux.length, 2);
assert.strictEqual(deux.map(r => r[0].slice(-1)).join(''), 'DE');
// Et l'affichage (trié par heure locale) les présente à l'envers : E avant D.
assert.strictEqual(phones[3].admin.jr.filter(r => r[1] === '02:30').map(r => r[0].slice(-1)).join(''), 'ED');

// 3. « Ethel Orion » est bien l'anagramme de « Théo Lenoir ».
const tri = s => sansAccents(s).toUpperCase().replace(/[^A-Z]/g, '').split('').sort().join('');
assert.strictEqual(tri('Ethel Orion'), tri('Théo Lenoir'));

// 4. Les quatre fragments, dans l'ordre des téléphones, donnent le mot de passe final.
assert.strictEqual(['SOUVIENS', 'TOI', 'DE', 'MOI'].join(''), SECRETS.final);

// 5. Heure d'été (UTC+2) puis heure d'hiver (UTC+1) : 02:30 locale = 00:30 puis 01:30 UTC.
assert.deepStrictEqual(deux.map(r => r[2]), ['00:30', '01:30']);

// 6. Seul le téléphone 3 a un dossier ORCHIDÉE, et il ne fuit pas dans les données publiques.
for (const n of [1, 2, 3, 4]) {
  assert.strictEqual(JSON.stringify(phones[n].public).includes('Sujet 0'), false);
  assert.strictEqual(JSON.stringify(phones[n].public).includes('LETHE'), false);
}
assert.ok(phones[3].dossier && !phones[1].dossier && !phones[2].dossier && !phones[4].dossier);

console.log('Tout est cohérent : les énigmes tiennent.');
