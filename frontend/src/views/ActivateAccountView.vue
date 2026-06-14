<script setup lang="ts">
import Button from "primevue/button";
import Card from "primevue/card";
import Message from "primevue/message";
import ProgressSpinner from "primevue/progressspinner";
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";

import BrandLogo from "../components/brand/BrandLogo.vue";
import { useAuthStore } from "../stores/auth";

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const loading = ref(true);
const error = ref<string | null>(null);
const verified = ref(false);

const token = computed(() => {
  const value = route.query.token;
  return typeof value === "string" ? value : "";
});

onMounted(async () => {
  if (!token.value) {
    error.value = "Der Aktivierungslink ist unvollständig.";
    loading.value = false;
    return;
  }

  try {
    await auth.verifyEmail(token.value);
    verified.value = true;
  } catch (activationError) {
    error.value =
      activationError instanceof Error
        ? activationError.message
        : "Deine E-Mail konnte nicht bestätigt werden.";
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <section class="mx-auto grid min-h-[70vh] max-w-md place-items-center">
    <Card class="w-full">
      <template #content>
        <div class="mb-6 flex justify-center">
          <BrandLogo />
        </div>

        <div v-if="loading" class="grid justify-items-center gap-4 py-8 text-center">
          <ProgressSpinner />
          <p class="text-sm text-stone-500">E-Mail-Adresse wird bestätigt...</p>
        </div>

        <div v-else-if="verified" class="grid gap-4 text-center">
          <Message severity="success" :closable="false">
            Deine E-Mail-Adresse wurde bestätigt.
          </Message>
          <Button
            icon="pi pi-arrow-right"
            label="Zum Dashboard"
            class="justify-self-center"
            @click="router.push('/')"
          />
        </div>

        <div v-else class="grid gap-4 text-center">
          <Message severity="error" :closable="false">
            {{ error }}
          </Message>
          <Button
            icon="pi pi-sign-in"
            label="Zum Login"
            class="justify-self-center"
            @click="router.push('/login')"
          />
        </div>
      </template>
    </Card>
  </section>
</template>
