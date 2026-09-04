import "element-plus/dist/index.css";
import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/governance.css";

import { createPinia } from "pinia";
import { createApp } from "vue";

import App from "./App.vue";
import { setUnauthorizedHandler } from "./api/client";
import { installPermissionDirective } from "./directives/permission";
import { createAppRouter } from "./router";
import { useAuthStore } from "./stores/auth";

const app = createApp(App);
const pinia = createPinia();
const router = createAppRouter(pinia);
setUnauthorizedHandler(() => {
  const currentPath = router.currentRoute.value.fullPath;
  useAuthStore(pinia).clearSession();
  if (router.currentRoute.value.path !== "/login") {
    void router.replace({
      path: "/login",
      query: { redirect: currentPath },
    });
  }
});
app.use(pinia).use(router);
installPermissionDirective(app);
app.mount("#app");
