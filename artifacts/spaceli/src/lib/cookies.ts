export type CookieConsent = {
  necessary: true;
  analytics: boolean;
  acceptedAt: string;
};

export function getCookieConsent(): CookieConsent | null {
  try {
    const raw = localStorage.getItem("ledi_cookie_consent");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
