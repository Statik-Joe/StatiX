Virtuelles Bautechnik-Labor – FOS 12 (Hessen)
Stand dieser Sicherung: siehe Datei-Zeitstempel im ZIP (zuletzt bearbeitet: Modul 4).
Enthaltene Dateien (alle zusammen in einen Ordner legen!)
`index.html` – Hauptmenü mit den 4 Modul-Kacheln
`modul-1-kraefteaddition.html` – Kräfteaddition & Vektoren (inkl. Erfolgskontrolle + Protokoll-Export)
`modul-2-hebelgesetz.html` – Hebelgesetz & Drehmoment (inkl. Erfolgskontrolle + Protokoll-Export, M₁/M₂-Beschriftung am Balken, Balkenvergleich, Kompensationsrechner)
`modul-3-statik-einfeldtraeger.html` – Schnittgrößen-Tool "SchnittGrip Pro" (inkl. erweitertem PNG-Export)
`modul-4-diagramme-zuordnen.html` – Quiz: Diagramme zuordnen (Teil A: System→Linie, Teil B: M↔Q direkt; unterstützt Kragarme ein-/beidseitig, mehrere Einzellasten, kombinierte Streckenlast+Einzellast)
`tailwind.min.css` – lokal gebautes Stylesheet (offline-fähig, keine CDN-Abhängigkeit). Wird automatisch erzeugt, nicht von Hand bearbeiten!
`package.json`, `tailwind.config.js`, `src/tailwind.css` – nur zum Neuerzeugen von tailwind.min.css nötig, nicht für den Unterricht
`labor.css` – gemeinsames Stylesheet aller Module (Modulfarbe, Kopfzeile, Umschalter, Zeichenflächen, Eingabefelder)
`labor.js` – gemeinsame Hilfsfunktionen aller Module (Zahlen mit Dezimalkomma, Tiefstellung im Canvas, Auflagersymbole, Protokoll-Export)
Einheitliche Konventionen
Kräfte in kN, Momente in kNm, Streckenlasten in kN/m, Längen in m (Modul 2: Massen in kg, Umrechnung F = m · g im Rechenweg).
Zahlen mit Dezimalkomma, Einheit mit Leerzeichen (z. B. „2,5 kN“), Indizes tiefgestellt (z. B. F₁, q₁, M<sub>max</sub>).
Jedes Modul: Kopfzeile mit „Zurück zum Menü“ + Modul-Badge in der Modulfarbe (1 Indigo, 2 Sky, 3 Teal, 4 Amber), Abschnitt „Rechenweg – …“, einheitliches Protokollformat.
tailwind.min.css neu erzeugen
Nötig, wenn in den HTML-Dateien neue Tailwind-Klassen verwendet werden (sonst fehlen deren Stile). Einmalig Node.js installieren, dann im Projektordner:
`npm install` und danach `npm run build:css`
Tailwind durchsucht alle HTML-Dateien und labor.js und nimmt genau die verwendeten Klassen auf.
Wichtig
Alle Dateien müssen im selben Ordner liegen, sonst funktionieren Navigation und Styling nicht.
Am besten im mobilen/Desktop-Browser direkt aus dem Ordner öffnen (nicht nur die Chat-Vorschau einzelner Dateien) – siehe frühere Hinweise zur Chat-Vorschau.
Bei Änderungswünschen: diese ZIP-Datei (oder die einzelnen .html-Dateien) im nächsten Chat einfach wieder hochladen, dann kann darauf aufgebaut werden.
