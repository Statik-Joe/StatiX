# Technische Dokumentation – Virtuelles Bautechnik-Labor

Diese Datei beschreibt, wie das Labor aufgebaut ist, wie es rechnet und was bei Änderungen nicht kaputtgehen darf. Sie richtet sich an alle, die das Projekt später pflegen – Menschen wie KI-Modelle. Die Bedienung aus Sicht des Unterrichts steht in `README.md`, die Aufgabenliste in `ROADMAP.md`, die Kurzregeln für KI-Sitzungen in `CLAUDE.md`.

Stand: Labor 3.10 (17.11.2026).

## 1. Überblick

- Sieben Lernmodule und eine Startseite, reines HTML, CSS und JavaScript ohne Framework.
- Läuft ohne Server und ohne Internet: Alle Dateien liegen im selben Ordner, es gibt keine Zugriffe auf fremde Adressen.
- Im Unterricht wird die App über GitHub Pages geöffnet (auch am Handy). Der Hauptzweig `main` ist der veröffentlichte Stand.
- Node.js wird nur für Tests und Hilfswerkzeuge gebraucht, nie für die App selbst.

## 2. Dateien

| Datei | Zweck | Gehört ins Offline-Paket |
|---|---|---|
| `index.html` | Startseite mit den sieben Kacheln | ja |
| `modul-1-kraefteaddition.html` … `modul-7-durchlauftraeger.html` | je ein Modul: HTML, Zeichnung und Bedienlogik in einem eingebetteten Skript | ja |
| `modul-3-statik-einfeldtraeger.html`, `modul-4-diagramme-zuordnen.html`, `modul-5-spannungsnachweis.html`, `modul-6-durchlauftraeger.html` | Weiterleitungen alter Adressen aus Labor 2.x (nicht löschen, nicht bearbeiten) | optional |
| `statik-core.js` | **Rechenkern**: alle fachlichen Rechnungen, Tabellenwerte und Aufgabengeneratoren | ja |
| `labor.js` | gemeinsame Bedienung: `fmt()`, `fillTextSub()`, Auflagersymbol, Protokoll-Export, Fortschritt speichern, mitwachsende Zeichenfläche, Präsentationsmodus, Vollbild | ja |
| `labor.css` | Modulfarben, Kopfzeile, Touch-Größen, Druckansicht | ja |
| `tailwind.min.css` | erzeugtes Stylesheet (nie von Hand ändern) | ja |
| `version.js` | einzige Stelle für Versionsnummern und Datum | ja |
| `tests/*.test.js` | automatische Tests (`npm test`) | nein |
| `tools/cache-version.js` | setzt die `?v=`-Prüfsummen (`npm run cache`) | nein |
| `src/tailwind.css`, `tailwind.config.js`, `package.json`, `package-lock.json` | Build des Stylesheets | nein |

Jede Modulseite lädt in dieser Reihenfolge: kleines Fehlermelde-Skript im `<head>`, `tailwind.min.css`, `labor.css`, dann am Ende `labor.js`, `version.js`, `statik-core.js` und das eigene eingebettete Skript.

## 3. Arbeitsteilung: Wo steht was?

- **Rechnen** gehört in `statik-core.js`. Die Funktionen dort kennen keine Seite (kein `document`) und laufen deshalb auch unter Node.js in den Tests.
- **Zeichnen und Bedienen** steht im eingebetteten Skript des Moduls. Es liest Eingaben, ruft den Rechenkern auf und zeigt Ergebnisse an.
- **Formatieren** (`fmt`) und alles, was mehrere Module gleich brauchen, steht in `labor.js`.

Wer eine Rechnung ändert oder ergänzt, tut das im Rechenkern und schreibt einen Test mit Handrechnung dazu.

## 4. Vorzeichen, Einheiten, Schreibweise

| Thema | Regel |
|---|---|
| Kräfte, Momente, Streckenlasten, Längen | kN, kNm, kN/m, m |
| Modul 2 | Massen in kg; F = m · g mit g = 9,81 m/s², angezeigt in N und kN |
| Modul 3 | Schichtdicken in cm (Eingabe), Rechnung in m; Wichten kN/m³, Flächenlasten kN/m² |
| Modul 6 | Querschnittsmaße cm, I in cm⁴, W in cm³, Spannungen N/mm² |
| Trägerkoordinate x | Auflager A (Festlager) bei x = 0, Auflager B (Loslager) bei x = L; Kragarme bei x < 0 und x > L |
| Lasten | nach unten positiv |
| Querkraft | heißt **V** (im Code `Q`); positiv, wenn die Summe der Kräfte links vom Schnitt nach oben zeigt; im Diagramm nach oben |
| Moment | positiv bei Zug unten (Feldmoment); im Diagramm nach unten aufgetragen (Zugseite); Stützmomente über Kragarm-Auflagern sind negativ |
| Winkel in Modul 1 | von der positiven x-Achse gegen den Uhrzeigersinn, 90° nach oben |
| Winkel in Modul 4 | von der Trägerachse im Uhrzeigersinn: 0° nach rechts, 90° nach unten, 270° nach oben |
| Winkel β in Modul 1, Modus „Schräge Last“ | zur Flächennormalen (Senkrechten) |
| Zahlen | deutsches Dezimalkomma, Leerzeichen vor der Einheit; immer über `fmt()` |
| Rundung | kaufmännisch (9,375 → 9,38, −9,375 → −9,38); gerundet wird nur für die Anzeige, gerechnet wird ungerundet |
| Toleranz in Übungen | einheitlich 2 %, mindestens 0,05 (`pruefeWert`); Winkel 1° mit Umlauf über 360° (`pruefeWinkel`) |
| Bemessungswerte | g_d = 1,35 · g_k, q_d = 1,5 · q_k, E_d = g_d + q_d; Ergebnisse mit Index Ed |

## 5. Rechenlogik je Modul

Die Funktionsnamen in Klammern stehen in `statik-core.js`.

### Modul 1 – Kräfteaddition

- Zerlegung: F_x = F · cos α, F_y = F · sin α. Resultierende: F_Rx = F_1x + F_2x, F_Ry = F_1y + F_2y, F_R = √(F_Rx² + F_Ry²), φ = arctan(F_Ry / F_Rx) im Bereich 0° bis 360° (`addiereKraefte`).
- Schräge Last auf einer Fläche: F_y = F · cos β, F_x = F · sin β (`zerlegeSchraegeLast`). Der Kräftemaßstab rechnet nur die Pfeillänge in cm um.
- Übung: Bei F_R < 1,5 kN wird φ nicht gewertet, weil die Richtung dann nicht bestimmt ist.

### Modul 2 – Hebelgesetz

- F = m · g / 1000 in kN, M = F · l (`hebelMomente`).
- Gleichgewicht genau dann, wenn m₁ · l₁ = m₂ · l₂ (`hebelVergleich`). Es gibt bewusst keine feste Schwelle in kNm.
- Übungsaufgaben liegen samt Lösung auf dem Raster der Regler: Massen in 5-kg-Schritten, Hebelarme in 0,1-m-Schritten (`erzeugeHebelAufgabe`).

### Modul 3 – Lastannahme

- Schicht: g = d · γ; feste Flächenlast für dünne Lagen. Holzbalkendecke: Schichten zwischen den Balken zählen mit (e − b) / e; Balken: b · h · γ / e bzw. bei Stahlträgern g aus der Profiltabelle / e (`berechneDeckenlast`).
- q_k = Nutzlast + Trennwandzuschlag. Streckenlast = Flächenlast · Einzugsbreite (Balkenabstand e bzw. gewählte Breite).
- Tabellen: `LAST_BAUSTOFFE`, `NUTZLASTEN`, `TRENNWANDZUSCHLAEGE`, `TEILSICHERHEIT`. Quellen stehen im Kommentar über den Tabellen (DIN EN 1991-1-1 mit NA, FLL für Gründach).
- Übergabe an Modul 4: `?g=…&q=…&L=…&gk=…&qk=…&bem=1` (g und q sind die Bemessungswerte g_d und q_d).

### Modul 4 – Schnittgrößen am Einfeldträger

- Auflagerkräfte aus ΣM um B bzw. um A; Streckenlasten über ihre Resultierende im Schwerpunkt (`berechneTraeger`).
- Schnittgrößen: Summe aller Kräfte links vom Schnitt (`schnitt(x)` liefert `{ Q, M }`). Eine Einzellast genau an der Schnittstelle zählt erst rechts davon.
- Schräge Lasten: Nur die Vertikalkomponente F · sin α geht in V und M ein, die Horizontalkomponente ergibt A_h (`zerlegeKraft`).
- Feldmoment an der Stelle, an der V im Feld von + nach − wechselt (`feldmomentBeiVNull`); Stützmomente M_A, M_B und betragsgrößtes Moment (`momenteEinfeldtraeger`, `extremwerte`).
- Diagramme werden an den Stellen aus `diagrammStellen` ausgewertet. Dazu gehören Punkte direkt links und rechts jeder Sprungstelle, damit Querkraftsprünge senkrecht erscheinen.
- Übung: zufällige Träger mit Bemessungslasten (`erzeugeTraegerAufgabe`); gefragt sind A_Ed,V, B_Ed,V, x₀ und M_Ed,F.
- Übergabe an Modul 6: `?M=<betragsgrößtes Moment>`, bei Bemessungswerten zusätzlich `&Ed=1`.

### Modul 5 – Diagramme zuordnen

- Rechnet mit demselben Kern wie Modul 4. Drei Antworten: die richtige Linie, eine mit vertauschtem Vorzeichen, eine seitlich verschobene.
- Der Schalter für die V-Konvention ändert nur die Zeichenrichtung, nie die Werte.

### Modul 6 – Spannungsnachweis

- Rechteck I = b · h³ / 12, Kreis I = π · d⁴ / 64, I-Profil I = (b · h³ − (b − s) · h_i³) / 12 mit h_i = h − 2 · t; W = I / e (`querschnittswerte`).
- σ = 1000 · M / W mit M in kNm und W in cm³ (`biegespannung`).
- **Standard: Bemessungswerte nach Eurocode** – σ_Ed = M_Ed / W ≤ f_d. Holz: f_m,d = k_mod · f_m,k / γ_M; Stahl: f_y,d = f_y,k / γ_M0 (`bemessungsfestigkeit`, `WERKSTOFFE_EC`, `KMOD`).
- Umschaltbar: zulässige Spannungen (σ_vorh ≤ σ_zul), gehört zu charakteristischen Momenten.
- Der Nachweis vergleicht mit zwei Nachkommastellen, also so, wie angezeigt wird (`nachweisErfuellt`).

### Modul 7 – Durchlaufträger

- Stützmomente aus der Dreimomentengleichung, Lösung mit dem Gauß-Verfahren; danach jedes Feld als Einfeldträger mit Randmomenten (`berechneDurchlauftraeger`).
- Auflagerkräfte aus dem Querkraftsprung. Eine Einzellast genau auf einem Auflager geht ganz in dieses Auflager.
- Größte Feldmomente (`feldmomente`), Biegelinie für die Grafiken (`biegelinie`), Momentennullpunkte (`momentenNullpunkte`).
- Die Beiwert-Tabelle in der Seite enthält gerundete Werte; geprüft wird gegen den exakten Wert, die Tabellenwerte liegen innerhalb der Toleranz.

## 6. Kennwerte und ihre Quellen

Alle fachlichen Kennwerte stehen mit Quelle im Kommentar an der jeweiligen Tabelle in `statik-core.js`. Die Lehrkraft prüft sie im Tabellenbuch; Werte, die nicht sicher belegt sind, werden in `ROADMAP.md` benannt.

| Wert | Stand im Code | Quelle laut Code |
|---|---|---|
| γ_G, γ_Q | 1,35 / 1,5 | DIN EN 1990 |
| Nutzlasten, Trennwandzuschläge | `NUTZLASTEN`, `TRENNWANDZUSCHLAEGE` | DIN EN 1991-1-1/NA |
| Wichten | `LAST_BAUSTOFFE` | DIN EN 1991-1-1, Bautabellen, Abschlussprüfung 2026 |
| f_m,k C24 / GL24h | 24 N/mm² | DIN EN 338 / DIN EN 14080 |
| γ_M Holz | 1,3 | DIN EN 1995-1-1/NA |
| k_mod | 0,6 bis 1,1 | DIN EN 1995-1-1, Tab. 3.1 |
| f_y S235 / S355 | 235 / 355 N/mm² | DIN EN 1993-1-1, Tab. 3.1 |
| γ_M0 Stahl | 1,0 | DIN EN 1993-1-1/NA |
| σ_zul (altes Verfahren) | Holz 10 / 11, Stahl 140 N/mm² | DIN 1052:1988, DIN 1050 – **nicht gegengeprüft** |

## 7. Tests

```sh
npm ci      # einmalig
npm test    # alle Tests, wenige Sekunden
```

| Datei | Prüft |
|---|---|
| `tests/statik-core.test.js` | Rechenkern gegen Tabellenwerte und Aufgaben der Abschlussprüfung 2026 |
| `tests/referenzfaelle.test.js` | Sonderfälle mit Handrechnung, die Kette Modul 3 → 4 → 6, Rundung, Toleranz |
| `tests/version.test.js` | Versionsangaben, Weiterleitungen |
| `tests/cache.test.js` | Cache-Schutz, Fehlermeldung in jeder Modulseite, keine Syntax für zu neue Browser |

Die Tests prüfen Rechnungen, nicht das Aussehen. Nach Änderungen an Seiten oder Zeichnungen deshalb zusätzlich jede geänderte Seite im Browser öffnen, im Handy- und im Desktop-Format, und auf Fehlermeldungen achten.

## 8. Build und Cache-Schutz

```sh
npm run build:css   # nach neuen Tailwind-Klassen: erzeugt tailwind.min.css
npm run cache       # nach Änderungen an labor.js, labor.css, statik-core.js, tailwind.min.css
```

- `npm run cache` schreibt hinter jede dieser Dateien in allen Seiten `?v=<Prüfsumme des Inhalts>`. Ändert sich die Datei, ändert sich ihre Adresse, und kein Browser mischt eine neue Seite mit einer alten Skriptdatei. `npm test` schlägt fehl, wenn der Schritt vergessen wurde.
- `version.js` wird mit `?v=<Gesamtversion>` geladen.
- Versionen stehen nur in `version.js`: beim geänderten Modul Version und Datum erhöhen, ebenso die Gesamtversion, dann `version.js?v=` in allen Seiten anpassen.

## 9. Bekannte Grenzen

- **Modul 4:** höchstens zwei Einzellasten und zwei Gleichstreckenlasten; keine Dreieckslasten, keine Einzelmomente, keine Normalkraftlinie. Das betragsgrößte Moment wird auf einem 1-cm-Raster gesucht, das Feldmoment bei V = 0 exakt.
- **Modul 6:** nur einachsige Biegung um die starke Achse. Nicht berücksichtigt: Höhenbeiwert k_h, Kippen, Schub, Durchbiegung, Ausrundungen von Walzprofilen (das I-Profil ist scharfkantig).
- **Modul 7:** konstante Biegesteifigkeit, je Feld eine Gleichlast über die ganze Länge und eine Einzellast; keine Kragarme, keine feldweise ungünstige Laststellung.
- **Modul 3:** keine Schneelast, keine Windlast.
- **Fortschritt speichern:** nur im Browser des Geräts; bei Adressen mit `file://` hängt es vom Browser ab.
- **Browser:** vorausgesetzt wird ein Browser ab etwa 2018. `?.` und `??` sind verboten, weil ältere Geräte sonst das ganze Skript ablehnen.

## 10. Regeln für künftige Änderungen

1. **Offline bleibt offline.** Keine Links auf fremde Server, keine CDN-Skripte, keine Schriften aus dem Netz.
2. **Rechnungen nur im Rechenkern** – und zu jeder neuen oder geänderten Rechnung ein Test mit Handrechnung im Kommentar.
3. **Vorzeichen und Bezeichnungen aus Abschnitt 4 nicht ändern.** V positiv nach oben, M positiv bei Zug unten, Querkraft heißt V, Bemessungswerte mit Index Ed.
4. **Zahlen immer über `fmt()` ausgeben**, Übungen immer über `pruefeWert()` / `pruefeWinkel()` prüfen.
5. **Gerechnet wird ungerundet**, gerundet nur für die Anzeige.
6. **Kennwerte nur mit Quelle.** Unsicheres offen benennen, nicht raten.
7. **Nach jeder Änderung:** `npm run cache` (falls CSS/JS geändert), `npm test`, geänderte Seiten im Handy- und Desktop-Format im Browser prüfen, Version in `version.js` erhöhen, `ROADMAP.md` abhaken.
8. **Jede Übung wird nur einmal gewertet** und verbirgt ihre Lösung bis zum Prüfen. Wer Werte verbirgt, muss sie nach dem Aufdecken neu berechnen lassen und nicht einen gemerkten alten Stand zurückschreiben.
9. **Weiterleitungsseiten und die Parameternamen der Übergaben** (`g`, `q`, `L`, `gk`, `qk`, `bem`, `M`, `Ed`) bleiben, damit alte Lesezeichen und Links funktionieren.
10. **Didaktische Entscheidungen** (Rechenverfahren, Einheiten, Toleranzen) trifft die Lehrkraft; im Zweifel nachfragen.
