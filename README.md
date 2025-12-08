# Namen-Randomizer

Eine barrierearme, responsive Web-App, um zufällig Namen aus einer oder mehreren Listen zu ziehen. Listen bleiben lokal gespeichert, sodass du auch später nahtlos weitermachen kannst.

## Features
- Zufallsauswahl mit Anzeige der bereits gezogenen Namen
- Editor für Namenlisten (ein Name pro Zeile oder Komma-getrennt), optional alphabetisch sortierbar
- Bis zu 10 benannte Listen anlegen, auswählen, umbenennen und lokal gesichert weiterverwenden
- Eingaben werden bereinigt (z. B. spitze Klammern entfernt, Länge begrenzt), um Script-Injektionen zu verhindern
- Tastaturkürzel: `Cmd/Ctrl + S` speichert die aktuelle Liste
- Aria-Live-Statusmeldungen, Skip-Link, klare Fokuszustände
- Responsive UI mit eigener Gestaltung (kein CRA-UI mehr)

## Struktur
- `index.html` – Einstieg, Markup und Layout-Slots
- `static/js/app.js` – Logik für Laden, Ziehen, Speichern, Listen-Management
- `static/css/app.css` – Styles (Schrift aus Google Fonts, System-Fallback)
- `names.json` – Startdaten (wird beim ersten Laden genutzt, Änderungen laufen lokal)

## Nutzung (lokal)
1. Repo in einen beliebigen Webserver-Root legen (z. B. MAMP, nginx oder `npx serve .`).
2. Im Browser `index.html` öffnen.
3. Namen im Editor eintragen (ein Name pro Zeile oder Komma-getrennt) und speichern. Bis zu 10 Listen können benannt, ausgewählt, umbenannt oder gelöscht werden; sie bleiben lokal gespeichert.

> Hinweis: Änderungen werden lokal gehalten (LocalStorage); die ausgelieferte `names.json` bleibt unverändert.

## Barrierefreiheit & UX
- Skip-Link für Tastaturnavigation.
- Fokus-Styles und hohe Kontraste.
- `aria-live` für Statusmeldungen (Ziehung, Fehler, Restbestand).
- Reduced-Motion-Beachtung (`prefers-reduced-motion`).

## Anpassen
- Farben/Typografie in `static/css/app.css` unter `:root`.
- Initiale Namen in `names.json`.
- Version-Hinweis im Hero-Badge (`index.html`).

## Lizenz
Ohne ausdrückliche Lizenzangabe bitte vor externer Nutzung Freigabe einholen.  
Lizenzhinweis: Build-Abhängigkeiten (React, React DOM, Scheduler, regenerator-runtime) unter MIT; Schrift „Space Grotesk“ unter SIL Open Font License (über Google Fonts geladen).
