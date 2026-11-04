# Roadmap – Virtuelles Bautechnik-Labor

Geplante Erweiterungen in der Reihenfolge, in der sie umgesetzt werden sollen. Erledigte Punkte werden abgehakt und mit der Version vermerkt, in der sie erschienen sind (siehe `version.js`).

## Geplant

- [ ] **Neues Modul: Lastannahme für Decken** – Deckenlasten aus dem Schichtaufbau berechnen (Eigengewicht g_k aus Dicke × Wichte bzw. Flächenlast je Schicht, Nutzlast q_k nach Nutzung, Trennwandzuschlag), getrennt für Stahlbetondecke und Holzbalkendecke; Umrechnung der Flächenlast in kN/m² auf die Streckenlast in kN/m für einen Balken über die Einzugsbreite (Balkenabstand) und Übergabe an Modul 3
- [ ] **Bemessung (Modul 5)** – W_erf = M / σ_zul berechnen und ein passendes Profil aus einer Tabelle wählen (Holzbalken b × h, IPE/HEA)
- [ ] **Zusammengesetzte Querschnitte** – Schwerpunkt, Trägheitsmoment I und Widerstandsmoment W für T- und U-Profile
- [ ] **Übungsmodus in Modul 3** – zufälliges System; A, B und M_max selbst eintragen, danach Prüfung und schrittweise aufgedeckter Rechenweg
- [ ] **Schwierigkeitsstufen in Modul 4** – von leicht bis schwer
- [ ] **Selbstlernpfad: Schnittgrößen von Hand berechnen** – Schritt für Schritt wie in Modul 6: Freischneiden, Auflagerkräfte aus ΣM = 0 und ΣF_z = 0, Querkraft- und Momentenverlauf an Schnittstellen bestimmen, max M bei Q = 0, Kontrolle; mit Grafiken und Übungen zur Selbstkontrolle

## Später

- [ ] **Fachwerke** – Stabkräfte mit Knotenpunktverfahren oder Ritterschnitt, Zug und Druck farbig markiert

## Erledigt

- [x] **Mitwachsende Zeichnungen in Modul 1 bis 5** – eigenes Handy-Layout mit normal großer Schrift, Ziehen per Finger in Modul 2 und 3, PNG-Export in Modul 3 auch auf dem Handy; Kasten „SchnittGrip Pro“ in Modul 3 entfernt – Labor 2.2
- [x] **Grafiken im Selbstlernpfad (Modul 6)** – Vergleich Einfeld-/Zweifeldträger, Unbekannte und fehlende Verformungsbedingung, Lastfall-Skizzen in der Beiwert-Tabelle, Beispielsystem, Lastaufteilung, Null-Stellen, Zugseite und Bewehrung, Idee der Dreimomentengleichung – Modul 6 Version 1.1 / Labor 2.1
- [x] **Handy und Tablet** – Touch-Mindestgrößen auf allen Geräten mit Fingerbedienung, mitwachsende Zeichnungen in Modul 6, Hinweis zum Querformat bei festen Zeichnungen, kein verschachteltes Scrollen in Modul 3 auf dem Tablet – Labor 2.1
- [x] **Einheitlichkeit geprüft** – Beschriftungen mit Eingabefeldern verknüpft, Rundungstoleranz in jeder Übung angegeben, Anführungszeichen vereinheitlicht – Labor 2.1
- [x] **Durchlaufträger mit 3 oder 4 Auflagern (Modul 6)** – Selbstlernmodul mit Schritt-für-Schritt-Anleitung, Beiwert-Tabelle, Übung mit Selbstkontrolle und Rechner für eigene Stützweiten und Lasten – Modul 6 Version 1.0 / Labor 2.0
- [x] Einheitlicher Aufbau aller Module (Einheiten kN/kNm, Dezimalkomma, gemeinsame Kopfzeile) – 1.x
- [x] Modul 5 Spannungsnachweis mit Erfolgskontrolle und Übernahme von M_max aus Modul 3 – 1.x
- [x] Gemeinsamer, getesteter Rechenkern für Modul 3 und 4 – 1.x
- [x] Touch-Bedienung, Präsentationsmodus und Vollbild – 1.x
- [x] Lernfortschritt lokal speichern, Lehrkraftmodus mit Druckansicht in Modul 3 – 1.x
- [x] Versionsnummer und Aktualisierungsdatum in jedem Modul – 1.8
