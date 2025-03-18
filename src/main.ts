import './assets/main.scss';
import 'reflect-metadata';
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import VueCookies from 'vue-cookies';
// import VueMatomo from 'vue-matomo';

import App from './App.vue';
import router from './router';

const app = createApp(App);
const pinia = createPinia();
app.use(pinia);
app.use(router);
app.use(VueCookies);

// app.use(VueMatomo, {
//     // Configure your matomo server and site by providing
//     host: 'https://matomo.codeclarity.io',
//     siteId: 2,
//     router: router,
//     disableCookies: true
// });

app.mount('#app');

// window.Piwik.getTracker
// this.$matomo
// window._paq.push(['trackPageView']);
