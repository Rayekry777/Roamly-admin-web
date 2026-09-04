import { defineStore } from "pinia";
import { computed, ref } from "vue";

import { getCurrentAdmin, loginAdmin, logoutAdmin } from "@/api/admin";
import type { CurrentAdmin } from "@/types/admin";
import {
  clearAdminToken,
  readAdminToken,
  writeAdminToken,
} from "@/utils/session";

export const useAuthStore = defineStore("admin-auth", () => {
  const token = ref<string | null>(readAdminToken());
  const current = ref<CurrentAdmin | null>(null);
  const loading = ref(false);
  const isAuthenticated = computed(() => Boolean(token.value));
  const forcePasswordChange = computed(
    () => current.value?.forcePasswordChange === true,
  );

  function clearSession(): void {
    clearAdminToken();
    token.value = null;
    current.value = null;
  }

  async function loadCurrent(force = false): Promise<CurrentAdmin> {
    if (current.value && !force) return current.value;
    const profile = await getCurrentAdmin();
    current.value = profile;
    return profile;
  }

  async function login(
    username: string,
    password: string,
  ): Promise<CurrentAdmin> {
    loading.value = true;
    try {
      const session = await loginAdmin(username, password);
      writeAdminToken(session.token);
      token.value = session.token;
      return await loadCurrent(true);
    } catch (error) {
      clearSession();
      throw error;
    } finally {
      loading.value = false;
    }
  }

  async function logout(): Promise<void> {
    try {
      if (token.value) await logoutAdmin();
    } finally {
      clearSession();
    }
  }

  function hasPermission(permission?: string): boolean {
    return (
      !permission || current.value?.permissions.includes(permission) === true
    );
  }

  return {
    token,
    current,
    loading,
    isAuthenticated,
    forcePasswordChange,
    clearSession,
    loadCurrent,
    login,
    logout,
    hasPermission,
  };
});
