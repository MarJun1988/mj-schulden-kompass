import { createRouter, createWebHistory } from "vue-router";

import { getAuthToken } from "../lib/graphql";

const AuthView = () => import("../views/AuthView.vue");
const ActivateAccountView = () => import("../views/ActivateAccountView.vue");
const AnalyticsView = () => import("../views/AnalyticsView.vue");
const DashboardView = () => import("../views/DashboardView.vue");
const DebtsView = () => import("../views/DebtsView.vue");
const VersionView = () => import("../views/HelpView.vue");

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/login",
      name: "login",
      component: AuthView,
      meta: { public: true },
    },
    {
      path: "/activate",
      name: "activate",
      component: ActivateAccountView,
      meta: { public: true },
    },
    {
      path: "/",
      name: "dashboard",
      component: DashboardView,
    },
    {
      path: "/debts",
      name: "debts",
      component: DebtsView,
    },
    {
      path: "/analytics",
      name: "analytics",
      component: AnalyticsView,
    },
    {
      path: "/version",
      name: "version",
      component: VersionView,
    },
    {
      path: "/transactions",
      redirect: "/debts",
    },
  ],
});

router.beforeEach((to) => {
  if (!to.meta.public && !getAuthToken()) {
    return "/login";
  }

  if (to.name === "login" && getAuthToken()) {
    return "/";
  }
});

export default router;
