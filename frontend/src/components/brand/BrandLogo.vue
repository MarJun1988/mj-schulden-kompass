<script setup lang="ts">
withDefaults(
  defineProps<{
    compact?: boolean;
  }>(),
  {
    compact: false,
  },
);
</script>

<template>
  <span class="inline-flex min-w-0 items-center gap-2">
    <svg
      class="size-10 shrink-0 drop-shadow-sm"
      viewBox="0 0 128 128"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect width="128" height="128" rx="28" class="fill-slate-950 dark:fill-slate-100" />
      <circle cx="64" cy="64" r="42" class="fill-indigo-700 dark:fill-indigo-400" />
      <circle cx="64" cy="64" r="34" class="fill-sky-50 dark:fill-slate-950" />
      <path d="M74 23L82 45L104 53L82 61L74 83L66 61L44 53L66 45L74 23Z" class="fill-amber-500" />
      <path
        d="M39 77C39 72.5817 42.5817 69 47 69H89C93.4183 69 97 72.5817 97 77V89C97 93.4183 93.4183 97 89 97H47C42.5817 97 39 93.4183 39 89V77Z"
        class="fill-sky-500"
      />
      <path
        d="M50 79H78"
        class="stroke-sky-50 dark:stroke-slate-950"
        stroke-width="6"
        stroke-linecap="round"
      />
      <path
        d="M50 88H66"
        class="stroke-sky-50 dark:stroke-slate-950"
        stroke-width="6"
        stroke-linecap="round"
      />
      <circle cx="86" cy="84" r="6" class="fill-sky-50 dark:fill-slate-950" />
    </svg>
    <span v-if="!compact" class="hidden min-w-0 leading-tight sm:block">
      <span class="block text-lg font-semibold text-slate-950 dark:text-slate-100 sm:text-xl">
        SchuldKompass
      </span>
      <span class="hidden text-xs font-medium text-slate-500 dark:text-slate-400 sm:block">
        Schulden klar im Blick
      </span>
    </span>
  </span>
</template>
