# CLAUDE.md – Hinweise für die Arbeit an diesem Repository

Virtuelles Bautechnik-Labor: interaktive Statik-Lernmodule für die FOS 12 (Hessen). Statische HTML-, CSS- und JavaScript-Dateien, laufen offline ohne Server. Überblick: `README.md`, geplante Erweiterungen: `ROADMAP.md`.

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
- Vorzeichen wie in Modul 3: Q positiv nach oben, M positiv nach unten (Zugseite). Querkraftsprünge senkrecht zeichnen – Diagramme über `diagrammStellen()` auswerten.
- Modul 5 arbeitet mit klassischen zulässigen Spannungen (Holz nach DIN 1052:1988, Stahl nach DIN 1050), nicht mit Eurocode-Bemessungswerten.

## Aufbau und gemeinsame Bausteine

- Jedes Modul: `<body data-modul="N">`, Kopfzeile mit `.lab-back` und `.lab-badge`, Abschnitt „Rechenweg – …“, Erfolgskontrolle mit `exportProtocol()` und optional `initLearningProgress(N, …)`.
- `labor.css` / `labor.js`: Modulfarben, Kopfzeile, Präsentationsmodus, Vollbild, Formatierung, Protokoll, lokaler Fortschritt.
- `statik-core.js`: gemeinsamer Rechenkern (Einfeldträger, Durchlaufträger, Extremwerte, Diagrammstellen). Neue Rechnungen hier ergänzen und testen, nicht in einzelnen Modulen duplizieren.
- `version.js`: einzige Stelle für Versionen. Bei Änderungen am Modul Version und `stand` erhöhen, ebenso die Gesamtversion; neue Module = neue Hauptversion des Labors.
- Neues Modul: Kachel in `index.html`, Farbe in `labor.css`, Eintrag in `version.js` und `tests/version.test.js`, README (Modulliste und Offline-Paket), ROADMAP.

## Build, Cache und Tests

- `tailwind.min.css` nie von Hand bearbeiten: nach neuen Tailwind-Klassen `npm ci` (falls nötig) und `npm run build:css`.
- Nach Änderungen an CSS/JS die `?v=…`-Angaben in allen HTML-Dateien erhöhen (Cache-Schutz); `version.js?v=` = Gesamtversion.
- Vor jedem Push: `npm test` muss grün sein. Zusätzlich die geänderten Seiten im Browser (Playwright, Chromium ist vorinstalliert) laden und auf JavaScript-Fehler prüfen, bei Zeichnungen Screenshots ansehen.
