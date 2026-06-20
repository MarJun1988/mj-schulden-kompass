# Ueberblick

SchuldKompass ist eine App, um private Schulden festzuhalten und nachvollziehbar zu machen.

Du kannst eintragen, wer dir Geld schuldet, wofuer die Schuld entstanden ist, welcher Kategorie sie zugeordnet ist und ob sie bereits bezahlt wurde. Wenn ein Schuldner eine Schuld als bezahlt melden moechte, wird daraus ein Zahlungsantrag mit Bemerkung, der von dir bestaetigt oder abgelehnt wird.

![SchuldKompass Dashboard](/images/dashboard.svg)

## Aktuelle Ansichten

![Tabbasiertes Schuldenlayout](/images/debts-tabs.svg)

![Auswertung mit Schuldner-Tabs](/images/analytics-tabs.svg)

## Rollen

- Besitzer: Traegt Schulden ein, markiert sie als bezahlt und entscheidet ueber Loeschantraege.
- Schuldner: Meldet sich mit seiner E-Mail-Adresse an und sieht offene sowie bereits bezahlte Schulden. Bezahlt melden geht nur ueber einen Antrag mit Bemerkung.

## Hauptfunktionen

- Registrierung und Login mit JWT
- Schulden anlegen
- Bekannte Schuldner per Dropdown auswaehlen
- Kategorie per Dropdown auswaehlen oder neu eintippen
- Summen pro Schuldner sehen
- Bezahlte Schulden nach Schuldner gruppiert mit Summenzeile sehen
- Kategorien und Schuldner-Kategorie-Kombinationen in der Auswertung in Tabs vergleichen
- Hilfe-Seite mit Einstiegspunkten, aktueller Version und Versionsverlauf
- Loeschantraege mit Begruendung
- Dashboard-Hinweis fuer offene Loeschantraege, nur wenn wirklich Antraege vorhanden sind
- Empty States statt leerer Tabellen
- Mobile Kartenansicht fuer Schuldenlisten
- Light Mode, Dark Mode und automatische System-Erkennung
- E-Mail an Schuldner bei neuer Schuld
- Registrierungsmail an neue Nutzer
- Persistente Retry-Queue fuer temporaer fehlgeschlagene E-Mails
- Grafana-Dashboard fuer Backend-Metriken, Mail-Queue und Docker-Logs

Weitere Betriebsdetails stehen unter [E-Mail](/guide/email) und [Monitoring](/guide/monitoring).

## Darstellung

SchuldKompass unterstuetzt im Frontend `Hell`, `Dunkel` und `System`. Bei `System` folgt die App automatisch der Einstellung deines Betriebssystems. Die Oberflaeche nutzt eine 2026-inspirierte Farbwelt aus chromatischen Neutrals, Violet/Cyan-Akzenten und sparsamen Lime-Highlights. Die Dokumentation nutzt ebenfalls den VitePress-Umschalter fuer Hell, Dunkel und automatische System-Erkennung.

## Hilfe und Version

Der Bereich `Hilfe` sammelt die wichtigsten Einstiegspunkte und zeigt die aktuell hinterlegte App-Version. Die Versionen kommen aus der Backend-Tabelle `AppVersion`. Bei einem Update kann eine Migration einen neuen Versionseintrag ergaenzen, sodass der Versionsverlauf in der App sichtbar bleibt.

## Technischer Aufbau

![Architektur](/images/architecture.svg)
