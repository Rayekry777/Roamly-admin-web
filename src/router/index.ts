import { createRouter, createWebHistory } from "vue-router";

export const routes = [
  {
    path: "/",
    name: "foundation",
    component: () => import("@/views/FoundationView.vue"),
  },
];

export default createRouter({
  history: createWebHistory(),
  routes,
});
