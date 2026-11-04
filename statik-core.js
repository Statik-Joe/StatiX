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
// Winkel werden von der Trägerachse aus gemessen: 0° nach rechts, 90° nach unten.
function zerlegeKraft(F, alpha) {
    const radians = (alpha * Math.PI) / 180;
    return {
        horizontal: F * Math.cos(radians),
        vertical: F * Math.sin(radians)
    };
}

function istImWertebereich(value, min, max) {
    if (typeof value === 'string' && value.trim() === '') return false;
    const number = Number(value);
    return Number.isFinite(number) && number >= min && number <= max;
}

function momentParameterwert(value) {
    if (value === null || value === undefined || (typeof value === 'string' && value.trim() === '')) return null;
    const moment = Number(value);
    if (!Number.isFinite(moment) || moment < 0) return null;
    return Math.round(moment * 100) / 100;
}

function erhoeheQuizPunktestand(punkte, versuche, richtig) {
    return {
        punkte: punkte + (richtig ? 1 : 0),
        versuche: versuche + 1
    };
}

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

// Auswertungsstellen für Q- und M-Diagramme im Bereich [xmin, xmax]: gleichmäßiges Raster plus je ein
// Punkt direkt links und rechts jeder Sprungstelle (Auflager, Einzellasten, Ränder der Streckenlasten).
// So wird ein Querkraftsprung senkrecht gezeichnet und nicht als schräge Linie zum nächsten Rasterpunkt.
function diagrammStellen(traeger, xmin, xmax, step = 0.05) {
    const n = Math.max(1, Math.round((xmax - xmin) / step));
    const d = 1e-6 * Math.max(1, xmax - xmin);
    const stellen = [];
    for (let i = 0; i <= n; i++) stellen.push(i === n ? xmax : xmin + (i / n) * (xmax - xmin));   // Endpunkt exakt
    traeger.kritischeStellen.forEach(x => stellen.push(x - d, x + d));
    return stellen
        .filter(x => x >= xmin && x <= xmax)
        .sort((a, b) => a - b)
        .filter((x, i, arr) => i === 0 || x - arr[i - 1] > d / 2);
}

// ==========================================================================
// Durchlaufträger (Zwei- und Dreifeldträger, allgemein n Felder) – Modul 6
// ==========================================================================
// system = { spans: [L1, L2, …], loads: [{ q, F, a }, …] } mit je einem Eintrag pro Feld:
//   q = Gleichlast über das ganze Feld [kN/m], F = Einzellast [kN] im Abstand a [m] vom linken Auflager des Feldes.
// Gelenkige Lagerung an allen Auflagern, Endauflager momentenfrei, konstante Biegesteifigkeit EI.
// Die Stützmomente folgen aus der Dreimomentengleichung (Clapeyron); danach wird jedes Feld wie ein
// Einfeldträger mit den Stützmomenten als Randmomenten behandelt.
// Liefert Auflagerpositionen X, Stützmomente, Auflagerkräfte, schnitt(x) und kritische Stellen
// (kompatibel mit extremwerte() und diagrammStellen()).
function berechneDurchlauftraeger(system) {
    const spans = system.spans;
    const n = spans.length;
    const loads = spans.map((_, j) => {
        const l = (system.loads && system.loads[j]) || {};
        const F = l.F || 0;
        const a = Math.min(Math.max(l.a === undefined ? spans[j] / 2 : l.a, 0), spans[j]);
        return { q: l.q || 0, F, a };
    });

    // Belastungsglieder der Dreimomentengleichung je Feld (links bzw. rechts)
    const glied = loads.map((l, j) => {
        const L = spans[j], a = l.a, b = L - l.a;
        const qTerm = l.q * L * L * L / 4;
        return {
            links: qTerm + (L > 0 ? l.F * a * b * (L + b) / L : 0),
            rechts: qTerm + (L > 0 ? l.F * a * b * (L + a) / L : 0)
        };
    });

    // Gleichungssystem für die inneren Stützmomente M_1 … M_(n-1) aufstellen und lösen (Gauß)
    const m = n - 1;
    const K = Array.from({ length: m }, () => new Array(m).fill(0));
    const r = new Array(m).fill(0);
    for (let i = 1; i <= m; i++) {
        const Ll = spans[i - 1], Lr = spans[i];
        K[i - 1][i - 1] = 2 * (Ll + Lr);
        if (i - 2 >= 0) K[i - 1][i - 2] = Ll;
        if (i < m) K[i - 1][i] = Lr;
        r[i - 1] = -(glied[i - 1].rechts + glied[i].links);
    }
    for (let c = 0; c < m; c++) {
        let p = c;
        for (let z = c + 1; z < m; z++) if (Math.abs(K[z][c]) > Math.abs(K[p][c])) p = z;
        [K[c], K[p]] = [K[p], K[c]];
        [r[c], r[p]] = [r[p], r[c]];
        for (let z = c + 1; z < m; z++) {
            const f = K[z][c] / K[c][c];
            for (let s = c; s < m; s++) K[z][s] -= f * K[c][s];
            r[z] -= f * r[c];
        }
    }
    const innen = new Array(m).fill(0);
    for (let c = m - 1; c >= 0; c--) {
        let sum = r[c];
        for (let s = c + 1; s < m; s++) sum -= K[c][s] * innen[s];
        innen[c] = sum / K[c][c];
    }
    const stuetzmomente = [0, ...innen, 0];

    // Auflagerpositionen
    const X = [0];
    spans.forEach(L => X.push(X[X.length - 1] + L));
    const gesamtLaenge = X[n];

    // Schnittgrößen im Feld j an der lokalen Stelle x (0 ≤ x ≤ L), Lasten bei x genau auf a zählen erst rechts davon
    function feldSchnitt(j, x) {
        const L = spans[j], l = loads[j];
        const RA0 = l.q * L / 2 + (L > 0 ? l.F * (L - l.a) / L : 0);   // Einfeldträger ohne Stützmomente
        let Q = RA0 - l.q * x;
        let M = RA0 * x - l.q * x * x / 2;
        if (x > l.a) { Q -= l.F; M -= l.F * (x - l.a); }
        const Ml = stuetzmomente[j], Mr = stuetzmomente[j + 1];
        return { Q: Q + (Mr - Ml) / L, M: M + Ml * (1 - x / L) + Mr * x / L };
    }

    // Auflagerkräfte aus dem Querkraftsprung an jedem Auflager
    const auflager = X.map((_, i) => {
        const rechts = i < n ? feldSchnitt(i, 0).Q : 0;
        const links = i > 0 ? feldSchnitt(i - 1, spans[i - 1]).Q : 0;
        return rechts - links;
    });

    const eps = 1e-9;
    function schnitt(x) {
        if (x <= eps || x > gesamtLaenge + eps) return { Q: 0, M: 0 };
        let j = 0;
        while (j < n - 1 && x > X[j + 1] + eps) j++;
        return feldSchnitt(j, Math.min(x - X[j], spans[j]));
    }

    const kritischeStellen = X.slice();
    loads.forEach((l, j) => { if (l.F) kritischeStellen.push(X[j] + l.a); });
    const totalLoad = loads.reduce((s, l, j) => s + l.q * spans[j] + l.F, 0);

    return { spans, loads, X, L: gesamtLaenge, stuetzmomente, auflager, totalLoad, schnitt, kritischeStellen };
}

// Größtes positives Feldmoment je Feld: [{ M, x }] mit x als globaler Stelle (M = 0, wenn das Feld nur negative Momente hat)
function feldmomente(dlt) {
    return dlt.spans.map((L, j) => {
        const x0 = dlt.X[j];
        const stellen = [];
        const n = 2000;
        for (let i = 0; i <= n; i++) stellen.push(x0 + (i / n) * L);
        const l = dlt.loads[j];
        if (l.F) stellen.push(x0 + l.a);
        let best = { M: 0, x: x0 + L / 2 };
        stellen.forEach(x => {
            const M = dlt.schnitt(Math.min(Math.max(x, x0 + 1e-7), x0 + L)).M;
            if (M > best.M) best = { M, x };
        });
        return best;
    });
}

// Biegelinie w(x) eines Durchlaufträgers, nach unten positiv, für EI = 1 (also w · EI).
// Zweifache Integration von w'' = −M/EI; die Randbedingungen w(0) = w(L) = 0 werden über eine
// lineare Korrektur erfüllt. Weil die Stützmomente aus der Verträglichkeit stammen, ist w auch an
// allen Zwischenauflagern null. Rückgabe: { xs, ws, M, max } mit max = größter Betrag von w.
function biegelinie(dlt, n = 300) {
    const dx = dlt.L / n;
    const xs = [], M = [];
    for (let i = 0; i <= n; i++) {
        xs.push(i * dx);
        M.push(dlt.schnitt(Math.min(Math.max(i * dx, 1e-7), dlt.L)).M);
    }
    const w = [0];
    let phi = 0;
    for (let i = 1; i <= n; i++) {
        const phiNeu = phi - (M[i - 1] + M[i]) / 2 * dx;
        w.push(w[i - 1] + (phi + phiNeu) / 2 * dx);
        phi = phiNeu;
    }
    const wEnde = w[n];
    const ws = w.map((v, i) => v - wEnde * xs[i] / dlt.L);
    return { xs, ws, M, max: Math.max(1e-12, ...ws.map(Math.abs)) };
}

// Momentennullpunkte: Stellen, an denen M innerhalb des Trägers das Vorzeichen wechselt
function momentenNullpunkte(dlt, n = 2000) {
    const punkte = [];
    let alt = null;
    for (let i = 1; i < n; i++) {
        const x = (i / n) * dlt.L;
        const M = dlt.schnitt(x).M;
        if (Math.abs(M) < 1e-9) continue;          // genau auf dem Nullpunkt: mit dem nächsten Wert vergleichen
        if (alt && Math.sign(M) !== Math.sign(alt.M)) {
            punkte.push(alt.x + (x - alt.x) * Math.abs(alt.M) / (Math.abs(alt.M) + Math.abs(M)));
        }
        alt = { x, M };
    }
    return punkte;
}

// Für die automatischen Tests unter Node.js exportieren (im Browser ohne Wirkung)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        berechneTraeger,
        extremwerte,
        diagrammStellen,
        berechneDurchlauftraeger,
        feldmomente,
        biegelinie,
        momentenNullpunkte,
        zerlegeKraft,
        istImWertebereich,
        momentParameterwert,
        erhoeheQuizPunktestand
    };
}
