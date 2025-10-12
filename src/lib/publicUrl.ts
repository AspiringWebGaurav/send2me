const FALLBACK_BASE_URL = "https://send2me.vercel.app";

const LOCAL_HOSTNAMES = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "::1",
  "[::1]",
]);

function ensureProtocol(raw: string): string {
  const trimmed = raw.replace(/^\s+|\s+$/g, "");
  if (!trimmed) return trimmed;
  if (/^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(trimmed)) {
    return trimmed;
  }
  // Handle protocol-relative URLs.
  if (trimmed.startsWith("//")) {
    return `https:${trimmed}`;
  }
  return `https://${trimmed}`;
}

export function normalizeBaseUrl(raw?: string | null): string | null {
  if (!raw) return null;
  const withProtocol = ensureProtocol(raw);
  if (!withProtocol) return null;
  try {
    const url = new URL(withProtocol);
    return url.origin;
  } catch {
    return null;
  }
}

function hostnameLooksLocal(hostname: string): boolean {
  const value = hostname.toLowerCase();
  if (LOCAL_HOSTNAMES.has(value)) return true;
  return value.endsWith(".localhost") || value.endsWith(".local");
}

export function isProbablyLocalBaseUrl(normalizedBase: string): boolean {
  try {
    const { hostname } = new URL(normalizedBase);
    return hostnameLooksLocal(hostname);
  } catch {
    return true;
  }
}

type ResolveOptions = {
  allowLocal?: boolean;
};

export function resolvePublicBaseUrl(
  preferred?: string | null,
  options: ResolveOptions = {}
): string {
  const { allowLocal = false } = options;

  const candidates: Array<{ value?: string | null; allowLocal: boolean }> = [
    { value: preferred, allowLocal },
    { value: process.env.NEXT_PUBLIC_PUBLIC_BASE_URL, allowLocal: false },
    { value: process.env.NEXT_PUBLIC_APP_URL, allowLocal: false },
    { value: process.env.VERCEL_URL, allowLocal: false },
    { value: FALLBACK_BASE_URL, allowLocal: true },
  ];

  for (const candidate of candidates) {
    const normalized = normalizeBaseUrl(candidate.value);
    if (!normalized) continue;
    if (!candidate.allowLocal && isProbablyLocalBaseUrl(normalized)) {
      continue;
    }
    return normalized;
  }

  return FALLBACK_BASE_URL;
}

export function getBaseUrlMeta() {
  const envNormalized = normalizeBaseUrl(process.env.NEXT_PUBLIC_PUBLIC_BASE_URL);
  const envIsReliable =
    !!envNormalized && !isProbablyLocalBaseUrl(envNormalized);

  const base = envIsReliable
    ? envNormalized
    : resolvePublicBaseUrl(undefined, { allowLocal: false });

  return {
    base,
    envIsReliable,
  };
}

export function buildProfileUrl(base: string, username: string): string {
  const normalizedBase =
    normalizeBaseUrl(base) ??
    resolvePublicBaseUrl(undefined, { allowLocal: true });
  const trimmedBase = normalizedBase.endsWith("/")
    ? normalizedBase.slice(0, -1)
    : normalizedBase;
  const safeUsername = encodeURIComponent(username.trim());
  return `${trimmedBase}/u/${safeUsername}`;
}
