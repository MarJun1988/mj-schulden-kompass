<script setup lang="ts">
import Button from "primevue/button";

import type { Debt } from "../../stores/debts";

defineProps<{
  debt: Debt;
  showActions?: boolean;
}>();

defineEmits<{
  approve: [id: string];
  reject: [id: string];
}>();
</script>

<template>
  <div class="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
    <div>
      <div v-if="debt.deletionStatus === 'PENDING'" class="max-w-72">
        <p class="font-medium text-rose-700">Beantragt</p>
        <p class="break-words text-xs text-stone-600">{{ debt.deletionReason }}</p>
      </div>
      <p v-else-if="debt.deletionStatus === 'REJECTED'" class="text-sm text-stone-500">Abgelehnt</p>
      <span v-else class="text-stone-400">-</span>
    </div>

    <div
      v-if="showActions && debt.deletionStatus === 'PENDING'"
      class="grid gap-2 sm:flex sm:justify-end"
    >
      <Button
        class="icon-action-button"
        icon="pi pi-times"
        label="Ablehnen"
        size="small"
        severity="secondary"
        title="Löschantrag ablehnen"
        aria-label="Löschantrag ablehnen"
        @click="$emit('reject', debt.id)"
      />
      <Button
        class="icon-action-button"
        icon="pi pi-trash"
        label="Löschen"
        size="small"
        severity="danger"
        title="Schuld löschen"
        aria-label="Schuld löschen"
        @click="$emit('approve', debt.id)"
      />
    </div>
  </div>
</template>
