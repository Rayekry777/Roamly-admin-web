import type { App, Directive } from "vue";

import { useAuthStore } from "@/stores/auth";

export const permissionDirective: Directive<HTMLElement, string> = {
  mounted(element, binding) {
    if (!useAuthStore().hasPermission(binding.value)) {
      element.hidden = true;
      element.setAttribute("aria-hidden", "true");
    }
  },
};

export function installPermissionDirective(app: App): void {
  app.directive("permission", permissionDirective);
}
