# Monitoring

SchuldKompass kombiniert Prometheus, Grafana, Loki und Grafana Alloy:

- Prometheus sammelt Backend-Metriken.
- Grafana zeigt Metriken und Logs in einem provisionierten Dashboard.
- Loki speichert Docker-Logs fuer sieben Tage.
- Alloy liest die Logs aller Container ueber den Docker-Socket und sendet sie an Loki.

## Lokal starten

```bash
docker compose up -d prometheus grafana
```

Grafana startet Loki und Alloy dabei automatisch als Abhaengigkeiten.

URLs:

- Backend-Metriken: `http://localhost:9101/metrics`
- Prometheus: `http://localhost:9090`
- Grafana: `http://localhost:3000`

Der lokale Grafana-Login lautet standardmaessig `admin` / `admin`.

## Dashboard

Das Dashboard `SchuldKompass Backend` wird automatisch provisioniert und zeigt:

- GraphQL-Anfragen nach Status
- GraphQL-Fehler nach Operation und Fehlercode
- p50- und p95-Latenzen
- Mail-Queue und Retry-Ereignisse
- Docker-Log-Volumen nach Service
- Fehler aus den strukturierten Backend-Logs
- Durchsuchbare Docker-Logs

Die Log-Ansicht kann nach Docker-Service, `DEBUG`, `INFO`, `WARN`, `ERROR` und Freitext gefiltert werden. Frontend, Docs und Edge liefern ihre Nginx-Logs. JavaScript-Fehler aus dem Browser sind keine Docker-Logs und werden deshalb nicht erfasst.

## Testing

Der GitLab-Deploy startet den Monitoring-Stack im Testing automatisch. Manuell kann er so gestartet werden:

```bash
docker compose --env-file .env.production \
  -f docker-compose.testing.yml \
  --profile monitoring \
  up -d prometheus loki alloy grafana
```

Grafana ist unter `http://<TESTING_IP>:${GRAFANA_PORT}` erreichbar. Ohne abweichende Konfiguration ist der Port `3000`.

## Production

```bash
docker compose --env-file .env.production \
  -f docker-compose.prod.yml \
  --profile monitoring \
  up -d prometheus loki alloy grafana
```

In `.env.production` sollten mindestens diese Werte gesetzt werden:

```bash
PROMETHEUS_PORT=9090
GRAFANA_PORT=3000
GRAFANA_ADMIN_USER=admin
GRAFANA_ADMIN_PASSWORD=replace-with-a-secure-password
```

Loki besitzt absichtlich keinen oeffentlich freigegebenen Port. Grafana greift intern ueber das Compose-Netzwerk darauf zu.

## Wichtige Metriken

- `schuldkompass_graphql_requests_total`
- `schuldkompass_graphql_errors_total`
- `schuldkompass_graphql_request_duration_seconds`
- `schuldkompass_mail_events_total`
- `schuldkompass_queued_mails`

## Datenschutz und Zugriff

Alloy hat lesenden Zugriff auf den Docker-Socket und kann dadurch Logs aller Container des Hosts erfassen. Der Zugriff auf Grafana sollte durch Firewall, VPN oder Reverse Proxy begrenzt und mit einem sicheren Passwort geschuetzt werden.
