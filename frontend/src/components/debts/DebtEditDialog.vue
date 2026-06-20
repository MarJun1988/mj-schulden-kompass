<script setup lang="ts">
import AutoComplete from "primevue/autocomplete";
import Button from "primevue/button";
import Dialog from "primevue/dialog";
import DatePicker from "primevue/datepicker";
import FloatLabel from "primevue/floatlabel";
import InputNumber from "primevue/inputnumber";
import InputText from "primevue/inputtext";
import { computed, reactive, ref, watch } from "vue";

import type { Debt } from "../../stores/debts";
import { useFormUiStore } from "../../stores/formUi";

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
  creditPaymentLabel?: string | null;
  knownCategories: string[];
  saving: boolean;
  visible: boolean;
}>();

const emit = defineEmits<{
  "update:visible": [value: boolean];
  save: [id: string, input: DebtEditInput];
}>();

const categorySuggestions = ref<string[]>([]);
const formId = "debt-edit-dialog-form";
const formUi = useFormUiStore();

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
    <form :id="formId" class="mt-3 grid gap-5" @submit.prevent="submit">
      <FloatLabel :variant="formUi.floatLabelVariant">
        <InputText
          id="debt-edit-debtor-name"
          v-model="form.debtorName"
          class="w-full"
          disabled
          required
        />
        <label for="debt-edit-debtor-name">Schuldner *</label>
      </FloatLabel>

      <FloatLabel :variant="formUi.floatLabelVariant">
        <InputText
          id="debt-edit-debtor-email"
          v-model="form.debtorEmail"
          class="w-full"
          type="email"
          disabled
          required
        />
        <label for="debt-edit-debtor-email">E-Mail des Schuldners *</label>
      </FloatLabel>

      <FloatLabel :variant="formUi.floatLabelVariant">
        <InputNumber
          input-id="debt-edit-amount"
          v-model="form.amount"
          class="w-full"
          mode="currency"
          currency="EUR"
          locale="de-DE"
          :min="0"
          required
        />
        <label for="debt-edit-amount">Betrag *</label>
      </FloatLabel>

      <FloatLabel :variant="formUi.floatLabelVariant">
        <InputText id="debt-edit-purpose" v-model="form.purpose" class="w-full" required />
        <label for="debt-edit-purpose">Zweck *</label>
      </FloatLabel>

      <FloatLabel :variant="formUi.floatLabelVariant">
        <InputText id="debt-edit-comment" v-model="form.comment" class="w-full" />
        <label for="debt-edit-comment">Kommentar</label>
      </FloatLabel>

      <FloatLabel :variant="formUi.floatLabelVariant">
        <AutoComplete
          input-id="debt-edit-category"
          v-model="form.category"
          class="w-full"
          :suggestions="categorySuggestions"
          dropdown
          @complete="searchCategories"
        />
        <label for="debt-edit-category">Kategorie *</label>
      </FloatLabel>

      <FloatLabel :variant="formUi.floatLabelVariant">
        <DatePicker
          input-id="debt-edit-date"
          v-model="form.debtDate"
          class="w-full"
          show-icon
          date-format="dd.mm.yy"
        />
        <label for="debt-edit-date">Datum *</label>
      </FloatLabel>

      <FloatLabel :variant="formUi.floatLabelVariant">
        <DatePicker
          input-id="debt-edit-paid-at"
          v-model="form.paidAt"
          class="w-full"
          show-icon
          show-button-bar
          date-format="dd.mm.yy"
        />
        <label for="debt-edit-paid-at">Bezahlt wann</label>
      </FloatLabel>

      <FloatLabel v-if="creditPaymentLabel" :variant="formUi.floatLabelVariant">
        <InputText
          id="debt-edit-credit-payment"
          :model-value="creditPaymentLabel"
          class="w-full"
          disabled
        />
        <label for="debt-edit-credit-payment">Bezahlt mit Guthaben</label>
      </FloatLabel>
    </form>
    <template #footer>
      <div class="mt-3 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
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
          form="debt-edit-dialog-form"
          class="mobile-icon-button"
          icon="pi pi-check"
          label="Speichern"
          title="Speichern"
          aria-label="Speichern"
          :loading="saving"
          :disabled="saving || !canSubmit"
        />
      </div>
    </template>
  </Dialog>
</template>
