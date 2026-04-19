export interface ConsentPreferences {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  version: number;
}

export const CONSENT_COOKIE = "cookie-consent";
const DAYS = 365;

export function getConsent(): ConsentPreferences | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${CONSENT_COOKIE}=([^;]*)`));
  if (!match) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(match[1]));
    // Handle legacy "accepted"/"refused" string values
    if (typeof parsed === "string") {
      return { necessary: true, analytics: parsed === "accepted", marketing: false, version: 1 };
    }
    return parsed as ConsentPreferences;
  } catch {
    return null;
  }
}

export function saveConsent(prefs: { analytics: boolean; marketing: boolean }): void {
  const full: ConsentPreferences = { necessary: true, ...prefs, version: 1 };
  const expires = new Date(Date.now() + DAYS * 864e5).toUTCString();
  document.cookie = `${CONSENT_COOKIE}=${encodeURIComponent(JSON.stringify(full))}; expires=${expires}; path=/; SameSite=Lax`;
  window.dispatchEvent(new CustomEvent("consent-updated", { detail: full }));
}

export function hasConsented(): boolean {
  return getConsent() !== null;
}

export function openConsentModal(): void {
  window.dispatchEvent(new CustomEvent("open-consent-modal"));
}
