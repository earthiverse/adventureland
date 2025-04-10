import App from "./App.vue";
import "./style.css";
import { createPinia } from "pinia";
import { createPersistedState } from 'pinia-plugin-persistedstate';
import { createApp, type Component } from "vue";

const app = createApp(App as Component);

const pinia = createPinia();
pinia.use(createPersistedState());
app.use(pinia);

app.mount("#app");
