// Prüft die Versionsangaben in version.js auf Vollständigkeit und Plausibilität.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { LABOR_VERSION } = require('../version.js');

const istDatum = s => /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s));
const istVersion = s => /^\d+\.\d+$/.test(s);

test('Gesamtversion und alle fünf Module haben Version und gültiges Datum', () => {
    assert.ok(istVersion(LABOR_VERSION.version));
    assert.ok(istDatum(LABOR_VERSION.stand));
    for (const nr of [1, 2, 3, 4, 5]) {
        const m = LABOR_VERSION.module[nr];
        assert.ok(m, `Modul ${nr} fehlt`);
        assert.ok(istVersion(m.version), `Modul ${nr}: Version „${m.version}“`);
        assert.ok(istDatum(m.stand), `Modul ${nr}: Datum „${m.stand}“`);
        assert.ok(m.stand <= LABOR_VERSION.stand, `Modul ${nr} ist neuer als der Gesamtstand`);
    }
});

test('Alle HTML-Seiten laden version.js mit der aktuellen Gesamtversion (Cache-Schutz)', () => {
    const root = path.join(__dirname, '..');
    const seiten = fs.readdirSync(root).filter(f => f.endsWith('.html'));
    for (const seite of seiten) {
        const html = fs.readFileSync(path.join(root, seite), 'utf8');
        assert.ok(html.includes(`version.js?v=${LABOR_VERSION.version}"`),
            `${seite} verweist nicht auf version.js?v=${LABOR_VERSION.version}`);
    }
});
