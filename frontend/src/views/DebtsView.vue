<script setup lang="ts">
import AutoComplete from "primevue/autocomplete";
import Button from "primevue/button";
import Card from "primevue/card";
import Column from "primevue/column";
import Checkbox from "primevue/checkbox";
import Dialog from "primevue/dialog";
import DataTable from "primevue/datatable";
import FloatLabel from "primevue/floatlabel";
import InputNumber from "primevue/inputnumber";
import InputText from "primevue/inputtext";
import Menu from "primevue/menu";
import Tab from "primevue/tab";
import TabList from "primevue/tablist";
import TabPanel from "primevue/tabpanel";
import TabPanels from "primevue/tabpanels";
import Tabs from "primevue/tabs";
import Textarea from "primevue/textarea";
import { useToast } from "primevue/usetoast";
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

import DebtDeletionReviewCell from "../components/debts/DebtDeletionReviewCell.vue";
import DebtEditDialog, { type DebtEditInput } from "../components/debts/DebtEditDialog.vue";
import DebtForm, { type DebtFormInput, type KnownDebtor } from "../components/debts/DebtForm.vue";
import DebtorSummaryCards from "../components/debts/DebtorSummaryCards.vue";
import { currency, formatDate } from "../components/debts/debtFormatters";
import { useDebtsStore, type Debt, type DebtCredit } from "../stores/debts";
import { useFormUiStore } from "../stores/formUi";

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

interface DebtorDebtGroup {
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
const formUi = useFormUiStore();
const route = useRoute();
const router = useRouter();
const toast = useToast();
const saving = ref(false);
const formVisible = ref(false);
const formCanSubmit = ref(false);
const editSaving = ref(false);
const editVisible = ref(false);
const paidMarking = ref(false);
const notifyPaidDebtor = ref(true);
const selectedDebt = ref<Debt | null>(null);
const paidDebtTarget = ref<Debt | null>(null);
const paidMailDialogVisible = ref(false);
const paymentRequestDialogVisible = ref(false);
const paymentRequestSubmitting = ref(false);
const paymentRequestTarget = ref<Debt | null>(null);
const paymentRequestReason = ref("");
const deletionRequestDialogVisible = ref(false);
const deletionRequestSubmitting = ref(false);
const deletionRequestTarget = ref<Debt | null>(null);
const deletionRequestReason = ref("");
const deleteDialogVisible = ref(false);
const deleteSubmitting = ref(false);
const deleteTarget = ref<Debt | null>(null);
const creditDialogVisible = ref(false);
const creditInfoDialogVisible = ref(false);
const creditSaving = ref(false);
const selectedCredit = ref<DebtCredit | null>(null);
const selectedCreditDebtor = ref<KnownDebtor | null>(null);
const creditDebtorSuggestions = ref<KnownDebtor[]>([]);
const payWithCreditSelected = ref(false);
const grantCreditForm = ref({
  debtorName: "",
  debtorEmail: "",
  amount: null as number | null,
  note: "",
});
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
const openOwedToMeActiveDebtor = ref("");
const openIOweActiveCategory = ref("");
const paidOwedToMeActiveDebtor = ref("");
const hasDebtEntries = computed(
  () =>
    openOwedToMe.value.length > 0 ||
    openIOwe.value.length > 0 ||
    paidIOwe.value.length > 0 ||
    paidOwedToMe.value.length > 0 ||
    store.credits.length > 0,
);
const hasOpenOwedToMeDeletionRequests = computed(() =>
  openOwedToMe.value.some((debt) => debt.deletionStatus === "PENDING"),
);
const hasPaidOwedToMeDeletionRequests = computed(() =>
  paidOwedToMe.value.some((debt) => debt.deletionStatus === "PENDING"),
);

const openOwedToMeGroups = computed(() => {
  const groups = new Map<string, DebtorDebtGroup>();

  for (const debt of openOwedToMe.value) {
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
        const dateCompare = new Date(b.debtDate).getTime() - new Date(a.debtDate).getTime();

        return dateCompare || a.purpose.localeCompare(b.purpose);
      }),
    }))
    .sort(
      (a, b) =>
        a.debtorName.localeCompare(b.debtorName) || a.debtorEmail.localeCompare(b.debtorEmail),
    );
});

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

const filterByQuery = (value: string, query: string) =>
  value.toLocaleLowerCase("de-DE").includes(query.toLocaleLowerCase("de-DE"));

const isKnownDebtor = (value: unknown): value is KnownDebtor =>
  Boolean(
    value &&
    typeof value === "object" &&
    "name" in value &&
    "email" in value &&
    typeof value.name === "string" &&
    typeof value.email === "string",
  );

const searchCreditDebtors = (event: { query: string }) => {
  const query = event.query.trim();

  creditDebtorSuggestions.value = query
    ? knownDebtors.value.filter(
        (debtor) =>
          filterByQuery(debtor.name, query) ||
          filterByQuery(debtor.email, query) ||
          filterByQuery(debtor.label, query),
      )
    : knownDebtors.value;
};

const applyCreditDebtor = (debtor: KnownDebtor | null) => {
  if (!debtor) {
    selectedCreditDebtor.value = null;
    return;
  }

  selectedCreditDebtor.value = debtor;
  grantCreditForm.value.debtorName = debtor.name;
  grantCreditForm.value.debtorEmail = debtor.email;
};

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

const visibleCredits = computed(() =>
  [...store.credits].sort(
    (a, b) =>
      b.balance - a.balance ||
      a.debtorName.localeCompare(b.debtorName) ||
      a.creator.name.localeCompare(b.creator.name),
  ),
);

const canGrantCredit = computed(() =>
  Boolean(
    grantCreditForm.value.debtorName.trim() &&
    grantCreditForm.value.debtorEmail.trim() &&
    grantCreditForm.value.amount &&
    grantCreditForm.value.amount > 0,
  ),
);

const findCreditForDebt = (debt: Debt | null) => {
  if (!debt) {
    return null;
  }

  const debtorEmail = debt.debtorEmail.toLocaleLowerCase("de-DE");

  return (
    store.credits.find(
      (credit) =>
        credit.creator.id === debt.creator.id &&
        credit.debtorEmail.toLocaleLowerCase("de-DE") === debtorEmail,
    ) ?? null
  );
};

const hasEnoughCredit = (debt: Debt | null) => {
  const credit = findCreditForDebt(debt);

  return Boolean(credit && credit.balance >= (debt?.amount ?? Number.POSITIVE_INFINITY));
};

const paidDebtCredit = computed(() => findCreditForDebt(paidDebtTarget.value));
const paymentRequestCredit = computed(() => findCreditForDebt(paymentRequestTarget.value));
const canPayPaidDebtWithCredit = computed(() => hasEnoughCredit(paidDebtTarget.value));
const canPayPaymentRequestWithCredit = computed(() => hasEnoughCredit(paymentRequestTarget.value));
const selectedDebtCreditPaymentLabel = computed(() => {
  const debt = selectedDebt.value;

  if (!debt) {
    return null;
  }

  for (const credit of store.credits) {
    const payment = credit.entries.find(
      (entry) => entry.type === "PAYMENT" && entry.debtId === debt.id,
    );

    if (payment) {
      return `Bezahlt mit Guthaben von ${credit.creator.name} für ${credit.debtorName} (${currency.format(payment.amount)})`;
    }
  }

  return null;
});

watch(
  knownDebtors,
  (debtors) => {
    creditDebtorSuggestions.value = [...debtors];
  },
  { immediate: true },
);

watch(selectedCreditDebtor, (debtor) => {
  if (!isKnownDebtor(debtor)) {
    return;
  }

  grantCreditForm.value.debtorName = debtor.name;
  grantCreditForm.value.debtorEmail = debtor.email;
});

watch(
  openOwedToMeGroups,
  (groups) => {
    if (!groups.length) {
      openOwedToMeActiveDebtor.value = "";
      return;
    }

    if (!groups.some((group) => group.debtorEmail === openOwedToMeActiveDebtor.value)) {
      openOwedToMeActiveDebtor.value = groups[0].debtorEmail;
    }
  },
  { immediate: true },
);

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
  formCanSubmit.value = false;
  formVisible.value = true;
};

const closeCreateDialog = () => {
  formVisible.value = false;
  formCanSubmit.value = false;

  if (route.query.create) {
    void router.replace({ path: route.path, query: { ...route.query, create: undefined } });
  }
};

const openCreditDialog = () => {
  selectedCreditDebtor.value = null;
  grantCreditForm.value = {
    debtorName: "",
    debtorEmail: "",
    amount: null,
    note: "",
  };
  creditDialogVisible.value = true;
};

const closeCreditDialog = () => {
  creditDialogVisible.value = false;
  selectedCreditDebtor.value = null;
  grantCreditForm.value = {
    debtorName: "",
    debtorEmail: "",
    amount: null,
    note: "",
  };
};

const openCreditInfoDialog = (credit: DebtCredit) => {
  selectedCredit.value = credit;
  creditInfoDialogVisible.value = true;
};

const closeCreditInfoDialog = () => {
  creditInfoDialogVisible.value = false;
  selectedCredit.value = null;
};

const submitCredit = async () => {
  if (!canGrantCredit.value || !grantCreditForm.value.amount) {
    return;
  }

  creditSaving.value = true;

  try {
    await store.grantCredit({
      debtorName: grantCreditForm.value.debtorName.trim(),
      debtorEmail: grantCreditForm.value.debtorEmail.trim(),
      amount: grantCreditForm.value.amount,
      note: grantCreditForm.value.note.trim() || null,
    });
    closeCreditDialog();
    toast.add({
      severity: "success",
      summary: "Guthaben gespeichert",
      detail: "Das Guthaben ist jetzt für beide Seiten sichtbar.",
      life: 3500,
    });
  } catch (error) {
    toast.add({
      severity: "error",
      summary: "Guthaben nicht gespeichert",
      detail:
        error instanceof Error ? error.message : "Das Guthaben konnte nicht gespeichert werden.",
      life: 4500,
    });
  } finally {
    creditSaving.value = false;
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

      openDeleteDialog(selectedOpenOwedActionDebt.value);
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
    disabled: selectedOpenIOweActionDebt.value?.paymentStatus === "PENDING",
    command: () => {
      if (!selectedOpenIOweActionDebt.value) {
        return;
      }

      openPaymentRequestDialog(selectedOpenIOweActionDebt.value);
      closeOpenIOweActions();
    },
  },
  {
    label: "Löschung beantragen",
    icon: "pi pi-trash",
    disabled: selectedOpenIOweActionDebt.value?.deletionStatus === "PENDING",
    command: () => {
      if (!selectedOpenIOweActionDebt.value) {
        return;
      }

      openDeletionRequestDialog(selectedOpenIOweActionDebt.value);
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
  payWithCreditSelected.value = false;
  notifyPaidDebtor.value = true;
  paidMailDialogVisible.value = true;
};

const closePaidMailDialog = () => {
  paidMailDialogVisible.value = false;
  paidDebtTarget.value = null;
  payWithCreditSelected.value = false;
  notifyPaidDebtor.value = true;
};

const openPaymentRequestDialog = (debt: Debt) => {
  paymentRequestTarget.value = debt;
  paymentRequestReason.value = "";
  payWithCreditSelected.value = false;
  paymentRequestDialogVisible.value = true;
};

const closePaymentRequestDialog = () => {
  paymentRequestDialogVisible.value = false;
  paymentRequestTarget.value = null;
  paymentRequestReason.value = "";
  payWithCreditSelected.value = false;
};

const openDeletionRequestDialog = (debt: Debt) => {
  deletionRequestTarget.value = debt;
  deletionRequestReason.value = "";
  deletionRequestDialogVisible.value = true;
};

const closeDeletionRequestDialog = () => {
  deletionRequestDialogVisible.value = false;
  deletionRequestTarget.value = null;
  deletionRequestReason.value = "";
};

const markDebtAsPaid = async (notifyDebtor: boolean) => {
  if (!paidDebtTarget.value) {
    return;
  }

  paidMarking.value = true;

  try {
    if (payWithCreditSelected.value) {
      await store.payWithCredit(paidDebtTarget.value.id);
    } else {
      await store.markPaid(paidDebtTarget.value.id, { notifyDebtor });
    }
    closePaidMailDialog();
  } catch (error) {
    toast.add({
      severity: "error",
      summary: "Schuld nicht markiert",
      detail: error instanceof Error ? error.message : "Die Schuld konnte nicht markiert werden.",
      life: 4500,
    });
  } finally {
    paidMarking.value = false;
  }
};

const openDeleteDialog = (debt: Debt) => {
  deleteTarget.value = debt;
  deleteDialogVisible.value = true;
};

const closeDeleteDialog = () => {
  deleteDialogVisible.value = false;
  deleteTarget.value = null;
};

const confirmDeleteOwnDebt = async () => {
  if (!deleteTarget.value) {
    return;
  }

  const debt = deleteTarget.value;
  deleteSubmitting.value = true;

  try {
    await store.deleteDebt(debt.id);
    closeDeleteDialog();
    toast.add({
      severity: "success",
      summary: "Schuld gelöscht",
      detail: `"${debt.purpose}" wurde gelöscht.`,
      life: 3500,
    });
  } catch (error) {
    toast.add({
      severity: "error",
      summary: "Schuld nicht gelöscht",
      detail: error instanceof Error ? error.message : "Die Schuld konnte nicht gelöscht werden.",
      life: 4500,
    });
  } finally {
    deleteSubmitting.value = false;
  }
};

const requestOpenIOweDeletion = async () => {
  const debt = deletionRequestTarget.value;
  const reason = deletionRequestReason.value.trim();

  if (!debt || !reason) {
    return;
  }

  deletionRequestSubmitting.value = true;

  try {
    await requestDeletion(debt.id, reason);
    closeDeletionRequestDialog();
    toast.add({
      severity: "success",
      summary: "Löschung beantragt",
      detail: `Dein Löschantrag für "${debt.purpose}" wurde gesendet.`,
      life: 3500,
    });
  } catch (error) {
    toast.add({
      severity: "error",
      summary: "Löschung nicht beantragt",
      detail:
        error instanceof Error ? error.message : "Der Löschantrag konnte nicht gesendet werden.",
      life: 4500,
    });
  } finally {
    deletionRequestSubmitting.value = false;
  }
};

const requestOpenIOwePayment = async () => {
  const debt = paymentRequestTarget.value;
  const reason = paymentRequestReason.value.trim();

  if (!debt || (!payWithCreditSelected.value && !reason)) {
    return;
  }

  paymentRequestSubmitting.value = true;

  try {
    const usedCredit = payWithCreditSelected.value;

    if (usedCredit) {
      await store.payWithCredit(debt.id);
    } else {
      await store.requestPaid(debt.id, reason);
    }
    closePaymentRequestDialog();
    toast.add({
      severity: "success",
      summary: usedCredit ? "Mit Guthaben bezahlt" : "Zahlung beantragt",
      detail: usedCredit
        ? `Die Schuld "${debt.purpose}" wurde mit Guthaben bezahlt.`
        : `Deine Zahlung für "${debt.purpose}" wurde zur Prüfung gemeldet.`,
      life: 3500,
    });
  } catch (error) {
    toast.add({
      severity: "error",
      summary: "Zahlung nicht beantragt",
      detail: error instanceof Error ? error.message : "Die Zahlung konnte nicht beantragt werden.",
      life: 4500,
    });
  } finally {
    paymentRequestSubmitting.value = false;
  }
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
      <div class="flex flex-wrap gap-2">
        <Button
          class="mobile-icon-button"
          icon="pi pi-wallet"
          label="Guthaben geben"
          title="Guthaben geben"
          aria-label="Guthaben geben"
          severity="secondary"
          @click="openCreditDialog"
        />
        <Button
          class="mobile-icon-button"
          icon="pi pi-plus"
          label="Schuld eintragen"
          title="Schuld eintragen"
          aria-label="Schuld eintragen"
          @click="openCreateDialog"
        />
      </div>
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
        @validity-change="formCanSubmit = $event"
        @submit="submitDebt"
      />
      <template #footer>
        <div class="mt-3 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" severity="secondary" label="Abbrechen" @click="closeCreateDialog" />
          <Button
            type="submit"
            form="debt-create-form"
            :loading="saving"
            :disabled="saving || !formCanSubmit"
            label="Schuld speichern"
            icon="pi pi-check"
          />
        </div>
      </template>
    </Dialog>
    <DebtEditDialog
      v-model:visible="editVisible"
      :debt="selectedDebt"
      :credit-payment-label="selectedDebtCreditPaymentLabel"
      :known-categories="knownCategories"
      :saving="editSaving"
      @save="saveDebt"
    />
    <Dialog
      v-model:visible="deleteDialogVisible"
      modal
      header="Schuld löschen"
      :style="{ width: 'min(92vw, 30rem)' }"
      @hide="closeDeleteDialog"
    >
      <div class="mt-3 grid gap-5">
        <p class="text-sm leading-6 text-stone-600">
          Diese Schuld wird dauerhaft entfernt. Bitte prüfe kurz, ob du wirklich diesen Eintrag
          löschen möchtest.
        </p>
        <div class="rounded-md border border-stone-200 bg-stone-50 px-3 py-2 text-sm">
          <p class="font-medium text-stone-900">{{ deleteTarget?.purpose }}</p>
          <p class="mt-1 text-stone-500">
            {{ deleteTarget ? currency.format(deleteTarget.amount) : "" }}
          </p>
        </div>
      </div>
      <template #footer>
        <div class="mt-3 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            severity="secondary"
            label="Abbrechen"
            :disabled="deleteSubmitting"
            @click="closeDeleteDialog"
          />
          <Button
            type="button"
            severity="danger"
            label="Schuld löschen"
            icon="pi pi-trash"
            :loading="deleteSubmitting"
            :disabled="deleteSubmitting"
            @click="confirmDeleteOwnDebt"
          />
        </div>
      </template>
    </Dialog>
    <Dialog
      v-model:visible="creditDialogVisible"
      modal
      header="Guthaben geben"
      :style="{ width: 'min(92vw, 32rem)' }"
      @hide="closeCreditDialog"
    >
      <form id="grant-credit-form" class="mt-3 grid gap-5" @submit.prevent="submitCredit">
        <p class="text-sm leading-6 text-stone-600">
          Lege hier ein Guthaben für einen Schuldner an. Es ist für beide Seiten sichtbar und kann
          später direkt zum Bezahlen passender Schulden verwendet werden.
        </p>
        <div v-if="knownDebtors.length">
          <FloatLabel :variant="formUi.floatLabelVariant">
            <AutoComplete
              input-id="grant-credit-known-debtor"
              v-model="selectedCreditDebtor"
              class="w-full"
              :suggestions="creditDebtorSuggestions"
              option-label="label"
              dropdown
              force-selection
              @complete="searchCreditDebtors"
              @clear="applyCreditDebtor(null)"
            />
            <label for="grant-credit-known-debtor">Bekannter Schuldner</label>
          </FloatLabel>
        </div>
        <FloatLabel :variant="formUi.floatLabelVariant">
          <InputText
            id="grant-credit-debtor-name"
            v-model="grantCreditForm.debtorName"
            class="w-full"
            required
          />
          <label for="grant-credit-debtor-name">Schuldner *</label>
        </FloatLabel>
        <FloatLabel :variant="formUi.floatLabelVariant">
          <InputText
            id="grant-credit-debtor-email"
            v-model="grantCreditForm.debtorEmail"
            class="w-full"
            type="email"
            required
          />
          <label for="grant-credit-debtor-email">E-Mail des Schuldners *</label>
        </FloatLabel>
        <FloatLabel :variant="formUi.floatLabelVariant">
          <InputNumber
            input-id="grant-credit-amount"
            v-model="grantCreditForm.amount"
            class="w-full"
            mode="currency"
            currency="EUR"
            locale="de-DE"
            :min="0.01"
            required
          />
          <label for="grant-credit-amount">Guthaben *</label>
        </FloatLabel>
        <FloatLabel :variant="formUi.floatLabelVariant">
          <Textarea
            id="grant-credit-note"
            v-model="grantCreditForm.note"
            class="w-full"
            rows="3"
            auto-resize
          />
          <label for="grant-credit-note">Woher kommt das Guthaben?</label>
        </FloatLabel>
      </form>
      <template #footer>
        <div class="mt-3 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            severity="secondary"
            label="Abbrechen"
            :disabled="creditSaving"
            @click="closeCreditDialog"
          />
          <Button
            type="submit"
            form="grant-credit-form"
            label="Guthaben speichern"
            icon="pi pi-check"
            :loading="creditSaving"
            :disabled="creditSaving || !canGrantCredit"
          />
        </div>
      </template>
    </Dialog>
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
    <Dialog
      v-model:visible="paidMailDialogVisible"
      modal
      header="Schuld als bezahlt markieren"
      :style="{ width: 'min(92vw, 28rem)' }"
      @hide="closePaidMailDialog"
    >
      <div class="mt-3 grid gap-5">
        <p class="text-sm text-stone-600">
          Soll die Schuld
          <strong>{{ paidDebtTarget?.purpose }}</strong>
          als bezahlt markiert werden?
        </p>
        <label
          v-if="!payWithCreditSelected"
          class="flex items-start gap-3 rounded-md border border-stone-200 px-3 py-2 text-sm text-stone-700"
        >
          <Checkbox v-model="notifyPaidDebtor" binary input-id="notify-paid-debtor" />
          <span>Schuldner per Mail informieren</span>
        </label>
        <label
          v-if="canPayPaidDebtWithCredit && paidDebtCredit"
          class="flex items-start gap-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900"
        >
          <Checkbox v-model="payWithCreditSelected" binary input-id="paid-with-credit-owner" />
          <span>
            Mit Guthaben von {{ paidDebtCredit.debtorName }} bezahlen
            <span class="block text-xs text-emerald-700">
              Verfügbar: {{ currency.format(paidDebtCredit.balance) }}
            </span>
          </span>
        </label>
      </div>
      <template #footer>
        <div class="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <Button
            type="button"
            severity="success"
            :label="payWithCreditSelected ? 'Mit Guthaben bezahlen' : 'Als bezahlt markieren'"
            :icon="payWithCreditSelected ? 'pi pi-wallet' : 'pi pi-check'"
            :loading="paidMarking"
            :disabled="paidMarking"
            @click="markDebtAsPaid(notifyPaidDebtor)"
          />
          <Button
            type="button"
            severity="secondary"
            label="Schließen"
            icon="pi pi-times"
            outlined
            :disabled="paidMarking"
            @click="closePaidMailDialog"
          />
        </div>
      </template>
    </Dialog>
    <Dialog
      v-model:visible="paymentRequestDialogVisible"
      modal
      header="Als bezahlt melden"
      :style="{ width: 'min(92vw, 30rem)' }"
      @hide="closePaymentRequestDialog"
    >
      <form
        id="payment-request-form"
        class="mt-3 grid gap-5"
        @submit.prevent="requestOpenIOwePayment"
      >
        <p class="text-sm leading-6 text-stone-600">
          Schön, dass du diese Schuld begleichen möchtest. Schreib kurz dazu, wie du bezahlt hast
          oder woran der Gläubiger die Zahlung erkennen kann.
        </p>
        <div class="rounded-md border border-stone-200 bg-stone-50 px-3 py-2 text-sm">
          <p class="font-medium text-stone-900">{{ paymentRequestTarget?.purpose }}</p>
          <p class="mt-1 text-stone-500">
            {{ paymentRequestTarget ? currency.format(paymentRequestTarget.amount) : "" }}
          </p>
        </div>
        <label
          v-if="canPayPaymentRequestWithCredit && paymentRequestCredit"
          class="flex items-start gap-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900"
        >
          <Checkbox v-model="payWithCreditSelected" binary input-id="payment-request-with-credit" />
          <span>
            Mit Guthaben von {{ paymentRequestCredit.creator.name }} bezahlen
            <span class="block text-xs text-emerald-700">
              Verfügbar: {{ currency.format(paymentRequestCredit.balance) }}
            </span>
          </span>
        </label>
        <FloatLabel :variant="formUi.floatLabelVariant">
          <Textarea
            id="payment-request-reason"
            v-model="paymentRequestReason"
            class="w-full"
            rows="4"
            auto-resize
            :disabled="payWithCreditSelected"
            required
          />
          <label for="payment-request-reason">Bemerkung *</label>
        </FloatLabel>
      </form>
      <template #footer>
        <div class="mt-3 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            severity="secondary"
            label="Abbrechen"
            :disabled="paymentRequestSubmitting"
            @click="closePaymentRequestDialog"
          />
          <Button
            type="submit"
            form="payment-request-form"
            severity="success"
            :label="payWithCreditSelected ? 'Mit Guthaben bezahlen' : 'Zahlung beantragen'"
            :icon="payWithCreditSelected ? 'pi pi-wallet' : 'pi pi-check-circle'"
            :loading="paymentRequestSubmitting"
            :disabled="
              paymentRequestSubmitting || (!payWithCreditSelected && !paymentRequestReason.trim())
            "
          />
        </div>
      </template>
    </Dialog>
    <Dialog
      v-model:visible="deletionRequestDialogVisible"
      modal
      header="Löschung beantragen"
      :style="{ width: 'min(92vw, 30rem)' }"
      @hide="closeDeletionRequestDialog"
    >
      <form
        id="deletion-request-form"
        class="mt-3 grid gap-5"
        @submit.prevent="requestOpenIOweDeletion"
      >
        <p class="text-sm leading-6 text-stone-600">
          Wenn diese Schuld aus deiner Sicht nicht mehr stimmt, kannst du eine Löschung beantragen.
          Schreib kurz dazu, warum der Eintrag entfernt werden soll.
        </p>
        <div class="rounded-md border border-stone-200 bg-stone-50 px-3 py-2 text-sm">
          <p class="font-medium text-stone-900">{{ deletionRequestTarget?.purpose }}</p>
          <p class="mt-1 text-stone-500">
            {{ deletionRequestTarget ? currency.format(deletionRequestTarget.amount) : "" }}
          </p>
        </div>
        <FloatLabel :variant="formUi.floatLabelVariant">
          <Textarea
            id="deletion-request-reason"
            v-model="deletionRequestReason"
            class="w-full"
            rows="4"
            auto-resize
            required
          />
          <label for="deletion-request-reason">Begründung *</label>
        </FloatLabel>
      </form>
      <template #footer>
        <div class="mt-3 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            severity="secondary"
            label="Abbrechen"
            :disabled="deletionRequestSubmitting"
            @click="closeDeletionRequestDialog"
          />
          <Button
            type="submit"
            form="deletion-request-form"
            severity="danger"
            label="Löschung beantragen"
            icon="pi pi-trash"
            :loading="deletionRequestSubmitting"
            :disabled="deletionRequestSubmitting || !deletionRequestReason.trim()"
          />
        </div>
      </template>
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

    <Card v-if="visibleCredits.length">
      <template #title>Guthaben</template>
      <template #content>
        <DataTable
          :value="visibleCredits"
          data-key="id"
          row-hover
          size="small"
          striped-rows
          tableStyle="min-width: 44rem;"
        >
          <Column header="Von" style="width: 12rem">
            <template #body="{ data }">
              <p class="font-medium text-stone-900">{{ data.creator.name }}</p>
              <p class="text-xs text-stone-500">{{ data.creator.email }}</p>
            </template>
          </Column>
          <Column header="Für" style="width: 12rem">
            <template #body="{ data }">
              <p class="font-medium text-stone-900">{{ data.debtorName }}</p>
              <p class="text-xs text-stone-500">{{ data.debtorEmail }}</p>
            </template>
          </Column>
          <Column header="Guthaben" style="width: 8rem" body-class="text-right">
            <template #body="{ data }">
              <span class="whitespace-nowrap font-semibold text-emerald-700">
                {{ currency.format(data.balance) }}
              </span>
            </template>
          </Column>
          <Column header="Info" style="width: 5rem" body-class="text-right">
            <template #body="{ data }">
              <Button
                class="icon-action-button"
                icon="pi pi-info-circle"
                label="Info"
                size="small"
                severity="secondary"
                title="Guthaben-Info"
                aria-label="Guthaben-Info"
                @click="openCreditInfoDialog(data)"
              />
            </template>
          </Column>
        </DataTable>
      </template>
    </Card>

    <Card v-if="openOwedToMeGroups.length || store.error">
      <template #title>Offene Schulden an mich</template>
      <template #content>
        <p v-if="store.error" class="mb-4 text-rose-700">{{ store.error }}</p>
        <DebtorSummaryCards :summaries="openDebtorSummaries" />
        <Tabs v-if="openOwedToMeGroups.length" v-model:value="openOwedToMeActiveDebtor">
          <TabList class="flex flex-wrap gap-2 border-b border-stone-200 pb-3">
            <Tab
              v-for="group in openOwedToMeGroups"
              :key="group.debtorEmail"
              :value="group.debtorEmail"
            >
              {{ group.debtorName }}
            </Tab>
          </TabList>
          <TabPanels>
            <TabPanel
              v-for="group in openOwedToMeGroups"
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
              <div class="w-full min-w-0 overflow-x-auto">
                <DataTable
                  class="w-full min-w-0"
                  :value="group.debts"
                  data-key="id"
                  row-hover
                  size="small"
                  striped-rows
                  tableStyle="min-width: 44rem;"
                >
                  <Column header="Datum" style="width: 8.5rem">
                    <template #body="{ data }">
                      <span class="whitespace-nowrap">{{ formatDate(data.debtDate) }}</span>
                    </template>
                  </Column>
                  <Column header="Betrag" style="width: 7.5rem" body-class="text-right">
                    <template #body="{ data }">
                      <span class="whitespace-nowrap font-semibold text-sky-800">{{
                        currency.format(data.amount)
                      }}</span>
                    </template>
                  </Column>
                  <Column header="Kategorie" style="width: 8rem">
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
                  <Column
                    v-if="hasOpenOwedToMeDeletionRequests"
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
                        @click="openOpenOwedActions(data, $event)"
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
