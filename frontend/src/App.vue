<script setup lang="ts">
import Menubar from "primevue/menubar";
import Toast from "primevue/toast";
import { computed, onMounted } from "vue";
import { useRouter } from "vue-router";

import BrandLogo from "./components/brand/BrandLogo.vue";
import AccountMenu from "./components/layout/AccountMenu.vue";
import { useAuthStore } from "./stores/auth";
import { useThemeStore } from "./stores/theme";

const router = useRouter();
const auth = useAuthStore();
const theme = useThemeStore();

const items = computed(() =>
  auth.token
    ? [
        { label: "Dashboard", icon: "pi pi-chart-line", route: "/" },
        { label: "Schulden", icon: "pi pi-wallet", route: "/debts" },
        { label: "Auswertung", icon: "pi pi-chart-bar", route: "/analytics" },
        { label: "Hilfe", icon: "pi pi-question-circle", href: "/docs/" },
      ]
    : [],
);

const logout = async () => {
  auth.logout();
  await router.push("/login");
};

onMounted(() => {
  theme.init();
  void auth.loadMe();
});
</script>

<template>
  <div class="app-shell min-h-screen text-slate-950 transition-colors dark:text-slate-100">
    <Toast position="top-right" />
    <header class="app-header sticky top-0 z-40 border-b transition-colors">
      <div class="w-full px-3 py-3 sm:px-5 lg:px-8">
        <Menubar
          :model="items"
          aria-label="Hauptnavigation"
          class="app-menubar w-full border-none p-2"
        >
          <template #start>
            <RouterLink
              to="/"
              class="mr-3 inline-flex rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500"
              aria-label="Zur Startseite"
            >
              <BrandLogo />
            </RouterLink>
          </template>

          <template #item="{ item, props }">
            <RouterLink
              v-if="item.route"
              v-slot="{ href, navigate, isActive, isExactActive }"
              :to="item.route"
              custom
            >
              <a
                v-bind="props.action"
                :href="href"
                :class="[
                  'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition',
                  isActive && (item.route !== '/' || isExactActive)
                    ? 'bg-violet-600 text-white shadow-sm shadow-violet-950/20 dark:bg-violet-400 dark:text-violet-950'
                    : 'text-slate-700 hover:bg-cyan-50 hover:text-slate-950 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-slate-50',
                ]"
                @click="navigate"
              >
                <span :class="item.icon" />
                <span>{{ item.label }}</span>
              </a>
            </RouterLink>
            <a
              v-else-if="item.href"
              v-bind="props.action"
              :href="item.href"
              class="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-cyan-50 hover:text-slate-950 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-slate-50"
            >
              <span :class="item.icon" />
              <span>{{ item.label }}</span>
            </a>
          </template>

          <template #end>
            <div class="flex items-center justify-end gap-2 sm:gap-3">
              <AccountMenu v-if="auth.token" :user="auth.user" @logout="logout" />
            </div>
          </template>
        </Menubar>
      </div>
    </header>

    <main class="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <RouterView />
    </main>
  </div>
</template>
