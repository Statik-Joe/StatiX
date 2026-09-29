// ==========================================================================
// Gemeinsamer Rechenkern für Einfeldträger mit optionalen Kragarmen.
// Wird von Modul 3 (Schnittgrößen) und Modul 4 (Diagramme zuordnen) genutzt,
// damit beide Module garantiert gleich rechnen. Getestet in tests/statik-core.test.js
// (npm test) gegen Tabellenwerte wie M = F·L/4 und M = q·L²/8.
//
// Koordinaten: x in m, Auflager A (Festlager) bei x = 0, Auflager B (Loslager) bei x = L.
// Kragarme liegen bei x < 0 (links) bzw. x > L (rechts).
// Lasten wirken nach unten und sind positiv: Einzellasten F [kN], Streckenlasten q [kN/m].
// Vorzeichen der Schnittgrößen (Schnittufer links): Q positiv, wenn die Summe links
// nach oben zeigt; M positiv bei Zug an der Unterseite (Feldmoment).
// ==========================================================================

// system = { L, pointLoads: [{ F, x }], udls: [{ q, start, end }] }
// Liefert Auflagerkräfte A, B, Gesamtlast und die Funktion schnitt(x) -> { Q, M }.
function berechneTraeger(system) {
    const L = system.L;
    const pointLoads = system.pointLoads || [];
    // Streckenlasten ohne Länge (Ende ≤ Anfang) tragen nichts bei
    const udls = (system.udls || []).filter(u => u.end > u.start);

    // Auflagerkräfte aus Momentengleichgewicht: ΣM um B = 0 liefert A, ΣM um A = 0 liefert B
    let sumMB = 0, sumMA = 0, totalLoad = 0;
    pointLoads.forEach(p => {
        sumMB += p.F * (L - p.x);
        sumMA += p.F * p.x;
        totalLoad += p.F;
    });
    udls.forEach(u => {
        const R = u.q * (u.end - u.start);   // Resultierende der Streckenlast
        const xs = (u.start + u.end) / 2;    // Lage der Resultierenden (Schwerpunkt)
        sumMB += R * (L - xs);
        sumMA += R * xs;
        totalLoad += R;
    });
    const A = L > 0 ? sumMB / L : 0;
    const B = L > 0 ? sumMA / L : 0;

    // Schnittgrößen an der Stelle x: Summe aller Kräfte links vom Schnitt
    const eps = 1e-9;
    function schnitt(x) {
        let Q = 0, M = 0;
        if (x > eps) { Q += A; M += A * x; }
        if (x > L + eps) { Q += B; M += B * (x - L); }
        pointLoads.forEach(p => {
            if (p.x < x) { Q -= p.F; M -= p.F * (x - p.x); }
        });
        udls.forEach(u => {
            if (x > u.start) {
                const len = Math.min(x, u.end) - u.start;   // belasteter Anteil links vom Schnitt
                Q -= u.q * len;
                M -= u.q * len * (x - u.start - len / 2);
            }
        });
        return { Q, M };
    }

    // Stellen, an denen Q springt oder M knickt (Auflager, Einzellasten, Ränder der Streckenlasten)
    const kritischeStellen = [0, L];
    pointLoads.forEach(p => kritischeStellen.push(p.x));
    udls.forEach(u => kritischeStellen.push(u.start, u.end));

    return { A, B, totalLoad, schnitt, kritischeStellen };
}

// Betragsgrößtes Moment und größte Querkraft im Bereich [xmin, xmax] (Rasterschritt step).
// Liefert { maxM, xMaxM, maxQ } mit Vorzeichen; xMaxM ist die Stelle x₀ von |M|max.
// Zusätzlich zum Raster wird direkt links und rechts jeder kritischen Stelle ausgewertet,
// weil |Q|max meist unmittelbar neben einem Auflager oder einer Einzellast liegt.
function extremwerte(traeger, xmin, xmax, step = 0.01) {
    let maxM = 0, xMaxM = xmin, maxQ = 0;
    const n = Math.max(1, Math.round((xmax - xmin) / step));
    const stellen = [];
    for (let i = 0; i <= n; i++) stellen.push(xmin + (i / n) * (xmax - xmin));   // ohne aufsummierte Rundungsfehler
    const d = 1e-7;
    traeger.kritischeStellen.forEach(x => stellen.push(x - d, x, x + d));
    for (const x of stellen) {
        if (x < xmin || x > xmax) continue;
        const s = traeger.schnitt(x);
        if (Math.abs(s.M) > Math.abs(maxM)) { maxM = s.M; xMaxM = x; }
        if (Math.abs(s.Q) > Math.abs(maxQ)) { maxQ = s.Q; }
    }
    return { maxM, xMaxM, maxQ };
}

// Für die automatischen Tests unter Node.js exportieren (im Browser ohne Wirkung)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { berechneTraeger, extremwerte };
}
