<script setup lang="ts">
import Button from "primevue/button";
import Card from "primevue/card";
import Tab from "primevue/tab";
import TabList from "primevue/tablist";
import TabPanel from "primevue/tabpanel";
import TabPanels from "primevue/tabpanels";
import Tabs from "primevue/tabs";
import ProgressSpinner from "primevue/progressspinner";
import { computed, onMounted, ref, watch } from "vue";

import { currency } from "../components/debts/debtFormatters";
import { useDebtsStore, type Debt } from "../stores/debts";

interface CategoryStats {
  category: string;
  openAmount: number;
  paidAmount: number;
  totalAmount: number;
  openCount: number;
  paidCount: number;
  totalCount: number;
}

interface DebtorCategoryGroup {
  key: string;
  name: string;
  email: string;
  categories: CategoryStats[];
  openAmount: number;
  paidAmount: number;
  totalAmount: number;
  openCount: number;
  paidCount: number;
  totalCount: number;
}

const store = useDebtsStore();

const buildCategoryStats = (debts: Debt[]) => {
  const categories = new Map<string, CategoryStats>();

  for (const debt of debts) {
    const current = categories.get(debt.category) ?? {
      category: debt.category,
      openAmount: 0,
      paidAmount: 0,
      totalAmount: 0,
      openCount: 0,
      paidCount: 0,
      totalCount: 0,
    };

    current.totalAmount += debt.amount;
    current.totalCount += 1;

    if (debt.isPaid) {
      current.paidAmount += debt.amount;
      current.paidCount += 1;
    } else {
      current.openAmount += debt.amount;
      current.openCount += 1;
    }

    categories.set(debt.category, current);
  }

  return Array.from(categories.values()).sort(
    (a, b) => b.totalAmount - a.totalAmount || a.category.localeCompare(b.category),
  );
};

const owedToMeCategoryStats = computed(() => buildCategoryStats(store.owedToMe));
const iOweCategoryStats = computed(() => buildCategoryStats(store.iOwe));
const debtorCategoryGroups = computed(() => {
  const groups = new Map<string, DebtorCategoryGroup>();

  for (const debt of store.owedToMe) {
    const key = debt.debtorEmail;
    const current =
      groups.get(key) ??
      ({
        key,
        name: debt.debtorName,
        email: debt.debtorEmail,
        categories: [],
        openAmount: 0,
        paidAmount: 0,
        totalAmount: 0,
        openCount: 0,
        paidCount: 0,
        totalCount: 0,
      } as DebtorCategoryGroup);

    let category = current.categories.find((entry) => entry.category === debt.category);

    if (!category) {
      category = {
        category: debt.category,
        openAmount: 0,
        paidAmount: 0,
        totalAmount: 0,
        openCount: 0,
        paidCount: 0,
        totalCount: 0,
      };
      current.categories.push(category);
    }

    category.totalAmount += debt.amount;
    category.totalCount += 1;
    current.totalAmount += debt.amount;
    current.totalCount += 1;

    if (debt.isPaid) {
      category.paidAmount += debt.amount;
      category.paidCount += 1;
      current.paidAmount += debt.amount;
      current.paidCount += 1;
    } else {
      category.openAmount += debt.amount;
      category.openCount += 1;
      current.openAmount += debt.amount;
      current.openCount += 1;
    }

    groups.set(key, current);
  }

  return Array.from(groups.values())
    .map((group) => ({
      ...group,
      categories: group.categories.sort(
        (a, b) => b.totalAmount - a.totalAmount || a.category.localeCompare(b.category),
      ),
    }))
    .sort((a, b) => b.totalAmount - a.totalAmount || a.name.localeCompare(b.name));
});
const debtorCategoryActive = ref("");

const totalOwedToMe = computed(() =>
  owedToMeCategoryStats.value.reduce((sum, category) => sum + category.totalAmount, 0),
);
const totalIOwe = computed(() =>
  iOweCategoryStats.value.reduce((sum, category) => sum + category.totalAmount, 0),
);
const totalOpenOwedToMe = computed(() =>
  owedToMeCategoryStats.value.reduce((sum, category) => sum + category.openAmount, 0),
);
const totalOpenIOwe = computed(() =>
  iOweCategoryStats.value.reduce((sum, category) => sum + category.openAmount, 0),
);
const hasAnalytics = computed(() => store.owedToMe.length > 0 || store.iOwe.length > 0);

const categoryPercent = (amount: number, total: number) => {
  if (total <= 0) {
    return 0;
  }

  return Math.max(4, Math.round((amount / total) * 100));
};

onMounted(() => {
  void store.fetchDebts();
});

watch(
  debtorCategoryGroups,
  (groups) => {
    if (!groups.length) {
      debtorCategoryActive.value = "";
      return;
    }

    if (!groups.some((group) => group.key === debtorCategoryActive.value)) {
      debtorCategoryActive.value = groups[0].key;
    }
  },
  { immediate: true },
);
</script>

<template>
  <section class="grid gap-6">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p class="text-sm font-medium uppercase tracking-wide text-violet-700 dark:text-violet-300">
          Auswertung
        </p>
        <h1 class="mt-1 text-3xl font-semibold text-slate-950 dark:text-slate-50">Kategorien</h1>
      </div>
      <RouterLink :to="{ path: '/debts', query: { create: '1' } }">
        <Button
          class="mobile-icon-button"
          icon="pi pi-plus"
          label="Schuld eintragen"
          title="Schuld eintragen"
          aria-label="Schuld eintragen"
        />
      </RouterLink>
    </div>

    <div v-if="store.loading" class="flex min-h-32 items-center justify-center">
      <ProgressSpinner />
    </div>
    <p v-else-if="store.error" class="text-rose-700">{{ store.error }}</p>

    <Card v-else-if="!hasAnalytics">
      <template #content>
        <div class="flex flex-col items-center px-4 py-10 text-center">
          <div class="grid size-12 place-items-center rounded-full bg-violet-50 text-violet-700">
            <i class="pi pi-chart-bar text-xl" aria-hidden="true" />
          </div>
          <h2 class="mt-4 text-xl font-semibold text-slate-950 dark:text-slate-50">
            Noch keine Auswertung vorhanden
          </h2>
          <p class="mt-2 max-w-md text-sm text-stone-500">
            Sobald Schulden eingetragen sind, zeigt dir diese Seite die Verteilung nach Kategorien.
          </p>
          <RouterLink class="mt-5" :to="{ path: '/debts', query: { create: '1' } }">
            <Button icon="pi pi-plus" label="Schuld eintragen" />
          </RouterLink>
        </div>
      </template>
    </Card>

    <template v-else>
      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card v-if="totalOwedToMe > 0">
          <template #title>Gesamt an mich</template>
          <template #content>
            <p class="text-3xl font-semibold text-cyan-800 dark:text-cyan-200">
              {{ currency.format(totalOwedToMe) }}
            </p>
            <p class="mt-1 text-sm text-stone-500">{{ store.owedToMe.length }} Einträge</p>
          </template>
        </Card>
        <Card v-if="totalOpenOwedToMe > 0">
          <template #title>Davon offen</template>
          <template #content>
            <p class="text-3xl font-semibold text-violet-800 dark:text-violet-200">
              {{ currency.format(totalOpenOwedToMe) }}
            </p>
          </template>
        </Card>
        <Card v-if="totalIOwe > 0">
          <template #title>Ich schulde gesamt</template>
          <template #content>
            <p class="text-3xl font-semibold text-rose-700 dark:text-rose-200">
              {{ currency.format(totalIOwe) }}
            </p>
            <p class="mt-1 text-sm text-stone-500">{{ store.iOwe.length }} Einträge</p>
          </template>
        </Card>
        <Card v-if="totalOpenIOwe > 0">
          <template #title>Davon offen</template>
          <template #content>
            <p class="text-3xl font-semibold text-amber-700 dark:text-amber-200">
              {{ currency.format(totalOpenIOwe) }}
            </p>
          </template>
        </Card>
      </div>

      <div class="grid gap-6 xl:grid-cols-2">
        <Card v-if="owedToMeCategoryStats.length">
          <template #title>Kategorien · Schulden an mich</template>
          <template #content>
            <div class="grid gap-4">
              <article v-for="category in owedToMeCategoryStats" :key="category.category">
                <div class="flex items-start justify-between gap-4">
                  <div>
                    <p class="font-semibold text-stone-900 dark:text-slate-50">
                      {{ category.category }}
                    </p>
                    <p class="text-xs text-stone-500">
                      {{ category.totalCount }} Einträge · {{ category.openCount }} offen
                    </p>
                  </div>
                  <p class="shrink-0 font-semibold text-cyan-800 dark:text-cyan-200">
                    {{ currency.format(category.totalAmount) }}
                  </p>
                </div>
                <div class="mt-3 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    class="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400"
                    :style="{ width: `${categoryPercent(category.totalAmount, totalOwedToMe)}%` }"
                  ></div>
                </div>
                <div class="mt-2 flex justify-between text-xs text-stone-500">
                  <span>Offen {{ currency.format(category.openAmount) }}</span>
                  <span>Bezahlt {{ currency.format(category.paidAmount) }}</span>
                </div>
              </article>
            </div>
          </template>
        </Card>

        <Card v-if="iOweCategoryStats.length">
          <template #title>Kategorien · Ich schulde</template>
          <template #content>
            <div class="grid gap-4">
              <article v-for="category in iOweCategoryStats" :key="category.category">
                <div class="flex items-start justify-between gap-4">
                  <div>
                    <p class="font-semibold text-stone-900 dark:text-slate-50">
                      {{ category.category }}
                    </p>
                    <p class="text-xs text-stone-500">
                      {{ category.totalCount }} Einträge · {{ category.openCount }} offen
                    </p>
                  </div>
                  <p class="shrink-0 font-semibold text-rose-700 dark:text-rose-200">
                    {{ currency.format(category.totalAmount) }}
                  </p>
                </div>
                <div class="mt-3 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    class="h-full rounded-full bg-gradient-to-r from-rose-500 to-amber-300"
                    :style="{ width: `${categoryPercent(category.totalAmount, totalIOwe)}%` }"
                  ></div>
                </div>
                <div class="mt-2 flex justify-between text-xs text-stone-500">
                  <span>Offen {{ currency.format(category.openAmount) }}</span>
                  <span>Bezahlt {{ currency.format(category.paidAmount) }}</span>
                </div>
              </article>
            </div>
          </template>
        </Card>
      </div>

      <Card v-if="debtorCategoryGroups.length">
        <template #title>Schuldner nach Kategorie</template>
        <template #content>
          <Tabs v-model:value="debtorCategoryActive">
            <TabList
              class="flex flex-wrap gap-2 border-b border-slate-200 pb-3 dark:border-slate-800"
            >
              <Tab v-for="group in debtorCategoryGroups" :key="group.key" :value="group.key">
                {{ group.name }}
              </Tab>
            </TabList>
            <TabPanels>
              <TabPanel
                v-for="group in debtorCategoryGroups"
                :key="group.key"
                :value="group.key"
                class="pt-4"
              >
                <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div class="min-w-0">
                    <p class="font-semibold text-stone-900 dark:text-slate-50">{{ group.name }}</p>
                    <p class="break-all text-xs text-stone-500">{{ group.email }}</p>
                  </div>
                  <div class="text-right">
                    <p class="text-sm text-stone-500">
                      {{ group.totalCount }} {{ group.totalCount === 1 ? "Eintrag" : "Einträge" }}
                    </p>
                    <p class="text-sm font-semibold text-cyan-800 dark:text-cyan-200">
                      {{ currency.format(group.totalAmount) }}
                    </p>
                  </div>
                </div>
                <div class="grid gap-3 md:grid-cols-2">
                  <article
                    v-for="category in group.categories"
                    :key="`${group.key}:${category.category}`"
                    class="rounded-md border border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-900"
                  >
                    <div class="flex items-start justify-between gap-3">
                      <div class="min-w-0">
                        <p class="truncate font-semibold text-stone-900 dark:text-slate-50">
                          {{ category.category }}
                        </p>
                        <p class="text-xs text-stone-500">
                          {{ category.totalCount }}
                          {{ category.totalCount === 1 ? "Eintrag" : "Einträge" }}
                        </p>
                      </div>
                      <p class="shrink-0 font-semibold text-violet-700 dark:text-violet-300">
                        {{ currency.format(category.totalAmount) }}
                      </p>
                    </div>
                    <div
                      class="mt-3 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"
                    >
                      <div
                        class="h-full rounded-full bg-gradient-to-r from-cyan-400 to-violet-500"
                        :style="{
                          width: `${categoryPercent(category.totalAmount, group.totalAmount)}%`,
                        }"
                      ></div>
                    </div>
                    <div class="mt-2 flex justify-between text-xs text-stone-500">
                      <span>Offen {{ currency.format(category.openAmount) }}</span>
                      <span>Bezahlt {{ currency.format(category.paidAmount) }}</span>
                    </div>
                  </article>
                </div>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </template>
      </Card>
    </template>
  </section>
</template>
