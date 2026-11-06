# Roadmap – Virtuelles Bautechnik-Labor

Geplante Erweiterungen in der Reihenfolge, in der sie umgesetzt werden sollen. Erledigte Punkte werden abgehakt und mit der Version vermerkt, in der sie erschienen sind (siehe `version.js`).

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
