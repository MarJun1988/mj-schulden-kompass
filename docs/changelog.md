# Changelog

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
