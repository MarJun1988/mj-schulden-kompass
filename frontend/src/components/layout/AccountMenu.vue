<script setup lang="ts">
import Button from "primevue/button";
import Dialog from "primevue/dialog";
import InputText from "primevue/inputtext";
import Select from "primevue/select";
import { computed, onBeforeUnmount, onMounted, reactive, ref } from "vue";

import { useAuthStore, type User } from "../../stores/auth";
import { useThemeStore, type ThemePreference } from "../../stores/theme";

const props = defineProps<{
  user: User | null;
}>();

const emit = defineEmits<{
  logout: [];
}>();

const auth = useAuthStore();
const theme = useThemeStore();
const menuRef = ref<HTMLElement | null>(null);
const menuOpen = ref(false);
const passwordDialogOpen = ref(false);
const savingPassword = ref(false);
const passwordMessage = ref<string | null>(null);
const passwordError = ref<string | null>(null);
const passwordForm = reactive({
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
});
const themeOptions: Array<{ label: string; value: ThemePreference; icon: string }> = [
  { label: "Hell", value: "light", icon: "pi pi-sun" },
  { label: "System", value: "system", icon: "pi pi-desktop" },
  { label: "Dunkel", value: "dark", icon: "pi pi-moon" },
];

const initials = computed(() => {
  const name = props.user?.name?.trim();
  if (!name) {
    return "SK";
  }

  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.at(0)?.toUpperCase())
    .join("");
});

const displayName = computed(() => props.user?.name ?? "Account");
const displayEmail = computed(() => props.user?.email ?? "");

const resetPasswordForm = () => {
  passwordForm.currentPassword = "";
  passwordForm.newPassword = "";
  passwordForm.confirmPassword = "";
  passwordMessage.value = null;
  passwordError.value = null;
};

const openPasswordDialog = () => {
  menuOpen.value = false;
  resetPasswordForm();
  passwordDialogOpen.value = true;
};

const closePasswordDialog = () => {
  passwordDialogOpen.value = false;
  resetPasswordForm();
};

const toggleMenu = () => {
  menuOpen.value = !menuOpen.value;
};

const logout = () => {
  menuOpen.value = false;
  emit("logout");
};

const handleDocumentClick = (event: MouseEvent) => {
  const target = event.target;
  if (!(target instanceof Node) || menuRef.value?.contains(target)) {
    return;
  }

  menuOpen.value = false;
};

const submitPasswordChange = async () => {
  passwordMessage.value = null;
  passwordError.value = null;

  if (!passwordForm.currentPassword || !passwordForm.newPassword) {
    passwordError.value = "Bitte fülle alle Passwortfelder aus.";
    return;
  }

  if (passwordForm.newPassword.length < 8) {
    passwordError.value = "Das neue Passwort muss mindestens 8 Zeichen haben.";
    return;
  }

  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    passwordError.value = "Die neuen Passwörter stimmen nicht überein.";
    return;
  }

  savingPassword.value = true;

  try {
    await auth.changePassword({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
    });
    passwordMessage.value = "Dein Passwort wurde geändert.";
    passwordForm.currentPassword = "";
    passwordForm.newPassword = "";
    passwordForm.confirmPassword = "";
  } catch (error) {
    passwordError.value =
      error instanceof Error ? error.message : "Passwort konnte nicht geändert werden.";
  } finally {
    savingPassword.value = false;
  }
};

onMounted(() => {
  document.addEventListener("click", handleDocumentClick);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", handleDocumentClick);
});
</script>

<template>
  <div ref="menuRef" class="relative">
    <button
      type="button"
      class="flex min-h-10 items-center gap-2 rounded-full border border-slate-200 bg-white px-2 py-1 text-left shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-indigo-600 dark:hover:bg-slate-800"
      :aria-expanded="menuOpen"
      aria-haspopup="menu"
      @click.stop="toggleMenu"
    >
      <span
        class="grid size-8 place-items-center rounded-full bg-indigo-900 text-xs font-semibold text-white dark:bg-indigo-400 dark:text-indigo-950"
      >
        {{ initials }}
      </span>
      <span class="hidden min-w-0 sm:block">
        <span
          class="block max-w-40 truncate text-sm font-semibold text-stone-900 dark:text-stone-100"
        >
          {{ displayName }}
        </span>
        <span class="block max-w-40 truncate text-xs text-stone-500 dark:text-stone-400">
          {{ displayEmail }}
        </span>
      </span>
      <i class="pi pi-chevron-down text-xs text-stone-500 dark:text-stone-400" aria-hidden="true" />
    </button>

    <div
      v-if="menuOpen"
      class="absolute right-0 z-50 mt-3 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl shadow-slate-950/10 dark:border-slate-700 dark:bg-slate-900 dark:shadow-black/30"
      role="menu"
    >
      <div class="border-b border-stone-100 px-4 py-3 dark:border-stone-800">
        <p class="truncate text-sm font-semibold text-stone-900 dark:text-stone-100">
          {{ displayName }}
        </p>
        <p class="truncate text-xs text-stone-500 dark:text-stone-400">{{ displayEmail }}</p>
      </div>
      <div class="border-b border-stone-100 px-4 py-3 dark:border-stone-800">
        <label class="grid gap-2">
          <span
            class="text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400"
          >
            Darstellung
          </span>
          <Select
            v-model="theme.preference"
            :options="themeOptions"
            option-label="label"
            option-value="value"
            class="w-full"
            size="small"
            placeholder="Darstellung"
            @update:model-value="theme.setPreference"
          >
            <template #value="{ value }">
              <div
                v-if="themeOptions.find((option) => option.value === value)"
                class="flex items-center gap-2"
              >
                <span :class="themeOptions.find((option) => option.value === value)?.icon" />
                <span>{{ themeOptions.find((option) => option.value === value)?.label }}</span>
              </div>
            </template>
            <template #option="{ option }">
              <div class="flex items-center gap-2">
                <span :class="option.icon" />
                <span>{{ option.label }}</span>
              </div>
            </template>
          </Select>
        </label>
      </div>
      <button
        type="button"
        class="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-stone-700 transition hover:bg-stone-50 dark:text-stone-200 dark:hover:bg-stone-800"
        role="menuitem"
        @click="openPasswordDialog"
      >
        <i class="pi pi-lock text-indigo-700 dark:text-indigo-300" aria-hidden="true" />
        <span>Kennwort ändern</span>
      </button>
      <button
        type="button"
        class="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-red-700 transition hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-950/40"
        role="menuitem"
        @click="logout"
      >
        <i class="pi pi-sign-out" aria-hidden="true" />
        <span>Abmelden</span>
      </button>
    </div>

    <Dialog
      v-model:visible="passwordDialogOpen"
      modal
      header="Kennwort ändern"
      class="w-[calc(100vw-2rem)] max-w-md"
      @hide="resetPasswordForm"
    >
      <form class="space-y-4" @submit.prevent="submitPasswordChange">
        <label class="block space-y-1">
          <span class="text-sm font-medium text-stone-700 dark:text-stone-200"
            >Aktuelles Kennwort</span
          >
          <InputText
            v-model="passwordForm.currentPassword"
            type="password"
            autocomplete="current-password"
            class="w-full"
          />
        </label>
        <label class="block space-y-1">
          <span class="text-sm font-medium text-stone-700 dark:text-stone-200">Neues Kennwort</span>
          <InputText
            v-model="passwordForm.newPassword"
            type="password"
            autocomplete="new-password"
            class="w-full"
          />
        </label>
        <label class="block space-y-1">
          <span class="text-sm font-medium text-stone-700 dark:text-stone-200">
            Neues Kennwort wiederholen
          </span>
          <InputText
            v-model="passwordForm.confirmPassword"
            type="password"
            autocomplete="new-password"
            class="w-full"
          />
        </label>

        <p
          v-if="passwordError"
          class="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/60 dark:text-red-200"
        >
          {{ passwordError }}
        </p>
        <p
          v-if="passwordMessage"
          class="rounded-md bg-sky-50 px-3 py-2 text-sm text-sky-800 dark:bg-sky-950/60 dark:text-sky-100"
        >
          {{ passwordMessage }}
        </p>

        <div class="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            label="Abbrechen"
            severity="secondary"
            outlined
            class="w-full sm:w-auto"
            @click="closePasswordDialog"
          />
          <Button
            type="submit"
            label="Speichern"
            icon="pi pi-check"
            class="w-full sm:w-auto"
            :loading="savingPassword"
          />
        </div>
      </form>
    </Dialog>
  </div>
</template>
