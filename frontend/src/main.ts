import "./style.css";
import "primeicons/primeicons.css";

import Aura from "@primeuix/themes/aura";
import PrimeVue from "primevue/config";
import ToastService from "primevue/toastservice";
import { createPinia } from "pinia";
import { createApp } from "vue";

import App from "./App.vue";
import router from "./router";

const app = createApp(App);

app.use(createPinia());
app.use(router);
app.use(ToastService);
app.use(PrimeVue, {
  theme: {
    preset: Aura,
    options: {
      darkModeSelector: ".app-dark",
    },
  },
  locale: {
    accept: "Ja",
    addRule: "Regel hinzufügen",
    after: "Nach",
    apply: "Anwenden",
    before: "Vor",
    cancel: "Abbrechen",
    choose: "Auswählen",
    clear: "Leeren",
    contains: "Enthält",
    dateAfter: "Datum ist nach",
    dateBefore: "Datum ist vor",
    dateFormat: "dd.mm.yy",
    dateIs: "Datum ist",
    dateIsNot: "Datum ist nicht",
    dayNames: ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"],
    dayNamesMin: ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"],
    dayNamesShort: ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"],
    emptyFilterMessage: "Keine Ergebnisse gefunden",
    emptyMessage: "Keine Einträge vorhanden",
    emptySearchMessage: "Keine Ergebnisse gefunden",
    emptySelectionMessage: "Keine Auswahl",
    endsWith: "Endet mit",
    equals: "Gleich",
    fileSizeTypes: ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"],
    filter: "Filtern",
    firstDayOfWeek: 1,
    gt: "Größer als",
    gte: "Größer oder gleich",
    lt: "Kleiner als",
    lte: "Kleiner oder gleich",
    matchAll: "Alle Regeln",
    matchAny: "Eine Regel",
    medium: "Mittel",
    monthNames: [
      "Januar",
      "Februar",
      "März",
      "April",
      "Mai",
      "Juni",
      "Juli",
      "August",
      "September",
      "Oktober",
      "November",
      "Dezember",
    ],
    monthNamesShort: [
      "Jan",
      "Feb",
      "Mär",
      "Apr",
      "Mai",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Okt",
      "Nov",
      "Dez",
    ],
    nextDecade: "Nächstes Jahrzehnt",
    nextHour: "Nächste Stunde",
    nextMinute: "Nächste Minute",
    nextMonth: "Nächster Monat",
    nextSecond: "Nächste Sekunde",
    nextYear: "Nächstes Jahr",
    noFilter: "Kein Filter",
    notContains: "Enthält nicht",
    notEquals: "Ungleich",
    now: "Jetzt",
    passwordPrompt: "Passwort eingeben",
    pending: "Ausstehend",
    prevDecade: "Vorheriges Jahrzehnt",
    prevHour: "Vorherige Stunde",
    prevMinute: "Vorherige Minute",
    prevMonth: "Vorheriger Monat",
    prevSecond: "Vorherige Sekunde",
    prevYear: "Vorheriges Jahr",
    reject: "Nein",
    removeRule: "Regel entfernen",
    searchMessage: "{0} Ergebnisse verfügbar",
    selectionMessage: "{0} Einträge ausgewählt",
    startsWith: "Beginnt mit",
    strong: "Stark",
    today: "Heute",
    upload: "Hochladen",
    weak: "Schwach",
    weekHeader: "KW",
  },
});

app.mount("#app");
