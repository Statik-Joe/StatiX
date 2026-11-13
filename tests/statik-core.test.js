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
    feldmomentBeiVNull,
    pruefeWert,
    erzeugeTraegerAufgabe,
    TRAEGER_AUFGABENARTEN,
    LAST_BAUSTOFFE,
    NUTZLASTEN,
    TRENNWANDZUSCHLAEGE,
    zerlegeKraft,
    istImWertebereich,
    momentParameterwert,
    erhoeheQuizPunktestand,
    hebelVergleich,
    addiereKraefte,
    zerlegeSchraegeLast,
    winkelAbstand,
    hebelMomente,
    erzeugeHebelAufgabe,
    querschnittswerte,
    biegespannung,
    WERKSTOFFE_EC,
    KMOD,
    bemessungsfestigkeit,
    momenteEinfeldtraeger
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

// ---------- Übungsmodus Schnittgrößen (Modul 4) ----------
// Abschlussprüfung FOS Bautechnik 2026 (Hessen), Vorschlag B, Aufgaben 1.3 und 1.4:
// Einfeldträger l_eff = 3,69 m, g_d + q_d = 12,015 kN/m → A = B = 22,168 kN, M_F = 20,45 kNm in Feldmitte
test('Prüfung 2026 B: A_Ed,V = B_Ed,V = 22,168 kN, M_Ed,F = 20,45 kNm bei x₀ = l/2', () => {
    const t = berechneTraeger({ L: 3.69, pointLoads: [], udls: [{ q: 12.015, start: 0, end: 3.69 }] });
    nah(t.A, 22.168, 0.001);
    nah(t.B, 22.168, 0.001);
    const f = feldmomentBeiVNull(t, 3.69);
    nah(f.x0, 1.845, 1e-6);
    nah(f.M, 20.450, 0.001);
});

// Vorschlag A, Aufgabe 2.3: Kragarm links 2,08 m, Feld 6,25 m, E_d = 9,151 kN/m
test('Prüfung 2026 A: Kragarm links – A_Ed,V = 50,798 kN, B_Ed,V = 25,430 kN, Feldmoment bei V = 0', () => {
    const q = 9.151;
    const t = berechneTraeger({ L: 6.25, pointLoads: [], udls: [{ q, start: -2.08, end: 6.25 }] });
    nah(t.A, 50.798, 0.001);
    nah(t.B, 25.430, 0.001);
    const f = feldmomentBeiVNull(t, 6.25);
    const x0 = t.A / q - 2.08;                                    // V(x) = A − q · (x + 2,08) = 0
    nah(f.x0, x0, 1e-6);
    nah(f.M, t.A * x0 - q * (x0 + 2.08) ** 2 / 2, 1e-6);
});

test('Feldmoment bei V = 0 liegt bei zwei Einzellasten genau unter der Last, an der V das Vorzeichen wechselt', () => {
    const t = berechneTraeger({ L: 6, pointLoads: [{ F: 30, x: 2 }, { F: 10, x: 4 }], udls: [] });
    const f = feldmomentBeiVNull(t, 6);
    assert.equal(f.x0, 2);
    nah(f.M, t.A * 2, 1e-9);
});

test('Eingaben prüfen: 2 % Toleranz, mindestens 0,05, Dezimalkomma erlaubt', () => {
    assert.ok(pruefeWert(22.0, 22.168));
    assert.ok(pruefeWert('22,1', 22.168));
    assert.ok(!pruefeWert(21.5, 22.168));
    assert.ok(pruefeWert(0.04, 0));
    assert.ok(!pruefeWert('', 1));
    assert.ok(!pruefeWert('abc', 1));
});

test('Aufgabengenerator: 400 Aufgaben aller Arten sind lösbar und im Gleichgewicht', () => {
    let seed = 12345;
    const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
    const arten = new Set();
    for (let i = 0; i < 400; i++) {
        const a = erzeugeTraegerAufgabe(rnd);
        arten.add(a.typ);
        assert.ok(a.L >= 3 && a.L <= 8, `L = ${a.L}`);
        assert.ok(a.x0 > 0 && a.x0 < a.L, `x₀ = ${a.x0}`);
        assert.ok(a.MF > 0 && a.A > 0 && a.B > 0);
        nah(a.A + a.B, a.traeger.totalLoad, 1e-9);
        a.pointLoads.forEach(p => assert.ok(p.x > 0 && p.x < a.L));
        // Das Feldmoment ist das größte Moment im Feld
        const { maxM } = extremwerte(a.traeger, 0, a.L, 0.001);
        assert.ok(a.MF >= maxM - 1e-6, `${a.typ}: M_F = ${a.MF}, max M = ${maxM}`);
    }
    assert.deepEqual([...arten].sort(), [...TRAEGER_AUFGABENARTEN].sort());
});

// ---------- Befunde aus der Prüfung vom 10.11.2026 (ROADMAP.md, Abschnitt „Fundament“) ----------

test('Durchlaufträger: Einzellast genau auf einem Auflager geht ganz in dieses Auflager (a = 0 und a = L)', () => {
    // Zweifeldträger 5 m + 5 m, F = 20 kN genau auf B – einmal als a = L in Feld 1, einmal als a = 0 in Feld 2
    for (const loads of [[{ F: 20, a: 5 }, {}], [{}, { F: 20, a: 0 }]]) {
        const t = dlt([5, 5], loads);
        nah(t.auflager[0], 0);
        nah(t.auflager[1], 20);
        nah(t.auflager[2], 0);
        nah(t.stuetzmomente[1], 0);
    }
    // zusätzlich q = 10 kN/m auf beiden Feldern: B = 1,25 · 10 · 5 + 20 = 82,5 kN, Summe = Gesamtlast 120 kN
    const t = dlt([5, 5], [{ q: 10, F: 20, a: 5 }, { q: 10 }]);
    nah(t.auflager[0], 18.75);
    nah(t.auflager[1], 82.5);
    nah(t.auflager[2], 18.75);
    nah(t.auflager.reduce((a, b) => a + b, 0), t.totalLoad);
    // Last auf dem Endauflager: A bzw. C trägt sie allein
    nah(dlt([5, 5], [{ F: 20, a: 0 }, {}]).auflager[0], 20);
    nah(dlt([5, 5], [{}, { F: 20, a: 5 }]).auflager[2], 20);
});

test('Durchlaufträger: Summe der Auflagerkräfte = Gesamtlast für jede Laststellung von 0 bis L', () => {
    for (let a = 0; a <= 4.0001; a += 0.25) {
        const t = dlt([4, 6.5, 3], [{ q: 5, F: 12, a }, { q: 8, F: 7, a: 6.5 }, { F: 20, a: Math.min(a, 3) }]);
        nah(t.auflager.reduce((s, R) => s + R, 0), t.totalLoad, 1e-9);
    }
});

test('Hebelgesetz: Gleichgewicht nur bei m₁ · l₁ = m₂ · l₂, auch bei kleinen Massen', () => {
    assert.equal(hebelVergleich(50, 3, 30, 5), 0);       // 150 kg·m = 150 kg·m
    assert.equal(hebelVergleich(15, 0.7, 3.5, 3), 0);    // 10,5 = 10,5 trotz Rechenungenauigkeit (0,7 · 15)
    assert.equal(hebelVergleich(5, 0.5, 5, 0.6), 1);     // 2,5 < 3,0: Seite 2 überwiegt (früher „Gleichgewicht“)
    assert.equal(hebelVergleich(15, 0.7, 20, 0.5), -1);  // 10,5 > 10,0: Seite 1 überwiegt (früher „Gleichgewicht“)
    // alle Reglerstellungen: Gleichgewicht genau dann, wenn die Produkte in ganzen kg·dm übereinstimmen
    for (let m1 = 5; m1 <= 100; m1 += 5) for (let m2 = 5; m2 <= 100; m2 += 5)
        for (let i = 5; i <= 50; i++) for (let j = 5; j <= 50; j++) {
            assert.equal(hebelVergleich(m1, i / 10, m2, j / 10) === 0, m1 * i === m2 * j, `${m1} kg · ${i / 10} m / ${m2} kg · ${j / 10} m`);
        }
});

// ---------- Modul 1: Kräfteaddition ----------

test('Kräfteaddition: F₁ = 80 kN / 30°, F₂ = 100 kN / 120° → F_R = 128,06 kN, φ = 81,34° (Startwerte Modul 1)', () => {
    const r = addiereKraefte(80, 30, 100, 120);
    nah(r.f1x, 69.28, 0.005);   // 80 · cos 30°
    nah(r.f1y, 40.00, 0.005);   // 80 · sin 30°
    nah(r.f2x, -50.00, 0.005);  // 100 · cos 120°
    nah(r.f2y, 86.60, 0.005);   // 100 · sin 120°
    nah(r.frx, 19.28, 0.005);
    nah(r.fry, 126.60, 0.005);
    nah(r.fr, 128.06, 0.005);   // √(19,28² + 126,60²)
    nah(r.ang, 81.34, 0.005);   // arctan(126,60 / 19,28)
});

test('Kräfteaddition: Winkel φ liegt immer zwischen 0° und 360° (alle Quadranten)', () => {
    nah(addiereKraefte(10, 0, 0, 0).ang, 0, 1e-9);
    nah(addiereKraefte(10, 180, 0, 0).ang, 180, 1e-9);
    nah(addiereKraefte(10, 225, 0, 0).ang, 225, 1e-9);
    nah(addiereKraefte(10, 330, 0, 0).ang, 330, 1e-9);
    nah(addiereKraefte(50, 0, 50, 180).fr, 0, 1e-9);   // entgegengesetzt gleich groß: F_R = 0
});

test('Winkelabstand: 359,5° ≙ 0° (0,5° Abstand), −30° ≙ 330°, 10° und 350° liegen 20° auseinander', () => {
    nah(winkelAbstand(359.5, 0), 0.5, 1e-9);
    nah(winkelAbstand(0, 359.5), 0.5, 1e-9);
    nah(winkelAbstand(-30, 330), 0, 1e-9);
    nah(winkelAbstand(10, 350), 20, 1e-9);
    nah(winkelAbstand(90, 270), 180, 1e-9);
});

test('Schräge Last auf Fläche: F = 20 kN, β = 25° → F_y = 18,13 kN, F_x = 8,45 kN; β = 0° und 90°', () => {
    const r = zerlegeSchraegeLast(20, 25);
    nah(r.Fy, 18.13, 0.005);   // 20 · cos 25°
    nah(r.Fx, 8.45, 0.005);    // 20 · sin 25°
    nah(zerlegeSchraegeLast(20, 0).Fx, 0, 1e-9);
    nah(zerlegeSchraegeLast(20, 90).Fy, 0, 1e-9);
});

// ---------- Modul 2: Hebelgesetz ----------

test('Hebelgesetz: 50 kg bei 3 m → F₁ = 0,4905 kN, M₁ = 1,4715 kNm; 30 kg bei 5 m → M₂ = 1,4715 kNm', () => {
    const r = hebelMomente(50, 3, 30, 5);
    nah(r.F1, 0.4905, 1e-9);   // 50 · 9,81 / 1000
    nah(r.M1, 1.4715, 1e-9);
    nah(r.F2, 0.2943, 1e-9);
    nah(r.M2, 1.4715, 1e-9);
});

test('Hebel-Übung: 2000 Aufgaben liegen auf dem Raster der Regler und sind mit der Lösung exakt im Gleichgewicht', () => {
    let seed = 7;
    const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    for (let i = 0; i < 2000; i++) {
        const a = erzeugeHebelAufgabe(rnd);
        for (const m of [a.m1, a.m2]) assert.ok(m >= 10 && m <= 100 && m % 5 === 0, `Masse ${m} kg nicht auf dem Regler`);
        for (const l of [a.l1, a.l2]) {
            assert.ok(l >= 0.5 && l <= 5, `Hebelarm ${l} m außerhalb`);
            nah(l * 10, Math.round(l * 10), 1e-9);
        }
        assert.notEqual(a.m1, a.m2);
        assert.equal(hebelVergleich(a.m1, a.l1, a.m2, a.l2), 0, JSON.stringify(a));
    }
});

// ---------- Modul 6: Querschnittswerte und Biegespannung ----------

test('Rechteck b/h = 20/40 cm: I = 106 666,7 cm⁴, W = 5333,3 cm³; σ bei 10 kNm = 1,875 N/mm²', () => {
    const r = querschnittswerte('rechteck', { b: 20, h: 40 });
    nah(r.I, 20 * 40 ** 3 / 12, 1e-6);   // 106 666,67
    nah(r.e, 20, 1e-12);
    nah(r.W, 5333.33, 0.01);             // b · h² / 6
    nah(biegespannung(10, r.W), 1.875, 1e-9);   // 10 · 10⁶ Nmm / 5 333 333 mm³
});

test('Kreis d = 20 cm: I = 7854,0 cm⁴, W = 785,4 cm³ (= π · d³ / 32)', () => {
    const r = querschnittswerte('kreis', { d: 20 });
    nah(r.I, 7853.98, 0.01);
    nah(r.W, 785.40, 0.01);
    nah(r.W, Math.PI * 20 ** 3 / 32, 1e-9);
});

test('I-Profil b = 15, h = 30, s = 1,0, t = 1,5 cm: I = (15 · 30³ − 14 · 27³) / 12 = 10 786,5 cm⁴, W = 719,1 cm³', () => {
    const r = querschnittswerte('iprofil', { b: 15, h: 30, s: 1, t: 1.5 });
    nah(r.I, 10786.5, 1e-9);
    nah(r.W, 719.1, 1e-9);
    // Ohne Aussparung (s = b) entspricht das I-Profil dem Rechteck
    nah(querschnittswerte('iprofil', { b: 15, h: 30, s: 15, t: 1.5 }).I, querschnittswerte('rechteck', { b: 15, h: 30 }).I, 1e-9);
    nah(biegespannung(5, 0), 0, 0);   // kein Querschnitt: keine Division durch null
});

// ---------- Modul 4: Feld- und Stützmomente mit Vorzeichen ----------

test('Doppel-Kragarm (Szenario Modul 4): M_A = M_B = −46,875 kNm, Feldmoment −9,375 kNm bei x₀ = 5 m', () => {
    // L = 10 m, Kragarme je 2,5 m, q = 3 kN/m über alles, F = 15 kN an beiden Kragarmenden
    const t = berechneTraeger({ L: 10, pointLoads: [{ F: 15, x: -2.5 }, { F: 15, x: 12.5 }], udls: [{ q: 3, start: -2.5, end: 12.5 }] });
    const m = momenteEinfeldtraeger(t, 10, -2.5, 12.5);
    nah(m.MA, -(15 * 2.5 + 3 * 2.5 ** 2 / 2), 1e-9);   // −46,875
    nah(m.MB, -46.875, 1e-9);
    nah(m.feld.x0, 5, 1e-6);
    nah(m.feld.M, -46.875 + 3 * 10 ** 2 / 8, 1e-9);    // Stützmoment + q · L² / 8 = −9,375
    nah(Math.abs(m.maxAbs.M), 46.875, 1e-9);
});

test('Einfeldträger ohne Kragarm: Stützmomente null, Feldmoment = q · L² / 8 bei L / 2', () => {
    const t = berechneTraeger({ L: 10, pointLoads: [], udls: [{ q: 4, start: 0, end: 10 }] });
    const m = momenteEinfeldtraeger(t, 10, 0, 10);
    assert.equal(m.MA, 0);
    assert.equal(m.MB, 0);
    nah(m.feld.x0, 5, 1e-6);
    nah(m.feld.M, 50, 1e-9);
});

test('Nur Kragarm belastet: kein Nulldurchgang von V im Feld, Stützmoment M_A = −F · a', () => {
    const t = berechneTraeger({ L: 6, pointLoads: [{ F: 10, x: -2 }], udls: [] });
    const m = momenteEinfeldtraeger(t, 6, -2, 6);
    assert.equal(m.feld, null);
    nah(m.MA, -20, 1e-9);
    assert.equal(m.MB, 0);
});

// ---------- Modul 6: Bemessung nach Eurocode ----------

const werkstoff = id => WERKSTOFFE_EC.find(w => w.id === id);
const kmod = id => KMOD.find(k => k.id === id).kmod;

test('Kennwerte Eurocode: C24 / GL24h f_m,k = 24, γ_M = 1,3; S235 f_y = 235, S355 f_y = 355, γ_M0 = 1,0; k_mod 0,6 … 1,1', () => {
    assert.deepEqual([werkstoff('c24').fk, werkstoff('c24').gammaM], [24, 1.3]);
    assert.deepEqual([werkstoff('gl24h').fk, werkstoff('gl24h').gammaM], [24, 1.3]);
    assert.deepEqual([werkstoff('s235').fk, werkstoff('s235').gammaM], [235, 1.0]);
    assert.deepEqual([werkstoff('s355').fk, werkstoff('s355').gammaM], [355, 1.0]);
    assert.deepEqual(KMOD.map(k => k.kmod), [0.6, 0.7, 0.8, 0.9, 1.1]);
});

test('Bemessungsfestigkeit: C24, KLED mittel → f_m,d = 0,8 · 24 / 1,3 = 14,77 N/mm²; S235 → f_y,d = 235 N/mm²', () => {
    nah(bemessungsfestigkeit(werkstoff('c24'), kmod('mittel')), 14.77, 0.005);
    nah(bemessungsfestigkeit(werkstoff('c24'), kmod('staendig')), 11.08, 0.005);   // 0,6 · 24 / 1,3
    nah(bemessungsfestigkeit(werkstoff('gl24h'), kmod('kurz')), 16.62, 0.005);     // 0,9 · 24 / 1,3
    assert.equal(bemessungsfestigkeit(werkstoff('s235'), 0.8), 235);                 // k_mod gilt nur für Holz
    assert.equal(bemessungsfestigkeit(werkstoff('s355')), 355);
});

test('Nachweis nach Eurocode: Balken C24 10/20 cm, M_Ed = 9 kNm → σ_Ed = 13,50 N/mm² ≤ 14,77 N/mm², η = 91 %', () => {
    const W = querschnittswerte('rechteck', { b: 10, h: 20 }).W;   // 10 · 20² / 6 = 666,67 cm³
    nah(W, 666.67, 0.005);
    const sigma = biegespannung(9, W);
    nah(sigma, 13.5, 1e-9);
    const fd = bemessungsfestigkeit(werkstoff('c24'), kmod('mittel'));
    assert.ok(sigma <= fd);
    nah(sigma / fd, 0.914, 0.001);
});
