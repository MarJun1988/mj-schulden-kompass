# Changelog

Alle relevanten Aenderungen an SchuldKompass werden hier gesammelt.

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

- Deploy-Jobs schreiben die auszurollende Version automatisch in `.env.production`.
- Testing-Deploy nutzt ein eigenes Compose-File mit GitLab-Container-Registry-Images.
- Testing-Deploy setzt `VERSION` auf den Branch-Build-Tag mit Commit-Hash.
- Production-Deploy setzt `VERSION` auf den Git-Tag des Releases.
- Deploy-Logs zeigen Pull, Migration, Recreate und Containerstatus klarer an.
- Container werden beim Deploy mit `--force-recreate` neu erstellt.

## 0.1.8 - 2026-06-08

### Neu

- Automatisierte Basis-Tests fuer Frontend-Formatierer und Backend-Versionslogik.
- Root-Testskript fuer Frontend- und Backend-Tests.
- VitePress nutzt das SchuldKompass-Logo als Favicon.

### Geaendert

- Versionsvergleich im Backend in eine testbare Utility ausgelagert.
- Versionsverlauf zeigt standardmaessig nur die letzten drei Versionen und klappt aeltere Eintraege bei Bedarf auf.

## 0.1.7 - 2026-06-08

### Neu

- Besitzer koennen fuer offene Schulden manuell eine Erinnerungsmail senden.
- Erinnerungsversand ist als GraphQL-Mutation abgesichert und prueft Besitzer sowie Zahlungsstatus.
- Frontend zeigt Versand-Erfolg und Fehler per PrimeVue Toast an.

### Geaendert

- Mailversand liefert fuer Erinnerungen einen echten Erfolg- oder Fehlerstatus zurueck.

## 0.1.6 - 2026-06-08

### Geaendert

- GitHub-Release-Pruefung bekommt ein kurzes Timeout und kann per Env deaktiviert werden.
- Production-Compose reicht Release-Check-Optionen an das Backend weiter.
- GraphQL-Request-Logging ist defensiver, damit Healthchecks nicht an fehlenden Context-Daten scheitern.

## 0.1.5 - 2026-06-08

### Geaendert

- Hauptnavigation auf die fachlichen Bereiche reduziert.
- Aktuelle App-Version dezent ins Nutzermenue verschoben.
- Versionsverlauf bleibt ueber die Versionsnummer im Nutzermenue erreichbar.
- Darstellungsauswahl im Nutzermenue durch einen kompakten Menuepunkt mit Auswahl-Dialog ersetzt.
- VitePress-Hilfe erhaelt einen Ruecksprung zur Anwendung.

## 0.1.4 - 2026-06-08

### Neu

- E-Mail-Aktivierung fuer neue Nutzer per zeitlich begrenztem Aktivierungslink.
- Oeffentliche Aktivierungsseite unter `/activate`, die den Link prueft und den Nutzer danach einloggt.
- Prisma-Migration fuer Verifikationsfelder am Nutzerkonto.
- Deploy-Pipeline fuehrt Prisma-Migrationen automatisch vor dem App-Start aus.

### Geaendert

- Registrierung erstellt zunaechst ein nicht aktiviertes Konto und sendet einen Aktivierungslink.
- Login ist erst nach bestaetigter E-Mail-Adresse moeglich.
- AppVersion-Verlauf erhaelt einen Eintrag fuer die E-Mail-Aktivierung.

## 0.1.3 - 2026-06-08

### Geaendert

- Production-Deploy auf dem Zielsystem getestet und stabilisiert.
- Prisma-Migrationen fuer frische Server und bestehende Datenbanken nachgezogen.
- Healthcheck- und Compose-Ablauf fuer Backend, Frontend, Docs und Edge nachjustiert.

## 0.1.2 - 2026-06-08

### Neu

- GitLab-CI fuer Build, Tests, Docker-Image-Publishing und Deploy vorbereitet.
- Docker-Hub-Images fuer Backend, Frontend, Docs und Edge in den Production-Flow eingebunden.
- Export zu GitHub inklusive Release-Verarbeitung vorbereitet.

## 0.1.1 - 2026-06-08

### Geaendert

- Production-Rollout vorbereitet und `docker-compose.prod.yml` auf externe Images ausgerichtet.
- Mailpit aus dem Production-Setup entfernt.
- Production-Env-Beispiel und Deploy-Variablen fuer den Serverbetrieb erweitert.

## 0.1.0 - 2026-06-07

### Neu

- Full-Stack-Grundaufbau mit Vue 3, TypeScript, Tailwind CSS, PrimeVue, Pinia und Vue Router.
- Backend mit Apollo GraphQL, Prisma, PostgreSQL, JWT-Auth und Mailversand.
- Registrierung und Login mit geschuetztem App-Bereich.
- Schulden erfassen mit Schuldner, Betrag, Zweck, Datum, Bezahldatum und Kategorie.
- Bekannte Schuldner im Formular per Dropdown auswaehlen.
- Kategorien als editierbares Dropdown.
- Summen pro Schuldner in der Forderungsuebersicht.
- Gruppierte bezahlte Schulden mit Summenzeile pro Schuldner.
- Auswertungsseite fuer Kategorien, offene/beglichene Summen und Schuldner-Kategorie-Kombinationen.
- Hilfe-Seite mit Kurzanleitung, aktueller Version und Versionsverlauf.
- Backend-Versionstabelle `AppVersion` inklusive initialem Versionseintrag.
- Schuldneransicht fuer offene und bezahlte Schulden.
- Loeschantraege mit Begruendung, Freigabe und Ablehnung durch den Besitzer.
- Loeschantraege direkt auf dem Dashboard sichtbar.
- Loeschantrag-Bereiche und -Spalten werden ausgeblendet, wenn keine offenen Antraege vorhanden sind.
- Empty States fuer Dashboard und Schuldenseite, wenn noch keine Eintraege vorhanden sind.
- Mobile optimierte Kartenansichten fuer Schuldenlisten.
- Optionales Kommentarfeld pro Schuld.
- Besitzer koennen eigene offene Schulden direkt bearbeiten oder loeschen.
- Theme-Auswahl im Frontend als Dropdown fuer Hell, Dunkel und System.
- Ueberarbeitete 2026-Farbwelt mit chromatischen Neutrals, Violet/Cyan-Akzenten und besser lesbarem Dark Mode.
- Registrierungsmail und Mail bei neu eingetragener Schuld.
- VitePress Dokumentation mit Bildern.
- Production-Docker-Setup mit Frontend-Nginx, Backend-Nginx, Docs-Nginx und Edge-Nginx.
- Healthchecks fuer Production-Services.
- Oxlint und Oxfmt fuer Linting und Formatierung.

### Geaendert

- Frontend-Komponenten fuer Schuldenformular, Summenkarten und Loeschzellen ausgelagert.
- Backend in Services, GraphQL-Module, Mapper, Auth, Typen und DB-Zugriff getrennt.
- README und Dokumentation fuer Nutzung, Entwicklung und Betrieb erweitert.
- Schuldenuebersichten optisch verdichtet, Tabellenabstaende nachjustiert und leere Bereiche reduziert.
- Menubar bleibt vollbreit, aber ohne eigene Hintergrundflaeche.

### Hinweise

- Vite meldet wegen PrimeVue einen grossen Frontend-Chunk. Das ist aktuell nur eine Warnung und kein Build-Fehler.
