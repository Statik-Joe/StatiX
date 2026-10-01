// ==========================================================================
// Gemeinsame Hilfsfunktionen für alle Module des Virtuellen Bautechnik-Labors.
// Sorgen dafür, dass Zahlen, Beschriftungen und Auflagersymbole in jedem
// Modul gleich dargestellt werden.
// ==========================================================================

// Zahl mit deutschem Dezimalkomma formatieren.
// fmt(3.14159, 2) -> "3,14"   |   fmt(2.5) -> "2,5" (ohne feste Nachkommastellen)
function fmt(value, digits) {
    const num = Number(value);
    let s = digits === undefined ? String(Math.round(num * 1000) / 1000) : num.toFixed(digits);
    if (/^-0(\.0*)?$/.test(s)) s = s.slice(1); // "-0,0" vermeiden
    return s.replace('.', ',');
}

// Canvas-Text mit Tiefstellung zeichnen: "M_{max} = 12,5 kNm" setzt "max" tiefer und kleiner.
// Berücksichtigt ctx.textAlign (left/start, center, right/end) wie ctx.fillText.
function fillTextSub(ctx, text, x, y) {
    const parts = [];
    const re = /_\{([^}]*)\}/g;
    let last = 0, m;
    while ((m = re.exec(text)) !== null) {
        if (m.index > last) parts.push({ t: text.slice(last, m.index), sub: false });
        parts.push({ t: m[1], sub: true });
        last = re.lastIndex;
    }
    if (last < text.length) parts.push({ t: text.slice(last), sub: false });

    const baseFont = ctx.font;
    const sizeMatch = baseFont.match(/(\d+(?:\.\d+)?)px/);
    const size = sizeMatch ? parseFloat(sizeMatch[1]) : 12;
    const subFont = baseFont.replace(/(\d+(?:\.\d+)?)px/, (size * 0.75).toFixed(1) + 'px');

    const widths = parts.map(p => {
        ctx.font = p.sub ? subFont : baseFont;
        return ctx.measureText(p.t).width;
    });
    const total = widths.reduce((a, b) => a + b, 0);

    const align = ctx.textAlign;
    let cx = x;
    if (align === 'center') cx = x - total / 2;
    else if (align === 'right' || align === 'end') cx = x - total;

    ctx.textAlign = 'left';
    parts.forEach((p, i) => {
        ctx.font = p.sub ? subFont : baseFont;
        ctx.fillText(p.t, cx, p.sub ? y + size * 0.3 : y);
        cx += widths[i];
    });
    ctx.font = baseFont;
    ctx.textAlign = align;
}

// Auflagersymbol nach Baustatik-Konvention zeichnen.
// (x, y) = Spitze des Dreiecks (Unterkante Träger), type = 'fest' oder 'los'.
// Festlager: Dreieck + Gelenk + schraffierte Bodenlinie.
// Loslager:  Dreieck + Gelenk + zwei Rollen + schraffierte Bodenlinie.
function drawSupport(ctx, x, y, type) {
    ctx.save();
    ctx.setLineDash([]);
    const h = 22;

    // Dreieck
    ctx.fillStyle = '#64748b';
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - 14, y + h);
    ctx.lineTo(x + 14, y + h);
    ctx.closePath();
    ctx.fill();

    // Gelenk an der Spitze
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y + 4, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    let groundY = y + h + 2;
    if (type === 'los') {
        ctx.fillStyle = '#64748b';
        ctx.beginPath();
        ctx.arc(x - 7, y + h + 4, 3, 0, Math.PI * 2);
        ctx.arc(x + 7, y + h + 4, 3, 0, Math.PI * 2);
        ctx.fill();
        groundY = y + h + 8;
    }

    // Bodenlinie mit Schraffur
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - 20, groundY);
    ctx.lineTo(x + 20, groundY);
    ctx.stroke();
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.5;
    for (let i = -18; i <= 18; i += 6) {
        ctx.beginPath();
        ctx.moveTo(x + i, groundY);
        ctx.lineTo(x + i - 6, groundY + 7);
        ctx.stroke();
    }
    ctx.restore();
}

// Protokoll der Erfolgskontrolle in einheitlichem Format als Textdatei herunterladen.
// entries: [{ zeit, aufgabe, details: ['Zeile', ...], richtig, gesamt }]
function exportProtocol(modulNr, modulTitel, studentName, entries) {
    if (!entries.length) return;
    const name = studentName.trim() || '—';
    let text = `Erfolgskontrolle – Modul ${modulNr}: ${modulTitel}\n`;
    text += `Name: ${name}\n`;
    text += `Exportiert am: ${new Date().toLocaleString('de-DE')}\n`;
    text += `${'='.repeat(50)}\n\n`;
    entries.forEach((e, i) => {
        text += `Aufgabe ${i + 1} (${e.zeit})\n`;
        text += `  ${e.aufgabe}\n`;
        (e.details || []).forEach(line => { text += `    ${line}\n`; });
        text += `  Ergebnis: ${e.richtig}/${e.gesamt} richtig\n\n`;
    });
    const richtig = entries.reduce((s, e) => s + e.richtig, 0);
    const gesamt = entries.reduce((s, e) => s + e.gesamt, 0);
    text += `${'='.repeat(50)}\n`;
    text += `Gesamt: ${entries.length} Aufgabe(n), ${richtig}/${gesamt} richtig (${Math.round(100 * richtig / gesamt)} %)\n`;

    const safeName = name !== '—' ? name.replace(/[^a-zA-Z0-9äöüÄÖÜß_-]/g, '_') : 'protokoll';
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `erfolgskontrolle_modul${modulNr}_${safeName}.txt`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
}

// ==========================================================================
// Unterricht am Beamer / Tablet
// 1) Präsentationsmodus: Knopf neben dem Modul-Badge vergrößert Schrift und Bedienelemente
//    (alle Größen hängen an rem). Die Einstellung gilt für alle Module und bleibt beim
//    Wechsel zwischen den Seiten erhalten.
// 2) Vollbild: Jede große Zeichenfläche bekommt oben rechts einen ⛶-Knopf. Im Vollbild wird die
//    Zeichnung formatfüllend skaliert; Ziehen per Maus/Finger funktioniert weiter. Esc beendet.
// ==========================================================================
(function initUnterrichtsansicht() {
    const STORAGE_KEY = 'bautechnik-labor:praesentation';
    const root = document.documentElement;

    function readSetting() {
        try { return localStorage.getItem(STORAGE_KEY) === '1'; } catch (e) { return false; }
    }
    function saveSetting(on) {
        try { localStorage.setItem(STORAGE_KEY, on ? '1' : '0'); } catch (e) { /* z. B. privater Modus */ }
    }

    // ---------- Präsentationsmodus ----------
    const badge = document.querySelector('.lab-badge');
    if (badge) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'lab-present-btn';
        badge.insertAdjacentElement('afterend', btn);
        const apply = on => {
            root.classList.toggle('lab-present', on);
            btn.textContent = on ? '🖥️ Präsentation: an' : '🖥️ Präsentation';
            btn.setAttribute('aria-pressed', on ? 'true' : 'false');
            btn.title = on ? 'Normale Schriftgröße' : 'Große Schrift für Beamer und Tafel';
            // Canvas-Elemente mit festen Pixelgrößen (z. B. Tooltips) neu positionieren lassen
            window.dispatchEvent(new Event('resize'));
        };
        apply(readSetting());
        btn.addEventListener('click', () => {
            const on = !root.classList.contains('lab-present');
            saveSetting(on);
            apply(on);
        });
    }

    // ---------- Vollbild für Zeichenflächen ----------
    const canFullscreen = !!(root.requestFullscreen || root.webkitRequestFullscreen);
    if (!canFullscreen) return;   // z. B. iPhone-Safari: dort gibt es keine Vollbild-Schnittstelle für Elemente

    const fsElement = () => document.fullscreenElement || document.webkitFullscreenElement;
    const enterFs = el => (el.requestFullscreen || el.webkitRequestFullscreen).call(el);
    const exitFs = () => (document.exitFullscreen || document.webkitExitFullscreen).call(document);

    document.querySelectorAll('canvas').forEach(canvas => {
        if (canvas.width < 700) return;   // kleine Diagramme (z. B. Antwortkarten in Modul 4) auslassen
        const host = canvas.parentElement;
        host.classList.add('lab-fs-host');
        // Seitenverhältnis merken, damit die Zeichnung im Vollbild unverzerrt formatfüllend wird
        const updateRatio = () => canvas.style.setProperty('--lab-ratio', canvas.width / canvas.height);
        updateRatio();
        new MutationObserver(updateRatio).observe(canvas, { attributes: true, attributeFilter: ['width', 'height'] });

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'lab-fs-btn';
        btn.textContent = '⛶';
        btn.title = 'Zeichnung im Vollbild anzeigen (Esc beendet)';
        btn.setAttribute('aria-label', btn.title);
        btn.addEventListener('click', () => { fsElement() === host ? exitFs() : enterFs(host); });
        host.appendChild(btn);
    });
    const onFsChange = () => {
        document.querySelectorAll('.lab-fs-btn').forEach(b => {
            const active = fsElement() === b.parentElement;
            b.textContent = active ? '✕' : '⛶';
        });
        window.dispatchEvent(new Event('resize'));
    };
    document.addEventListener('fullscreenchange', onFsChange);
    document.addEventListener('webkitfullscreenchange', onFsChange);
})();
