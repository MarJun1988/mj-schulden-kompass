# Changelog

## 1.0.4 - 2026-06-17

### Neu

- Guthaben koennen als Rueckueberweisung reduziert werden, ohne daraus eine neue Schuld zu erzeugen.
- Rueckueberweisungen erscheinen als eigene Bewegung in der Guthaben-Info und werden per Mail benachrichtigt.

## 1.0.3 - 2026-06-17

### Neu

- Guthaben koennen Schuldnern gutgeschrieben und als Bezahlmethode fuer passende Schulden genutzt werden.
- Guthaben-Info-Dialoge zeigen Herkunft, Verwendung und aktuellen Stand uebersichtlich als DataTable.
- Mailbenachrichtigungen werden beim neuen Guthaben und bei Zahlungen per Guthaben versendet.
- Das Schuldner-Dashboard zeigt das eigene aktuelle Guthaben inklusive Detaildialog.

### Geaendert

- Dialoge fuer Bezahlen, Loeschen, Guthaben und Formulare wurden optisch vereinheitlicht und luftiger gestaltet.
- Formularfelder nutzen einheitliche PrimeVue-FloatLabels mit globaler Pinia-Konfiguration.
- Schuldenlisten nutzen staerker PrimeVue-DataTables, Tabs nach Schuldnern und Summenzeilen.
- Negative Guthabenbewegungen werden in der Guthaben-Info rot hervorgehoben.

## 1.0.2 - 2026-06-14

### Neu

- Schuldenansichten nutzen jetzt kompakte Aktionsmenues statt vieler Einzelbuttons.
- Der Schuld-erfassen-Dialog zeigt wieder einen klaren Footer mit Speichern- und Abbrechen-Button.
- Tabellen und Karten wurden weiter auf ein ruhigeres, breiteres Layout abgestimmt.

### Geaendert

- Spaltenreihenfolgen in den Schuldentabellen wurden an die fachlichen Bereiche angepasst.
- Die Bereiche "Ich schulde" und "Von mir bezahlt" wurden auf DataTable umgestellt und enger an den Container gebunden.
- Der Bereich "Bezahlte Schulden" wurde in der Zeilenhoehe stabilisiert.

## 1.0.1 - 2026-06-14

### Geaendert

- Schuldentabellen haben feste Spaltenbreiten und springen beim Tab-Wechsel nicht mehr.
- Die Ansicht "Bezahlte Schulden" nutzt eine ruhigere Zeilenhoehe mit abgeschnittenen Texten.
- Die Auswertung "Schuldner nach Kategorie" und die Schuldenansicht bleiben tabbasiert und kompakt.

## 1.0.0 - 2026-06-08

### Neu

- Erster stabiler Release von SchuldKompass.
- Vollstaendiger Produktiv- und Testing-Deploy mit migrationssicherem Container-Neustart.
- VitePress-Hilfe ohne fehleranfaelligen Ruecksprung-Link zur App.

### Geaendert

- Versionierung, CI-Default und Beispiel-Production-Env auf `1.0.0` angehoben.

## 0.1.9 - 2026-06-08

### Geaendert

- Deploy schreibt `VERSION` automatisch in `.env.production`, bevor Images gepullt werden.
- Production nutzt den Git-Tag als Version, Testing den Build-Tag mit Commit-Hash.
- Container werden beim Deploy sichtbar neu erstellt und der Containerstatus wird im Job ausgegeben.

## 0.1.8 - 2026-06-08

### Neu

- Automatisierte Basis-Tests fuer Frontend und Backend.
- VitePress-Favicon ueber das SchuldKompass-Logo.

### Geaendert

- Der Versionsverlauf zeigt zuerst nur die letzten drei Versionen und klappt aeltere Versionen per Button auf.

## 0.1.7 - 2026-06-08

### Neu

- Offene Schulden koennen per Button mit einer Erinnerungsmail versehen werden.
- Erfolg und Fehler beim Erinnerungsversand werden als PrimeVue Toast angezeigt.

### Geaendert

- Das Backend meldet fehlgeschlagenen SMTP-Versand bei Erinnerungen an das Frontend zurueck.

## 0.1.6 - 2026-06-08

### Geaendert

- GitHub-Release-Pruefung blockiert das Backend nicht mehr dauerhaft, wenn GitHub nicht erreichbar ist.
- Die Release-Pruefung kann per `GITHUB_RELEASE_CHECK_ENABLED=false` deaktiviert werden.
- Production-Compose uebergibt Release-Check-Optionen explizit an das Backend.

## 0.1.5 - 2026-06-08

### Geaendert

- Hauptnavigation zeigt nur noch Dashboard, Schulden, Auswertung und Hilfe.
- Die aktuelle Version steht dezent im Nutzermenue und fuehrt zum Versionsverlauf.
- Die Theme-Auswahl wurde vom Select zu einem kleinen Dialog fuer System, Hell und Dunkel umgebaut.
- Die Dokumentation bietet im oberen Menue einen Link zurueck in die Anwendung.

## 0.1.4 - 2026-06-08

### Neu

- Neue Nutzer aktivieren ihr Konto per E-Mail-Link.
- Aktivierungsseite prueft den Token und meldet den Nutzer nach erfolgreicher Bestaetigung an.
- Die Deploy-Pipeline fuehrt Prisma-Migrationen automatisch vor dem App-Start aus.

### Geaendert

- Registrierung fuehrt nicht mehr direkt zum Login, sondern sendet zuerst den Aktivierungslink.
- Login ist erst nach bestaetigter E-Mail-Adresse moeglich.

## 0.1.3 - 2026-06-08

### Geaendert

- Production-Deploy und Migrationen auf dem Zielsystem getestet.
- Compose- und Healthcheck-Ablauf fuer den Rollout stabilisiert.

## 0.1.2 - 2026-06-08

### Neu

- GitLab-CI fuer Build, Docker-Images, Deploy und GitHub-Export vorbereitet.
- Docker-Hub-Image-Nutzung fuer Production eingebunden.

## 0.1.1 - 2026-06-08

### Geaendert

- Production-Rollout vorbereitet und Production-Compose auf externe Images umgestellt.
- Production-Umgebung ohne Mailpit aufgeraeumt.

## 0.1.0 - 2026-06-07

### Neu

- Schulden mit Schuldner, Betrag, Zweck, Datum, Bezahldatum und Kategorie erfassen.
- Bezahlte Schulden nach Schuldner gruppieren und pro Gruppe summieren.
- Kategorien, offene/beglichene Betraege und Schuldner-Kategorie-Kombinationen auswerten.
- Hilfe-Seite mit Einstiegspunkten, aktueller Version und Versionsverlauf.
- Backend-Versionstabelle `AppVersion`, die ueber Migrationen erweitert wird.
- Schuldner sehen offene und bereits bezahlte Schulden.
- Loeschantraege mit Begruendung und Freigabe durch den Besitzer.
- Dashboard zeigt offene Loeschantraege sofort an.
- Dashboard und Tabellen blenden Loeschantraege aus, wenn keine offenen Antraege existieren.
- Empty States ersetzen leere Listen und Tabellen.
- Mobile Kartenansichten fuer Schuldenlisten.
- Optionales Kommentarfeld pro Schuld.
- Besitzer koennen eigene offene Schulden direkt bearbeiten oder loeschen.
- Theme-Auswahl im Frontend als Dropdown fuer Hell, Dunkel und System.
- Ueberarbeitete 2026-Farbwelt mit chromatischen Neutrals, Violet/Cyan-Akzenten und besserem Dark-Mode-Kontrast.
- Vollbreite Menubar ohne eigene Hintergrundflaeche.
- JWT-Auth, GraphQL API, Prisma und PostgreSQL.
- E-Mails bei Registrierung und neuer Schuld.
- VitePress Dokumentation mit Bildern.
- Production-Docker-Stack mit Nginx und Healthchecks.
- Oxlint und Oxfmt fuer Codequalitaet.

### Intern

- Frontend-Views in kleinere Komponenten aufgeteilt.
- Backend in Services, Mapper, Auth, GraphQL und DB getrennt.
- README, Docs und Changelog auf aktuellen Stand gebracht.
