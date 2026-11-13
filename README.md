# Virtuelles Bautechnik-Labor

Interaktive Statik- und Mechanik-Lernmodule für die Fachoberschule (FOS 12, Hessen). Die Anwendung besteht aus statischen HTML-, CSS- und JavaScript-Dateien und benötigt zur Laufzeit keine Internetverbindung.

## Module

- `index.html` – Startseite mit den sieben Lernmodulen
- `modul-1-kraefteaddition.html` – Kräfteaddition, Vektorzerlegung und schräge Last auf einer Fläche
- `modul-2-hebelgesetz.html` – Hebelgesetz, Drehmomente und interaktive Wippe
- `modul-3-lastannahme.html` – Lastannahme für Decken: Eigengewicht aus dem Schichtaufbau (bei Holzbalkendecken auch Dämmung oder Schüttung zwischen den Balken mit dem Gefachanteil (e − b) / e), Gründach und Dachgarten mit wassergesättigten Schichten nach FLL, Nutzlast und Trennwandzuschlag nach DIN EN 1991-1-1 mit NA, Umrechnung auf die Streckenlast eines Balkens bzw. 1-m-Deckenstreifens, Übergabe an Modul 4
- `modul-4-statik-einfeldtraeger.html` – Auflagerkräfte, Querkraft und Biegemoment für Einfeldträger mit Kragarmen, Einzel- und Streckenlasten; Übungsmodus mit zufälligen Aufgaben im Stil der Abschlussprüfung, Selbstkontrolle und Rechenweg
- `modul-5-diagramme-zuordnen.html` – Quiz zum Zuordnen von Systemen und Schnittgrößendiagrammen
- `modul-6-spannungsnachweis.html` – Querschnittswerte und Biegespannungsnachweis
- `modul-7-durchlauftraeger.html` – Selbstlernmodul Durchlaufträger: Schritt-für-Schritt-Anleitung mit Grafiken (Vergleich mit Einfeldträgern, statische Unbestimmtheit, Lastaufteilung, Zugseite und Bewehrung, Idee der Dreimomentengleichung) und Beiwert-Tabelle, Übung mit Selbstkontrolle und Rechner für Zwei- und Dreifeldträger mit eigenen Stützweiten und Lasten

## Unterricht

Modul 4 bietet im **Lehrkraftmodus** vorgefertigte Unterrichtsszenarien, einen Reset auf die ursprünglichen Vorführwerte und eine Druckansicht für ein Arbeitsblatt. Ein optionaler Arbeitsauftrag kann ergänzt werden; Lösungen und Diagramm werden nur mit aktivierter Option mitgedruckt. Im Druckdialog kann das Blatt auch als PDF gespeichert werden.

## Handy und Tablet

Alle Module lassen sich per Finger bedienen. Auf Geräten mit Touch-Bedienung (Handy und Tablet) haben Schaltflächen, Eingabefelder, Auswahllisten und aufklappbare Abschnitte eine Mindesthöhe von etwa 44 px, Kontrollkästchen und Schieberegler sind vergrößert. Jede Beschriftung ist mit ihrem Eingabefeld verknüpft, ein Tippen auf die Beschriftung setzt also den Cursor ins Feld.

Alle Zeichnungen wachsen mit der Bildschirmbreite mit (`responsiveCanvas` in `labor.js`). Auf dem Handy werden sie nicht einfach verkleinert, sondern bekommen ein eigenes, schmales Layout: Die Beschriftung bleibt so groß wie der übrige Seitentext, Querschnitt und Spannungsverteilung in Modul 6 stehen untereinander, Beschriftungen in Modul 1 und 2 werden umgebrochen oder versetzt. Ab etwa 600 px Breite zeigen Modul 1, 2 und 6 die gewohnte Desktop-Zeichnung, nur passend skaliert. Kisten (Modul 2) und Lasten (Modul 4) lassen sich auf jeder Größe per Finger ziehen. Der Vollbild-Knopf ⛶ steht überall zur Verfügung, wo der Browser Vollbild für einzelne Elemente unterstützt (nicht auf dem iPhone). Der PNG-Export in Modul 4 hängt die Wertetabelle auf dem Handy einspaltig an.

## Barrierearmut

Im Diagrammquiz lassen sich Antwortkarten per Tastatur auswählen. Screenreader erhalten Textbeschreibungen der dargestellten Kurven; zu jedem Aufgabenteil gibt es aufklappbare, schrittweise Hinweise. Nach einer Antwort wird die Auswertung angesagt und erläutert typische Vorzeichen- und Lagefehler.

## Lokaler Fortschritt

In jedem Modul kann **Fortschritt speichern** aktiviert werden. Dann speichert das Labor die Eingaben und abgeschlossenen Übungsversuche lokal im Browser. Die Daten verlassen das Gerät nicht und enthalten nicht den optionalen Namen aus dem Protokoll-Export. Über **Daten löschen** lässt sich der gespeicherte Stand des jeweiligen Moduls entfernen; das Abwählen der Speicheroption pausiert weitere Schreibvorgänge.

Seit Labor 3.0 ist die Lastannahme Modul 3, die bisherigen Module 3 bis 6 sind zu 4 bis 7 geworden. Ein in Labor 2.x gespeicherter Stand wird beim ersten Öffnen einer Seite einmalig zur neuen Modulnummer umgezogen.

Der lokale Browser-Speicher ist an Browserprofil und Seitenadresse gebunden. Bei `file://`-Adressen hängt seine Verfügbarkeit vom Browser ab. Falls Speichern dort nicht funktioniert und Python installiert ist, im Ausgabeordner `python -m http.server 8000` starten und `http://localhost:8000` öffnen. Das Labor selbst benötigt weiterhin keine Netzwerkverbindung.

## Tests und Stylesheet bauen

Für Entwicklung werden Node.js und npm benötigt. Im Projektordner ausführen:

```sh
npm ci
npm test
npm run build:css
npm run cache
```

Die Tests prüfen den gemeinsamen Statik-Rechenkern gegen bekannte Tabellenwerte, einschließlich der Kraftzerlegung schräger Lasten, Eingabegrenzen, Quiz-Punktestand und Momentenübergabe von Modul 4 an Modul 6. `npm run cache` setzt nach Änderungen an `labor.js`, `labor.css`, `statik-core.js` oder `tailwind.min.css` die `?v=…`-Angaben in allen Seiten auf eine Prüfsumme des Dateiinhalts (Cache-Schutz, besonders wichtig für die Handynutzung über GitHub Pages); `npm test` meldet, wenn das vergessen wurde. Jede Modulseite zeigt außerdem eine Fehlermeldung, falls ein Skript nicht geladen werden kann, statt einfach leere Zeichnungen. `npm run build:css` erzeugt `tailwind.min.css` aus den Klassen in den HTML- und JavaScript-Dateien. Die erzeugte Datei nicht von Hand bearbeiten.

## Offline-Paket erstellen

1. Vor der Weitergabe die Tests und den CSS-Build wie oben ausführen.
2. Einen neuen Ausgabeordner anlegen und diese Dateien unverändert nebeneinander hineinkopieren:
   - `index.html`
   - `modul-1-kraefteaddition.html`
   - `modul-2-hebelgesetz.html`
   - `modul-3-lastannahme.html`
   - `modul-4-statik-einfeldtraeger.html`
   - `modul-5-diagramme-zuordnen.html`
   - `modul-6-spannungsnachweis.html`
   - `modul-7-durchlauftraeger.html`
   - `tailwind.min.css`
   - `labor.css` und `labor.js`
   - `statik-core.js`
   - `version.js`
3. Den Ausgabeordner als ZIP komprimieren. `node_modules`, Git-Dateien, `src`, `tests`, `tools` und Build-Konfigurationen werden für den Unterricht nicht benötigt.
4. Das ZIP testweise entpacken und `index.html` sowie jedes Modul öffnen. Prüfen, dass alle Seiten und Styles geladen werden und die gewünschten Browser lokale Fortschritte speichern können.

Optional können die Weiterleitungsseiten `modul-3-statik-einfeldtraeger.html`, `modul-4-diagramme-zuordnen.html`, `modul-5-spannungsnachweis.html` und `modul-6-durchlauftraeger.html` mitkopiert werden. Sie leiten alte Lesezeichen aus Labor 2.x auf die neuen Modulnummern weiter.

Alle oben aufgeführten Laufzeitdateien müssen im selben Verzeichnis liegen. Nach Änderungen an `labor.css`, `labor.js`, `statik-core.js` oder `tailwind.min.css` `npm run cache` ausführen, damit Browser keine veralteten Dateien aus dem Cache laden. Bei Änderungen an Tailwind-Klassen `npm run build:css` ausführen und `tailwind.min.css` mit ins Paket aufnehmen.

## Roadmap

Geplante Erweiterungen stehen in `ROADMAP.md`.

## Versionen

Jedes Modul zeigt neben dem Modul-Badge seine Versionsnummer und das Datum der letzten Aktualisierung, die Startseite zusätzlich an jeder Kachel und in der Fußzeile die Gesamtversion des Labors. Alle Angaben stehen nur in `version.js`.

Bei einer Aktualisierung:

1. In `version.js` beim geänderten Modul `version` erhöhen und `stand` auf das aktuelle Datum setzen (Format `JJJJ-MM-TT`).
2. Die Gesamtversion `LABOR_VERSION.version` und ihr `stand` ebenfalls anpassen.
3. In allen HTML-Dateien `version.js?v=…` auf die neue Gesamtversion setzen. `npm test` prüft, dass keine Seite vergessen wurde.

Schema: kleine Verbesserungen und Fehlerbehebungen erhöhen die Unterversion (1.8 → 1.9), große Umbauten oder neue Teilbereiche die Hauptversion (1.9 → 2.0).

## Gemeinsame Bausteine

- `labor.css` und `labor.js` – Modulfarben, Präsentationsmodus, Vollbild für Zeichnungen, mitwachsende Zeichenflächen, Touch-Bedienung, Zahlenformatierung, Protokoll-Export und lokales Speichern des Lernfortschritts
- `statik-core.js` – gemeinsamer Rechenkern: Kräfteaddition für Modul 1, Hebelgesetz und Übungsaufgaben für Modul 2, Einfeldträger mit Feld- und Stützmomenten für Modul 4 und 5, Querschnittswerte und Biegespannung für Modul 6, Durchlaufträger für Modul 7 (Durchlaufträger über die Dreimomentengleichung, Übungsaufgaben und Feldmoment bei V = 0 für Modul 4), Lastannahme für Modul 3 (Baustoff-, Nutzlast- und Trennwandtabellen, `berechneDeckenlast`) sowie getestete Validierungs-, Quiz- und Übergabehelfer
- `src/tailwind.css`, `tailwind.config.js`, `package.json` und `package-lock.json` – CSS-Build-Konfiguration für die Entwicklung
- `version.js` – Versionsnummern und Aktualisierungsdatum aller Module und der Startseite
- `tests/statik-core.test.js` – automatisierte Tests des Statik-Rechenkerns (einschließlich Biegelinie und Momentennullpunkten für die Grafiken in Modul 7)
- `tests/version.test.js` – prüft Versionsangaben und den Cache-Schutz von `version.js`
- `tests/cache.test.js` und `tools/cache-version.js` – Cache-Schutz der übrigen CSS- und JS-Dateien über Prüfsummen, Fehlermeldung bei Ladefehlern, keine Syntax, die ältere Handy-Browser ablehnen

## Einheitliche Konventionen

- Kräfte in kN, Momente in kNm, Streckenlasten in kN/m und Längen in m
- Zahlen werden mit deutschem Dezimalkomma und Einheiten mit Leerzeichen dargestellt, zum Beispiel `2,5 kN`
- In Modul 4 wird der Winkel schräger Einzelkräfte von der Trägerachse aus gemessen: 0° nach rechts, 90° nach unten, 180° nach links und 270° nach oben
- In Modul 3 werden Schichtdicken in cm eingegeben und für die Rechnung in m umgerechnet; Wichten in kN/m³, Flächenlasten in kN/m², Streckenlasten in kN/m. Lastwerte als Richtwerte nach DIN EN 1991-1-1 mit NA, Gründachschichten wassergesättigt nach den FLL-Dachbegrünungsrichtlinien; dünne Lagen (Vlies, Abdichtung, Bewuchs) als Flächenlast in kN/m². Jede Wichte und Flächenlast lässt sich ändern. Die Schneelast ist nicht enthalten
- Bemessungswerte nach Eurocode wie in der Abschlussprüfung: Modul 3 zeigt erst die charakteristischen Werte g_k und q_k, dann g_d = 1,35 · g_k, q_d = 1,5 · q_k und E_d = g_d + q_d
- Modul 3 übergibt die Bemessungswerte g_d und q_d als Streckenlasten q₁ und q₂ an Modul 4 (`?g=…&q=…&L=…&gk=…&qk=…&bem=1`); Modul 4 kennzeichnet die Ergebnisse dann mit dem Index Ed (A_Ed,V, B_Ed,V, V_Ed, M_Ed). Modul 4 übergibt |M| an Modul 6 (`?M=…`, bei Bemessungswerten zusätzlich `&Ed=1`); Modul 6 weist darauf hin, dass zulässige Spannungen zu charakteristischen Momenten gehören
- Die Querkraft heißt in allen Modulen V (wie in der Abschlussprüfung)
- In Modul 2 werden Massen in kg eingegeben und die Gewichtskraft mit `F = m · g` berechnet
- In Modul 6 werden Querschnittsmaße in cm, Querschnittswerte in cm³ und cm⁴ und Spannungen in N/mm² angegeben, wie in den Bautabellen
- In jeder Übung mit Selbstkontrolle steht die Rundungstoleranz direkt über dem Prüfen-Knopf (Modul 1 und 2: 3 %, Modul 3, 4, 6 und 7: 2 %)
- Hinweistexte nutzen deutsche Anführungszeichen („…“) und den Halbgeviertstrich (–)
