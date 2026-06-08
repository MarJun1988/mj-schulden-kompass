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
  releaseStatus: ReleaseStatus;
}

interface ReleaseStatus {
  currentVersion: string | null;
  latestVersion: string | null;
  updateAvailable: boolean;
  releaseUrl: string | null;
  checkedAt: string;
}

const versions = ref<AppVersion[]>([]);
const releaseStatus = ref<ReleaseStatus | null>(null);
const selectedVersionId = ref<string | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);

const latestVersion = computed(() => versions.value.at(0) ?? null);
const selectedVersion = computed(
  () =>
    versions.value.find((version) => version.id === selectedVersionId.value) ?? latestVersion.value,
);
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
        releaseStatus {
          currentVersion
          latestVersion
          updateAvailable
          releaseUrl
          checkedAt
        }
      }
    `);

    versions.value = payload.data?.appVersions ?? [];
    releaseStatus.value = payload.data?.releaseStatus ?? null;
    selectedVersionId.value = latestVersion.value?.id ?? null;
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

    <div v-else class="grid gap-6">
      <Card v-if="releaseStatus?.updateAvailable">
        <template #content>
          <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div class="flex gap-3">
              <span
                class="grid size-10 shrink-0 place-items-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-200"
              >
                <i class="pi pi-exclamation-circle" aria-hidden="true" />
              </span>
              <div>
                <h2 class="text-base font-semibold text-slate-950 dark:text-slate-50">
                  Neue Version verfügbar
                </h2>
                <p class="mt-1 text-sm text-stone-500">
                  Installiert ist v{{ releaseStatus.currentVersion }}, auf GitHub ist v{{
                    releaseStatus.latestVersion
                  }}
                  verfügbar.
                </p>
              </div>
            </div>
            <a
              v-if="releaseStatus.releaseUrl"
              :href="releaseStatus.releaseUrl"
              target="_blank"
              rel="noreferrer"
              class="inline-flex items-center justify-center gap-2 rounded-md bg-slate-950 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-white"
            >
              <i class="pi pi-external-link" aria-hidden="true" />
              Release öffnen
            </a>
          </div>
        </template>
      </Card>

      <Card v-if="versions.length">
        <template #title>Versionsverlauf</template>
        <template #content>
          <div class="grid gap-5 lg:grid-cols-[minmax(14rem,18rem)_minmax(0,1fr)]">
            <div class="grid content-start gap-2">
              <button
                v-for="version in versions"
                :key="version.id"
                type="button"
                class="rounded-md border px-4 py-3 text-left transition-colors"
                :class="
                  selectedVersion?.id === version.id
                    ? 'border-violet-500 bg-violet-50 text-violet-950 dark:border-violet-300 dark:bg-violet-950/40 dark:text-violet-50'
                    : 'border-slate-200 bg-white text-slate-800 hover:border-violet-300 hover:bg-violet-50/60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-violet-400 dark:hover:bg-violet-950/30'
                "
                @click="selectedVersionId = version.id"
              >
                <span class="flex items-center gap-2 font-semibold">
                  v{{ version.version }}
                  <span
                    v-if="latestVersion?.id === version.id"
                    class="rounded-full bg-cyan-100 px-2 py-0.5 text-[0.7rem] font-medium text-cyan-800 dark:bg-cyan-950/70 dark:text-cyan-100"
                  >
                    aktuell
                  </span>
                </span>
                <span class="mt-1 block text-xs text-stone-500 dark:text-stone-400">
                  {{ formatDate(version.releasedAt) }}
                </span>
              </button>
            </div>

            <article
              v-if="selectedVersion"
              class="rounded-md border border-slate-200 bg-white px-5 py-4 dark:border-slate-700 dark:bg-slate-900"
            >
              <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div class="min-w-0">
                  <p class="text-sm font-medium text-violet-700 dark:text-violet-300">
                    v{{ selectedVersion.version }}
                  </p>
                  <h2 class="mt-1 text-xl font-semibold text-slate-950 dark:text-slate-50">
                    {{ selectedVersion.title }}
                  </h2>
                  <p class="mt-2 text-sm text-stone-500">
                    {{ selectedVersion.description }}
                  </p>
                </div>
                <p class="shrink-0 text-sm text-stone-500">
                  {{ formatDate(selectedVersion.releasedAt) }}
                </p>
              </div>

              <ul class="mt-4 grid gap-2">
                <li
                  v-for="note in selectedVersion.notes"
                  :key="note"
                  class="flex gap-2 text-sm text-stone-700 dark:text-stone-200"
                >
                  <i
                    class="pi pi-check mt-0.5 text-violet-700 dark:text-violet-300"
                    aria-hidden="true"
                  />
                  <span>{{ note }}</span>
                </li>
              </ul>
            </article>
          </div>
        </template>
      </Card>
    </div>
  </section>
</template>
