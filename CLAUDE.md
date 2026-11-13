# CLAUDE.md – Hinweise für die Arbeit an diesem Repository

Virtuelles Bautechnik-Labor: interaktive Statik-Lernmodule für die FOS 12 (Hessen). Statische HTML-, CSS- und JavaScript-Dateien, laufen offline ohne Server. Überblick und Modulliste: `README.md`, geplante Erweiterungen: `ROADMAP.md`.

Modulnummern ab Labor 3.0: 1 Kräfteaddition, 2 Hebelgesetz, 3 Lastannahme, 4 Schnittgrößen (Einfeldträger), 5 Diagramme zuordnen, 6 Spannungsnachweis, 7 Durchlaufträger. Die alten Dateinamen (z. B. `modul-3-statik-einfeldtraeger.html`) leiten nur noch auf die neuen Seiten weiter – nicht löschen und nicht für neue Arbeit verwenden.

## Zusammenarbeit

- Mit dem Nutzer auf Deutsch kommunizieren, gern kurz und auf den Punkt.
- Pull Requests nur anlegen, wenn der Nutzer darum bittet. **Mergen nur nach ausdrücklicher Bestätigung** („ja, mergen“).
- Fachliche Kennwerte (Materialwerte, zulässige Spannungen, Tabellenbeiwerte) mit einer Quelle belegen. Was nicht sicher belegt ist, offen benennen – der Nutzer prüft solche Werte selbst im Tabellenbuch.
- Nächste Aufgaben stehen in `ROADMAP.md`. Erledigte Punkte dort abhaken und mit der Version vermerken.
- Bei mehrdeutigen didaktischen Entscheidungen (z. B. Einheiten, Rechenverfahren) kurz nachfragen statt zu raten.

## Fachliche Konventionen

- Einheiten: Kräfte in kN, Momente in kNm, Streckenlasten in kN/m, Längen in m. Modul 2: Massen in kg, F = m · g im Rechenweg in N und kN.
- Zahlen mit deutschem Dezimalkomma und Leerzeichen vor der Einheit („2,5 kN“): `fmt()` aus `labor.js` verwenden.
- Indizes tiefgestellt: im HTML `<sub>`, im Canvas `fillTextSub(ctx, 'M_{max} = …')`.
- Querkraft heißt **V** (wie in der Abschlussprüfung), nicht Q. Vorzeichen wie in Modul 4 (Schnittgrößen): V positiv nach oben, M positiv nach unten (Zugseite). Im Code heißt das Feld weiterhin `Q`. Querkraftsprünge senkrecht zeichnen – Diagramme über `diagrammStellen()` auswerten.
- Bemessungswerte nach Eurocode (DIN EN 1990) wie in der Abschlussprüfung: erst charakteristisch g_k, q_k (DIN EN 1991-1-1 mit NA), dann g_d = 1,35 · g_k, q_d = 1,5 · q_k, E_d = g_d + q_d; Ergebnisse mit Index Ed (A_Ed,V, B_Ed,V, V_Ed, M_Ed). Modul 3 übergibt g_d und q_d an Modul 4.
- Modul 6 (Spannungsnachweis) arbeitet mit klassischen zulässigen Spannungen (Holz nach DIN 1052:1988, Stahl nach DIN 1050) und gehört zu charakteristischen Momenten. Ein übergebenes M_Ed wird dort mit einem Warnhinweis gekennzeichnet – bei Übergängen zwischen den Modulen auf diesen Unterschied achten.

## Aufbau und gemeinsame Bausteine

- Jedes Modul: `<body data-modul="N">`, Kopfzeile mit `.lab-back` und `.lab-badge`, Abschnitt „Rechenweg – …“, Erfolgskontrolle mit `exportProtocol()` und optional `initLearningProgress(N, …)`.
- `labor.css` / `labor.js`: Modulfarben, Kopfzeile, Präsentationsmodus, Vollbild, Formatierung, Protokoll, lokaler Fortschritt.
- `statik-core.js`: gemeinsamer Rechenkern (u. a. Einfeldträger, Durchlaufträger, Extremwerte, Diagrammstellen). Neue Rechnungen hier ergänzen und testen, nicht in einzelnen Modulen duplizieren.
- `version.js`: einzige Stelle für Versionen. Bei Änderungen am Modul Version und `stand` erhöhen, ebenso die Gesamtversion; neue Module = neue Hauptversion des Labors.
- Neues Modul: Kachel in `index.html`, Farbe in `labor.css`, Eintrag in `version.js` und `tests/version.test.js`, README (Modulliste und Offline-Paket), ROADMAP.

## Build, Cache und Tests

- `tailwind.min.css` nie von Hand bearbeiten: nach neuen Tailwind-Klassen `npm ci` (falls nötig) und `npm run build:css`.
- Nach Änderungen an `labor.js`, `labor.css`, `statik-core.js` oder `tailwind.min.css`: `npm run cache` (setzt `?v=` auf eine Prüfsumme, `npm test` prüft das). `version.js?v=` = Gesamtversion. Die Schüler nutzen die App am Handy über GitHub Pages – ein vergessener Cache-Schutz führt dort zu „Script error“ und leeren Zeichnungen.
- Kein `?.` und kein `??` in Skripten (ältere Handy-Browser lehnen sonst das ganze Skript ab; `npm test` prüft das).
- Vor jedem Push: `npm test` muss grün sein. Zusätzlich die geänderten Seiten im Browser (Playwright, Chromium ist vorinstalliert) laden und auf JavaScript-Fehler prüfen, bei Zeichnungen Screenshots ansehen.
