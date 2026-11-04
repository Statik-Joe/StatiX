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

// Labor 3.0: Die Lastannahme ist neu Modul 3, die bisherigen Module 3–6 sind zu 4–7 geworden.
// Gespeicherten Fortschritt deshalb einmalig zur neuen Modulnummer umziehen (von hinten nach vorn,
// damit nichts überschrieben wird). Danach merkt sich das Labor, dass der Umzug erledigt ist.
(function fortschrittUmnummerieren() {
    const erledigt = 'bautechnik-labor:nummerierung:v3';
    try {
        if (localStorage.getItem(erledigt)) return;
        for (const alt of [6, 5, 4, 3]) {
            const von = `bautechnik-labor:modul-${alt}:fortschritt:v1`;
            const nach = `bautechnik-labor:modul-${alt + 1}:fortschritt:v1`;
            const wert = localStorage.getItem(von);
            if (wert !== null) {
                localStorage.setItem(nach, wert);
                localStorage.removeItem(von);
            }
        }
        localStorage.setItem(erledigt, '1');
    } catch (error) { /* kein lokaler Speicher (z. B. privater Modus): nichts umzuziehen */ }
})();

// Optionales Speichern von Eingaben und abgeschlossenen Übungsversuchen auf diesem Gerät.
function initLearningProgress(modulNr, options = {}) {
    const key = `bautechnik-labor:modul-${modulNr}:fortschritt:v1`;
    const enabledKey = 'bautechnik-labor:fortschritt-aktiv';
    const badge = document.querySelector('.lab-badge');
    const header = badge && badge.parentElement ? badge.parentElement.parentElement : null;
    if (!header) throw new Error(`Kopfzeile für Modul ${modulNr} nicht gefunden.`);

    const control = document.createElement('div');
    control.className = 'lab-progress-control';
    const label = document.createElement('label');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'lab-progress-toggle';
    checkbox.setAttribute('aria-label', 'Fortschritt auf diesem Gerät speichern');
    label.append(checkbox, document.createTextNode(' Fortschritt speichern'));

    const clearButton = document.createElement('button');
    clearButton.type = 'button';
    clearButton.className = 'lab-progress-clear';
    clearButton.textContent = 'Daten löschen';
    clearButton.disabled = true;

    const status = document.createElement('span');
    status.className = 'lab-progress-status';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    control.append(label, clearButton, status);
    header.appendChild(control);
    let restoreBlocked = false;

    function setStatus(message, isError = false) {
        status.textContent = message;
        status.classList.toggle('is-error', isError);
    }

    function captureControls() {
        const values = {};
        document.querySelectorAll('input[id], select[id], textarea[id]').forEach(input => {
            if (input.classList.contains('lab-progress-toggle') ||
                input.type === 'password' || input.type === 'file' ||
                /^studentName/i.test(input.id)) return;
            values[input.id] = input.type === 'checkbox' || input.type === 'radio'
                ? input.checked
                : input.value;
        });
        return values;
    }

    function restoreControls(values) {
        Object.entries(values || {}).forEach(([id, value]) => {
            const input = document.getElementById(id);
            if (!input || input.classList.contains('lab-progress-toggle')) return;
            if (input.type === 'checkbox' || input.type === 'radio') input.checked = value === true;
            else input.value = String(value);
        });
    }

    function save() {
        if (!checkbox.checked || restoreBlocked) return;
        try {
            const record = {
                version: 1,
                savedAt: new Date().toISOString(),
                controls: captureControls(),
                custom: options.capture ? options.capture() : null
            };
            localStorage.setItem(key, JSON.stringify(record));
            clearButton.disabled = false;
            setStatus('Auf diesem Gerät gespeichert.');
        } catch (error) {
            setStatus(`Speichern nicht möglich: ${error.message || error}`, true);
        }
    }

    function restore() {
        let record;
        try {
            const raw = localStorage.getItem(key);
            if (!raw) {
                setStatus('Speichern ist aktiviert. Bisher gibt es hier noch keinen gespeicherten Stand.');
                return 'empty';
            }
            record = JSON.parse(raw);
            if (record.version !== 1 || !record.controls || typeof record.controls !== 'object') {
                throw new Error('Der gespeicherte Stand hat ein unbekanntes Format.');
            }
            restoreControls(record.controls);
            if (options.restore) options.restore(record.custom);
            restoreBlocked = false;
            clearButton.disabled = false;
            const savedAt = new Date(record.savedAt);
            const time = Number.isNaN(savedAt.getTime()) ? '' : ` (${savedAt.toLocaleString('de-DE')})`;
            setStatus(`Gespeicherter Stand wiederhergestellt${time}.`);
            return 'restored';
        } catch (error) {
            restoreBlocked = true;
            setStatus(`Wiederherstellen nicht möglich: ${error.message || error}`, true);
            return 'error';
        }
    }

    let saveTimer;
    function scheduleSave() {
        if (!checkbox.checked) return;
        window.clearTimeout(saveTimer);
        saveTimer = window.setTimeout(save, 250);
    }
    document.addEventListener('input', scheduleSave);
    document.addEventListener('change', scheduleSave);

    checkbox.addEventListener('change', () => {
        try {
            localStorage.setItem(enabledKey, checkbox.checked ? '1' : '0');
        } catch (error) {
            checkbox.checked = false;
            setStatus(`Speichereinstellung nicht verfügbar: ${error.message || error}`, true);
            return;
        }
        if (checkbox.checked) {
            if (restore() === 'empty') save();
        } else {
            setStatus('Speichern pausiert. Bereits gespeicherte Daten bleiben erhalten.');
        }
    });

    clearButton.addEventListener('click', () => {
        try {
            localStorage.removeItem(key);
            restoreBlocked = false;
            clearButton.disabled = true;
            setStatus('Gespeicherter Stand dieses Moduls wurde gelöscht.');
        } catch (error) {
            setStatus(`Löschen nicht möglich: ${error.message || error}`, true);
        }
    });

    try {
        checkbox.checked = localStorage.getItem(enabledKey) === '1';
        if (checkbox.checked) restore();
    } catch (error) {
        checkbox.disabled = true;
        clearButton.disabled = true;
        setStatus(`Lokaler Speicher ist nicht verfügbar: ${error.message || error}`, true);
    }

    return { save };
}

// ==========================================================================
// Mitwachsende Zeichenfläche für Handy, Tablet und Vollbild.
// Die Zeichnung wird in einer logischen Breite W angelegt, die der tatsächlichen Breite auf dem
// Bildschirm entspricht (begrenzt auf minBreite … maxBreite). Text bleibt dadurch auch auf dem Handy
// so groß wie im übrigen Seitentext. Ist der Bildschirm breiter als maxBreite (Desktop, Vollbild),
// wird die Zeichnung nur noch vergrößert. Scharf auf hochauflösenden Displays (devicePixelRatio).
//
// Mit festeBreite (z. B. 800) gilt ab der Breite schmalAb (Standard 600 px) immer W = festeBreite:
// Die bewährte Desktop-Zeichnung bleibt unverändert und wird nur skaliert. Darunter zeichnet das
// Modul ein eigenes, schmales Layout mit W < schmalAb.
//
//   const z = responsiveCanvas(canvas, 400, (ctx, W, H) => { ... }, { maxBreite: 900 });
//   z.zeichne()          erneut zeichnen (z. B. nach neuen Eingabewerten oder in einer Animation)
//   z.setze(fn)          neue Zeichenfunktion (ctx, W, H) hinterlegen und zeichnen
//   z.vorbereiten(H)     Zeichenfläche selbst vorbereiten (optional mit neuer Höhe H): { ctx, W, H }
//   z.punkt(x, y)        Bildschirmkoordinaten (clientX/clientY) in Zeichnungskoordinaten umrechnen
//   z.mass()             { W, H, s }: s = Bildschirmpixel je Zeichnungseinheit
// hoehe darf eine Zahl oder eine Funktion der logischen Breite W sein.
// Im HTML bleibt width="900" (bzw. die bisherige Breite) stehen, damit labor.js den Vollbild-Knopf
// ergänzt, und data-responsive="1", damit kein Hinweis zum Querformat erscheint.
// ==========================================================================
function responsiveCanvas(canvas, hoehe, zeichne, optionen = {}) {
    const { minBreite = 320, maxBreite = 900, festeBreite = 0, schmalAb = 600 } = optionen;
    canvas.dataset.responsive = '1';
    let mass = null;
    let malen = zeichne || null;
    const hoeheFuer = W => (typeof hoehe === 'function' ? hoehe(W) : hoehe);
    const logischeBreite = breite => (festeBreite && breite >= schmalAb)
        ? festeBreite
        : Math.min(maxBreite, Math.max(minBreite, breite));
    const messen = () => {
        const b = canvas.getBoundingClientRect().width;
        return b >= 1 ? b : 0;
    };

    function anwenden(breite, H) {
        const W = logischeBreite(breite);
        const s = breite / W;
        const dpr = window.devicePixelRatio || 1;
        const bw = Math.max(1, Math.round(breite * dpr));
        const bh = Math.max(1, Math.round(H * s * dpr));
        if (canvas.width !== bw) canvas.width = bw;
        if (canvas.height !== bh) canvas.height = bh;
        mass = { breite, W, H, s, dpr };
    }

    function vorbereiten(H) {
        // Unsichtbar (zugeklappt, anderer Teil): mit der zuletzt bekannten bzw. der Desktop-Breite arbeiten
        const breite = messen() || (mass ? mass.breite : (festeBreite || maxBreite));
        const neueH = H !== undefined ? H : hoeheFuer(logischeBreite(breite));
        if (!mass || Math.abs(breite - mass.breite) >= 0.5 || neueH !== mass.H) anwenden(breite, neueH);
        const ctx = canvas.getContext('2d');
        ctx.setTransform(mass.s * mass.dpr, 0, 0, mass.s * mass.dpr, 0, 0);
        ctx.clearRect(0, 0, mass.W, mass.H);
        return { ctx, W: mass.W, H: mass.H };
    }

    function zeichnen() {
        if (!malen) return;
        const { ctx, W, H } = vorbereiten();
        malen(ctx, W, H);
    }

    function beiGroessenaenderung() {
        const breite = messen();
        if (!breite || (mass && Math.abs(breite - mass.breite) < 0.5)) return;
        zeichnen();
    }
    if (typeof ResizeObserver !== 'undefined') new ResizeObserver(beiGroessenaenderung).observe(canvas);
    window.addEventListener('resize', beiGroessenaenderung);

    return {
        neu: zeichnen,
        zeichne: zeichnen,
        setze(fn) { malen = fn; zeichnen(); },
        vorbereiten,
        mass: () => mass,
        // logische Breite für die aktuelle Größe auf dem Bildschirm (ohne neu zu zeichnen)
        breite: () => logischeBreite(messen() || (mass ? mass.breite : (festeBreite || maxBreite))),
        punkt(clientX, clientY) {
            const r = canvas.getBoundingClientRect();
            const W = mass ? mass.W : canvas.width, H = mass ? mass.H : canvas.height;
            return { x: (clientX - r.left) * W / r.width, y: (clientY - r.top) * H / r.height };
        }
    };
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

    // ---------- Hinweis auf dem Handy im Hochformat ----------
    // Feste Zeichnungen (900 px breit) werden auf dem Handy stark verkleinert. Quer gehalten sind sie
    // etwa doppelt so groß. Mitwachsende Zeichnungen (responsiveCanvas, data-responsive="1")
    // brauchen den Hinweis nicht. Derzeit wachsen alle Zeichnungen mit; der Hinweis bleibt für
    // künftige Module mit fester Zeichnung.
    document.querySelectorAll('canvas').forEach(canvas => {
        if (canvas.width < 700 || canvas.dataset.responsive) return;
        if (canvas.parentElement.querySelector(':scope > .lab-rotate-hint')) return;
        const hint = document.createElement('p');
        hint.className = 'lab-rotate-hint';
        hint.textContent = '📱 Tipp: Gerät quer halten, dann wird die Zeichnung größer und die Beschriftung besser lesbar.';
        canvas.insertAdjacentElement('afterend', hint);
    });

    // ---------- Vollbild für Zeichenflächen ----------
    const canFullscreen = !!(root.requestFullscreen || root.webkitRequestFullscreen);
    if (!canFullscreen) return;   // z. B. iPhone-Safari: dort gibt es keine Vollbild-Schnittstelle für Elemente

    const fsElement = () => document.fullscreenElement || document.webkitFullscreenElement;
    const enterFs = el => (el.requestFullscreen || el.webkitRequestFullscreen).call(el);
    const exitFs = () => (document.exitFullscreen || document.webkitExitFullscreen).call(document);

    document.querySelectorAll('canvas').forEach(canvas => {
        if (canvas.width < 700) return;   // kleine Diagramme (z. B. Antwortkarten in Modul 5) auslassen
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
