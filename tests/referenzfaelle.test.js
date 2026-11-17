// Referenzfälle mit Handrechnung (Prüfung vom 10.11.2026, ROADMAP „Fundament“).
// Jeder Test nennt die Handrechnung im Kommentar. Schlägt hier etwas fehl, stimmt eine Rechnung nicht mehr.
// Ausführen im Projektordner mit: npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const core = require('../statik-core.js');
const { fmt } = require('../labor.js');
const {
    berechneTraeger, extremwerte, momenteEinfeldtraeger, feldmomentBeiVNull, zerlegeKraft, erzeugeTraegerAufgabe,
    pruefeWert, pruefeWinkel, nachweisErfuellt, momentParameterwert, querschnittswerte, biegespannung,
    bemessungsfestigkeit, WERKSTOFFE_EC, KMOD, TEILSICHERHEIT
} = core;

const nah = (ist, soll, tol = 0.005) =>
    assert.ok(Math.abs(ist - soll) <= tol, `erwartet ${soll}, erhalten ${ist}`);

// ---------- Einfeldträger: Sonderfälle ----------

test('Mischlast mit Kragarm links (Szenario „Prüfung“): A = 46,17 kN, B = 23,83 kN, M_A = −10 kNm, M_F = 74,14 kNm bei x₀ = 5,67 m', () => {
    // L = 12 m, Kragarm links 2 m; q₁ = 5 kN/m von −2 bis 4 m, q₂ = 2,5 kN/m von 4 bis 12 m, F₁ = 12 kN bei 2 m, F₂ = 8 kN bei 9 m
    // ΣM um A: B · 12 = 30 · 1 + 20 · 8 + 12 · 2 + 8 · 9 = 286 → B = 23,833; ΣV: A = 70 − 23,833 = 46,167
    // M_A = −5 · 2² / 2 = −10; V(4) = 46,167 − 30 − 12 = 4,167 → x₀ = 4 + 4,167 / 2,5 = 5,667
    // M(4) = 46,167 · 4 − 30 · 3 − 12 · 2 = 70,667 → M_F = 70,667 + 4,167² / (2 · 2,5) = 74,139
    const t = berechneTraeger({ L: 12, pointLoads: [{ F: 12, x: 2 }, { F: 8, x: 9 }],
        udls: [{ q: 5, start: -2, end: 4 }, { q: 2.5, start: 4, end: 12 }] });
    nah(t.A, 46.167); nah(t.B, 23.833); nah(t.totalLoad, 70, 1e-9);
    const m = momenteEinfeldtraeger(t, 12, -2, 12);
    nah(m.MA, -10, 1e-9); assert.equal(m.MB, 0);
    nah(m.feld.x0, 5.667); nah(m.feld.M, 74.139);
    nah(extremwerte(t, -2, 12).maxQ, 36.167);   // größte Querkraft rechts neben A: 46,167 − 10
});

test('Teilstreckenlast: q = 10 kN/m auf den ersten 2 m von L = 6 m → A = 16,67 kN, B = 3,33 kN, M_F = 13,89 kNm bei x₀ = 1,67 m', () => {
    // R = 20 kN bei x = 1 m: B = 20 · 1 / 6, A = 20 · 5 / 6; x₀ = A / q; M_F = A² / (2 · q)
    const t = berechneTraeger({ L: 6, pointLoads: [], udls: [{ q: 10, start: 0, end: 2 }] });
    nah(t.A, 16.667); nah(t.B, 3.333);
    const f = feldmomentBeiVNull(t, 6);
    nah(f.x0, 1.667); nah(f.M, 13.889);
});

test('Lasten genau auf den Auflagern gehen direkt ins Auflager und erzeugen kein Moment', () => {
    // F = 10 kN auf A, F = 10 kN auf B, F = 20 kN in Feldmitte, L = 6 m: A = B = 20 kN, max M = 20 · 6 / 4 = 30 kNm
    const t = berechneTraeger({ L: 6, pointLoads: [{ F: 10, x: 0 }, { F: 10, x: 6 }, { F: 20, x: 3 }], udls: [] });
    nah(t.A, 20, 1e-9); nah(t.B, 20, 1e-9);
    const e = extremwerte(t, 0, 6);
    nah(e.maxM, 30, 1e-9); nah(e.xMaxM, 3, 1e-9); nah(Math.abs(e.maxQ), 10, 1e-9);
    nah(t.schnitt(0).M, 0, 1e-9); nah(t.schnitt(6).M, 0, 1e-9);
});

test('Kragarm rechts mit Gleichlast über die ganze Länge: A = 8,4 kN, B = 19,6 kN, M_B = −8 kNm, M_F = 8,82 kNm bei x₀ = 2,1 m', () => {
    // L = 5 m, Kragarm rechts 2 m, q = 4 kN/m: R = 28 kN bei 3,5 m → B = 28 · 3,5 / 5 = 19,6; A = 8,4
    // M_B = −4 · 2² / 2 = −8; x₀ = A / q = 2,1; M_F = A² / (2 · q) = 8,82
    const t = berechneTraeger({ L: 5, pointLoads: [], udls: [{ q: 4, start: 0, end: 7 }] });
    nah(t.A, 8.4, 1e-9); nah(t.B, 19.6, 1e-9);
    const m = momenteEinfeldtraeger(t, 5, 0, 7);
    assert.equal(m.MA, 0); nah(m.MB, -8, 1e-9); nah(m.feld.x0, 2.1, 1e-6); nah(m.feld.M, 8.82, 1e-9);
});

test('Freie Trägerenden: Moment null, Querkraft links vom Anfang null, Kragarmende ohne Last querkraftfrei', () => {
    const t = berechneTraeger({ L: 10, pointLoads: [{ F: 15, x: -2.5 }], udls: [{ q: 3, start: -2.5, end: 12.5 }] });
    nah(t.schnitt(-2.5).M, 0, 1e-9); nah(t.schnitt(12.5).M, 0, 1e-9);
    nah(t.schnitt(-2.5).Q, 0, 1e-9);        // Schnitt genau am Anfang: die Spitzenlast zählt erst rechts davon
    nah(t.schnitt(12.5).Q, 0, 1e-9);        // rechtes Ende ohne Einzellast: V läuft auf null aus
});

test('Schräge Einzellast 20 kN unter 30° bei x = 2 m, L = 8 m: F_v = 10 kN, F_h = 17,32 kN, A = 7,5 kN, B = 2,5 kN', () => {
    const k = zerlegeKraft(20, 30);          // Winkel von der Trägerachse, 90° = nach unten
    nah(k.vertical, 10, 1e-9); nah(k.horizontal, 17.321);
    const t = berechneTraeger({ L: 8, pointLoads: [{ F: k.vertical, x: 2 }], udls: [] });
    nah(t.A, 7.5, 1e-9); nah(t.B, 2.5, 1e-9);
});

test('Übungsaufgaben „zwei Einzellasten“: x₀ ist immer eindeutig (kein Abschnitt mit V = 0 zwischen den Lasten)', () => {
    let seed = 3;
    const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    for (let i = 0; i < 5000; i++) {
        const a = erzeugeTraegerAufgabe(rnd, 'zwei-einzellasten');
        const mitte = (a.pointLoads[0].x + a.pointLoads[1].x) / 2;
        assert.ok(Math.abs(a.traeger.schnitt(mitte).Q) > 1e-6, JSON.stringify(a.pointLoads));
    }
});

// ---------- Kette wie in der Prüfung: Lastannahme → Bemessungswerte → Schnittgrößen → Nachweis ----------

test('Kette Modul 3 → 4 → 6: g_k = 5,90, q_k = 2,70 kN/m, L = 3,69 m → M_Ed = 20,45 kNm → Balken C24 14/26 cm: σ_Ed = 12,97 ≤ 14,77 N/mm²', () => {
    // Lasten wie Prüfung 2026 B; der Nachweis am Ende ist eine eigene Fortsetzung (kam in der Prüfung nicht vor)
    const gd = TEILSICHERHEIT.G * 5.90, qd = TEILSICHERHEIT.Q * 2.70;       // 7,965 und 4,05 kN/m
    nah(gd, 7.965, 1e-9); nah(qd, 4.05, 1e-9);
    const L = 3.69;
    const t = berechneTraeger({ L, pointLoads: [], udls: [{ q: gd, start: 0, end: L }, { q: qd, start: 0, end: L }] });
    const m = momenteEinfeldtraeger(t, L, 0, L);
    nah(m.feld.M, 12.015 * L * L / 8, 1e-9);                                  // E_d · L² / 8 = 20,450
    const uebergabe = momentParameterwert(Math.abs(m.maxAbs.M));              // so steht es in der Adresse ?M=…
    assert.equal(uebergabe, 20.45);
    const W = querschnittswerte('rechteck', { b: 14, h: 26 }).W;              // 14 · 26² / 6 = 1577,33 cm³
    nah(W, 1577.33);
    const sigma = biegespannung(uebergabe, W);                                // 20,45 · 1000 / 1577,33 = 12,97
    nah(sigma, 12.965);
    const fd = bemessungsfestigkeit(WERKSTOFFE_EC.find(w => w.id === 'c24'), KMOD.find(k => k.id === 'mittel').kmod);
    assert.equal(nachweisErfuellt(sigma, fd), true);
    assert.equal(nachweisErfuellt(biegespannung(uebergabe, querschnittswerte('rechteck', { b: 10, h: 20 }).W), fd), false);   // 30,68 > 14,77
});

test('Übergabe-Adressen zwischen den Modulen behalten ihre Parameternamen (g, q, L, gk, qk, bem / M, Ed)', () => {
    const lies = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
    const m3 = lies('modul-3-lastannahme.html'), m4 = lies('modul-4-statik-einfeldtraeger.html'), m6 = lies('modul-6-spannungsnachweis.html');
    for (const teil of ['modul-4-statik-einfeldtraeger.html?g=', '&q=', '&L=', '&gk=', '&qk=', '&bem=1']) assert.ok(m3.includes(teil), `Modul 3 sendet ${teil} nicht`);
    for (const teil of ["p.has('g')", "zahl('L')", "zahl('gk')", "p.get('bem')"]) assert.ok(m4.includes(teil), `Modul 4 liest ${teil} nicht`);
    for (const teil of ["'modul-6-spannungsnachweis.html?M='", "'&Ed=1'"]) assert.ok(m4.includes(teil), `Modul 4 sendet ${teil} nicht`);
    for (const teil of ["params.get('M')", "params.get('Ed')"]) assert.ok(m6.includes(teil), `Modul 6 liest ${teil} nicht`);
});

// ---------- Rundung, Toleranz, Nachweis ----------

test('fmt(): deutsches Dezimalkomma, kaufmännische Rundung (auch bei negativen Zahlen), kein „−0,00“', () => {
    assert.equal(fmt(2.5), '2,5');
    assert.equal(fmt(3.14159, 2), '3,14');
    assert.equal(fmt(1.005, 2), '1,01');               // toFixed allein ergäbe 1,00
    assert.equal(fmt(2.675, 2), '2,68');
    assert.equal(fmt(-9.375, 2), '-9,38');             // Feldmoment des Szenarios „Doppel-Kragarm“
    assert.equal(fmt(-46.875 + 37.5, 2), '-9,38');     // derselbe Wert mit Rechenungenauigkeit
    assert.equal(fmt(46.875, 2), '46,88');
    assert.equal(fmt(-0.001, 2), '0,00');
    assert.equal(fmt(1.4715, 3), '1,472');             // M = 0,4905 kN · 3,0 m in Modul 2
    assert.equal(fmt(22.167675, 3), '22,168');         // A_Ed,V der Prüfung 2026 B
    assert.equal(fmt(1234.5678), '1234,568');
});

test('Einheitliche Toleranz: 2 %, mindestens 0,05; Winkel 1° mit Umlauf; leeres Feld ist falsch', () => {
    assert.equal(pruefeWert('102', 100), true);        // 2 %
    assert.equal(pruefeWert('102,1', 100), false);
    assert.equal(pruefeWert('1.05', 1), true);         // mindestens 0,05
    assert.equal(pruefeWert('1.06', 1), false);
    assert.equal(pruefeWert('-31.2', -31.25), true);   // negatives Stützmoment
    assert.equal(pruefeWert('31.25', -31.25), false);  // Vorzeichenfehler
    assert.equal(pruefeWert('', 0), false);
    assert.equal(pruefeWinkel('0', 359.5), true);
    assert.equal(pruefeWinkel('-30', 330), true);
    assert.equal(pruefeWinkel('82.3', 81.34), true);
    assert.equal(pruefeWinkel('82.4', 81.34), false);
    assert.equal(pruefeWinkel('', 0), false);
});

test('Nachweis rundet wie die Anzeige: 140,004 gilt als 140,00 ≤ 140,00; 140,006 nicht', () => {
    assert.equal(nachweisErfuellt(140.004, 140), true);
    assert.equal(nachweisErfuellt(140.006, 140), false);
    assert.equal(nachweisErfuellt(13.5, 14.769), true);
    assert.equal(nachweisErfuellt(14.78, 14.769), false);
});
