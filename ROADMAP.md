# Roadmap – Virtuelles Bautechnik-Labor

Geplante Erweiterungen in der Reihenfolge, in der sie umgesetzt werden sollen. Erledigte Punkte werden abgehakt und mit der Version vermerkt, in der sie erschienen sind (siehe `version.js`).

## Fundament: Befunde aus der Prüfung vom 10.11.2026

To-do-Liste der Code-Prüfung (Rechenkern, Einheitlichkeit, Handy). Reihenfolge nach Schweregrad; Nummern wie in der Befundliste. Neue Funktionen kommen hier nicht hinzu.

### Hoch

- [x] **1 · Modul 7 / Rechenkern: Einzellast genau auf dem rechten Feldauflager (a = L) ging verloren** – Zweifeldträger 5 + 5 m, F = 20 kN auf B: Soll B = 20 kN, Ist 0 kN. Die Last wird jetzt dem Auflager zugerechnet; Tests für a = 0, a = L und Summe = Gesamtlast – Modul 7 Version 1.4 / Labor 3.7
- [x] **2 · Modul 6: Übergebenes Moment aus Modul 4 wurde bei aktivem „Fortschritt speichern“ überschrieben** – Übergabe wird jetzt nach dem Wiederherstellen angewendet – Modul 6 Version 1.11 / Labor 3.7
- [x] **3 · Modul 2: falsches „Perfektes Gleichgewicht“** – feste Schwelle 0,005 kNm durch den Vergleich m₁ · l₁ = m₂ · l₂ ersetzt (`hebelVergleich` in `statik-core.js`, getestet für alle Reglerstellungen) – Modul 2 Version 1.10 / Labor 3.7

### Mittel

- [x] **4 · Modul 2, Übung:** Wippe kippte trotz „Richtig!“ – Aufgaben liegen jetzt samt Lösung auf dem Raster der Regler (`erzeugeHebelAufgabe`, Massen in 5-kg-Schritten); dabei behoben: Nach dem Prüfen zeigte die Wippe den Stand von vor der Antwort – Modul 2 Version 1.11 / Labor 3.8
- [x] **5 · Modul 4:** Feldmoment (bei V = 0) und Stützmomente M_A, M_B mit Vorzeichen im Ergebnis, im Rechenweg, in der Zeichnung, im Druckblatt und im PNG-Export (`momenteEinfeldtraeger`); an Modul 6 geht weiter das betragsgrößte Moment – Modul 4 Version 1.18 / Labor 3.8
- [x] **6 · Modul 4:** roher Formelcode im Rechenweg durch F<sub>v</sub> = F · sin(α) ersetzt – Labor 3.8
- [x] **7 · Modul 1 und 2:** „Prüfen“ nach dem Prüfen gesperrt bis zur nächsten Aufgabe; dabei behoben: In Modul 1 zeigte die Lösung nach „Neue Aufgabe“ im Übungsmodus nur „?“ – Labor 3.8
- [x] **8 · Modul 1:** Winkel φ modulo 360° geprüft (`winkelAbstand`); bei F_R < 1,5 kN wird φ nicht gewertet – Modul 1 Version 1.12 / Labor 3.8
- [x] **9 · Modul 1, 2, 6:** Rechnungen im Rechenkern (`addiereKraefte`, `zerlegeSchraegeLast`, `hebelMomente`, `querschnittswerte`, `biegespannung`) mit Referenzfällen getestet – Labor 3.8
- [x] **10 · Handy (GitHub Pages):** `?.` entfernt; Cache-Schutz über Prüfsummen (`npm run cache`, von `npm test` geprüft), damit keine neue Seite mit alter Skriptdatei läuft; sichtbare Fehlermeldung statt leerer Zeichnung; Test gegen `?.`/`??` – alle Module / Labor 3.8
- [x] **11 · Modul 6:** Nachweis mit Bemessungswerten nach Eurocode als Standard (σ_Ed ≤ f_d; C24, GL24h, S235, S355; k_mod nach Lasteinwirkungsdauer; f_d als zusätzliches Prüffeld in der Übung), umschaltbar auf zulässige Spannungen; Kennwerte mit Normquelle im Rechenkern – *Werte bitte im Tabellenbuch gegenprüfen* – Modul 6 Version 1.13 / Labor 3.9

### Niedrig

- [ ] **12 · Modul 4, Übung:** Aufgaben „zwei Einzellasten“ mit V = 0 zwischen den Lasten verwerfen (x₀ nicht eindeutig)
- [ ] **13 · Modul 6:** Nachweis und Anzeige gleich runden; Zufallsaufgaben mit 97–103 % Ausnutzung vermeiden
- [ ] **14 · alle Module:** Toleranzen vereinheitlichen und überall `pruefeWert()` verwenden – *Rückfrage offen: gewünschte Werte*
- [ ] **15 · Modul 1 und 4:** unterschiedliche Winkeldefinition dokumentieren, Hinweis in Modul 1
- [ ] **16 · Modul 4 und 5:** alte Bezeichnungen bereinigen („Q(x)“ in Teil B und im Protokoll, PNG-Dateiname `modul3_…`)
- [ ] **17 · Modul 5:** V-Linie am rechten Kragarmende zur Nulllinie schließen
- [ ] **18 · Modul 7:** Übungsprotokoll im Fortschritt speichern
- [ ] **19 · Modul 2 / `fmt()`:** Zwischenwerte im Rechenweg stimmig runden, kaufmännische Rundung testen (Beispiel: Feldmoment −9,375 kNm wird als −9,37 statt −9,38 angezeigt)
- [ ] **20 · Modul 4:** Anfang einer Streckenlast beim Ziehen nicht über ihr Ende hinaus

### Danach

- [ ] **Testsuite** um die Referenzfälle der Prüfung ergänzen (Einfeldträger-Sonderfälle, Modul 1/2/6, Übergaben Modul 3 → 4 → 6)
- [ ] **Technische Dokumentation** (Aufbau, Formeln je Modul, Vorzeichen und Einheiten, Build, Tests, bekannte Grenzen, Regeln für künftige Änderungen)

## Geplant

- [ ] **Schneelast für Dächer (Modul 3)** – s = μ · s_k nach DIN EN 1991-1-3 mit NA: Schneelastzone, Geländehöhe, Formbeiwert für Flachdach; Übergabe als zusätzliche Streckenlast an Modul 4
- [ ] **Bemessung (Modul 6)** – W_erf = M / σ_zul berechnen und ein passendes Profil aus einer Tabelle wählen (Holzbalken b × h, IPE/HEA)
- [ ] **Zusammengesetzte Querschnitte** – Schwerpunkt, Trägheitsmoment I und Widerstandsmoment W für T- und U-Profile
- [ ] **Schwierigkeitsstufen in Modul 5** – von leicht bis schwer
- [ ] **Prüfungstrainer** – Aufgaben im Stil der Abschlussprüfung (FOS 12, Hessen): Lastannahme → Bemessungswerte → Schnittgrößen als zusammenhängende Aufgabe (wie Prüfung 2026, Vorschlag A und B; ein Spannungsnachweis kam dort nicht vor), zufällige Werte, Punkte je Teilaufgabe, Zeitvorgabe, aufdeckbarer Lösungsweg und Protokoll. Grundlage: alte Prüfungen, die die Lehrkraft bereitstellt (Aufgaben werden mit eigenen Werten neu formuliert)
- [ ] **Selbstlernpfad: Schnittgrößen von Hand berechnen** – Schritt für Schritt wie in Modul 7: Freischneiden, Auflagerkräfte aus ΣM = 0 und ΣF_z = 0, Querkraft- und Momentenverlauf (V und M) an Schnittstellen bestimmen, max M bei V = 0, Kontrolle; mit Grafiken und Übungen zur Selbstkontrolle

## Später

- [ ] **Fachwerke** – Stabkräfte mit Knotenpunktverfahren oder Ritterschnitt, Zug und Druck farbig markiert

## Erledigt

- [x] **Momentenlinie der Kachel Modul 4 korrigiert** – exakte Parabeln für Gleichstreckenlast: Feldmoment, steiler Anstieg zum Stützmoment über B, Knick am Auflager, waagerechtes Auslaufen am freien Kragarmende – Labor 3.6
- [x] **Isometrische Grafiken auf der Startseite** – jede Modulkachel zeigt das Thema als isometrisches Bauteil in der Modulfarbe (Modul 4 mit Kragarm und Momentenlinie über Feld und Kragarm); reines SVG, offline und auf jeder Bildschirmgröße scharf. Modul 4: Eingabespalte auf dem Desktop so hoch wie die Zeichnung – Labor 3.5
- [x] **Übungsmodus in Modul 4** – zufällige Träger im Stil der Abschlussprüfung (Gleichlast, mit Einzellast, mit Kragarm links oder rechts, zwei Einzellasten) mit Bemessungslasten; A_Ed,V, B_Ed,V, x₀ (V = 0) und M_Ed,F selbst berechnen; Ergebnisse, Verläufe und Rechenweg bleiben bis zum Prüfen verborgen, danach Rechenweg mit Zahlen Schritt für Schritt; Protokoll-Export – Modul 4 Version 1.16 / Labor 3.4
- [x] **Bemessungswerte nach Eurocode wie in der Abschlussprüfung** – Modul 3 zeigt erst g_k und q_k, dann g_d, q_d und E_d, übt die Bemessungswerte und übergibt sie an Modul 4; Modul 4 mit Index Ed (Schalter „Lasten sind Bemessungswerte“); Querkraft heißt in allen Modulen V; Modul 6 warnt bei übergebenem M_Ed; Baustoffe aus der Prüfung 2026 ergänzt bzw. angepasst (Fertigparkett, XPS, Kalkgipsputz, Kunststoffboden, Siebdruckplatte, Stahlträger IPE als Balken) – Labor 3.3
- [x] **Modul 3: Gründach** – Gründach- und Flachdachschichten (Substrat und Drainage wassergesättigt nach FLL, Vliese, Abdichtung, Bewuchs als Flächenlast), Vorlagen „Gründach extensiv“ und „Dachgarten“, Nutzlastkategorie H (nicht begehbares Dach), Hinweis auf die Schneelast, Exkurs im Selbstlernpfad, Gründach-Aufgaben in der Übung – Modul 3 Version 1.2 / Labor 3.2
- [x] **Modul 3: Dämmung und Schüttung zwischen den Balken** – Lage je Schicht wählbar (über, zwischen, unter den Balken); Schichten im Gefach zählen mit (e − b) / e, Prüfung gegen die Balkenhöhe, Vorlagen, Übung und Selbstlernpfad ergänzt – Modul 3 Version 1.1 / Labor 3.1
- [x] **Neues Modul 3: Lastannahme für Decken** – Selbstlernpfad mit Grafiken (Deckenschnitt, g = d · γ, Einzugsbreite), Rechner für Stahlbeton- und Holzbalkendecken mit Schichtaufbau, Nutzlast nach Kategorie und Trennwandzuschlag, Übung mit Selbstkontrolle und Protokoll, Übergabe von g_k und q_k an Modul 4. Die bisherigen Module 3–6 sind zu 4–7 geworden; alte Adressen leiten weiter, gespeicherter Fortschritt wird übernommen – Labor 3.0

> Hinweis: Die Einträge unten verwenden bereits die Modulnummern ab Labor 3.0.

- [x] **Mitwachsende Zeichnungen in Modul 1, 2 und 4 bis 6** – eigenes Handy-Layout mit normal großer Schrift, Ziehen per Finger in Modul 2 und 4, PNG-Export in Modul 4 auch auf dem Handy; Kasten „SchnittGrip Pro“ in Modul 4 entfernt – Labor 2.2
- [x] **Grafiken im Selbstlernpfad (Modul 7)** – Vergleich Einfeld-/Zweifeldträger, Unbekannte und fehlende Verformungsbedingung, Lastfall-Skizzen in der Beiwert-Tabelle, Beispielsystem, Lastaufteilung, Null-Stellen, Zugseite und Bewehrung, Idee der Dreimomentengleichung – Modul 7 Version 1.1 / Labor 2.1
- [x] **Handy und Tablet** – Touch-Mindestgrößen auf allen Geräten mit Fingerbedienung, mitwachsende Zeichnungen in Modul 7, Hinweis zum Querformat bei festen Zeichnungen, kein verschachteltes Scrollen in Modul 4 auf dem Tablet – Labor 2.1
- [x] **Einheitlichkeit geprüft** – Beschriftungen mit Eingabefeldern verknüpft, Rundungstoleranz in jeder Übung angegeben, Anführungszeichen vereinheitlicht – Labor 2.1
- [x] **Durchlaufträger mit 3 oder 4 Auflagern (Modul 7)** – Selbstlernmodul mit Schritt-für-Schritt-Anleitung, Beiwert-Tabelle, Übung mit Selbstkontrolle und Rechner für eigene Stützweiten und Lasten – Modul 7 Version 1.0 / Labor 2.0
- [x] Einheitlicher Aufbau aller Module (Einheiten kN/kNm, Dezimalkomma, gemeinsame Kopfzeile) – 1.x
- [x] Modul 6 Spannungsnachweis mit Erfolgskontrolle und Übernahme von M_max aus Modul 4 – 1.x
- [x] Gemeinsamer, getesteter Rechenkern für Modul 4 und 5 – 1.x
- [x] Touch-Bedienung, Präsentationsmodus und Vollbild – 1.x
- [x] Lernfortschritt lokal speichern, Lehrkraftmodus mit Druckansicht in Modul 4 – 1.x
- [x] Versionsnummer und Aktualisierungsdatum in jedem Modul – 1.8
