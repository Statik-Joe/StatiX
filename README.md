# Virtuelles Bautechnik-Labor

Interaktive Statik- und Mechanik-Lernmodule für die Fachoberschule (FOS 12, Hessen). Die Anwendung besteht aus statischen HTML-, CSS- und JavaScript-Dateien und benötigt zur Laufzeit keine Internetverbindung.

## Module

- `index.html` – Startseite mit den fünf Lernmodulen
- `modul-1-kraefteaddition.html` – Kräfteaddition, Vektorzerlegung und schräge Last auf einer Fläche
- `modul-2-hebelgesetz.html` – Hebelgesetz, Drehmomente und interaktive Wippe
- `modul-3-statik-einfeldtraeger.html` – Auflagerkräfte, Querkraft und Biegemoment für Einfeldträger mit Kragarmen, Einzel- und Streckenlasten
- `modul-4-diagramme-zuordnen.html` – Quiz zum Zuordnen von Systemen und Schnittgrößendiagrammen
- `modul-5-spannungsnachweis.html` – Querschnittswerte und Biegespannungsnachweis

## Unterricht und Zugänglichkeit

Modul 3 bietet im **Lehrkraftmodus** vorgefertigte Unterrichtsszenarien, einen Reset auf die ursprünglichen Vorführwerte und eine Druckansicht für ein Arbeitsblatt. Ein optionaler Arbeitsauftrag kann ergänzt werden; Lösungen und Diagramm werden nur mit aktivierter Option mitgedruckt. Im Druckdialog kann das Blatt auch als PDF gespeichert werden.

Im Diagrammquiz lassen sich Antwortkarten per Tastatur auswählen. Screenreader erhalten Textbeschreibungen der dargestellten Kurven; zu jedem Aufgabenteil gibt es aufklappbare, schrittweise Hinweise. Nach einer Antwort wird die Auswertung angesagt und erläutert typische Vorzeichen- und Lagefehler.

## Lokaler Fortschritt

In jedem Modul kann **Fortschritt speichern** aktiviert werden. Dann speichert das Labor die Eingaben und abgeschlossenen Übungsversuche lokal im Browser. Die Daten verlassen das Gerät nicht und enthalten nicht den optionalen Namen aus dem Protokoll-Export. Über **Daten löschen** lässt sich der gespeicherte Stand des jeweiligen Moduls entfernen; das Abwählen der Speicheroption pausiert weitere Schreibvorgänge.

Der lokale Browser-Speicher ist an Browserprofil und Seitenadresse gebunden. Bei `file://`-Adressen hängt seine Verfügbarkeit vom Browser ab. Falls Speichern dort nicht funktioniert und Python installiert ist, im Ausgabeordner `python -m http.server 8000` starten und `http://localhost:8000` öffnen. Das Labor selbst benötigt weiterhin keine Netzwerkverbindung.

## Tests und Stylesheet bauen

Für Entwicklung werden Node.js und npm benötigt. Im Projektordner ausführen:

```sh
npm ci
npm test
npm run build:css
```

Die Tests prüfen den gemeinsamen Statik-Rechenkern gegen bekannte Tabellenwerte, einschließlich der Kraftzerlegung schräger Lasten, Eingabegrenzen, Quiz-Punktestand und Momentenübergabe von Modul 3 an Modul 5. `npm run build:css` erzeugt `tailwind.min.css` aus den Klassen in den HTML- und JavaScript-Dateien. Die erzeugte Datei nicht von Hand bearbeiten.

## Offline-Paket erstellen

1. Vor der Weitergabe die Tests und den CSS-Build wie oben ausführen.
2. Einen neuen Ausgabeordner anlegen und diese Dateien unverändert nebeneinander hineinkopieren:
   - `index.html`
   - `modul-1-kraefteaddition.html`
   - `modul-2-hebelgesetz.html`
   - `modul-3-statik-einfeldtraeger.html`
   - `modul-4-diagramme-zuordnen.html`
   - `modul-5-spannungsnachweis.html`
   - `tailwind.min.css`
   - `labor.css` und `labor.js`
   - `statik-core.js`
3. Den Ausgabeordner als ZIP komprimieren. `node_modules`, Git-Dateien, `src`, `tests` und Build-Konfigurationen werden für den Unterricht nicht benötigt.
4. Das ZIP testweise entpacken und `index.html` sowie jedes Modul öffnen. Prüfen, dass alle Seiten und Styles geladen werden und die gewünschten Browser lokale Fortschritte speichern können.

Alle oben aufgeführten Laufzeitdateien müssen im selben Verzeichnis liegen. Nach Änderungen an `labor.css`, `labor.js` oder `statik-core.js` die zugehörigen `?v=…`-Versionsparameter in den HTML-Dateien aktualisieren, damit Browser keine veralteten Dateien aus dem Cache laden. Bei Änderungen an Tailwind-Klassen `npm run build:css` ausführen und `tailwind.min.css` mit ins Paket aufnehmen.

## Gemeinsame Bausteine

- `labor.css` und `labor.js` – Modulfarben, Präsentationsmodus, Vollbild für Zeichnungen, Zahlenformatierung, Protokoll-Export und lokales Speichern des Lernfortschritts
- `statik-core.js` – gemeinsamer Statik-Rechenkern für Modul 3 und Modul 4 sowie getestete Validierungs-, Quiz- und Übergabehelfer
- `src/tailwind.css`, `tailwind.config.js`, `package.json` und `package-lock.json` – CSS-Build-Konfiguration für die Entwicklung
- `tests/statik-core.test.js` – automatisierte Tests des Statik-Rechenkerns

## Einheitliche Konventionen

- Kräfte in kN, Momente in kNm, Streckenlasten in kN/m und Längen in m
- Zahlen werden mit deutschem Dezimalkomma und Einheiten mit Leerzeichen dargestellt, zum Beispiel `2,5 kN`
- In Modul 3 wird der Winkel schräger Einzelkräfte von der Trägerachse aus gemessen: 0° nach rechts, 90° nach unten, 180° nach links und 270° nach oben
- In Modul 2 werden Massen in kg eingegeben und die Gewichtskraft mit `F = m · g` berechnet
