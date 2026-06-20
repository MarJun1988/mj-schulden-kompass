# Schulden Verwalten

## Neue Schuld erfassen

Oeffne in der App den Bereich `Schulden` und fuelle das Formular aus:

![Neue Schuld erfassen](/images/debt-form.svg)

- Schuldner
- E-Mail des Schuldners
- Betrag
- Zweck
- Kommentar
- Kategorie
- Datum
- Bezahlt wann

Wenn du den Schuldner schon einmal verwendet hast, kannst du ihn ueber `Bekannter Schuldner` auswaehlen. Name und E-Mail werden automatisch uebernommen.

Das Feld `Kommentar` ist optional. Du kannst dort z. B. eine kurze Notiz, einen Treffpunkt, eine Rechnungserklaerung oder eine interne Erinnerung zur Schuld hinterlegen.

## Kategorien

Die Kategorie ist ein Dropdown. Es enthaelt Standardwerte wie:

- Konzert
- Klamotten
- Essen
- Reise
- Sonstiges

Bereits verwendete Kategorien werden automatisch ergaenzt. Neue Kategorien koennen weiterhin eingetippt werden.

## Summen pro Schuldner

Im Bereich `Offene Schulden an mich` siehst du oberhalb der Tabelle eine Zusammenfassung pro Schuldner:

![Summen pro Schuldner](/images/debtor-summary.svg)

- Name
- E-Mail
- offene Gesamtsumme
- Anzahl offener Eintraege

In diesem Bereich kannst du als Besitzer eigene offene Eintraege direkt bearbeiten, loeschen oder als bezahlt markieren.

## Bezahlte Schulden

Der Bereich `Bezahlte Schulden` gruppiert erledigte Eintraege nach Schuldner. Innerhalb jeder Gruppe siehst du die einzelnen bezahlten Schulden und darunter eine Summenzeile mit Anzahl und Gesamtbetrag.

![Bezahlte Schulden als Tabs](/images/debts-tabs.svg)

Wenn keine bezahlten Schulden vorhanden sind, wird der Bereich ausgeblendet. Dadurch bleibt die Seite kompakt und zeigt nur Inhalte, die gerade relevant sind.

## Schuld als bezahlt melden

Wenn du eine offene Schuld als bezahlt melden moechtest, musst du eine kurze Bemerkung angeben. Daraus wird ein Zahlungsantrag. Der Besitzer sieht den Antrag im Dashboard und in der Schuldenansicht und kann ihn bestaetigen oder ablehnen.

Der Schuldner kann den Betrag also nicht direkt als bezahlt abschliessen. Erst nach der Bestaetigung durch den Besitzer wird die Schuld auf bezahlt gesetzt und der andere Nutzer bekommt optional eine Mail.

## Sicht des Schuldners

Der Schuldner meldet sich mit derselben E-Mail-Adresse an, die du beim Eintrag verwendet hast. Danach sieht er:

- was er noch schuldet
- wofuer die Schuld ist
- welche Kategorie sie hat
- was bereits bezahlt wurde
- ob ein Zahlungsantrag offen, abgelehnt oder bestaetigt wurde

Der Loeschantrag wird fuer den Schuldner nur bei `Ich schulde` angezeigt. Bereits bezahlte Schulden bleiben zur Nachvollziehbarkeit sichtbar, ohne neues Loeschformular.

Wenn noch keine Schulden vorhanden sind, zeigt die App einen zentralen Startzustand mit Button zum Erfassen der ersten Schuld statt leerer Tabellen.

## Schulden loeschen

Schulden werden nicht direkt vom Schuldner geloescht. Der Ablauf ist:

![Loeschantrag Ablauf](/images/deletion-flow.svg)

- Der Schuldner beantragt die Loeschung mit einer Begruendung.
- Der Besitzer der Schuld sieht offene Loeschantraege in seiner Tabelle und direkt auf dem Dashboard.
- Der Besitzer kann den Antrag bestaetigen oder ablehnen.

Nach einer Ablehnung bleibt die Schuld sichtbar. Der Schuldner kann danach einen neuen Antrag mit einer anderen Begruendung stellen.

Gibt es keine offenen Loeschantraege, blendet die App die entsprechenden Dashboard-Kacheln, Tabellenspalten und Kartenbereiche aus.

## Mobile Ansicht

Auf kleinen Displays werden die Schulden nicht als breite Tabellen angezeigt, sondern als Karten. Dadurch bleiben Betrag, Schuldner, Zweck und Aktionen besser lesbar.

## Auswertung

Die Auswertungsseite zeigt Schuldner nach Kategorie in Tabs. Oben waehlst du den Schuldner, im Inhalt siehst du die Kategorien mit Summen, offenen Betraegen und bezahlten Betraegen.

![Auswertung mit Schuldner-Tabs](/images/analytics-tabs.svg)
