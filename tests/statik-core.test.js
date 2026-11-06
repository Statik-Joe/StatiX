// Automatische Tests des Rechenkerns gegen Tabellenwerte der Baustatik.
// Ausführen im Projektordner mit: npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const {
    berechneTraeger,
    extremwerte,
    diagrammStellen,
    berechneDurchlauftraeger,
    feldmomente,
    biegelinie,
    momentenNullpunkte,
    berechneDeckenlast,
    LAST_BAUSTOFFE,
    NUTZLASTEN,
    TRENNWANDZUSCHLAEGE,
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

test('Gleichgewicht: A + B = Gesamtlast bei gemischter Belastung (Preset „Prüfungsmischlast“ aus Modul 4)', () => {
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
    // Gleichgewicht ΣV = 0: Auflagerkräfte (nach oben positiv) = Lastkomponente (nach unten positiv)
    nah(t.A + t.B - components.vertical, 0);
});

test('Eingabegrenzen sind inklusiv und weisen ungültige Werte zurück', () => {
    assert.equal(istImWertebereich(1, 1, 30), true);
    assert.equal(istImWertebereich('30', 1, 30), true);
    assert.equal(istImWertebereich(0.99, 1, 30), false);
    assert.equal(istImWertebereich(30.01, 1, 30), false);
    assert.equal(istImWertebereich('', 0, 100000), false);
    assert.equal(istImWertebereich('NaN', 0, 100000), false);
});

test('M_max-Übergabe von Modul 4 nach Modul 6 rundet und lehnt ungültige Werte ab', () => {
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

test('Diagrammstellen: Querkraftsprünge an Auflager und Einzellast werden senkrecht abgebildet', () => {
    // Einzellast bewusst zwischen zwei Rasterpunkten (Raster 0,05 m), Kragarm links 1,13 m
    const L = 7, F = 18, a = 3.33;
    const t = berechneTraeger({ L, pointLoads: [{ F, x: a }], udls: [{ q: 4, start: -1.13, end: L }] });
    const xs = diagrammStellen(t, -1.13, L, 0.05);
    assert.ok(xs.every((x, i) => i === 0 || x > xs[i - 1]), 'Stellen aufsteigend und ohne Doppelte');
    assert.equal(xs[0], -1.13);
    assert.equal(xs[xs.length - 1], L);
    // An jeder Sprungstelle liegen zwei Punkte so dicht beieinander, dass der Sprung senkrecht erscheint
    for (const [stelle, sprung] of [[0, t.A], [a, -F]]) {
        const links = xs.filter(x => x < stelle).pop();
        const rechts = xs.find(x => x > stelle);
        assert.ok(rechts - links < 1e-4, `Punkte an x = ${stelle} liegen ${rechts - links} m auseinander`);
        nah(t.schnitt(rechts).Q - t.schnitt(links).Q, sprung, 0.01);
    }
});

// ---------- Durchlaufträger (Modul 7): Vergleich mit Tabellenwerten gleicher Stützweiten ----------
const dlt = (spans, loads) => berechneDurchlauftraeger({ spans, loads });

test('Zweifeldträger, Gleichlast auf beiden Feldern: A = C = 0,375·qL, B = 1,25·qL, M_B = −0,125·qL², M_F = 0,070·qL²', () => {
    const q = 10, L = 5;
    const t = dlt([L, L], [{ q }, { q }]);
    nah(t.auflager[0], 0.375 * q * L);
    nah(t.auflager[1], 1.25 * q * L);
    nah(t.auflager[2], 0.375 * q * L);
    nah(t.stuetzmomente[1], -0.125 * q * L * L);
    const f = feldmomente(t);
    nah(f[0].M, 0.0703 * q * L * L, 0.03);
    nah(f[0].x, 0.375 * L, 0.01);
});

test('Zweifeldträger, Gleichlast nur auf Feld 1: A = 0,4375·qL, B = 0,625·qL, C = −0,0625·qL (abhebend), M_B = −0,0625·qL²', () => {
    const q = 8, L = 4;
    const t = dlt([L, L], [{ q }, {}]);
    nah(t.auflager[0], 0.4375 * q * L);
    nah(t.auflager[1], 0.625 * q * L);
    nah(t.auflager[2], -0.0625 * q * L);
    nah(t.stuetzmomente[1], -0.0625 * q * L * L);
});

test('Zweifeldträger, Einzellast in jeder Feldmitte: A = 0,3125·F, B = 1,375·F, M_B = −0,1875·F·L, M_F = 0,156·F·L', () => {
    const F = 20, L = 6;
    const t = dlt([L, L], [{ F, a: L / 2 }, { F, a: L / 2 }]);
    nah(t.auflager[0], 0.3125 * F);
    nah(t.auflager[1], 1.375 * F);
    nah(t.stuetzmomente[1], -0.1875 * F * L);
    nah(feldmomente(t)[0].M, 0.15625 * F * L);
});

test('Dreifeldträger, Gleichlast auf allen Feldern: A = 0,4·qL, B = 1,1·qL, M_B = −0,1·qL², M_F1 = 0,08·qL², M_F2 = 0,025·qL²', () => {
    const q = 12, L = 4;
    const t = dlt([L, L, L], [{ q }, { q }, { q }]);
    nah(t.auflager[0], 0.4 * q * L);
    nah(t.auflager[1], 1.1 * q * L);
    nah(t.auflager[2], 1.1 * q * L);
    nah(t.auflager[3], 0.4 * q * L);
    nah(t.stuetzmomente[1], -0.1 * q * L * L);
    nah(t.stuetzmomente[2], -0.1 * q * L * L);
    const f = feldmomente(t);
    nah(f[0].M, 0.08 * q * L * L, 0.03);
    nah(f[1].M, 0.025 * q * L * L, 0.03);
});

test('Dreifeldträger, Einzellast in jeder Feldmitte: A = 0,35·F, B = 1,15·F, M_B = −0,15·F·L, M_F1 = 0,175·F·L, M_F2 = 0,1·F·L', () => {
    const F = 15, L = 5;
    const t = dlt([L, L, L], [{ F, a: 2.5 }, { F, a: 2.5 }, { F, a: 2.5 }]);
    nah(t.auflager[0], 0.35 * F);
    nah(t.auflager[1], 1.15 * F);
    nah(t.stuetzmomente[1], -0.15 * F * L);
    const f = feldmomente(t);
    nah(f[0].M, 0.175 * F * L);
    nah(f[1].M, 0.1 * F * L);
});

test('Durchlaufträger mit eigenen Werten: Gleichgewicht und Übergang zum Einfeldträger', () => {
    // ungleiche Stützweiten, gemischte Lasten
    const t = dlt([4, 6.5, 3], [{ q: 5, F: 12, a: 1.5 }, { q: 8 }, { F: 20, a: 2 }]);
    nah(t.auflager.reduce((a, b) => a + b, 0), t.totalLoad);   // ΣV = 0
    // ΣM um A = 0: Auflagerkräfte · Abstand = Lasten · Abstand
    const mR = t.auflager.reduce((s, R, i) => s + R * t.X[i], 0);
    const mL = 5 * 4 * 2 + 12 * 1.5 + 8 * 6.5 * (4 + 3.25) + 20 * (10.5 + 2);
    nah(mR, mL);
    // Momente an den Endauflagern null, Stützmomente stetig
    nah(t.schnitt(1e-6).M, 0);
    nah(t.schnitt(t.L).M, 0);
    nah(t.schnitt(4 - 1e-6).M, t.stuetzmomente[1]);
    nah(t.schnitt(4 + 1e-6).M, t.stuetzmomente[1]);
    // Ein Feld allein entspricht dem Einfeldträger aus berechneTraeger
    const e = dlt([7], [{ q: 3, F: 10, a: 2 }]);
    const ref = berechneTraeger({ L: 7, pointLoads: [{ F: 10, x: 2 }], udls: [{ q: 3, start: 0, end: 7 }] });
    nah(e.auflager[0], ref.A);
    nah(e.auflager[1], ref.B);
    nah(e.schnitt(3.3).M, ref.schnitt(3.3).M);
});

test('Biegelinie Einfeldträger mit Gleichlast: max w · EI = 5/384 · q · L⁴ in Feldmitte', () => {
    const q = 10, L = 5;
    const bl = biegelinie(berechneDurchlauftraeger({ spans: [L], loads: [{ q }] }));
    nah(bl.max, 5 / 384 * q * L ** 4, 0.01);
    nah(bl.ws[150], bl.max, 1e-9);
});

test('Biegelinie Zweifeldträger mit Gleichlast: w = 0 über B, max w · EI = 0,00542 · q · L⁴', () => {
    const q = 10, L = 5;
    const bl = biegelinie(berechneDurchlauftraeger({ spans: [L, L], loads: [{ q }, { q }] }));
    nah(bl.ws[150] / bl.max, 0, 1e-3);           // bezogen auf die größte Durchbiegung
    nah(bl.max, 0.00542 * q * L ** 4, 0.1);
});

test('Biegelinie Dreifeldträger mit ungleichen Feldern: w = 0 an allen Zwischenauflagern', () => {
    const dlt = berechneDurchlauftraeger({ spans: [4, 6.5, 3], loads: [{ q: 5, F: 12, a: 1.5 }, { q: 8 }, { F: 20, a: 2 }] });
    const bl = biegelinie(dlt, 1350);
    [4, 10.5].forEach(X => nah(bl.ws[Math.round(X / dlt.L * 1350)] / bl.max, 0, 1e-3));
});

test('Momentennullpunkte Zweifeldträger mit Gleichlast bei 0,75 · L und 1,25 · L', () => {
    const L = 5;
    const p = momentenNullpunkte(berechneDurchlauftraeger({ spans: [L, L], loads: [{ q: 10 }, { q: 10 }] }));
    assert.equal(p.length, 2);
    nah(p[0], 0.75 * L, 0.01);
    nah(p[1], 1.25 * L, 0.01);
});

// ---------- Lastannahme für Decken (Modul 3) ----------
test('Stahlbetondecke: g_k = Σ d · γ, q_k = Nutzlast + Trennwandzuschlag, 1-m-Streifen und q_d = 1,35 g + 1,5 q', () => {
    const r = berechneDeckenlast({
        schichten: [
            { name: 'Zementestrich', d: 0.05, gamma: 22 },
            { name: 'Trittschalldämmung', d: 0.03, gamma: 1 },
            { name: 'Stahlbetonplatte', d: 0.20, gamma: 25 },
            { name: 'Kalkzementputz', d: 0.015, gamma: 20 }
        ],
        nutzlast: 1.5, trennwand: 0.8
    });
    nah(r.gk, 1.1 + 0.03 + 5.0 + 0.3, 1e-9);
    nah(r.qk, 2.3, 1e-9);
    assert.equal(r.einzugsbreite, 1);
    nah(r.gStrecke, 6.43, 1e-9);
    nah(r.qStrecke, 2.3, 1e-9);
    nah(r.EdFlaeche, 1.35 * 6.43 + 1.5 * 2.3, 1e-9);
    nah(r.gdStrecke, 1.35 * 6.43, 1e-9);
    nah(r.qdStrecke, 1.5 * 2.3, 1e-9);
});

test('Holzbalkendecke: Balkeneigengewicht b · h · γ, Streckenlast = Flächenlast · e + Balken', () => {
    const r = berechneDeckenlast({
        schichten: [
            { name: 'Dielung', d: 0.024, gamma: 4.2 },
            { name: 'Gipskarton', d: 0.0125, gamma: 9 }
        ],
        balken: { b: 0.10, h: 0.22, gamma: 4.2, e: 0.625 },
        nutzlast: 1.5, trennwand: 0
    });
    nah(r.gBalkenStrecke, 0.0924, 1e-9);
    nah(r.gBalkenFlaeche, 0.0924 / 0.625, 1e-9);
    nah(r.gStrecke, (0.1008 + 0.1125) * 0.625 + 0.0924, 1e-9);
    nah(r.gStrecke, r.gk * 0.625, 1e-9);               // beide Rechenwege führen zum gleichen Ergebnis
    nah(r.qStrecke, 1.5 * 0.625, 1e-9);
});

test('Feste Flächenlast je Schicht und eigene Einzugsbreite', () => {
    const r = berechneDeckenlast({ schichten: [{ name: 'Belag', g: 0.5 }, { name: 'Platte', d: 0.16, gamma: 25 }], nutzlast: 2, breite: 2.5 });
    nah(r.gk, 4.5, 1e-9);
    nah(r.gStrecke, 11.25, 1e-9);
    nah(r.qStrecke, 5, 1e-9);
});

test('Tabellenwerte Lastannahme: Nutzlast A2 = 1,5, C1 = 3,0 kN/m², Trennwandzuschlag 0,8 / 1,2, Stahlbeton 25 kN/m³', () => {
    const nl = kat => NUTZLASTEN.find(n => n.kat === kat).qk;
    assert.equal(nl('A2'), 1.5);
    assert.equal(nl('C1'), 3.0);
    assert.deepEqual(TRENNWANDZUSCHLAEGE.map(t => t.wert), [0, 0.8, 1.2]);
    assert.equal(LAST_BAUSTOFFE.find(b => b.id === 'stahlbeton').gamma, 25);
    LAST_BAUSTOFFE.forEach(b => assert.ok(b.gamma > 0 || (b.flaeche >= 0 && b.dicke > 0), b.name));
    assert.equal(new Set(LAST_BAUSTOFFE.map(b => b.id)).size, LAST_BAUSTOFFE.length);
});

test('Holzbalkendecke: Dämmung zwischen den Balken zählt nur mit dem Gefachanteil (e − b) / e', () => {
    const balken = { b: 0.10, h: 0.22, gamma: 4.2, e: 0.625 };
    const r = berechneDeckenlast({
        schichten: [
            { name: 'Dielung', d: 0.024, gamma: 4.2, lage: 'oben' },
            { name: 'Mineralwolle', d: 0.12, gamma: 1.0, lage: 'zwischen' },
            { name: 'Gipskarton', d: 0.0125, gamma: 9, lage: 'unten' }
        ],
        balken, nutzlast: 1.5
    });
    nah(r.gefachanteil, 0.84, 1e-9);
    nah(r.schichten[1].faktor, 0.84, 1e-9);
    assert.equal(r.schichten[0].faktor, 1);
    nah(r.schichten[1].g, 0.12 * 1.0 * 0.84, 1e-9);
    nah(r.gk, 0.1008 + 0.1008 + 0.1125 + 0.0924 / 0.625, 1e-9);
    // je Balken: Gefachdämmung über die lichte Weite e − b, Balken über seine Breite b
    nah(r.gStrecke, (0.1008 + 0.1125) * 0.625 + 0.12 * 1.0 * (0.625 - 0.10) + 0.10 * 0.22 * 4.2, 1e-9);
});

test('Stahlbetondecke: Lage „zwischen“ hat ohne Balken keine Wirkung', () => {
    const r = berechneDeckenlast({ schichten: [{ name: 'Dämmung', d: 0.1, gamma: 1, lage: 'zwischen' }] });
    nah(r.gk, 0.1, 1e-9);
    assert.equal(r.gefachanteil, 1);
});

test('Gründach extensiv auf Stahlbetondecke: Substrat wassergesättigt, Vlies und Bewuchs als Flächenlast', () => {
    const katalog = id => LAST_BAUSTOFFE.find(b => b.id === id);
    const r = berechneDeckenlast({
        schichten: [
            { name: 'Vegetation', g: katalog('vegetation-extensiv').flaeche },
            { name: 'Substrat', d: 0.10, gamma: katalog('substrat-extensiv').gamma },
            { name: 'Filtervlies', g: katalog('filtervlies').flaeche },
            { name: 'Drainage', g: katalog('drainage-element').flaeche },
            { name: 'Stahlbeton', d: 0.20, gamma: 25 }
        ],
        nutzlast: NUTZLASTEN.find(n => n.kat === 'H').qk
    });
    nah(r.gk, 0.10 + 1.40 + 0.01 + 0.10 + 5.0, 1e-9);
    nah(r.qk, 0, 1e-9);
    assert.ok(NUTZLASTEN.find(n => n.kat === 'H').dach);
});

// Nachrechnung der Abschlussprüfung FOS Bautechnik 2026 (Hessen), Vorschlag B, Aufgabe 1.1:
// Decke über EG, 1-m-Streifen, Trennwandzuschlag 1,2 kN/m² → g_d = 7,965 kN/m, q_d = 4,05 kN/m
test('Prüfung 2026 B 1.1: g_k = 5,90, g_d = 7,965 und q_d = 4,05 kN/m', () => {
    const k = id => LAST_BAUSTOFFE.find(b => b.id === id);
    const r = berechneDeckenlast({
        schichten: [
            { name: 'Fertigparkett', d: 0.020, gamma: k('parkett').gamma },
            { name: 'Zementestrich', d: 0.045, gamma: k('zementestrich').gamma },
            { name: 'XPS', d: 0.050, gamma: k('xps').gamma },
            { name: 'Stahlbeton', d: 0.180, gamma: k('stahlbeton').gamma },
            { name: 'Kalkgipsputz', d: 0.015, gamma: k('kalkgipsputz').gamma }
        ],
        nutzlast: 1.5, trennwand: 1.2
    });
    nah(r.gStrecke, 5.90, 1e-9);
    nah(r.gdStrecke, 7.965, 1e-9);
    nah(r.qdStrecke, 4.05, 1e-9);
    nah(r.EdStrecke, 12.015, 1e-9);
});

// Abschlussprüfung 2026 A, Aufgabe 2.1 (Galerie): Stahlträger IPE 160 im Abstand 62,5 cm,
// Siebdruckplatte als Flächenlast, Kunststoffboden 1,5 cm – Balkeneigengewicht aus der Profiltabelle
test('Stahlträger: Eigengewicht g je m aus der Profiltabelle statt b · h · γ', () => {
    const k = id => LAST_BAUSTOFFE.find(b => b.id === id);
    const r = berechneDeckenlast({
        schichten: [
            { name: 'Kunststoffboden', d: 0.015, gamma: k('kunststoffboden').gamma },
            { name: 'Siebdruckplatte', g: k('siebdruckplatte').flaeche }
        ],
        balken: { b: 0.082, h: 0.16, g: 0.158, e: 0.625 },
        nutzlast: 4.0
    });
    nah(r.gBalkenStrecke, 0.158, 1e-9);
    nah(r.gBalkenFlaeche, 0.158 / 0.625, 1e-9);
    nah(r.gk, 0.225 + 0.163 + 0.2528, 1e-9);
    nah(r.gdFlaeche, 1.35 * r.gk, 1e-9);
});
