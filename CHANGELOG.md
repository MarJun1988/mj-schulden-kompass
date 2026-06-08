# Changelog

Alle relevanten Aenderungen an SchuldKompass werden hier gesammelt.

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
