import "reflect-metadata";

import { createPinia } from "pinia";
import { type Component, createApp } from "vue";
import VueCookies from "vue-cookies";

import App from "./App.vue";
import router from "./router.ts";

import "./assets/main.css";

// Vite emits this when a dynamically imported chunk fails to load — typically
// after the dev server restarts or the machine sleeps/wakes, invalidating the
// hashed module URLs an open tab still references. Without a handler the tab
// 404s on every navigation until a manual hard reload. Reload once to pick up
// the fresh module graph; the guard keeps a genuinely-down server from
// causing a reload loop.
window.addEventListener("vite:preloadError", (event) => {
    const last = Number(sessionStorage.getItem("chunk-reload-at") ?? 0);
    if (Date.now() - last < 10_000) {
        return; // just reloaded and still failing — let the error surface
    }
    sessionStorage.setItem("chunk-reload-at", String(Date.now()));
    event.preventDefault();
    window.location.reload();
});

const app = createApp(App as Component);
const pinia = createPinia();
app.use(pinia);
app.use(router);
app.use(VueCookies);

app.mount("#app");
