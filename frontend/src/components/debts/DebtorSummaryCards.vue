<script setup lang="ts">
import { currency } from "./debtFormatters";

defineProps<{
  summaries: Array<{
    name: string;
    email: string;
    amount: number;
    count: number;
  }>;
}>();
</script>

<template>
  <div v-if="summaries.length" class="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
    <div
      v-for="summary in summaries"
      :key="summary.email"
      class="rounded-md border border-sky-100 bg-sky-50 px-4 py-3"
    >
      <div class="flex items-start justify-between gap-3">
        <div>
          <p class="font-semibold text-stone-900">{{ summary.name }}</p>
          <p class="text-xs text-stone-500">{{ summary.email }}</p>
        </div>
        <p class="text-right font-semibold text-sky-800">
          {{ currency.format(summary.amount) }}
        </p>
      </div>
      <p class="mt-2 text-sm text-stone-500">
        {{ summary.count }} {{ summary.count === 1 ? "offener Eintrag" : "offene Einträge" }}
      </p>
    </div>
  </div>
</template>
