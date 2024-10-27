import { ref } from 'vue';
import { defineStore } from 'pinia';

export interface StateStore {
    page: string;
    menu: string;
    publicPage: boolean;
}

export const useStateStore = defineStore('state', () => {
    const page = ref('');
    const menu = ref('');
    const publicPage = ref(false);

    function $reset() {
        page.value = '';
        menu.value = '';
        publicPage.value = false;
    }

    return { page, menu, publicPage, $reset };
});
