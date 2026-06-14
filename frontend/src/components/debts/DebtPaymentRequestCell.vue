<script setup lang="ts">
import Button from "primevue/button";
import Dialog from "primevue/dialog";
import Textarea from "primevue/textarea";
import { ref } from "vue";

import type { DebtPaymentStatus } from "../../stores/debts";

const props = defineProps<{
  debtId: string;
  status: DebtPaymentStatus | null;
  reason: string | null;
}>();

const emit = defineEmits<{
  request: [id: string, reason: string];
}>();

const paymentRemark = ref("");
const dialogVisible = ref(false);
const formId = "debt-payment-request-form";

const openDialog = () => {
  paymentRemark.value = "";
  dialogVisible.value = true;
};

const closeDialog = () => {
  dialogVisible.value = false;
  paymentRemark.value = "";
};

const submit = () => {
  const reason = paymentRemark.value.trim();

  if (!reason) {
    return;
  }

  emit("request", props.debtId, reason);
  closeDialog();
};
</script>

<template>
  <div class="flex items-center justify-end gap-2">
    <p
      v-if="status === 'PENDING'"
      class="text-sm font-medium text-amber-700"
      :title="reason ?? undefined"
    >
      Zahlung beantragt
    </p>
    <p v-else-if="status === 'REJECTED'" class="text-sm font-medium text-rose-700">
      Zahlung abgelehnt
    </p>
    <Button
      class="icon-action-button justify-self-end"
      icon="pi pi-check-circle"
      label="Als bezahlt melden"
      size="small"
      severity="success"
      :title="status === 'PENDING' ? 'Zahlungsantrag läuft bereits' : 'Als bezahlt melden'"
      aria-label="Als bezahlt melden"
      :disabled="status === 'PENDING'"
      @click="openDialog"
    />

    <Dialog
      v-model:visible="dialogVisible"
      modal
      header="Als bezahlt melden"
      class="w-[calc(100vw-2rem)] max-w-md"
      @hide="paymentRemark = ''"
    >
      <form :id="formId" class="grid gap-4" @submit.prevent="submit">
        <p
          v-if="status === 'REJECTED'"
          class="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-950/60 dark:text-amber-200"
        >
          Dein letzter Zahlungsantrag wurde abgelehnt. Bitte gib eine neue Bemerkung an.
        </p>
        <label class="grid gap-2">
          <span class="text-sm font-medium text-stone-700 dark:text-stone-200"
            >Bemerkung <span class="text-rose-600">*</span></span
          >
          <Textarea
            v-model="paymentRemark"
            rows="4"
            auto-resize
            placeholder="Warum möchtest du die Schuld als bezahlt melden?"
            required
          />
        </label>
      </form>
      <template #footer>
        <div class="mt-3 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            label="Abbrechen"
            severity="secondary"
            outlined
            class="w-full sm:w-auto"
            @click="closeDialog"
          />
          <Button
            type="submit"
            form="debt-payment-request-form"
            icon="pi pi-check-circle"
            label="Beantragen"
            severity="success"
            class="w-full sm:w-auto"
            :disabled="!paymentRemark.trim()"
          />
        </div>
      </template>
    </Dialog>
  </div>
</template>
