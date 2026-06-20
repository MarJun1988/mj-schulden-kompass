---
layout: home

hero:
  name: SchuldKompass
  text: Private Schulden sauber klaeren
  tagline: Anleitung fuer Nutzung, Setup, Betrieb und Entwicklung.
  image:
    src: /images/dashboard.svg
    alt: SchuldKompass Dashboard
  actions:
    - theme: brand
      text: Loslegen
      link: /guide/
    - theme: alt
      text: Entwicklung
      link: /development/

features:
  - title: Schulden erfassen
    details: Erfasse Schuldner, Betrag, Zweck, Datum, Bezahldatum und Kategorie.
  - title: Sicher anmelden
    details: Nutzer melden sich per JWT-Auth an und sehen nur ihre passenden Eintraege.
  - title: Loeschen mit Freigabe
    details: Schuldner stellen Loeschantraege mit Begruendung, Besitzer entscheiden. Leere Antragsbereiche bleiben ausgeblendet.
  - title: Aufgeraeumte Oberflaeche
    details: Leere Bereiche verschwinden, bezahlte Schulden sind tabbasiert und lange Tabellen bleiben stabil.
  - title: Mobile Ansicht
    details: Schuldenlisten werden auf kleinen Displays als gut lesbare Karten angezeigt.
  - title: E-Mail Hinweise
    details: Schuldner und neue Nutzer erhalten automatisch E-Mails. Fehlgeschlagene Sendungen bleiben in einer persistenten Retry-Queue.
  - title: Monitoring
    details: Grafana verbindet Backend-Metriken mit durchsuchbaren Docker-Logs aus Loki.
  - title: Production Stack
    details: Docker Compose mit Frontend, Backend, Docs, Postgres, Nginx und optionalem Monitoring-Stack.
---

## Aktuelle Oberfläche

![Tabbasiertes Schuldenlayout](/images/debts-tabs.svg)

Die aktuelle App setzt auf kompaktere Tabs, klare Spalten und eine ruhigere Zeilenhoehe in den Schuldentabellen.
