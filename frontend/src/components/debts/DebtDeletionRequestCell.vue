<script setup lang="ts">
import Button from "primevue/button";
import Dialog from "primevue/dialog";
import FloatLabel from "primevue/floatlabel";
import Textarea from "primevue/textarea";
import { ref } from "vue";

import type { DebtDeletionStatus } from "../../stores/debts";
import { useFormUiStore } from "../../stores/formUi";
import { deletionStatusText } from "./debtFormatters";

const props = defineProps<{
  debtId: string;
  status: DebtDeletionStatus | null;
  reason: string | null;
}>();

const emit = defineEmits<{
  request: [id: string, reason: string];
}>();

const formUi = useFormUiStore();
const deletionReason = ref("");
const dialogVisible = ref(false);
const formId = "debt-deletion-request-form";

const openDialog = () => {
  deletionReason.value = "";
  dialogVisible.value = true;
};

const closeDialog = () => {
  dialogVisible.value = false;
  deletionReason.value = "";
};

const submit = () => {
  const reason = deletionReason.value.trim();

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
      {{ deletionStatusText(status) }}
    </p>
    <Button
      v-if="status !== 'PENDING'"
      class="icon-action-button justify-self-end"
      :icon="status === 'REJECTED' ? 'pi pi-refresh' : 'pi pi-trash'"
      label="Löschung beantragen"
      size="small"
      severity="danger"
      :title="status === 'REJECTED' ? 'Löschung erneut beantragen' : 'Löschung beantragen'"
      :aria-label="status === 'REJECTED' ? 'Löschung erneut beantragen' : 'Löschung beantragen'"
      @click="openDialog"
    />

    <Dialog
      v-model:visible="dialogVisible"
      modal
      header="Löschung beantragen"
      class="w-[calc(100vw-2rem)] max-w-md"
      @hide="deletionReason = ''"
    >
      <form :id="formId" class="mt-3 grid gap-5" @submit.prevent="submit">
        <p
          v-if="status === 'REJECTED'"
          class="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950/60 dark:text-rose-200"
        >
          Der letzte Löschantrag wurde abgelehnt. Du kannst mit einer neuen Begründung erneut
          anfragen.
        </p>
        <FloatLabel :variant="formUi.floatLabelVariant">
          <Textarea
            id="debt-deletion-request-reason"
            v-model="deletionReason"
            class="w-full"
            rows="4"
            auto-resize
            required
          />
          <label for="debt-deletion-request-reason">Begründung *</label>
        </FloatLabel>
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
            form="debt-deletion-request-form"
            icon="pi pi-trash"
            label="Beantragen"
            severity="danger"
            class="w-full sm:w-auto"
            :disabled="!deletionReason.trim()"
          />
        </div>
      </template>
    </Dialog>
  </div>
</template>
