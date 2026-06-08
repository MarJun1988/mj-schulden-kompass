# Changelog

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
