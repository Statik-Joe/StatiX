// ==========================================================================
// Versionsangaben des Virtuellen Bautechnik-Labors – EINZIGE Stelle zum Pflegen.
//
// Bei jeder Aktualisierung:
//  1. Beim geänderten Modul die Version erhöhen und das Datum („stand“) anpassen.
//  2. Die Gesamtversion des Labors erhöhen und ihr Datum anpassen.
//  3. In allen HTML-Dateien den Verweis version.js?v=… auf die neue Gesamtversion setzen,
//     damit Browser nicht die alte, zwischengespeicherte Datei anzeigen.
//
// Schema: Hauptversion.Unterversion – kleine Verbesserungen und Fehlerbehebungen erhöhen die
// Unterversion (1.8 → 1.9), große Umbauten oder neue Teilbereiche die Hauptversion (1.9 → 2.0).
// Datum im Format JJJJ-MM-TT.
// ==========================================================================
const LABOR_VERSION = {
    version: '1.8',
    stand: '2026-10-16',
    module: {
        1: { version: '1.9',  stand: '2026-10-16' },   // Kräfteaddition & Vektoren
        2: { version: '1.7',  stand: '2026-10-01' },   // Hebelgesetz & Drehmoment
        3: { version: '1.11', stand: '2026-10-16' },   // Schnittgrößen (Einfeldträger)
        4: { version: '1.8',  stand: '2026-10-01' },   // Diagramme zuordnen
        5: { version: '1.6',  stand: '2026-10-01' }    // Spannungsnachweis
    }
};

// Anzeige: im Modul neben dem Modul-Badge, auf der Startseite an jeder Kachel und in der Fußzeile.
(function zeigeVersionen() {
    if (typeof document === 'undefined') return;   // unter Node.js (Tests) gibt es keine Seite
    const datum = iso => {
        const [j, m, t] = iso.split('-');
        return `${t}.${m}.${j}`;
    };
    const text = info => `Version ${info.version} · Stand ${datum(info.stand)}`;

    function einsetzen() {
        // Modulseite: <body data-modul="N">
        const nr = document.body.dataset.modul;
        const badge = document.querySelector('.lab-badge');
        if (nr && badge && LABOR_VERSION.module[nr] && !document.querySelector('.lab-version')) {
            const el = document.createElement('span');
            el.className = 'lab-version';
            el.textContent = text(LABOR_VERSION.module[nr]);
            el.title = `Bautechnik-Labor ${text(LABOR_VERSION)}`;
            badge.insertAdjacentElement('afterend', el);
        }
        // Startseite: Kacheln mit data-version-modul="N" und Fußzeile mit id="laborVersion"
        document.querySelectorAll('[data-version-modul]').forEach(el => {
            const info = LABOR_VERSION.module[el.dataset.versionModul];
            if (info) el.textContent = `v${info.version} · ${datum(info.stand)}`;
        });
        const gesamt = document.getElementById('laborVersion');
        if (gesamt) gesamt.textContent = text(LABOR_VERSION);
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', einsetzen);
    else einsetzen();
})();

// Für die automatischen Tests unter Node.js exportieren (im Browser ohne Wirkung)
if (typeof module !== 'undefined' && module.exports) module.exports = { LABOR_VERSION };
