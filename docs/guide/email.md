# E-Mail

SchuldKompass verschickt unter anderem diese E-Mails:

- Registrierungsmail an neue Nutzer
- Benachrichtigung an Schuldner, wenn eine neue Schuld eingetragen wurde
- Erinnerungen an offene Schulden
- Benachrichtigungen zu Zahlungen, Guthaben und Rueckueberweisungen

## Lokale Entwicklung

Lokal wird Mailpit verwendet.

![Mailpit Mailbox](/images/mailpit.svg)

```bash
docker compose up -d mailpit
```

Mailbox:

```text
http://localhost:8025
```

SMTP:

```text
localhost:1025
```

## SMTP konfigurieren

In `backend/.env` kannst du echte SMTP-Daten eintragen:

```bash
MAIL_FROM="SchuldKompass <deine-mail@example.com>"
SMTP_HOST="smtp.example.com"
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER="dein-user"
SMTP_PASS="dein-passwort"
SMTP_CONNECTION_TIMEOUT_MS=10000
SMTP_GREETING_TIMEOUT_MS=10000
SMTP_SOCKET_TIMEOUT_MS=15000
MAIL_RETRY_ENABLED=true
MAIL_RETRY_INTERVAL_MINUTES=30
MAIL_RETRY_MAX_ATTEMPTS=10
MAIL_RETRY_BATCH_SIZE=20
```

## Retry-Queue

Wenn SMTP nicht erreichbar ist oder ein Timeout auftritt, speichert SchuldKompass die Mail persistent in der Tabelle `QueuedMail`. Der Backend-Worker versucht faellige Mails in Batches erneut. Die Queue bleibt auch nach einem Backend-Neustart erhalten.

Statuswerte:

- `PENDING`: wartet auf den naechsten Versuch
- `SENDING`: wird gerade verarbeitet
- `SENT`: wurde erfolgreich versendet
- `FAILED`: maximale Anzahl an Versuchen erreicht

Wartende, erfolgreiche und dauerhaft fehlgeschlagene Mails sind als Metriken im Grafana-Dashboard sichtbar.
