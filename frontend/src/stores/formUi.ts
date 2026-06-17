import { defineStore } from "pinia";

export type FloatLabelVariant = "over" | "in" | "on";

export const useFormUiStore = defineStore("formUi", {
  state: () => ({
    floatLabelVariant: "in" as FloatLabelVariant,
  }),
  actions: {
    setFloatLabelVariant(variant: FloatLabelVariant) {
      this.floatLabelVariant = variant;
    },
  },
});
