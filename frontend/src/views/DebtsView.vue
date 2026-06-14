<script setup lang="ts">
import Button from "primevue/button";
import Card from "primevue/card";
import Column from "primevue/column";
import Dialog from "primevue/dialog";
import DataTable from "primevue/datatable";
import Menu from "primevue/menu";
import Tab from "primevue/tab";
import TabList from "primevue/tablist";
import TabPanel from "primevue/tabpanel";
import TabPanels from "primevue/tabpanels";
import Tabs from "primevue/tabs";
import { useToast } from "primevue/usetoast";
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

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
const openOwedActionMenu = ref<InstanceType<typeof Menu> | null>(null);
const selectedOpenOwedActionDebt = ref<Debt | null>(null);
const openIOweActionMenu = ref<InstanceType<typeof Menu> | null>(null);
const selectedOpenIOweActionDebt = ref<Debt | null>(null);
const paidActionMenu = ref<InstanceType<typeof Menu> | null>(null);
const selectedPaidActionDebt = ref<Debt | null>(null);
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

const openOpenOwedActions = (debt: Debt, event: Event) => {
  selectedOpenOwedActionDebt.value = debt;
  openOwedActionMenu.value?.toggle(event);
};

const closeOpenOwedActions = () => {
  selectedOpenOwedActionDebt.value = null;
};

const openOwedActionItems = computed(() => [
  {
    label: "Erinnern",
    icon: "pi pi-envelope",
    command: () => {
      if (!selectedOpenOwedActionDebt.value) {
        return;
      }

      void sendReminder(selectedOpenOwedActionDebt.value);
      closeOpenOwedActions();
    },
  },
  {
    label: "Bearbeiten",
    icon: "pi pi-pencil",
    command: () => {
      if (!selectedOpenOwedActionDebt.value) {
        return;
      }

      openEdit(selectedOpenOwedActionDebt.value);
      closeOpenOwedActions();
    },
  },
  {
    label: "Löschen",
    icon: "pi pi-trash",
    command: () => {
      if (!selectedOpenOwedActionDebt.value) {
        return;
      }

      void deleteOwnDebt(selectedOpenOwedActionDebt.value);
      closeOpenOwedActions();
    },
  },
  {
    label: "Bezahlt",
    icon: "pi pi-check",
    command: () => {
      if (!selectedOpenOwedActionDebt.value) {
        return;
      }

      openPaidMailDialog(selectedOpenOwedActionDebt.value);
      closeOpenOwedActions();
    },
  },
]);

const openOpenIOweActions = (debt: Debt, event: Event) => {
  selectedOpenIOweActionDebt.value = debt;
  openIOweActionMenu.value?.toggle(event);
};

const closeOpenIOweActions = () => {
  selectedOpenIOweActionDebt.value = null;
};

const openIOweActionItems = computed(() => [
  {
    label: "Bearbeiten",
    icon: "pi pi-pencil",
    command: () => {
      if (!selectedOpenIOweActionDebt.value) {
        return;
      }

      openEdit(selectedOpenIOweActionDebt.value);
      closeOpenIOweActions();
    },
  },
  {
    label: "Bezahlt melden",
    icon: "pi pi-check",
    command: () => {
      if (!selectedOpenIOweActionDebt.value) {
        return;
      }

      openPaidMailDialog(selectedOpenIOweActionDebt.value);
      closeOpenIOweActions();
    },
  },
  {
    label: "Löschung beantragen",
    icon: "pi pi-trash",
    command: () => {
      if (!selectedOpenIOweActionDebt.value) {
        return;
      }

      void requestOpenIOweDeletion(selectedOpenIOweActionDebt.value);
      closeOpenIOweActions();
    },
  },
]);

const openPaidActions = (debt: Debt, event: Event) => {
  selectedPaidActionDebt.value = debt;
  paidActionMenu.value?.toggle(event);
};

const closePaidActions = () => {
  selectedPaidActionDebt.value = null;
};

const paidActionItems = computed(() => [
  {
    label: "Bearbeiten",
    icon: "pi pi-pencil",
    command: () => {
      if (!selectedPaidActionDebt.value) {
        return;
      }

      openEdit(selectedPaidActionDebt.value);
      closePaidActions();
    },
  },
]);

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

const requestOpenIOweDeletion = async (debt: Debt) => {
  const reason = window.prompt("Bitte einen Grund für den Löschantrag eingeben:");

  if (!reason?.trim()) {
    return;
  }

  await requestDeletion(debt.id, reason.trim());
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
        form-id="debt-create-form"
        :known-debtors="knownDebtors"
        :known-categories="knownCategories"
        :saving="saving"
        @submit="submitDebt"
      />
      <template #footer>
        <div class="mt-3 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" severity="secondary" label="Abbrechen" @click="closeCreateDialog" />
          <Button
            type="submit"
            form="debt-create-form"
            :loading="saving"
            :disabled="saving"
            label="Schuld speichern"
            icon="pi pi-check"
          />
        </div>
      </template>
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
    <Menu
      ref="openOwedActionMenu"
      :model="openOwedActionItems"
      popup
      @hide="closeOpenOwedActions"
    />
    <Menu
      ref="openIOweActionMenu"
      :model="openIOweActionItems"
      popup
      @hide="closeOpenIOweActions"
    />
    <Menu ref="paidActionMenu" :model="paidActionItems" popup @hide="closePaidActions" />
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
                icon="pi pi-ellipsis-v"
                label="Aktionen"
                size="small"
                severity="secondary"
                title="Aktionen"
                aria-label="Aktionen"
                @click="openOpenOwedActions(debt, $event)"
              />
            </div>
          </article>
        </div>
        <div class="hidden md:block">
          <table class="w-full table-fixed border-collapse text-left text-sm">
            <thead>
              <tr class="border-b border-stone-200 text-stone-500">
                <th class="w-64 py-3 pr-4 font-medium">Schuldner</th>
                <th class="w-28 py-3 pr-4 text-right font-medium">Betrag</th>
                <th class="w-32 py-3 pr-4 font-medium">Kategorie</th>
                <th class="py-3 pr-4 font-medium">Wofür</th>
                <th class="w-32 py-3 pr-4 font-medium">Datum</th>
                <th v-if="hasOpenOwedToMeDeletionRequests" class="w-48 py-3 pr-4 font-medium">
                  Löschantrag
                </th>
                <th class="w-16 py-3 text-right font-medium">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="debt in openOwedToMe" :key="debt.id" class="border-b border-stone-100">
                <td class="py-3 pr-4 align-top">
                  <p class="font-medium text-stone-900">{{ debt.debtorName }}</p>
                  <p class="text-xs text-stone-500">{{ debt.debtorEmail }}</p>
                </td>
                <td class="py-3 pr-4 text-right align-top font-semibold text-sky-800">
                  <span class="whitespace-nowrap">{{ currency.format(debt.amount) }}</span>
                </td>
                <td class="py-3 pr-4 align-top">
                  <span class="whitespace-nowrap">{{ debt.category }}</span>
                </td>
                <td class="py-3 pr-4 align-top">
                  <div class="flex min-h-10 flex-col justify-center overflow-hidden py-1">
                    <p class="truncate leading-5">{{ debt.purpose }}</p>
                    <p v-if="debt.comment" class="truncate text-xs leading-4 text-stone-500">
                      {{ debt.comment }}
                    </p>
                  </div>
                </td>
                <td class="py-3 pr-4 align-top">
                  <span class="whitespace-nowrap">{{ formatDate(debt.debtDate) }}</span>
                </td>
                <td v-if="hasOpenOwedToMeDeletionRequests" class="py-3 pr-4 align-top">
                  <DebtDeletionReviewCell
                    :debt="debt"
                    show-actions
                    @approve="approveDeletion"
                    @reject="rejectDeletion"
                  />
                </td>
                <td class="py-3 text-right align-top">
                  <div class="flex justify-end gap-2">
                    <Button
                      class="icon-action-button"
                      icon="pi pi-ellipsis-v"
                      label="Aktionen"
                      size="small"
                      severity="secondary"
                      title="Aktionen"
                      aria-label="Aktionen"
                      @click="openOpenOwedActions(debt, $event)"
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
                    <Button
                      class="mobile-icon-button"
                      icon="pi pi-ellipsis-v"
                      label="Aktionen"
                      size="small"
                      severity="secondary"
                      title="Aktionen"
                      aria-label="Aktionen"
                      @click="openOpenIOweActions(debt, $event)"
                    />
                  </div>
                </article>
              </div>
              <div class="hidden w-full min-w-0 overflow-hidden md:block">
                <DataTable
                  class="w-full min-w-0"
                  :value="group.debts"
                  data-key="id"
                  row-hover
                  size="small"
                  striped-rows
                  tableStyle="width: 100%;"
                >
                  <Column header="Gläubiger" style="width: 14rem">
                    <template #body="{ data }">
                      <p class="font-medium text-stone-900">{{ data.creator.name }}</p>
                      <p class="text-xs text-stone-500">{{ data.creator.email }}</p>
                    </template>
                  </Column>
                  <Column header="Betrag" style="width: 6rem" body-class="text-right">
                    <template #body="{ data }">
                      <span class="whitespace-nowrap font-semibold text-rose-700">{{
                        currency.format(data.amount)
                      }}</span>
                    </template>
                  </Column>
                  <Column header="Wofür">
                    <template #body="{ data }">
                      <div class="flex h-10 flex-col justify-center overflow-hidden py-1">
                        <p class="truncate leading-5">{{ data.purpose }}</p>
                        <p v-if="data.comment" class="truncate text-xs leading-4 text-stone-500">
                          {{ data.comment }}
                        </p>
                      </div>
                    </template>
                  </Column>
                  <Column header="Aktionen" style="width: 4rem" body-class="text-right">
                    <template #body="{ data }">
                      <Button
                        class="icon-action-button"
                        icon="pi pi-ellipsis-v"
                        label="Aktionen"
                        size="small"
                        severity="secondary"
                        title="Aktionen"
                        aria-label="Aktionen"
                        @click="openOpenIOweActions(data, $event)"
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
        <div class="hidden w-full min-w-0 overflow-hidden md:block">
          <DataTable
            class="w-full min-w-0"
            :value="paidIOwe"
            data-key="id"
            row-hover
            size="small"
            striped-rows
            tableStyle="width: 100%;"
          >
            <Column header="Gläubiger" style="width: 14rem">
              <template #body="{ data }">
                <p class="font-medium text-stone-900">{{ data.creator.name }}</p>
                <p class="text-xs text-stone-500">{{ data.creator.email }}</p>
              </template>
            </Column>
            <Column header="Bezahlt am" style="width: 7rem">
              <template #body="{ data }">
                <span class="whitespace-nowrap">{{ formatDate(data.paidAt) }}</span>
              </template>
            </Column>
            <Column header="Betrag" style="width: 6rem" body-class="text-right">
              <template #body="{ data }">
                <span class="whitespace-nowrap font-semibold text-stone-700">{{
                  currency.format(data.amount)
                }}</span>
              </template>
            </Column>
            <Column header="Kategorie" style="width: 7rem">
              <template #body="{ data }">
                <span class="whitespace-nowrap">{{ data.category }}</span>
              </template>
            </Column>
            <Column header="Wofür">
              <template #body="{ data }">
                <div class="flex h-10 flex-col justify-center overflow-hidden py-1">
                  <p class="truncate leading-5">{{ data.purpose }}</p>
                  <p v-if="data.comment" class="truncate text-xs leading-4 text-stone-500">
                    {{ data.comment }}
                  </p>
                </div>
              </template>
            </Column>
            <Column header="Aktionen" style="width: 4rem" body-class="text-right">
              <template #body="{ data }">
                <Button
                  class="icon-action-button"
                  icon="pi pi-ellipsis-v"
                  label="Aktionen"
                  size="small"
                  severity="secondary"
                  title="Aktionen"
                  aria-label="Aktionen"
                  @click="openPaidActions(data, $event)"
                />
              </template>
            </Column>
          </DataTable>
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
                  class="rounded-md border border-stone-200 px-4 py-3"
                >
                  <div class="flex items-start justify-between gap-3">
                    <p class="min-w-0 text-sm font-medium text-stone-800">{{ debt.purpose }}</p>
                    <p class="shrink-0 font-semibold text-stone-800">
                      {{ currency.format(debt.amount) }}
                    </p>
                  </div>
                  <p v-if="debt.comment" class="mt-1 text-sm text-stone-500">{{ debt.comment }}</p>
                  <p class="text-xs text-stone-500">bezahlt am {{ formatDate(debt.paidAt) }}</p>
                  <div class="mt-3 flex justify-end gap-2">
                    <Button
                      class="mobile-icon-button"
                      icon="pi pi-ellipsis-v"
                      label="Aktionen"
                      size="small"
                      severity="secondary"
                      title="Aktionen"
                      aria-label="Aktionen"
                      @click="openPaidActions(debt, $event)"
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
              <div class="hidden w-full min-w-0 overflow-hidden md:block">
                <DataTable
                  class="w-full min-w-0"
                  :value="group.debts"
                  data-key="id"
                  row-hover
                  size="small"
                  striped-rows
                  :row-class="() => 'h-16'"
                  tableStyle="table-layout: fixed; width: 100%;"
                >
                  <Column header="Bezahlt" style="width: 8.5rem">
                    <template #body="{ data }">
                      <span class="whitespace-nowrap">{{ formatDate(data.paidAt) }}</span>
                    </template>
                  </Column>
                  <Column header="Betrag" style="width: 7.5rem" body-class="text-right">
                    <template #body="{ data }">
                      <span class="whitespace-nowrap font-semibold text-stone-700">{{
                        currency.format(data.amount)
                      }}</span>
                    </template>
                  </Column>
                  <Column header="Zweck">
                    <template #body="{ data }">
                      <div class="flex h-10 flex-col justify-center overflow-hidden py-1">
                        <p class="truncate leading-5">{{ data.purpose }}</p>
                        <p v-if="data.comment" class="truncate text-xs leading-4 text-stone-500">
                          {{ data.comment }}
                        </p>
                      </div>
                    </template>
                  </Column>
                  <Column header="Aktion" style="width: 4rem" body-class="text-right">
                    <template #body="{ data }">
                      <Button
                        class="icon-action-button"
                        icon="pi pi-ellipsis-v"
                        label="Aktionen"
                        size="small"
                        severity="secondary"
                        title="Aktionen"
                        aria-label="Aktionen"
                        @click="openPaidActions(data, $event)"
                      />
                    </template>
                  </Column>
                  <Column
                    v-if="hasPaidOwedToMeDeletionRequests"
                    header="Löschantrag"
                    style="width: 12rem"
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
