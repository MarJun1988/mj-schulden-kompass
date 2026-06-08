<script setup lang="ts">
import Button from "primevue/button";
import Card from "primevue/card";
import Dialog from "primevue/dialog";
import { computed, onMounted, ref } from "vue";
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

const store = useDebtsStore();
const route = useRoute();
const router = useRouter();
const saving = ref(false);
const formVisible = ref(false);
const editSaving = ref(false);
const editVisible = ref(false);
const selectedDebt = ref<Debt | null>(null);
const categoryExamples = ["Konzert", "Klamotten", "Essen", "Reise", "Sonstiges"];

const openOwedToMe = computed(() => store.owedToMe.filter((debt) => !debt.isPaid));
const paidOwedToMe = computed(() => store.owedToMe.filter((debt) => debt.isPaid));
const openIOwe = computed(() => store.iOwe.filter((debt) => !debt.isPaid));
const paidIOwe = computed(() => store.iOwe.filter((debt) => debt.isPaid));
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

const deleteOwnDebt = async (debt: Debt) => {
  const shouldDelete = window.confirm(
    `Soll die Schuld "${debt.purpose}" wirklich gelöscht werden?`,
  );

  if (!shouldDelete) {
    return;
  }

  await store.deleteDebt(debt.id);
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
                @click="store.markPaid(debt.id)"
              />
            </div>
          </article>
        </div>
        <div class="hidden overflow-x-auto md:block">
          <table class="w-full min-w-[720px] border-collapse text-left text-sm">
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
                  <p class="font-medium text-stone-900">{{ debt.debtorName }}</p>
                  <p class="text-xs text-stone-500">{{ debt.debtorEmail }}</p>
                </td>
                <td class="py-3 pr-4">
                  <p>{{ debt.purpose }}</p>
                  <p v-if="debt.comment" class="mt-1 text-xs text-stone-500">
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
                      @click="store.markPaid(debt.id)"
                    />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
    </Card>

    <Card v-if="openIOwe.length">
      <template #title>Ich schulde</template>
      <template #content>
        <div class="grid gap-3 md:hidden">
          <article
            v-for="debt in openIOwe"
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
          <table class="w-full min-w-[620px] border-collapse text-left text-sm">
            <thead>
              <tr class="border-b border-stone-200 text-stone-500">
                <th class="py-3 pr-4 font-medium">Gläubiger</th>
                <th class="py-3 pr-4 font-medium">Wofür</th>
                <th class="py-3 pr-4 font-medium">Kategorie</th>
                <th class="py-3 pr-4 text-right font-medium">Betrag</th>
                <th class="py-3 pr-4 font-medium">Löschung</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="debt in openIOwe" :key="debt.id" class="border-b border-stone-100">
                <td class="py-3 pr-4">
                  <p class="font-medium text-stone-900">{{ debt.creator.name }}</p>
                  <p class="text-xs text-stone-500">{{ debt.creator.email }}</p>
                </td>
                <td class="py-3 pr-4">
                  <p>{{ debt.purpose }}</p>
                  <p v-if="debt.comment" class="mt-1 text-xs text-stone-500">
                    {{ debt.comment }}
                  </p>
                </td>
                <td class="py-3 pr-4">{{ debt.category }}</td>
                <td class="py-3 pr-4 text-right font-semibold text-rose-700">
                  {{ currency.format(debt.amount) }}
                </td>
                <td class="py-3 pr-4">
                  <DebtDeletionRequestCell
                    :debt-id="debt.id"
                    :status="debt.deletionStatus"
                    :reason="debt.deletionReason"
                    @request="requestDeletion"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
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
          <table class="w-full min-w-[600px] border-collapse text-left text-sm">
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
                  <p class="font-medium text-stone-900">{{ debt.creator.name }}</p>
                  <p class="text-xs text-stone-500">{{ debt.creator.email }}</p>
                </td>
                <td class="py-3 pr-4">
                  <p>{{ debt.purpose }}</p>
                  <p v-if="debt.comment" class="mt-1 text-xs text-stone-500">
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
        <div class="grid gap-3 md:hidden">
          <section
            v-for="group in paidOwedToMeGroups"
            :key="group.debtorEmail"
            class="overflow-hidden rounded-md border border-stone-200"
          >
            <div class="border-b border-stone-200 bg-stone-50 px-5 py-4">
              <p class="font-semibold text-stone-900">{{ group.debtorName }}</p>
              <p class="break-all text-xs text-stone-500">{{ group.debtorEmail }}</p>
            </div>
            <article
              v-for="debt in group.debts"
              :key="debt.id"
              class="border-b border-stone-100 px-4 py-3 last:border-b-0"
            >
              <div class="flex items-start justify-between gap-3">
                <p class="min-w-0 text-sm font-medium text-stone-800">{{ debt.purpose }}</p>
                <p class="shrink-0 font-semibold text-stone-800">
                  {{ currency.format(debt.amount) }}
                </p>
              </div>
              <p v-if="debt.comment" class="mt-1 text-sm text-stone-500">{{ debt.comment }}</p>
              <p class="text-xs text-stone-500">bezahlt am {{ formatDate(debt.paidAt) }}</p>
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
            <div
              class="flex items-center justify-between gap-3 border-t border-sky-200 bg-sky-50 px-4 py-3 text-sm"
            >
              <span class="font-medium text-sky-900">
                Summe · {{ group.count }} {{ group.count === 1 ? "Eintrag" : "Einträge" }}
              </span>
              <span class="shrink-0 font-semibold text-sky-950">
                {{ currency.format(group.total) }}
              </span>
            </div>
          </section>
        </div>
        <div class="hidden overflow-x-auto md:block">
          <table class="w-full min-w-[640px] border-collapse text-left text-sm">
            <thead>
              <tr class="border-b border-stone-200 text-stone-500">
                <th class="py-3 pl-5 pr-5 font-medium">Schuldner</th>
                <th class="py-3 pr-4 font-medium">Zweck</th>
                <th class="py-3 pr-4 font-medium">Bezahlt</th>
                <th class="py-3 pr-4 text-right font-medium">Betrag</th>
                <th v-if="hasPaidOwedToMeDeletionRequests" class="py-3 pr-4 font-medium">
                  Löschantrag
                </th>
              </tr>
            </thead>
            <tbody>
              <template v-for="group in paidOwedToMeGroups" :key="group.debtorEmail">
                <tr class="border-b border-stone-200 bg-stone-50 text-stone-700">
                  <td class="px-5 py-4" :colspan="hasPaidOwedToMeDeletionRequests ? 5 : 4">
                    <div class="flex min-w-0 flex-col gap-0.5">
                      <p class="font-semibold text-stone-900">{{ group.debtorName }}</p>
                      <p class="break-all text-xs text-stone-500">{{ group.debtorEmail }}</p>
                    </div>
                  </td>
                </tr>
                <tr v-for="debt in group.debts" :key="debt.id" class="border-b border-stone-100">
                  <td class="w-8 py-3 pl-5 pr-3"></td>
                  <td class="py-3 pr-4">
                    <p>{{ debt.purpose }}</p>
                    <p v-if="debt.comment" class="mt-1 text-xs text-stone-500">
                      {{ debt.comment }}
                    </p>
                  </td>
                  <td class="py-3 pr-4">{{ formatDate(debt.paidAt) }}</td>
                  <td class="py-3 pr-4 text-right font-semibold">
                    {{ currency.format(debt.amount) }}
                  </td>
                  <td v-if="hasPaidOwedToMeDeletionRequests" class="py-3 pr-4">
                    <DebtDeletionReviewCell
                      :debt="debt"
                      show-actions
                      @approve="approveDeletion"
                      @reject="rejectDeletion"
                    />
                  </td>
                </tr>
                <tr class="border-b border-sky-200 bg-sky-50">
                  <td class="py-3 pl-5 pr-4 font-medium text-sky-900" colspan="3">
                    Summe · {{ group.count }} {{ group.count === 1 ? "Eintrag" : "Einträge" }}
                  </td>
                  <td class="py-3 pr-4 text-right font-semibold text-sky-950">
                    {{ currency.format(group.total) }}
                  </td>
                  <td v-if="hasPaidOwedToMeDeletionRequests" class="py-3 pr-4"></td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </template>
    </Card>
  </section>
</template>
