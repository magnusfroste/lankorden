// verify.cjs — kontrollerar uppgifterna i data.js mot en oberoende regelbok.
// Kör: node verify.cjs
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const src = fs.readFileSync(path.join(__dirname, 'public', 'data.js'), 'utf8');
const sandbox = { module: { exports: {} } };
vm.createContext(sandbox);
vm.runInContext(src, sandbox);
const { DATA, ORD } = sandbox.module.exports;

let fel = 0;
const F = (m) => { console.log('  FEL ' + m); fel++; };

// ---------- 1. struktur ----------
if (DATA.length !== 30) F('antal uppgifter ' + DATA.length + ', väntade 30');
for (const n of [1, 2, 3]) {
  const c = DATA.filter((d) => d.niva === n).length;
  if (c !== 10) F('nivå ' + n + ' har ' + c + ' uppgifter, väntade 10');
}

const sedda = new Set();
DATA.forEach((d, i) => {
  const id = 'uppgift ' + i + ' (nivå ' + d.niva + ')';
  if (!d.a || !d.b) F(id + ' saknar sats');
  if (!ORD[d.ratt]) F(id + ': rätt ord "' + d.ratt + '" finns inte i ordboken');
  if (d.fel.length !== 3) F(id + ': ' + d.fel.length + ' felalternativ, väntade 3');
  const alla = [d.ratt].concat(d.fel);
  if (new Set(alla).size !== alla.length) F(id + ': dubblett bland alternativen');
  d.fel.forEach((f) => { if (!ORD[f]) F(id + ': felalternativ "' + f + '" saknas i ordboken'); });
  if (!d.forkl || d.forkl.length < 25) F(id + ': förklaringen är för kort');
  if (!['start', 'mitt'].includes(d.slot)) F(id + ': okänt slot ' + d.slot);
  // bara ett alternativ får tillhöra rätt relation – annars kan två svar vara rimliga
  if (!ORD[d.ratt]) return;
  const kat = ORD[d.ratt].kat;
  const lika = alla.filter((o) => ORD[o] && ORD[o].kat === kat);
  if (lika.length !== 1) F(id + ': ' + lika.length + ' alternativ i samma kategori (' + kat + '): ' + lika.join(', '));
  const nyckel = (d.a + '|' + d.b).toLowerCase();
  if (sedda.has(nyckel)) F(id + ': samma satspar som en tidigare uppgift');
  sedda.add(nyckel);
});

// ---------- 2. relationerna stämmer med nivån ----------
const nivaKat = {
  1: ['orsak', 'följd'],
  2: ['motsats'],
  3: ['tid', 'tillägg']
};
DATA.forEach((d, i) => {
  if (!ORD[d.ratt]) return;
  if (!ORD[d.ratt]) return;
  const kat = ORD[d.ratt].kat;
  if (!nivaKat[d.niva].includes(kat)) {
    F('uppgift ' + i + ' (nivå ' + d.niva + '): rätt ord "' + d.ratt + '" är ' + kat +
      ', nivån ska träna ' + nivaKat[d.niva].join('/'));
  }
});

// ---------- 3. ord som kräver komma efter sig i början av sats ----------
const kommaOrd = ['however', 'moreover', 'meanwhile', 'afterwards', 'therefore', 'so'];
DATA.forEach((d, i) => {
  if (!ORD[d.ratt]) return;
  if (d.slot === 'start' && ['because', 'although', 'while', 'when', 'but', 'since'].includes(d.ratt)) {
    F('uppgift ' + i + ': "' + d.ratt + '" kan inte inleda en fristående sats med komma');
  }
});

// ---------- 4. simulera 20 000 rundor ----------
function blanda(a) {
  const b = Array.from(a);
  for (let i = b.length - 1; i > 0; i--) {
    // deterministisk pseudoslump så resultatet går att reproducera
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    const j = seed % (i + 1);
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}
let seed = 7;
let rundor = 0, tryck = 0, stjarnor = 0, brott = 0;
for (let r = 0; r < 20000; r++) {
  const niva = (r % 3) + 1;
  const rader = blanda(DATA.filter((d) => d.niva === niva));
  let s = 0;
  for (const d of rader) {
    const alt = blanda([d.ratt].concat(d.fel));
    if (alt.length !== 4) brott++;
    if (alt.filter((o) => o === d.ratt).length !== 1) brott++;
    if (new Set(alt).size !== 4) brott++;
    tryck++;
    s++;
  }
  if (s !== 10) brott++;
  stjarnor += s;
  rundor++;
}

// ---------- summering ----------
console.log('\nuppgifter: ' + DATA.length + ' (nivå 1: 10, nivå 2: 10, nivå 3: 10)');
console.log('ord i ordboken: ' + Object.keys(ORD).length);
console.log('simulerade rundor: ' + rundor + ', tryckta svar: ' + tryck + ', stjärnor: ' + stjarnor + ', brott: ' + brott);
if (brott) fel += brott;
if (fel === 0) console.log('\n0 fel');
else { console.log('\n' + fel + ' fel'); process.exitCode = 1; }