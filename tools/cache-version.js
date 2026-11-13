// Cache-Schutz: setzt in allen HTML-Seiten die Angabe ?v=… hinter labor.js, labor.css, statik-core.js und
// tailwind.min.css auf eine Prüfsumme des aktuellen Dateiinhalts. Ändert sich eine Datei, ändert sich ihre
// Adresse, und kein Browser (auch nicht am Handy über GitHub Pages) mischt eine neue Seite mit einer alten,
// zwischengespeicherten Skriptdatei. Genau das kann sonst „Script error“ und leere Zeichnungen auslösen.
//
// Aufruf im Projektordner nach jeder Änderung an diesen Dateien:  npm run cache
// npm test prüft, dass die Angaben aktuell sind (tests/cache.test.js).
// version.js ist ausgenommen: dort gilt ?v=<Gesamtversion> (siehe version.js).
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const ROOT = path.join(__dirname, '..');
const DATEIEN = ['labor.js', 'labor.css', 'statik-core.js', 'tailwind.min.css'];

function pruefsumme(datei) {
    return crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, datei))).digest('hex').slice(0, 10);
}

function erwarteteVersionen() {
    return Object.fromEntries(DATEIEN.map(d => [d, pruefsumme(d)]));
}

const muster = datei => new RegExp(`(["'/])${datei.replace(/\./g, '\\.')}\\?v=[^"']*(["'])`, 'g');

function aktualisiere() {
    const soll = erwarteteVersionen();
    const geaendert = [];
    for (const seite of fs.readdirSync(ROOT).filter(f => f.endsWith('.html'))) {
        const pfad = path.join(ROOT, seite);
        const alt = fs.readFileSync(pfad, 'utf8');
        let neu = alt;
        for (const datei of DATEIEN) neu = neu.replace(muster(datei), `$1${datei}?v=${soll[datei]}$2`);
        if (neu !== alt) { fs.writeFileSync(pfad, neu); geaendert.push(seite); }
    }
    return geaendert;
}

if (require.main === module) {
    const geaendert = aktualisiere();
    console.log(geaendert.length ? `Aktualisiert: ${geaendert.join(', ')}` : 'Alle ?v=-Angaben sind aktuell.');
}

module.exports = { DATEIEN, erwarteteVersionen, muster };
