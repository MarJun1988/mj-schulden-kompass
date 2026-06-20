<script setup lang="ts">
import AutoComplete from "primevue/autocomplete";
import Checkbox from "primevue/checkbox";
import DatePicker from "primevue/datepicker";
import FloatLabel from "primevue/floatlabel";
import InputNumber from "primevue/inputnumber";
import InputText from "primevue/inputtext";
import { computed, reactive, ref, watch } from "vue";

import { useFormUiStore } from "../../stores/formUi";

export interface KnownDebtor {
  name: string;
  email: string;
  label: string;
}

export interface DebtFormInput {
  debtorName: string;
  debtorEmail: string;
  amount: number;
  purpose: string;
  comment: string | null;
  category: string;
  debtDate: string;
  paidAt: string | null;
  notifyDebtor: boolean;
}

const props = defineProps<{
  knownDebtors: KnownDebtor[];
  knownCategories: string[];
  saving: boolean;
  formId?: string;
}>();

const emit = defineEmits<{
  submit: [input: DebtFormInput];
  "validity-change": [value: boolean];
}>();

const formUi = useFormUiStore();
const selectedDebtor = ref<KnownDebtor | null>(null);
const debtorSuggestions = ref<KnownDebtor[]>([]);
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
  notifyDebtor: true,
});

const filterByQuery = (value: string, query: string) =>
  value.toLocaleLowerCase("de-DE").includes(query.toLocaleLowerCase("de-DE"));

const asTrimmedString = (value: unknown) => (typeof value === "string" ? value.trim() : "");

const isKnownDebtor = (value: unknown): value is KnownDebtor =>
  Boolean(
    value &&
    typeof value === "object" &&
    "name" in value &&
    "email" in value &&
    typeof value.name === "string" &&
    typeof value.email === "string",
  );

const canSubmit = computed(() =>
  Boolean(
    asTrimmedString(form.debtorName) &&
    asTrimmedString(form.debtorEmail) &&
    form.amount &&
    asTrimmedString(form.purpose) &&
    asTrimmedString(form.category) &&
    form.debtDate,
  ),
);

watch(
  () => props.knownDebtors,
  (debtors) => {
    debtorSuggestions.value = [...debtors];
  },
  { immediate: true },
);

const searchDebtors = (event: { query: string }) => {
  const query = event.query.trim();

  debtorSuggestions.value = query
    ? props.knownDebtors.filter(
        (debtor) =>
          filterByQuery(debtor.name, query) ||
          filterByQuery(debtor.email, query) ||
          filterByQuery(debtor.label, query),
      )
    : props.knownDebtors;
};

const searchCategories = (event: { query: string }) => {
  const query = event.query.trim();

  categorySuggestions.value = query
    ? props.knownCategories.filter((category) => filterByQuery(category, query))
    : props.knownCategories;
};

const applyKnownDebtor = (debtor: KnownDebtor | null) => {
  if (!debtor) {
    selectedDebtor.value = null;
    return;
  }

  selectedDebtor.value = debtor;
  form.debtorName = debtor.name;
  form.debtorEmail = debtor.email;
};

watch(selectedDebtor, (debtor) => {
  if (!isKnownDebtor(debtor)) {
    return;
  }

  form.debtorName = debtor.name;
  form.debtorEmail = debtor.email;
});

watch(canSubmit, (value) => emit("validity-change", value), { immediate: true });

const resetForm = () => {
  selectedDebtor.value = null;
  form.debtorName = "";
  form.debtorEmail = "";
  form.amount = null;
  form.purpose = "";
  form.comment = "";
  form.category = "";
  form.debtDate = new Date();
  form.paidAt = null;
  form.notifyDebtor = true;
};

const submit = () => {
  if (
    !asTrimmedString(form.debtorName) ||
    !asTrimmedString(form.debtorEmail) ||
    !form.amount ||
    !asTrimmedString(form.purpose) ||
    !asTrimmedString(form.category)
  ) {
    return;
  }

  emit("submit", {
    debtorName: asTrimmedString(form.debtorName),
    debtorEmail: asTrimmedString(form.debtorEmail),
    amount: form.amount,
    purpose: asTrimmedString(form.purpose),
    comment: asTrimmedString(form.comment) || null,
    category: asTrimmedString(form.category),
    debtDate: form.debtDate.toISOString(),
    paidAt: form.paidAt?.toISOString() ?? null,
    notifyDebtor: form.notifyDebtor,
  });
  resetForm();
};
</script>

<template>
  <form :id="formId" class="mt-3 grid gap-5" @submit.prevent="submit">
    <div v-if="knownDebtors.length">
      <FloatLabel :variant="formUi.floatLabelVariant">
        <AutoComplete
          input-id="debt-create-known-debtor"
          v-model="selectedDebtor"
          class="w-full"
          :suggestions="debtorSuggestions"
          option-label="label"
          dropdown
          force-selection
          @complete="searchDebtors"
          @clear="applyKnownDebtor(null)"
        />
        <label for="debt-create-known-debtor">Bekannter Schuldner</label>
      </FloatLabel>
    </div>

    <FloatLabel :variant="formUi.floatLabelVariant">
      <InputText id="debt-create-debtor-name" v-model="form.debtorName" class="w-full" required />
      <label for="debt-create-debtor-name">Schuldner *</label>
    </FloatLabel>

    <FloatLabel :variant="formUi.floatLabelVariant">
      <InputText
        id="debt-create-debtor-email"
        v-model="form.debtorEmail"
        class="w-full"
        type="email"
        required
      />
      <label for="debt-create-debtor-email">E-Mail des Schuldners *</label>
    </FloatLabel>

    <FloatLabel :variant="formUi.floatLabelVariant">
      <InputNumber
        input-id="debt-create-amount"
        v-model="form.amount"
        class="w-full"
        mode="currency"
        currency="EUR"
        locale="de-DE"
        :min="0"
        required
      />
      <label for="debt-create-amount">Betrag *</label>
    </FloatLabel>

    <FloatLabel :variant="formUi.floatLabelVariant">
      <InputText id="debt-create-purpose" v-model="form.purpose" class="w-full" required />
      <label for="debt-create-purpose">Zweck *</label>
    </FloatLabel>

    <FloatLabel :variant="formUi.floatLabelVariant">
      <InputText id="debt-create-comment" v-model="form.comment" class="w-full" />
      <label for="debt-create-comment">Kommentar</label>
    </FloatLabel>

    <FloatLabel :variant="formUi.floatLabelVariant">
      <AutoComplete
        input-id="debt-create-category"
        v-model="form.category"
        class="w-full"
        :suggestions="categorySuggestions"
        dropdown
        @complete="searchCategories"
      />
      <label for="debt-create-category">Kategorie *</label>
    </FloatLabel>

    <FloatLabel :variant="formUi.floatLabelVariant">
      <DatePicker
        input-id="debt-create-date"
        v-model="form.debtDate"
        class="w-full"
        show-icon
        date-format="dd.mm.yy"
      />
      <label for="debt-create-date">Datum *</label>
    </FloatLabel>

    <FloatLabel :variant="formUi.floatLabelVariant">
      <DatePicker
        input-id="debt-create-paid-at"
        v-model="form.paidAt"
        class="w-full"
        show-icon
        show-button-bar
        date-format="dd.mm.yy"
      />
      <label for="debt-create-paid-at">Bezahlt wann</label>
    </FloatLabel>

    <label
      class="flex items-center gap-3 rounded-lg border border-stone-200 px-3 py-2 text-sm text-stone-700"
    >
      <Checkbox v-model="form.notifyDebtor" binary input-id="notify-debtor-on-create" />
      <span>Schuldner per Mail informieren</span>
    </label>
  </form>
</template>
