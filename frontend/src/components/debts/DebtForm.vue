<script setup lang="ts">
import AutoComplete from "primevue/autocomplete";
import Button from "primevue/button";
import Checkbox from "primevue/checkbox";
import DatePicker from "primevue/datepicker";
import InputNumber from "primevue/inputnumber";
import InputText from "primevue/inputtext";
import { computed, reactive, ref } from "vue";

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
}>();

const emit = defineEmits<{
  submit: [input: DebtFormInput];
}>();

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

const canSubmit = computed(() =>
  Boolean(
    form.debtorName.trim() &&
    form.debtorEmail.trim() &&
    form.amount &&
    form.purpose.trim() &&
    form.category.trim(),
  ),
);

const filterByQuery = (value: string, query: string) =>
  value.toLocaleLowerCase("de-DE").includes(query.toLocaleLowerCase("de-DE"));

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
  selectedDebtor.value = debtor;

  if (!debtor) {
    return;
  }

  form.debtorName = debtor.name;
  form.debtorEmail = debtor.email;
};

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
    !form.debtorName.trim() ||
    !form.debtorEmail.trim() ||
    !form.amount ||
    !form.purpose.trim() ||
    !form.category.trim()
  ) {
    return;
  }

  emit("submit", {
    debtorName: form.debtorName,
    debtorEmail: form.debtorEmail,
    amount: form.amount,
    purpose: form.purpose,
    comment: form.comment.trim() || null,
    category: form.category,
    debtDate: form.debtDate.toISOString(),
    paidAt: form.paidAt?.toISOString() ?? null,
    notifyDebtor: form.notifyDebtor,
  });
  resetForm();
};
</script>

<template>
  <form class="grid gap-4" @submit.prevent="submit">
    <label v-if="knownDebtors.length" class="grid gap-2">
      <span class="text-sm font-medium text-stone-700">Bekannter Schuldner</span>
      <AutoComplete
        v-model="selectedDebtor"
        :suggestions="debtorSuggestions"
        option-label="label"
        placeholder="Schuldner suchen"
        dropdown
        force-selection
        @complete="searchDebtors"
        @item-select="applyKnownDebtor($event.value)"
        @clear="applyKnownDebtor(null)"
      />
    </label>

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

    <label
      class="flex items-center gap-3 rounded-lg border border-stone-200 px-3 py-2 text-sm text-stone-700"
    >
      <Checkbox v-model="form.notifyDebtor" binary input-id="notify-debtor-on-create" />
      <span>Schuldner per Mail informieren</span>
    </label>

    <Button
      type="submit"
      class="mobile-icon-button justify-self-end sm:w-full"
      icon="pi pi-check"
      label="Speichern"
      title="Speichern"
      aria-label="Speichern"
      :loading="saving"
      :disabled="saving || !canSubmit"
    />
  </form>
</template>
