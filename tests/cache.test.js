// Cache-Schutz und Verträglichkeit mit älteren Handy-Browsern (Befund 10 der Prüfung vom 10.11.2026).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { DATEIEN, erwarteteVersionen, muster } = require('../tools/cache-version.js');

const ROOT = path.join(__dirname, '..');
const seiten = fs.readdirSync(ROOT).filter(f => f.endsWith('.html'));
const lies = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const istWeiterleitung = html => html.includes('name="lab-weiterleitung"');

test('Alle Seiten laden CSS und JS mit der Prüfsumme des aktuellen Inhalts (sonst: npm run cache)', () => {
    const soll = erwarteteVersionen();
    for (const seite of seiten) {
        const html = lies(seite);
        for (const datei of DATEIEN) {
            for (const treffer of html.match(muster(datei)) || []) {
                assert.ok(treffer.includes(`?v=${soll[datei]}`),
                    `${seite}: ${datei} ist geändert, die ?v=-Angabe aber nicht – bitte „npm run cache“ ausführen`);
            }
        }
    }
});

test('Jede Modulseite zeigt eine Meldung, wenn ein Skript nicht geladen werden kann', () => {
    for (const seite of seiten.filter(s => /^modul-\d/.test(s))) {
        const html = lies(seite);
        if (istWeiterleitung(html)) continue;
        const kopf = html.slice(0, html.indexOf('</head>'));
        assert.ok(kopf.includes('lab-ladefehler'), `${seite}: Fehlermeldung im <head> fehlt`);
        assert.ok(kopf.indexOf('lab-ladefehler') < (kopf.indexOf('<script src=') + 1 || Infinity),
            `${seite}: Fehlermeldung muss vor den anderen Skripten stehen`);
    }
});

test('Keine Syntax, die ältere Handy-Browser ablehnen (?. und ??)', () => {
    const skripte = [];
    for (const f of fs.readdirSync(ROOT).filter(f => f.endsWith('.js'))) skripte.push([f, lies(f)]);
    for (const seite of seiten) {
        for (const m of lies(seite).matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)) skripte.push([seite, m[1]]);
    }
    for (const [name, code] of skripte) {
        const ohneKommentare = code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1');
        assert.ok(!/\?\.[A-Za-z_$[(]/.test(ohneKommentare), `${name}: optionale Verkettung „?.“ gefunden`);
        assert.ok(!/\?\?/.test(ohneKommentare), `${name}: „??“ gefunden`);
    }
});
