import { defineStore } from "pinia";
import { ref } from "vue";

export const useStateStore = defineStore("state", () => {
  const page = ref("");
  const menu = ref("");
  const publicPage = ref(false);

  function $reset(): void {
    page.value = "";
    menu.value = "";
    publicPage.value = false;
  }

  return { page, menu, publicPage, $reset };
});
