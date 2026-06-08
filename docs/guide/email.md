# E-Mail

SchuldKompass verschickt zwei Arten von E-Mails:

- Registrierungsmail an neue Nutzer
- Benachrichtigung an Schuldner, wenn eine neue Schuld eingetragen wurde

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
```

Wenn der Mailversand fehlschlaegt, wird der Fehler im Backend geloggt. Die App-Aktion selbst wird nicht abgebrochen.
