<script setup lang="ts">
import Button from "primevue/button";
import Card from "primevue/card";
import Column from "primevue/column";
import Dialog from "primevue/dialog";
import DataTable from "primevue/datatable";
import Tab from "primevue/tab";
import TabList from "primevue/tablist";
import TabPanel from "primevue/tabpanel";
import TabPanels from "primevue/tabpanels";
import Tabs from "primevue/tabs";
import { useToast } from "primevue/usetoast";
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

import DebtDeletionRequestCell from "../components/debts/DebtDeletionRequestCell.vue";
import DebtDeletionReviewCell from "../components/debts/DebtDeletionReviewCell.vue";
import DebtEditDialog, { type DebtEditInput } from "../components/debts/DebtEditDialog.vue";
import DebtForm, { type DebtFormInput, type KnownDebtor } from "../components/debts/DebtForm.vue";
import DebtorSummaryCards from "../components/debts/DebtorSummaryCards.vue";
import { currency, formatDate } from "../components/debts/debtFormatters";
import { useDebtsStore, type Debt } from "../stores/debts";

interface DebtorSummary {
  name: string;
  email: string;
  amount: number;
  count: number;
}

interface PaidDebtGroup {
  debtorName: string;
  debtorEmail: string;
  total: number;
  count: number;
  debts: Debt[];
}

interface OpenDebtGroup {
  category: string;
  total: number;
  count: number;
  debts: Debt[];
}

const store = useDebtsStore();
const route = useRoute();
const router = useRouter();
const toast = useToast();
const saving = ref(false);
const formVisible = ref(false);
const editSaving = ref(false);
const editVisible = ref(false);
const selectedDebt = ref<Debt | null>(null);
const paidDebtTarget = ref<Debt | null>(null);
const paidMailDialogVisible = ref(false);
const remindingDebtIds = ref(new Set<string>());
const categoryExamples = ["Konzert", "Klamotten", "Essen", "Reise", "Sonstiges"];

const openOwedToMe = computed(() => store.owedToMe.filter((debt) => !debt.isPaid));
const paidOwedToMe = computed(() => store.owedToMe.filter((debt) => debt.isPaid));
const openIOwe = computed(() => store.iOwe.filter((debt) => !debt.isPaid));
const paidIOwe = computed(() => store.iOwe.filter((debt) => debt.isPaid));
const openIOweActiveCategory = ref("");
const paidOwedToMeActiveDebtor = ref("");
const hasDebtEntries = computed(
  () =>
    openOwedToMe.value.length > 0 ||
    openIOwe.value.length > 0 ||
    paidIOwe.value.length > 0 ||
    paidOwedToMe.value.length > 0,
);
const hasOpenOwedToMeDeletionRequests = computed(() =>
  openOwedToMe.value.some((debt) => debt.deletionStatus === "PENDING"),
);
const hasPaidOwedToMeDeletionRequests = computed(() =>
  paidOwedToMe.value.some((debt) => debt.deletionStatus === "PENDING"),
);

const paidOwedToMeGroups = computed(() => {
  const groups = new Map<string, PaidDebtGroup>();

  for (const debt of paidOwedToMe.value) {
    const key = debt.debtorEmail;
    const current = groups.get(key);

    if (current) {
      current.total += debt.amount;
      current.count += 1;
      current.debts.push(debt);
    } else {
      groups.set(key, {
        debtorName: debt.debtorName,
        debtorEmail: debt.debtorEmail,
        total: debt.amount,
        count: 1,
        debts: [debt],
      });
    }
  }

  return Array.from(groups.values())
    .map((group) => ({
      ...group,
      debts: [...group.debts].sort((a, b) => {
        const paidAtCompare =
          new Date(b.paidAt ?? b.createdAt).getTime() - new Date(a.paidAt ?? a.createdAt).getTime();

        return paidAtCompare || a.purpose.localeCompare(b.purpose);
      }),
    }))
    .sort(
      (a, b) =>
        a.debtorName.localeCompare(b.debtorName) || a.debtorEmail.localeCompare(b.debtorEmail),
    );
});

const openIOweGroups = computed(() => {
  const groups = new Map<string, OpenDebtGroup>();

  for (const debt of openIOwe.value) {
    const key = debt.category;
    const current = groups.get(key);

    if (current) {
      current.total += debt.amount;
      current.count += 1;
      current.debts.push(debt);
    } else {
      groups.set(key, {
        category: debt.category,
        total: debt.amount,
        count: 1,
        debts: [debt],
      });
    }
  }

  return Array.from(groups.values())
    .map((group) => ({
      ...group,
      debts: [...group.debts].sort((a, b) => {
        const dateCompare = new Date(b.debtDate).getTime() - new Date(a.debtDate).getTime();

        return dateCompare || a.purpose.localeCompare(b.purpose);
      }),
    }))
    .sort((a, b) => a.category.localeCompare(b.category));
});

const knownCategories = computed(() => {
  const categories = new Set(categoryExamples);

  for (const debt of store.owedToMe) {
    categories.add(debt.category);
  }

  return Array.from(categories).sort((a, b) => a.localeCompare(b));
});

const knownDebtors = computed(() => {
  const debtors = new Map<string, KnownDebtor>();

  for (const debt of store.owedToMe) {
    if (!debtors.has(debt.debtorEmail)) {
      debtors.set(debt.debtorEmail, {
        name: debt.debtorName,
        email: debt.debtorEmail,
        label: `${debt.debtorName} (${debt.debtorEmail})`,
      });
    }
  }

  return Array.from(debtors.values()).sort((a, b) => a.name.localeCompare(b.name));
});

const openDebtorSummaries = computed(() => {
  const summaries = new Map<string, DebtorSummary>();

  for (const debt of openOwedToMe.value) {
    const current = summaries.get(debt.debtorEmail);

    if (current) {
      current.amount += debt.amount;
      current.count += 1;
    } else {
      summaries.set(debt.debtorEmail, {
        name: debt.debtorName,
        email: debt.debtorEmail,
        amount: debt.amount,
        count: 1,
      });
    }
  }

  return Array.from(summaries.values()).sort((a, b) => b.amount - a.amount);
});

watch(
  openIOweGroups,
  (groups) => {
    if (!groups.length) {
      openIOweActiveCategory.value = "";
      return;
    }

    if (!groups.some((group) => group.category === openIOweActiveCategory.value)) {
      openIOweActiveCategory.value = groups[0].category;
    }
  },
  { immediate: true },
);

watch(
  paidOwedToMeGroups,
  (groups) => {
    if (!groups.length) {
      paidOwedToMeActiveDebtor.value = "";
      return;
    }

    if (!groups.some((group) => group.debtorEmail === paidOwedToMeActiveDebtor.value)) {
      paidOwedToMeActiveDebtor.value = groups[0].debtorEmail;
    }
  },
  { immediate: true },
);

const submitDebt = async (input: DebtFormInput) => {
  saving.value = true;

  try {
    await store.createDebt(input);
    formVisible.value = false;
  } finally {
    saving.value = false;
  }
};

const openCreateDialog = () => {
  formVisible.value = true;
};

const closeCreateDialog = () => {
  formVisible.value = false;

  if (route.query.create) {
    void router.replace({ path: route.path, query: { ...route.query, create: undefined } });
  }
};

const requestDeletion = async (id: string, reason: string) => {
  await store.requestDeletion(id, reason);
};

const approveDeletion = async (id: string) => {
  await store.approveDeletion(id);
};

const rejectDeletion = async (id: string) => {
  await store.rejectDeletion(id);
};

const openEdit = (debt: Debt) => {
  selectedDebt.value = debt;
  editVisible.value = true;
};

const saveDebt = async (id: string, input: DebtEditInput) => {
  editSaving.value = true;

  try {
    await store.updateDebt(id, input);
    editVisible.value = false;
    selectedDebt.value = null;
  } finally {
    editSaving.value = false;
  }
};

const openPaidMailDialog = (debt: Debt) => {
  paidDebtTarget.value = debt;
  paidMailDialogVisible.value = true;
};

const closePaidMailDialog = () => {
  paidMailDialogVisible.value = false;
  paidDebtTarget.value = null;
};

const markDebtAsPaid = async (notifyDebtor: boolean) => {
  if (!paidDebtTarget.value) {
    return;
  }

  await store.markPaid(paidDebtTarget.value.id, { notifyDebtor });
  closePaidMailDialog();
};

const deleteOwnDebt = async (debt: Debt) => {
  const shouldDelete = window.confirm(
    `Soll die Schuld "${debt.purpose}" wirklich gelöscht werden?`,
  );

  if (!shouldDelete) {
    return;
  }

  await store.deleteDebt(debt.id);
};

const sendReminder = async (debt: Debt) => {
  remindingDebtIds.value = new Set(remindingDebtIds.value).add(debt.id);

  try {
    await store.sendReminder(debt.id);
    toast.add({
      severity: "success",
      summary: "Erinnerung gesendet",
      detail: `Erinnerungsmail an ${debt.debtorName} wurde gesendet.`,
      life: 3500,
    });
  } catch (error) {
    toast.add({
      severity: "error",
      summary: "Versand fehlgeschlagen",
      detail:
        error instanceof Error ? error.message : "Erinnerungsmail konnte nicht gesendet werden.",
      life: 4500,
    });
  } finally {
    const nextIds = new Set(remindingDebtIds.value);
    nextIds.delete(debt.id);
    remindingDebtIds.value = nextIds;
  }
};

onMounted(() => {
  void store.fetchDebts();

  if (route.query.create === "1") {
    formVisible.value = true;
  }
});
</script>

<template>
  <section class="grid min-w-0 max-w-full gap-6">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p class="text-sm font-medium uppercase tracking-wide text-indigo-700">Schulden</p>
        <h1 class="mt-1 text-3xl font-semibold text-slate-950">Schulden</h1>
      </div>
      <Button
        class="mobile-icon-button"
        icon="pi pi-plus"
        label="Schuld eintragen"
        title="Schuld eintragen"
        aria-label="Schuld eintragen"
        @click="openCreateDialog"
      />
    </div>

    <Dialog
      v-model:visible="formVisible"
      modal
      header="Neue Schuld"
      class="w-[calc(100vw-2rem)] max-w-lg"
      @hide="closeCreateDialog"
    >
      <DebtForm
        :known-debtors="knownDebtors"
        :known-categories="knownCategories"
        :saving="saving"
        @submit="submitDebt"
      />
    </Dialog>
    <DebtEditDialog
      v-model:visible="editVisible"
      :debt="selectedDebt"
      :known-categories="knownCategories"
      :saving="editSaving"
      @save="saveDebt"
    />
    <Dialog
      v-model:visible="paidMailDialogVisible"
      modal
      header="Schuld als bezahlt markieren"
      :style="{ width: 'min(92vw, 28rem)' }"
      @hide="closePaidMailDialog"
    >
      <div class="grid gap-4">
        <p class="text-sm text-stone-600">
          Soll die Schuld
          <strong>{{ paidDebtTarget?.purpose }}</strong>
          als bezahlt markiert werden und der Schuldner eine Info-Mail erhalten?
        </p>
        <div class="flex flex-wrap justify-end gap-2">
          <Button
            type="button"
            severity="secondary"
            label="Ohne Mail"
            icon="pi pi-times"
            @click="markDebtAsPaid(false)"
          />
          <Button
            type="button"
            severity="success"
            label="Mail senden"
            icon="pi pi-envelope"
            @click="markDebtAsPaid(true)"
          />
        </div>
      </div>
    </Dialog>
    <Card v-if="!store.loading && !store.error && !hasDebtEntries">
      <template #content>
        <div class="flex flex-col items-center px-4 py-10 text-center">
          <div class="grid size-12 place-items-center rounded-full bg-indigo-50 text-indigo-700">
            <i class="pi pi-receipt text-xl" aria-hidden="true" />
          </div>
          <h2 class="mt-4 text-xl font-semibold text-slate-950">Noch keine Schulden vorhanden</h2>
          <p class="mt-2 max-w-md text-sm text-stone-500">
            Trage deine erste Schuld ein. Danach zeigt die Seite nur die Bereiche an, in denen auch
            wirklich Einträge vorhanden sind.
          </p>
          <Button
            class="mt-5"
            icon="pi pi-plus"
            label="Schuld eintragen"
            @click="openCreateDialog"
          />
        </div>
      </template>
    </Card>

    <Card v-if="openOwedToMe.length || store.error">
      <template #title>Offene Schulden an mich</template>
      <template #content>
        <p v-if="store.error" class="mb-4 text-rose-700">{{ store.error }}</p>
        <DebtorSummaryCards :summaries="openDebtorSummaries" />
        <div class="grid gap-3 md:hidden">
          <article
            v-for="debt in openOwedToMe"
            :key="debt.id"
            class="rounded-md border border-stone-200 px-4 py-3"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <p class="font-semibold text-stone-900">{{ debt.debtorName }}</p>
                <p class="break-all text-xs text-stone-500">{{ debt.debtorEmail }}</p>
              </div>
              <p class="shrink-0 font-semibold text-sky-800">
                {{ currency.format(debt.amount) }}
              </p>
            </div>
            <p class="mt-2 text-sm text-stone-700">{{ debt.purpose }}</p>
            <p v-if="debt.comment" class="mt-1 text-sm text-stone-500">{{ debt.comment }}</p>
            <p class="text-xs text-stone-500">
              {{ debt.category }} · {{ formatDate(debt.debtDate) }}
            </p>
            <div
              v-if="hasOpenOwedToMeDeletionRequests && debt.deletionStatus === 'PENDING'"
              class="mt-3"
            >
              <DebtDeletionReviewCell
                :debt="debt"
                show-actions
                @approve="approveDeletion"
                @reject="rejectDeletion"
              />
            </div>
            <div class="mt-3 flex justify-end gap-2">
              <Button
                class="mobile-icon-button"
                icon="pi pi-envelope"
                label="Erinnern"
                size="small"
                severity="secondary"
                title="Erinnerungsmail senden"
                aria-label="Erinnerungsmail senden"
                :loading="remindingDebtIds.has(debt.id)"
                @click="sendReminder(debt)"
              />
              <Button
                class="mobile-icon-button"
                icon="pi pi-pencil"
                label="Bearbeiten"
                size="small"
                severity="secondary"
                title="Bearbeiten"
                aria-label="Bearbeiten"
                @click="openEdit(debt)"
              />
              <Button
                class="mobile-icon-button"
                icon="pi pi-trash"
                label="Löschen"
                size="small"
                severity="danger"
                title="Löschen"
                aria-label="Löschen"
                @click="deleteOwnDebt(debt)"
              />
              <Button
                class="mobile-icon-button"
                icon="pi pi-check"
                label="Bezahlt"
                size="small"
                severity="success"
                title="Als bezahlt markieren"
                aria-label="Als bezahlt markieren"
                @click="openPaidMailDialog(debt)"
              />
            </div>
          </article>
        </div>
        <div class="hidden overflow-x-auto md:block">
          <table class="w-full min-w-[980px] table-fixed border-collapse text-left text-sm">
            <colgroup>
              <col class="w-[18rem]" />
              <col class="w-[20rem]" />
              <col class="w-[11rem]" />
              <col class="w-[10rem]" />
              <col class="w-[10rem]" />
              <col v-if="hasOpenOwedToMeDeletionRequests" class="w-[14rem]" />
              <col class="w-[14rem]" />
            </colgroup>
            <thead>
              <tr class="border-b border-stone-200 text-stone-500">
                <th class="py-3 pr-4 font-medium">Schuldner</th>
                <th class="py-3 pr-4 font-medium">Zweck</th>
                <th class="py-3 pr-4 font-medium">Kategorie</th>
                <th class="py-3 pr-4 font-medium">Datum</th>
                <th class="py-3 pr-4 text-right font-medium">Betrag</th>
                <th v-if="hasOpenOwedToMeDeletionRequests" class="py-3 pr-4 font-medium">
                  Löschantrag
                </th>
                <th class="py-3 pr-4 text-right font-medium">Aktion</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="debt in openOwedToMe" :key="debt.id" class="border-b border-stone-100">
                <td class="py-3 pr-4">
                  <p class="truncate font-medium text-stone-900">{{ debt.debtorName }}</p>
                  <p class="text-xs text-stone-500">{{ debt.debtorEmail }}</p>
                </td>
                <td class="py-3 pr-4">
                  <p class="truncate">{{ debt.purpose }}</p>
                  <p v-if="debt.comment" class="mt-1 truncate text-xs text-stone-500">
                    {{ debt.comment }}
                  </p>
                </td>
                <td class="py-3 pr-4">{{ debt.category }}</td>
                <td class="py-3 pr-4">{{ formatDate(debt.debtDate) }}</td>
                <td class="py-3 pr-4 text-right font-semibold text-sky-800">
                  {{ currency.format(debt.amount) }}
                </td>
                <td v-if="hasOpenOwedToMeDeletionRequests" class="py-3 pr-4">
                  <DebtDeletionReviewCell
                    :debt="debt"
                    show-actions
                    @approve="approveDeletion"
                    @reject="rejectDeletion"
                  />
                </td>
                <td class="py-3 pr-4 text-right">
                  <div class="flex justify-end gap-2">
                    <Button
                      class="icon-action-button"
                      icon="pi pi-envelope"
                      label="Erinnern"
                      size="small"
                      severity="secondary"
                      title="Erinnerungsmail senden"
                      aria-label="Erinnerungsmail senden"
                      :loading="remindingDebtIds.has(debt.id)"
                      @click="sendReminder(debt)"
                    />
                    <Button
                      class="icon-action-button"
                      icon="pi pi-pencil"
                      label="Bearbeiten"
                      size="small"
                      severity="secondary"
                      title="Bearbeiten"
                      aria-label="Bearbeiten"
                      @click="openEdit(debt)"
                    />
                    <Button
                      class="icon-action-button"
                      icon="pi pi-trash"
                      label="Löschen"
                      size="small"
                      severity="danger"
                      title="Löschen"
                      aria-label="Löschen"
                      @click="deleteOwnDebt(debt)"
                    />
                    <Button
                      class="icon-action-button"
                      icon="pi pi-check"
                      label="Bezahlt"
                      size="small"
                      severity="success"
                      title="Als bezahlt markieren"
                      aria-label="Als bezahlt markieren"
                      @click="openPaidMailDialog(debt)"
                    />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
    </Card>

    <Card v-if="openIOweGroups.length">
      <template #title>Ich schulde</template>
      <template #content>
        <Tabs v-model:value="openIOweActiveCategory">
          <TabList class="flex flex-wrap gap-2 border-b border-stone-200 pb-3">
            <Tab v-for="group in openIOweGroups" :key="group.category" :value="group.category">
              {{ group.category }}
            </Tab>
          </TabList>
          <TabPanels>
            <TabPanel
              v-for="group in openIOweGroups"
              :key="group.category"
              :value="group.category"
              class="pt-4"
            >
              <div class="mb-4 flex items-center justify-between gap-3">
                <p class="text-sm text-stone-500">
                  {{ group.count }} {{ group.count === 1 ? "Eintrag" : "Einträge" }}
                </p>
                <p class="text-sm font-semibold text-rose-700">
                  {{ currency.format(group.total) }}
                </p>
              </div>
              <div class="grid gap-3 md:hidden">
                <article
                  v-for="debt in group.debts"
                  :key="debt.id"
                  class="rounded-md border border-stone-200 px-4 py-3"
                >
                  <div class="flex items-start justify-between gap-3">
                    <div class="min-w-0">
                      <p class="font-semibold text-stone-900">{{ debt.creator.name }}</p>
                      <p class="break-all text-xs text-stone-500">{{ debt.creator.email }}</p>
                    </div>
                    <p class="shrink-0 font-semibold text-rose-700">
                      {{ currency.format(debt.amount) }}
                    </p>
                  </div>
                  <p class="mt-2 text-sm text-stone-700">{{ debt.purpose }}</p>
                  <p v-if="debt.comment" class="mt-1 text-sm text-stone-500">{{ debt.comment }}</p>
                  <p class="text-xs text-stone-500">{{ debt.category }}</p>
                  <div class="mt-3">
                    <DebtDeletionRequestCell
                      :debt-id="debt.id"
                      :status="debt.deletionStatus"
                      :reason="debt.deletionReason"
                      @request="requestDeletion"
                    />
                  </div>
                </article>
              </div>
              <div class="hidden overflow-x-auto md:block">
                <DataTable
                  :value="group.debts"
                  data-key="id"
                  row-hover
                  size="small"
                  striped-rows
                  table-style="table-layout: fixed; width: 100%;"
                >
                  <Column header="Gläubiger" header-style="width: 18rem" body-style="width: 18rem">
                    <template #body="{ data }">
                      <p class="truncate font-medium text-stone-900">{{ data.creator.name }}</p>
                      <p class="text-xs text-stone-500">{{ data.creator.email }}</p>
                    </template>
                  </Column>
                  <Column header="Wofür" header-style="width: 20rem" body-style="width: 20rem">
                    <template #body="{ data }">
                      <p class="truncate">{{ data.purpose }}</p>
                      <p v-if="data.comment" class="mt-1 truncate text-xs text-stone-500">
                        {{ data.comment }}
                      </p>
                    </template>
                  </Column>
                  <Column
                    header="Betrag"
                    body-class="text-right"
                    header-style="width: 10rem"
                    body-style="width: 10rem"
                  >
                    <template #body="{ data }">
                      <span class="font-semibold text-rose-700">{{
                        currency.format(data.amount)
                      }}</span>
                    </template>
                  </Column>
                  <Column header="Löschung" header-style="width: 12rem" body-style="width: 12rem">
                    <template #body="{ data }">
                      <DebtDeletionRequestCell
                        :debt-id="data.id"
                        :status="data.deletionStatus"
                        :reason="data.deletionReason"
                        @request="requestDeletion"
                      />
                    </template>
                  </Column>
                </DataTable>
              </div>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </template>
    </Card>

    <Card v-if="paidIOwe.length">
      <template #title>Von mir bezahlt</template>
      <template #content>
        <div class="grid gap-3 md:hidden">
          <article
            v-for="debt in paidIOwe"
            :key="debt.id"
            class="rounded-md border border-stone-200 px-4 py-3"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <p class="font-semibold text-stone-900">{{ debt.creator.name }}</p>
                <p class="break-all text-xs text-stone-500">{{ debt.creator.email }}</p>
              </div>
              <p class="shrink-0 font-semibold text-stone-700">
                {{ currency.format(debt.amount) }}
              </p>
            </div>
            <p class="mt-2 text-sm text-stone-700">{{ debt.purpose }}</p>
            <p v-if="debt.comment" class="mt-1 text-sm text-stone-500">{{ debt.comment }}</p>
            <p class="text-xs text-stone-500">
              {{ debt.category }} · bezahlt am {{ formatDate(debt.paidAt) }}
            </p>
          </article>
        </div>
        <div class="hidden overflow-x-auto md:block">
          <table class="w-full min-w-[760px] table-fixed border-collapse text-left text-sm">
            <colgroup>
              <col class="w-[18rem]" />
              <col class="w-[18rem]" />
              <col class="w-[10rem]" />
              <col class="w-[10rem]" />
              <col class="w-[10rem]" />
            </colgroup>
            <thead>
              <tr class="border-b border-stone-200 text-stone-500">
                <th class="py-3 pr-4 font-medium">Gläubiger</th>
                <th class="py-3 pr-4 font-medium">Wofür</th>
                <th class="py-3 pr-4 font-medium">Kategorie</th>
                <th class="py-3 pr-4 font-medium">Bezahlt am</th>
                <th class="py-3 pr-4 text-right font-medium">Betrag</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="debt in paidIOwe" :key="debt.id" class="border-b border-stone-100">
                <td class="py-3 pr-4">
                  <p class="truncate font-medium text-stone-900">{{ debt.creator.name }}</p>
                  <p class="text-xs text-stone-500">{{ debt.creator.email }}</p>
                </td>
                <td class="py-3 pr-4">
                  <p class="truncate">{{ debt.purpose }}</p>
                  <p v-if="debt.comment" class="mt-1 truncate text-xs text-stone-500">
                    {{ debt.comment }}
                  </p>
                </td>
                <td class="py-3 pr-4">{{ debt.category }}</td>
                <td class="py-3 pr-4">{{ formatDate(debt.paidAt) }}</td>
                <td class="py-3 pr-4 text-right font-semibold text-stone-700">
                  {{ currency.format(debt.amount) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
    </Card>

    <Card v-if="paidOwedToMeGroups.length">
      <template #title>Bezahlte Schulden</template>
      <template #content>
        <Tabs v-model:value="paidOwedToMeActiveDebtor">
          <TabList class="flex flex-wrap gap-2 border-b border-stone-200 pb-3">
            <Tab
              v-for="group in paidOwedToMeGroups"
              :key="group.debtorEmail"
              :value="group.debtorEmail"
            >
              {{ group.debtorName }}
            </Tab>
          </TabList>
          <TabPanels>
            <TabPanel
              v-for="group in paidOwedToMeGroups"
              :key="group.debtorEmail"
              :value="group.debtorEmail"
              class="pt-4"
            >
              <div class="mb-4 flex items-center justify-between gap-3">
                <div class="min-w-0">
                  <p class="font-semibold text-stone-900">{{ group.debtorName }}</p>
                  <p class="break-all text-xs text-stone-500">{{ group.debtorEmail }}</p>
                </div>
                <div class="text-right">
                  <p class="text-sm text-stone-500">
                    {{ group.count }} {{ group.count === 1 ? "Eintrag" : "Einträge" }}
                  </p>
                  <p class="text-sm font-semibold text-sky-700">
                    {{ currency.format(group.total) }}
                  </p>
                </div>
              </div>
              <div class="grid gap-3 md:hidden">
                <article
                  v-for="debt in group.debts"
                  :key="debt.id"
                  class="min-h-28 rounded-md border border-stone-200 px-4 py-3"
                >
                  <div class="flex items-start justify-between gap-3">
                    <p class="min-w-0 truncate text-sm font-medium text-stone-800">
                      {{ debt.purpose }}
                    </p>
                    <p class="shrink-0 font-semibold text-stone-800">
                      {{ currency.format(debt.amount) }}
                    </p>
                  </div>
                  <p v-if="debt.comment" class="mt-1 truncate text-sm text-stone-500">
                    {{ debt.comment }}
                  </p>
                  <p class="text-xs text-stone-500">bezahlt am {{ formatDate(debt.paidAt) }}</p>
                  <div class="mt-3 flex justify-end gap-2">
                    <Button
                      class="mobile-icon-button"
                      icon="pi pi-pencil"
                      label="Bearbeiten"
                      size="small"
                      severity="secondary"
                      title="Eintrag bearbeiten"
                      aria-label="Eintrag bearbeiten"
                      @click="openEdit(debt)"
                    />
                  </div>
                  <div
                    v-if="hasPaidOwedToMeDeletionRequests && debt.deletionStatus === 'PENDING'"
                    class="mt-3"
                  >
                    <DebtDeletionReviewCell
                      :debt="debt"
                      show-actions
                      @approve="approveDeletion"
                      @reject="rejectDeletion"
                    />
                  </div>
                </article>
              </div>
              <div class="hidden overflow-x-auto md:block">
                <DataTable
                  :value="group.debts"
                  data-key="id"
                  row-hover
                  size="small"
                  striped-rows
                  table-style="table-layout: fixed; width: 100%;"
                >
                  <Column header="Zweck" header-style="width: 20rem" body-style="width: 20rem">
                    <template #body="{ data }">
                      <div class="flex h-14 flex-col justify-center gap-0.5 overflow-hidden">
                        <p class="truncate">{{ data.purpose }}</p>
                        <p v-if="data.comment" class="truncate text-xs text-stone-500">
                          {{ data.comment }}
                        </p>
                      </div>
                    </template>
                  </Column>
                  <Column header="Bezahlt" header-style="width: 10rem" body-style="width: 10rem">
                    <template #body="{ data }">
                      {{ formatDate(data.paidAt) }}
                    </template>
                  </Column>
                  <Column
                    header="Betrag"
                    body-class="text-right"
                    header-style="width: 10rem"
                    body-style="width: 10rem"
                  >
                    <template #body="{ data }">
                      <span class="font-semibold text-stone-700">{{
                        currency.format(data.amount)
                      }}</span>
                    </template>
                  </Column>
                  <Column
                    header="Aktion"
                    body-class="text-right"
                    header-style="width: 12rem"
                    body-style="width: 12rem"
                  >
                    <template #body="{ data }">
                      <Button
                        class="icon-action-button"
                        icon="pi pi-pencil"
                        label="Bearbeiten"
                        size="small"
                        severity="secondary"
                        title="Eintrag bearbeiten"
                        aria-label="Eintrag bearbeiten"
                        @click="openEdit(data)"
                      />
                    </template>
                  </Column>
                  <Column
                    v-if="hasPaidOwedToMeDeletionRequests"
                    header="Löschantrag"
                    header-style="width: 12rem"
                    body-style="width: 12rem"
                  >
                    <template #body="{ data }">
                      <DebtDeletionReviewCell
                        :debt="data"
                        show-actions
                        @approve="approveDeletion"
                        @reject="rejectDeletion"
                      />
                    </template>
                  </Column>
                </DataTable>
              </div>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </template>
    </Card>
  </section>
</template>
