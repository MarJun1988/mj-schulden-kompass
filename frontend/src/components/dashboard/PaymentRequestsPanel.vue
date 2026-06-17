<script setup lang="ts">
import Button from "primevue/button";
import Card from "primevue/card";

import type { Debt } from "../../stores/debts";
import { currency, formatDate } from "../debts/debtFormatters";

defineProps<{
  requests: Debt[];
}>();

defineEmits<{
  approve: [id: string];
  reject: [id: string];
}>();
</script>

<template>
  <Card>
    <template #title>Zahlungsanträge</template>
    <template #content>
      <div v-if="requests.length" class="grid gap-3">
        <div
          v-for="debt in requests"
          :key="debt.id"
          class="rounded-md border border-amber-100 bg-amber-50 px-4 py-3"
        >
          <div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p class="font-semibold text-stone-900">{{ debt.debtorName }} meldet bezahlt</p>
              <p class="text-sm text-stone-600">
                {{ debt.purpose }} · {{ debt.category }} · {{ currency.format(debt.amount) }}
              </p>
              <p v-if="debt.comment" class="mt-1 text-xs text-stone-600">{{ debt.comment }}</p>
              <p class="mt-1 text-xs text-stone-500">
                Eingetragen am {{ formatDate(debt.debtDate) }}
              </p>
              <p class="mt-2 text-sm text-amber-800">{{ debt.paymentReason }}</p>
            </div>
            <div class="flex shrink-0 justify-end gap-2">
              <Button
                class="mobile-icon-button"
                icon="pi pi-times"
                label="Ablehnen"
                size="small"
                severity="secondary"
                title="Zahlungsantrag ablehnen"
                aria-label="Zahlungsantrag ablehnen"
                @click="$emit('reject', debt.id)"
              />
              <Button
                class="mobile-icon-button"
                icon="pi pi-check-circle"
                label="Bestätigen"
                size="small"
                severity="success"
                title="Zahlung bestätigen"
                aria-label="Zahlung bestätigen"
                @click="$emit('approve', debt.id)"
              />
            </div>
          </div>
        </div>
      </div>
      <p v-else class="text-sm text-stone-500">Keine offenen Zahlungsanträge.</p>
    </template>
  </Card>
</template>
