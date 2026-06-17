<script setup lang="ts">
import Button from "primevue/button";
import Card from "primevue/card";
import Column from "primevue/column";
import DataTable from "primevue/datatable";
import Dialog from "primevue/dialog";
import ProgressSpinner from "primevue/progressspinner";
import { computed, onMounted, ref } from "vue";

import DeletionRequestsPanel from "../components/dashboard/DeletionRequestsPanel.vue";
import PaymentRequestsPanel from "../components/dashboard/PaymentRequestsPanel.vue";
import { currency, formatDate } from "../components/debts/debtFormatters";
import { useAuthStore } from "../stores/auth";
import { useDebtsStore, type DebtCredit } from "../stores/debts";

const store = useDebtsStore();
const auth = useAuthStore();
const selectedCredit = ref<DebtCredit | null>(null);
const creditInfoDialogVisible = ref(false);

const openDebts = computed(() => store.owedToMe.filter((debt) => !debt.isPaid).slice(0, 5));
const debtsIOwe = computed(() => store.iOwe.filter((debt) => !debt.isPaid).slice(0, 5));
const paidDebtsIOwe = computed(() => store.iOwe.filter((debt) => debt.isPaid).slice(0, 5));
const pendingDeletionRequests = computed(() =>
  store.owedToMe.filter((debt) => debt.deletionStatus === "PENDING"),
);
const pendingPaymentRequests = computed(() =>
  store.owedToMe.filter((debt) => debt.paymentStatus === "PENDING"),
);
const debtorCredits = computed(() => {
  const email = auth.user?.email.toLocaleLowerCase("de-DE");

  if (!email) {
    return [];
  }

  return store.credits
    .filter((credit) => credit.debtorEmail.toLocaleLowerCase("de-DE") === email)
    .sort(
      (a, b) =>
        b.balance - a.balance ||
        a.creator.name.localeCompare(b.creator.name) ||
        a.debtorName.localeCompare(b.debtorName),
    );
});
const debtorCreditTotal = computed(() =>
  debtorCredits.value.reduce((sum, credit) => sum + credit.balance, 0),
);
const hasDashboardEntries = computed(
  () =>
    openDebts.value.length > 0 ||
    debtsIOwe.value.length > 0 ||
    paidDebtsIOwe.value.length > 0 ||
    pendingDeletionRequests.value.length > 0 ||
    pendingPaymentRequests.value.length > 0 ||
    debtorCredits.value.length > 0,
);
const iOweOpenAmount = computed(() =>
  store.iOwe.filter((debt) => !debt.isPaid).reduce((sum, debt) => sum + debt.amount, 0),
);
const paidIOweAmount = computed(() =>
  paidDebtsIOwe.value.reduce((sum, debt) => sum + debt.amount, 0),
);

const approveDeletion = async (id: string) => {
  await store.approveDeletion(id);
};

const rejectDeletion = async (id: string) => {
  await store.rejectDeletion(id);
};

const approvePaid = async (id: string) => {
  await store.approvePaid(id);
};

const rejectPaid = async (id: string) => {
  await store.rejectPaid(id);
};

const openCreditInfoDialog = (credit: DebtCredit) => {
  selectedCredit.value = credit;
  creditInfoDialogVisible.value = true;
};

const closeCreditInfoDialog = () => {
  selectedCredit.value = null;
  creditInfoDialogVisible.value = false;
};

onMounted(() => {
  void store.fetchDebts();
});
</script>

<template>
  <section class="grid gap-6">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p class="text-sm font-medium uppercase tracking-wide text-indigo-700">Schulden</p>
        <h1 class="mt-1 text-3xl font-semibold text-slate-950">Dashboard</h1>
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

    <Dialog
      v-model:visible="creditInfoDialogVisible"
      modal
      header="Guthaben-Info"
      :style="{ width: 'min(92vw, 46rem)' }"
      @hide="closeCreditInfoDialog"
    >
      <div v-if="selectedCredit" class="mt-3 grid gap-5">
        <div
          class="grid gap-3 rounded-md border border-stone-200 bg-stone-50 px-3 py-3 sm:grid-cols-3"
        >
          <div>
            <p class="text-xs font-medium uppercase text-stone-500">Von</p>
            <p class="mt-1 truncate text-sm font-semibold text-stone-900">
              {{ selectedCredit.creator.name }}
            </p>
          </div>
          <div>
            <p class="text-xs font-medium uppercase text-stone-500">Für</p>
            <p class="mt-1 truncate text-sm font-semibold text-stone-900">
              {{ selectedCredit.debtorName }}
            </p>
          </div>
          <div class="sm:text-right">
            <p class="text-xs font-medium uppercase text-stone-500">Aktuelles Guthaben</p>
            <p class="mt-1 text-sm font-semibold text-emerald-700">
              {{ currency.format(selectedCredit.balance) }}
            </p>
          </div>
        </div>
        <div class="w-full min-w-0 overflow-x-auto">
          <DataTable
            :value="selectedCredit.entries"
            data-key="id"
            row-hover
            size="small"
            striped-rows
            tableStyle="min-width: 38rem;"
          >
            <Column header="Typ" style="width: 10rem">
              <template #body="{ data }">
                <span
                  :class="[
                    'font-medium',
                    data.type === 'GRANT' ? 'text-emerald-700' : 'text-rose-700',
                  ]"
                >
                  {{ data.type === "GRANT" ? "Erhalten" : "Verwendet" }}
                </span>
              </template>
            </Column>
            <Column header="Datum" style="width: 8rem">
              <template #body="{ data }">
                <span class="whitespace-nowrap">{{ formatDate(data.createdAt) }}</span>
              </template>
            </Column>
            <Column header="Betrag" style="width: 8rem" body-class="text-right">
              <template #body="{ data }">
                <span
                  :class="[
                    'whitespace-nowrap font-semibold',
                    data.type === 'GRANT' ? 'text-emerald-700' : 'text-rose-700',
                  ]"
                >
                  {{ data.type === "GRANT" ? "+" : "-" }}{{ currency.format(data.amount) }}
                </span>
              </template>
            </Column>
            <Column header="Info">
              <template #body="{ data }">
                <p class="truncate text-sm text-stone-600">{{ data.note ?? "-" }}</p>
              </template>
            </Column>
          </DataTable>
        </div>
      </div>
    </Dialog>

    <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      <Card v-if="debtorCredits.length">
        <template #title>Mein Guthaben</template>
        <template #content>
          <p class="text-3xl font-semibold text-emerald-700">
            {{ currency.format(debtorCreditTotal) }}
          </p>
          <div class="mt-3 grid gap-2">
            <div
              v-for="credit in debtorCredits"
              :key="credit.id"
              class="flex items-center justify-between gap-3 rounded-md border border-stone-200 px-3 py-2"
            >
              <div class="min-w-0">
                <p class="truncate text-sm font-medium text-stone-900">{{ credit.creator.name }}</p>
                <p class="text-xs font-semibold text-emerald-700">
                  {{ currency.format(credit.balance) }}
                </p>
              </div>
              <Button
                class="icon-action-button"
                icon="pi pi-info-circle"
                label="Info"
                size="small"
                severity="secondary"
                title="Guthaben-Info"
                aria-label="Guthaben-Info"
                @click="openCreditInfoDialog(credit)"
              />
            </div>
          </div>
        </template>
      </Card>
      <Card v-if="store.summary.openAmount > 0">
        <template #title>Offen</template>
        <template #content>
          <p class="text-3xl font-semibold text-sky-800">
            {{ currency.format(store.summary.openAmount) }}
          </p>
        </template>
      </Card>
      <Card v-if="store.summary.openCount > 0">
        <template #title>Offene Fälle</template>
        <template #content>
          <p class="text-3xl font-semibold text-sky-700">
            {{ store.summary.openCount }}
          </p>
        </template>
      </Card>
      <Card>
        <template #title>Bezahlt</template>
        <template #content>
          <p class="text-3xl font-semibold text-stone-700">
            {{ currency.format(store.summary.paidAmount) }}
          </p>
        </template>
      </Card>
      <Card v-if="iOweOpenAmount > 0">
        <template #title>Ich schulde</template>
        <template #content>
          <p class="text-3xl font-semibold text-rose-700">{{ currency.format(iOweOpenAmount) }}</p>
          <p class="mt-1 text-sm text-stone-500">{{ debtsIOwe.length }} offen</p>
        </template>
      </Card>
      <Card v-if="pendingDeletionRequests.length">
        <template #title>Löschanträge</template>
        <template #content>
          <p class="text-3xl font-semibold text-amber-700">
            {{ pendingDeletionRequests.length }}
          </p>
          <p class="mt-1 text-sm text-stone-500">warten auf Entscheidung</p>
        </template>
      </Card>
    </div>

    <div v-if="store.loading" class="flex min-h-32 items-center justify-center">
      <ProgressSpinner />
    </div>
    <p v-else-if="store.error" class="text-rose-700">{{ store.error }}</p>

    <div v-else-if="!hasDashboardEntries" class="grid gap-6">
      <Card>
        <template #content>
          <div class="flex flex-col items-center px-4 py-10 text-center">
            <div class="grid size-12 place-items-center rounded-full bg-indigo-50 text-indigo-700">
              <i class="pi pi-wallet text-xl" aria-hidden="true" />
            </div>
            <h2 class="mt-4 text-xl font-semibold text-slate-950">Noch keine Schulden erfasst</h2>
            <p class="mt-2 max-w-md text-sm text-stone-500">
              Sobald du eine Schuld einträgst oder jemand dir eine Schuld zuordnet, erscheinen hier
              die passenden Bereiche automatisch.
            </p>
            <RouterLink class="mt-5" :to="{ path: '/debts', query: { create: '1' } }">
              <Button icon="pi pi-plus" label="Schuld eintragen" />
            </RouterLink>
          </div>
        </template>
      </Card>
    </div>

    <div v-else class="grid gap-6">
      <DeletionRequestsPanel
        v-if="pendingDeletionRequests.length"
        :requests="pendingDeletionRequests"
        @approve="approveDeletion"
        @reject="rejectDeletion"
      />
      <PaymentRequestsPanel
        v-if="pendingPaymentRequests.length"
        :requests="pendingPaymentRequests"
        @approve="approvePaid"
        @reject="rejectPaid"
      />

      <div class="grid gap-6 lg:grid-cols-2">
        <Card v-if="openDebts.length">
          <template #title>Mir schuldet jemand</template>
          <template #content>
            <div class="grid gap-3">
              <div
                v-for="debt in openDebts"
                :key="debt.id"
                class="flex items-center justify-between gap-4 border-b border-stone-100 py-3"
              >
                <div>
                  <p class="font-semibold text-stone-900">{{ debt.debtorName }}</p>
                  <p class="text-sm text-stone-500">{{ debt.purpose }} · {{ debt.category }}</p>
                  <p v-if="debt.comment" class="text-xs text-stone-500">{{ debt.comment }}</p>
                </div>
                <p class="font-semibold text-sky-800">{{ currency.format(debt.amount) }}</p>
              </div>
            </div>
          </template>
        </Card>

        <Card v-if="debtsIOwe.length">
          <template #title>Ich schulde</template>
          <template #content>
            <div class="grid gap-3">
              <div
                v-for="debt in debtsIOwe"
                :key="debt.id"
                class="flex items-center justify-between gap-4 border-b border-stone-100 py-3"
              >
                <div>
                  <p class="font-semibold text-stone-900">{{ debt.creator.name }}</p>
                  <p class="text-sm text-stone-500">{{ debt.purpose }} · {{ debt.category }}</p>
                  <p v-if="debt.comment" class="text-xs text-stone-500">{{ debt.comment }}</p>
                </div>
                <p class="font-semibold text-rose-700">{{ currency.format(debt.amount) }}</p>
              </div>
            </div>
          </template>
        </Card>

        <Card v-if="paidDebtsIOwe.length">
          <template #title>Von mir bereits bezahlt</template>
          <template #content>
            <div class="w-full min-w-0 overflow-x-auto">
              <DataTable
                :value="paidDebtsIOwe"
                data-key="id"
                row-hover
                size="small"
                striped-rows
                show-gridlines
                tableStyle="min-width: 42rem;"
              >
                <Column header="Gläubiger" style="width: 12rem">
                  <template #body="{ data }">
                    <p class="font-medium text-stone-900">{{ data.creator.name }}</p>
                    <p class="text-xs text-stone-500">{{ data.creator.email }}</p>
                  </template>
                  <template #footer>
                    <span class="font-semibold text-stone-900">Summe</span>
                  </template>
                </Column>
                <Column header="Bezahlt am" style="width: 8rem">
                  <template #body="{ data }">
                    <span class="whitespace-nowrap">{{ formatDate(data.paidAt) }}</span>
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
                <Column header="Kategorie" style="width: 8rem">
                  <template #body="{ data }">
                    <span class="whitespace-nowrap">{{ data.category }}</span>
                  </template>
                </Column>
                <Column header="Betrag" style="width: 8rem" body-class="text-right">
                  <template #body="{ data }">
                    <span class="whitespace-nowrap font-semibold text-stone-700">
                      {{ currency.format(data.amount) }}
                    </span>
                  </template>
                  <template #footer>
                    <p class="text-right font-semibold text-stone-900">
                      {{ currency.format(paidIOweAmount) }}
                    </p>
                  </template>
                </Column>
              </DataTable>
            </div>
          </template>
        </Card>
      </div>
    </div>
  </section>
</template>
