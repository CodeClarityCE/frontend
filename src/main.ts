import "reflect-metadata";

import { createPinia } from "pinia";
import { type Component, createApp } from "vue";
import VueCookies from "vue-cookies";

import App from "./App.vue";
import router from "./router.ts";

import "./assets/main.css";

const app = createApp(App as Component);
const pinia = createPinia();
app.use(pinia);
app.use(router);
app.use(VueCookies);

app.mount("#app");
