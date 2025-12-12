import './assets/main.css';
import 'reflect-metadata';
import { createPinia } from 'pinia';
import { createApp } from 'vue';
import VueCookies from 'vue-cookies';
import App from './App.vue';
import router from './router.ts';

const app = createApp(App);
const pinia = createPinia();
app.use(pinia);
app.use(router);
app.use(VueCookies);

app.mount('#app');
