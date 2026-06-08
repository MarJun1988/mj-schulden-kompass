<script setup lang="ts">
import AutoComplete from "primevue/autocomplete";
import Button from "primevue/button";
import DatePicker from "primevue/datepicker";
import Dialog from "primevue/dialog";
import InputNumber from "primevue/inputnumber";
import InputText from "primevue/inputtext";
import { reactive, ref, watch } from "vue";

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
  visible: boolean;
  saving: boolean;
}>();

const emit = defineEmits<{
  "update:visible": [visible: boolean];
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

const filterByQuery = (value: string, query: string) =>
  value.toLocaleLowerCase("de-DE").includes(query.toLocaleLowerCase("de-DE"));

const searchCategories = (event: { query: string }) => {
  const query = event.query.trim();

  categorySuggestions.value = query
    ? props.knownCategories.filter((category) => filterByQuery(category, query))
    : props.knownCategories;
};

const close = () => {
  emit("update:visible", false);
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
  () => props.debt,
  (debt) => {
    if (!debt) {
      return;
    }

    form.debtorName = debt.debtorName;
    form.debtorEmail = debt.debtorEmail;
    form.amount = debt.amount;
    form.purpose = debt.purpose;
    form.comment = debt.comment ?? "";
    form.category = debt.category;
    form.debtDate = new Date(debt.debtDate);
    form.paidAt = debt.paidAt ? new Date(debt.paidAt) : null;
  },
  { immediate: true },
);
</script>

<template>
  <Dialog
    :visible="visible"
    modal
    header="Schuld bearbeiten"
    class="mx-4 w-[min(680px,calc(100vw-2rem))]"
    @update:visible="$emit('update:visible', $event)"
  >
    <form class="grid gap-4" @submit.prevent="submit">
      <label class="grid gap-2">
        <span class="text-sm font-medium text-stone-700 dark:text-stone-200">Schuldner</span>
        <InputText v-model="form.debtorName" required />
      </label>

      <label class="grid gap-2">
        <span class="text-sm font-medium text-stone-700 dark:text-stone-200"
          >E-Mail des Schuldners</span
        >
        <InputText v-model="form.debtorEmail" type="email" required />
      </label>

      <label class="grid gap-2">
        <span class="text-sm font-medium text-stone-700 dark:text-stone-200">Betrag</span>
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
        <span class="text-sm font-medium text-stone-700 dark:text-stone-200">Zweck</span>
        <InputText v-model="form.purpose" required />
      </label>

      <label class="grid gap-2">
        <span class="text-sm font-medium text-stone-700 dark:text-stone-200">Kommentar</span>
        <InputText v-model="form.comment" placeholder="Optionaler Hinweis zur Schuld" />
      </label>

      <label class="grid gap-2">
        <span class="text-sm font-medium text-stone-700 dark:text-stone-200">Kategorie</span>
        <AutoComplete
          v-model="form.category"
          :suggestions="categorySuggestions"
          placeholder="Kategorie suchen oder eintippen"
          dropdown
          @complete="searchCategories"
        />
      </label>

      <div class="grid gap-4 sm:grid-cols-2">
        <label class="grid gap-2">
          <span class="text-sm font-medium text-stone-700 dark:text-stone-200">Datum</span>
          <DatePicker v-model="form.debtDate" show-icon date-format="dd.mm.yy" />
        </label>

        <label class="grid gap-2">
          <span class="text-sm font-medium text-stone-700 dark:text-stone-200">Bezahlt wann</span>
          <DatePicker v-model="form.paidAt" show-icon show-button-bar date-format="dd.mm.yy" />
        </label>
      </div>

      <div class="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
        <Button type="button" label="Abbrechen" severity="secondary" @click="close" />
        <Button type="submit" icon="pi pi-save" label="Speichern" :loading="saving" />
      </div>
    </form>
  </Dialog>
</template>
