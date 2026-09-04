const TOKEN_KEY = "roamly.admin.token";

export function readAdminToken(): string | null {
  return window.localStorage.getItem(TOKEN_KEY);
}

export function writeAdminToken(token: string): void {
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearAdminToken(): void {
  window.localStorage.removeItem(TOKEN_KEY);
}

export { TOKEN_KEY };
