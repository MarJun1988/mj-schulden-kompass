<script setup lang="ts">
import Button from "primevue/button";
import Card from "primevue/card";
import InputText from "primevue/inputtext";
import Password from "primevue/password";
import SelectButton from "primevue/selectbutton";
import { reactive, ref } from "vue";
import { useRouter } from "vue-router";

import BrandLogo from "../components/brand/BrandLogo.vue";
import { useAuthStore } from "../stores/auth";

const router = useRouter();
const auth = useAuthStore();
const mode = ref<"login" | "register">("login");
const error = ref<string | null>(null);
const success = ref<string | null>(null);
const loading = ref(false);

const modeOptions = [
  { label: "Login", value: "login" },
  { label: "Registrieren", value: "register" },
];

const form = reactive({
  name: "",
  email: "",
  password: "",
});

const submit = async () => {
  error.value = null;
  success.value = null;
  loading.value = true;

  try {
    if (mode.value === "register") {
      await auth.register({
        name: form.name,
        email: form.email,
        password: form.password,
      });
      success.value = `Wir haben dir einen Aktivierungslink an ${form.email} gesendet.`;
      mode.value = "login";
      form.password = "";
    } else {
      await auth.login({
        email: form.email,
        password: form.password,
      });
      await router.push("/");
    }
  } catch (submitError) {
    error.value = submitError instanceof Error ? submitError.message : "Anmeldung fehlgeschlagen";
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <section class="mx-auto grid min-h-[70vh] max-w-md place-items-center">
    <Card class="w-full">
      <template #content>
        <div class="mb-6 flex justify-center">
          <BrandLogo />
        </div>
        <form class="grid gap-4" @submit.prevent="submit">
          <SelectButton
            v-model="mode"
            :options="modeOptions"
            option-label="label"
            option-value="value"
          />

          <label v-if="mode === 'register'" class="grid gap-2">
            <span class="text-sm font-medium text-stone-700">Name</span>
            <InputText v-model="form.name" autocomplete="name" required />
          </label>

          <label class="grid gap-2">
            <span class="text-sm font-medium text-stone-700">E-Mail</span>
            <InputText v-model="form.email" type="email" autocomplete="email" required />
          </label>

          <label class="grid gap-2">
            <span class="text-sm font-medium text-stone-700">Passwort</span>
            <Password
              v-model="form.password"
              :feedback="mode === 'register'"
              autocomplete="current-password"
              input-class="w-full"
              required
              toggle-mask
            />
          </label>

          <p v-if="error" class="text-sm text-rose-700">{{ error }}</p>
          <p v-if="success" class="text-sm text-emerald-700">{{ success }}</p>

          <Button
            type="submit"
            icon="pi pi-lock"
            :label="mode === 'register' ? 'Konto erstellen' : 'Einloggen'"
            :loading="loading"
          />
        </form>
      </template>
    </Card>
  </section>
</template>
