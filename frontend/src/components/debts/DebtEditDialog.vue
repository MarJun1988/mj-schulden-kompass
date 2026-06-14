<script setup lang="ts">
import AutoComplete from "primevue/autocomplete";
import Button from "primevue/button";
import Dialog from "primevue/dialog";
import DatePicker from "primevue/datepicker";
import InputNumber from "primevue/inputnumber";
import InputText from "primevue/inputtext";
import { computed, reactive, ref, watch } from "vue";

import type { Debt } from "../../stores/debts";

export interface DebtEditInput {
  debtorName: string;
  debtorEmail: string;
  amount: number;
  purpose: string;
  comment: string | null;
  category: string;
  debtDate: string;
  paidAt: string | null;
}

const props = defineProps<{
  debt: Debt | null;
  knownCategories: string[];
  saving: boolean;
  visible: boolean;
}>();

const emit = defineEmits<{
  "update:visible": [value: boolean];
  save: [id: string, input: DebtEditInput];
}>();

const categorySuggestions = ref<string[]>([]);

const form = reactive({
  debtorName: "",
  debtorEmail: "",
  amount: null as number | null,
  purpose: "",
  comment: "",
  category: "",
  debtDate: new Date(),
  paidAt: null as Date | null,
});

const dialogVisible = computed({
  get: () => props.visible,
  set: (value: boolean) => emit("update:visible", value),
});

const canSubmit = computed(() =>
  Boolean(
    props.debt &&
    form.debtorName.trim() &&
    form.debtorEmail.trim() &&
    form.amount &&
    form.purpose.trim() &&
    form.category.trim(),
  ),
);

const filterByQuery = (value: string, query: string) =>
  value.toLocaleLowerCase("de-DE").includes(query.toLocaleLowerCase("de-DE"));

const searchCategories = (event: { query: string }) => {
  const query = event.query.trim();

  categorySuggestions.value = query
    ? props.knownCategories.filter((category) => filterByQuery(category, query))
    : props.knownCategories;
};

const resetForm = () => {
  const debt = props.debt;

  form.debtorName = debt?.debtorName ?? "";
  form.debtorEmail = debt?.debtorEmail ?? "";
  form.amount = debt?.amount ?? null;
  form.purpose = debt?.purpose ?? "";
  form.comment = debt?.comment ?? "";
  form.category = debt?.category ?? "";
  form.debtDate = debt ? new Date(debt.debtDate) : new Date();
  form.paidAt = debt?.paidAt ? new Date(debt.paidAt) : null;
};

const submit = () => {
  if (
    !props.debt ||
    !form.debtorName.trim() ||
    !form.debtorEmail.trim() ||
    !form.amount ||
    !form.purpose.trim() ||
    !form.category.trim()
  ) {
    return;
  }

  emit("save", props.debt.id, {
    debtorName: form.debtorName,
    debtorEmail: form.debtorEmail,
    amount: form.amount,
    purpose: form.purpose,
    comment: form.comment.trim() || null,
    category: form.category,
    debtDate: form.debtDate.toISOString(),
    paidAt: form.paidAt?.toISOString() ?? null,
  });
};

watch(
  () => [props.debt, props.visible],
  () => {
    if (props.visible) {
      resetForm();
    }
  },
  { immediate: true },
);

watch(
  () => props.visible,
  (visible) => {
    if (!visible) {
      emit("update:visible", false);
    }
  },
);
</script>

<template>
  <Dialog
    v-model:visible="dialogVisible"
    modal
    header="Schuld bearbeiten"
    class="w-[calc(100vw-2rem)] max-w-lg"
  >
    <form class="grid gap-4" @submit.prevent="submit">
      <label class="grid gap-2">
        <span class="text-sm font-medium text-stone-700"
          >Schuldner <span class="text-rose-600">*</span></span
        >
        <InputText v-model="form.debtorName" required />
      </label>

      <label class="grid gap-2">
        <span class="text-sm font-medium text-stone-700"
          >E-Mail des Schuldners <span class="text-rose-600">*</span></span
        >
        <InputText v-model="form.debtorEmail" type="email" required />
      </label>

      <label class="grid gap-2">
        <span class="text-sm font-medium text-stone-700"
          >Betrag <span class="text-rose-600">*</span></span
        >
        <InputNumber
          v-model="form.amount"
          mode="currency"
          currency="EUR"
          locale="de-DE"
          :min="0"
          required
        />
      </label>

      <label class="grid gap-2">
        <span class="text-sm font-medium text-stone-700"
          >Zweck <span class="text-rose-600">*</span></span
        >
        <InputText v-model="form.purpose" required />
      </label>

      <label class="grid gap-2">
        <span class="text-sm font-medium text-stone-700">Kommentar</span>
        <InputText v-model="form.comment" placeholder="Optionaler Hinweis zur Schuld" />
      </label>

      <label class="grid gap-2">
        <span class="text-sm font-medium text-stone-700"
          >Kategorie <span class="text-rose-600">*</span></span
        >
        <AutoComplete
          v-model="form.category"
          :suggestions="categorySuggestions"
          placeholder="Kategorie suchen oder eintippen"
          dropdown
          @complete="searchCategories"
        />
      </label>

      <label class="grid gap-2">
        <span class="text-sm font-medium text-stone-700"
          >Datum <span class="text-rose-600">*</span></span
        >
        <DatePicker v-model="form.debtDate" show-icon date-format="dd.mm.yy" />
      </label>

      <label class="grid gap-2">
        <span class="text-sm font-medium text-stone-700">Bezahlt wann</span>
        <DatePicker v-model="form.paidAt" show-icon show-button-bar date-format="dd.mm.yy" />
      </label>

      <div class="flex justify-end gap-2">
        <Button
          type="button"
          class="mobile-icon-button"
          icon="pi pi-times"
          label="Abbrechen"
          severity="secondary"
          title="Abbrechen"
          aria-label="Abbrechen"
          @click="dialogVisible = false"
        />
        <Button
          type="submit"
          class="mobile-icon-button"
          icon="pi pi-check"
          label="Speichern"
          title="Speichern"
          aria-label="Speichern"
          :loading="saving"
          :disabled="saving || !canSubmit"
        />
      </div>
    </form>
  </Dialog>
</template>
