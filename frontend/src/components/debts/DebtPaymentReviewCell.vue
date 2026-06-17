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
      <div v-if="debt.paymentStatus === 'PENDING'" class="max-w-72">
        <p class="font-medium text-amber-700">Zahlung beantragt</p>
        <p class="break-words text-xs text-stone-600">{{ debt.paymentReason }}</p>
      </div>
      <p v-else-if="debt.paymentStatus === 'REJECTED'" class="text-sm text-stone-500">
        Zahlung abgelehnt
      </p>
      <span v-else class="text-stone-400">-</span>
    </div>

    <div
      v-if="showActions && debt.paymentStatus === 'PENDING'"
      class="grid gap-2 sm:flex sm:justify-end"
    >
      <Button
        class="icon-action-button"
        icon="pi pi-times"
        label="Ablehnen"
        size="small"
        severity="secondary"
        title="Zahlungsantrag ablehnen"
        aria-label="Zahlungsantrag ablehnen"
        @click="$emit('reject', debt.id)"
      />
      <Button
        class="icon-action-button"
        icon="pi pi-check-circle"
        label="Als bezahlt markieren"
        size="small"
        severity="success"
        title="Zahlung bestätigen"
        aria-label="Zahlung bestätigen"
        @click="$emit('approve', debt.id)"
      />
    </div>
  </div>
</template>
