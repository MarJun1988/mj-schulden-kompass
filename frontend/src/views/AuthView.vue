<script setup lang="ts">
import Button from "primevue/button";
import Card from "primevue/card";
import FloatLabel from "primevue/floatlabel";
import InputText from "primevue/inputtext";
import Password from "primevue/password";
import SelectButton from "primevue/selectbutton";
import { computed, reactive, ref } from "vue";
import { useRouter } from "vue-router";

import BrandLogo from "../components/brand/BrandLogo.vue";
import { useAuthStore } from "../stores/auth";
import { useFormUiStore } from "../stores/formUi";

const router = useRouter();
const auth = useAuthStore();
const formUi = useFormUiStore();
const mode = ref<"login" | "register">("login");
const error = ref<string | null>(null);
const success = ref<string | null>(null);
const loading = ref(false);
const canSubmit = computed(() =>
  mode.value === "register"
    ? Boolean(form.name.trim() && form.email.trim() && form.password.trim())
    : Boolean(form.email.trim() && form.password.trim()),
);

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

          <FloatLabel v-if="mode === 'register'" :variant="formUi.floatLabelVariant">
            <InputText
              id="auth-name"
              v-model="form.name"
              class="w-full"
              autocomplete="name"
              required
            />
            <label for="auth-name">Name *</label>
          </FloatLabel>

          <FloatLabel :variant="formUi.floatLabelVariant">
            <InputText
              id="auth-email"
              v-model="form.email"
              class="w-full"
              type="email"
              autocomplete="email"
              required
            />
            <label for="auth-email">E-Mail *</label>
          </FloatLabel>

          <FloatLabel :variant="formUi.floatLabelVariant">
            <Password
              input-id="auth-password"
              v-model="form.password"
              class="w-full"
              :feedback="mode === 'register'"
              autocomplete="current-password"
              input-class="w-full"
              required
              toggle-mask
            />
            <label for="auth-password">Passwort *</label>
          </FloatLabel>

          <p v-if="error" class="text-sm text-rose-700">{{ error }}</p>
          <p v-if="success" class="text-sm text-emerald-700">{{ success }}</p>

          <Button
            type="submit"
            icon="pi pi-lock"
            :label="mode === 'register' ? 'Konto erstellen' : 'Einloggen'"
            :loading="loading"
            :disabled="loading || !canSubmit"
          />
        </form>
      </template>
    </Card>
  </section>
</template>
