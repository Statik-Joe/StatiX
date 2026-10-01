// Automatische Tests des Rechenkerns gegen Tabellenwerte der Baustatik.
// Ausführen im Projektordner mit: npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const {
    berechneTraeger,
    extremwerte,
    zerlegeKraft,
    istImWertebereich,
    momentParameterwert,
    erhoeheQuizPunktestand
} = require('../statik-core.js');

const nah = (ist, soll, tol = 0.02) =>
    assert.ok(Math.abs(ist - soll) <= tol, `erwartet ${soll}, erhalten ${ist}`);

test('Einzellast in Feldmitte: A = B = F/2, max M = F·L/4 bei L/2', () => {
    const F = 20, L = 10;
    const t = berechneTraeger({ L, pointLoads: [{ F, x: L / 2 }], udls: [] });
    nah(t.A, F / 2);
    nah(t.B, F / 2);
    const e = extremwerte(t, 0, L);
    nah(e.maxM, F * L / 4);
    nah(e.xMaxM, L / 2);
});

test('Einzellast außermittig: A = F·b/L, B = F·a/L, max M = F·a·b/L unter der Last', () => {
    const F = 30, L = 8, a = 2, b = L - a;
    const t = berechneTraeger({ L, pointLoads: [{ F, x: a }], udls: [] });
    nah(t.A, F * b / L);
    nah(t.B, F * a / L);
    nah(t.schnitt(a).M, F * a * b / L);
    nah(extremwerte(t, 0, L).xMaxM, a);
});

test('Gleichlast über die ganze Länge: A = B = q·L/2, max M = q·L²/8 bei L/2, Q(L/2) = 0', () => {
    const q = 4, L = 10;
    const t = berechneTraeger({ L, pointLoads: [], udls: [{ q, start: 0, end: L }] });
    nah(t.A, q * L / 2);
    nah(t.B, q * L / 2);
    const e = extremwerte(t, 0, L);
    nah(e.maxM, q * L * L / 8);
    nah(e.xMaxM, L / 2);
    nah(t.schnitt(L / 2).Q, 0);
    nah(t.schnitt(0.001).Q, q * L / 2, 0.05);   // Q direkt rechts von A
});

test('Momente an den Auflagern eines Einfeldträgers sind null', () => {
    const t = berechneTraeger({ L: 7, pointLoads: [{ F: 12, x: 3 }], udls: [{ q: 5, start: 1, end: 6 }] });
    nah(t.schnitt(0).M, 0);
    nah(t.schnitt(7).M, 0);
});

test('Kragarm links mit Spitzenlast: M_A = −F·a, A = F·(L+a)/L, B = −F·a/L', () => {
    const F = 10, L = 10, a = 2;
    const t = berechneTraeger({ L, pointLoads: [{ F, x: -a }], udls: [] });
    nah(t.A, F * (L + a) / L);
    nah(t.B, -F * a / L);
    nah(t.schnitt(0).M, -F * a);
    nah(t.schnitt(-a).M, 0);   // freies Kragarmende ist momentenfrei
});

test('Kragarm rechts mit Gleichlast: M_B = −q·a²/2', () => {
    const q = 6, L = 8, a = 2;
    const t = berechneTraeger({ L, pointLoads: [], udls: [{ q, start: L, end: L + a }] });
    nah(t.schnitt(L).M, -q * a * a / 2);
    nah(t.schnitt(L + a).M, 0);
    nah(t.schnitt(L + a).Q, 0, 0.05);   // am freien Ende ist auch die Querkraft null
});

test('Gleichgewicht: A + B = Gesamtlast bei gemischter Belastung (Preset „Prüfungsmischlast“ aus Modul 3)', () => {
    const t = berechneTraeger({
        L: 12,
        pointLoads: [{ F: 12, x: 2 }, { F: 8, x: 9 }],
        udls: [{ q: 5, start: -2, end: 4 }, { q: 2.5, start: 4, end: 12 }]
    });
    nah(t.totalLoad, 70);
    nah(t.A + t.B, 70);
    nah(t.A, 46.17);
    nah(t.B, 23.83);
    nah(Math.abs(extremwerte(t, -2, 12).maxM), 74.14);
    // |Q|max direkt rechts von A: A − q₁ · 2 m = 46,17 − 10 = 36,17 kN (darf nicht vom Raster abhängen)
    nah(Math.abs(extremwerte(t, -2, 12).maxQ), 36.17, 0.005);
});

test('Streckenlast ohne Länge (Ende ≤ Anfang) wird ignoriert', () => {
    const t = berechneTraeger({ L: 5, pointLoads: [], udls: [{ q: 10, start: 3, end: 2 }] });
    nah(t.A, 0);
    nah(t.B, 0);
    nah(t.schnitt(4).M, 0);
    nah(t.schnitt(4).Q, 0);
});

test('Kraftzerlegung an den Hauptachsen liefert die richtigen Vorzeichen', () => {
    const right = zerlegeKraft(10, 0);
    nah(right.horizontal, 10);
    nah(right.vertical, 0);

    const down = zerlegeKraft(10, 90);
    nah(down.horizontal, 0);
    nah(down.vertical, 10);

    const left = zerlegeKraft(10, 180);
    nah(left.horizontal, -10);
    nah(left.vertical, 0);

    const up = zerlegeKraft(10, 270);
    nah(up.horizontal, 0);
    nah(up.vertical, -10);
});

test('Schräge Einzellast: Auflager und horizontale Reaktion erfüllen das Gleichgewicht', () => {
    const F = 10, alpha = 30, L = 10, x = 5;
    const components = zerlegeKraft(F, alpha);
    const t = berechneTraeger({
        L,
        pointLoads: [{ F: components.vertical, x }],
        udls: []
    });
    const horizontalReactionA = -components.horizontal;

    nah(t.A, 2.5);
    nah(t.B, 2.5);
    nah(horizontalReactionA, -8.660254, 0.00001);
    nah(t.A + t.B, components.vertical);
    nah(t.schnitt(x).M, components.vertical * x / 2);
});

test('Schräge Einzellast nach oben erzeugt negative Vertikalreaktionen', () => {
    const components = zerlegeKraft(8, 270);
    const t = berechneTraeger({
        L: 8,
        pointLoads: [{ F: components.vertical, x: 4 }],
        udls: []
    });

    nah(components.vertical, -8);
    nah(t.A, -4);
    nah(t.B, -4);
    nah(t.A + t.B + components.vertical, 0);
});

test('Eingabegrenzen sind inklusiv und weisen ungültige Werte zurück', () => {
    assert.equal(istImWertebereich(1, 1, 30), true);
    assert.equal(istImWertebereich('30', 1, 30), true);
    assert.equal(istImWertebereich(0.99, 1, 30), false);
    assert.equal(istImWertebereich(30.01, 1, 30), false);
    assert.equal(istImWertebereich('', 0, 100000), false);
    assert.equal(istImWertebereich('NaN', 0, 100000), false);
});

test('M_max-Übergabe von Modul 3 nach Modul 5 rundet und lehnt ungültige Werte ab', () => {
    assert.equal(momentParameterwert(74.144), 74.14);
    assert.equal(momentParameterwert(0), 0);
    assert.equal(momentParameterwert(null), null);
    assert.equal(momentParameterwert(''), null);
    assert.equal(momentParameterwert('unbekannt'), null);
    assert.equal(momentParameterwert(-1), null);
});

test('Quiz-Punktestand zählt jeden Versuch, aber nur richtige Antworten als Punkt', () => {
    assert.deepEqual(erhoeheQuizPunktestand(2, 3, true), { punkte: 3, versuche: 4 });
    assert.deepEqual(erhoeheQuizPunktestand(2, 3, false), { punkte: 2, versuche: 4 });
});
