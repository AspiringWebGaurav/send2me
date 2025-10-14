export const VERIFICATION_IP_COOKIE = "__s2_verify_ip";
export const VERIFICATION_IP_COOKIE_MAX_AGE = 60 * 10; // 10 minutes

export function decodeVerificationCookie(value: string | undefined | null): string | null {
  if (!value) {
    return null;
  }

  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}
