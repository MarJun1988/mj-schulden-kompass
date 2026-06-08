<script setup lang="ts">
import Button from "primevue/button";
import Card from "primevue/card";
import ProgressSpinner from "primevue/progressspinner";
import { computed, onMounted, ref } from "vue";

import { gql } from "../lib/graphql";

interface AppVersion {
  id: string;
  version: string;
  title: string;
  description: string;
  notes: string[];
  releasedAt: string;
}

interface VersionsData {
  latestAppVersion: AppVersion | null;
  appVersions: AppVersion[];
}

const versions = ref<AppVersion[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);

const latestVersion = computed(() => versions.value.at(0) ?? null);
const helpItems = [
  {
    icon: "pi pi-plus",
    title: "Schuld eintragen",
    text: "Neue Schulden legst du im Bereich Schulden an. Bekannte Schuldner und Kategorien werden vorgeschlagen.",
    route: { path: "/debts", query: { create: "1" } },
    action: "Neue Schuld",
  },
  {
    icon: "pi pi-wallet",
    title: "Schulden verwalten",
    text: "Offene Einträge kannst du bearbeiten, löschen oder als bezahlt markieren. Schuldner beantragen Löschungen mit Begründung.",
    route: "/debts",
    action: "Zu Schulden",
  },
  {
    icon: "pi pi-chart-bar",
    title: "Kategorien auswerten",
    text: "Die Auswertung zeigt dir, welche Kategorien und Schuldner-Kategorie-Kombinationen besonders relevant sind.",
    route: "/analytics",
    action: "Zur Auswertung",
  },
];

const formatDate = (date: string) =>
  new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));

const fetchVersions = async () => {
  loading.value = true;
  error.value = null;

  try {
    const payload = await gql<VersionsData>(`
      query HelpVersions {
        latestAppVersion {
          id
          version
          title
          description
          notes
          releasedAt
        }
        appVersions {
          id
          version
          title
          description
          notes
          releasedAt
        }
      }
    `);

    versions.value = payload.data?.appVersions ?? [];
  } catch (fetchError) {
    error.value =
      fetchError instanceof Error ? fetchError.message : "Versionen konnten nicht geladen werden.";
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  void fetchVersions();
});
</script>

<template>
  <section class="grid gap-6">
    <div>
      <p class="text-sm font-medium uppercase tracking-wide text-violet-700 dark:text-violet-300">
        Version
      </p>
      <h1 class="mt-1 text-3xl font-semibold text-slate-950 dark:text-slate-50">
        Version & Einstieg
      </h1>
    </div>

    <div class="grid gap-4 lg:grid-cols-3">
      <Card v-for="item in helpItems" :key="item.title">
        <template #content>
          <div class="flex h-full flex-col">
            <div class="grid size-11 place-items-center rounded-full bg-violet-50 text-violet-700">
              <i :class="item.icon" aria-hidden="true" />
            </div>
            <h2 class="mt-4 text-lg font-semibold text-slate-950 dark:text-slate-50">
              {{ item.title }}
            </h2>
            <p class="mt-2 flex-1 text-sm text-stone-500">{{ item.text }}</p>
            <RouterLink class="mt-4" :to="item.route">
              <Button :label="item.action" size="small" severity="secondary" />
            </RouterLink>
          </div>
        </template>
      </Card>
    </div>

    <div v-if="loading" class="flex min-h-32 items-center justify-center">
      <ProgressSpinner />
    </div>
    <p v-else-if="error" class="text-rose-700">{{ error }}</p>

    <div v-else class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)]">
      <Card>
        <template #title>Aktuelle Version</template>
        <template #content>
          <div v-if="latestVersion" class="grid gap-4">
            <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p class="text-3xl font-semibold text-cyan-800 dark:text-cyan-200">
                  v{{ latestVersion.version }}
                </p>
                <h2 class="mt-2 text-xl font-semibold text-slate-950 dark:text-slate-50">
                  {{ latestVersion.title }}
                </h2>
                <p class="mt-2 text-sm text-stone-500">{{ latestVersion.description }}</p>
              </div>
              <p class="shrink-0 text-sm text-stone-500">
                {{ formatDate(latestVersion.releasedAt) }}
              </p>
            </div>
            <ul class="grid gap-2">
              <li
                v-for="note in latestVersion.notes"
                :key="note"
                class="flex gap-2 text-sm text-stone-700 dark:text-stone-200"
              >
                <i class="pi pi-check mt-0.5 text-cyan-700 dark:text-cyan-300" aria-hidden="true" />
                <span>{{ note }}</span>
              </li>
            </ul>
          </div>
          <p v-else class="text-sm text-stone-500">Noch keine Version hinterlegt.</p>
        </template>
      </Card>

      <Card v-if="versions.length">
        <template #title>Versionsverlauf</template>
        <template #content>
          <div class="grid gap-3">
            <article
              v-for="version in versions"
              :key="version.id"
              class="rounded-md border border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-900"
            >
              <div class="flex items-start justify-between gap-3">
                <div>
                  <p class="font-semibold text-slate-950 dark:text-slate-50">
                    v{{ version.version }}
                  </p>
                  <p class="text-sm text-stone-500">{{ version.title }}</p>
                </div>
                <p class="shrink-0 text-xs text-stone-500">{{ formatDate(version.releasedAt) }}</p>
              </div>
            </article>
          </div>
        </template>
      </Card>
    </div>
  </section>
</template>
