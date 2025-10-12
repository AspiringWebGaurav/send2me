"use client";

import { useEffect, useMemo, useState } from "react";
import { getBaseUrlMeta, normalizeBaseUrl } from "@/lib/publicUrl";

export function usePreferredBaseUrl(): string {
  const meta = useMemo(() => getBaseUrlMeta(), []);
  const [baseUrl, setBaseUrl] = useState(meta.base);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const runtimeBase = normalizeBaseUrl(window.location.origin);
    if (!runtimeBase) return;
    if (!meta.envIsReliable) {
      setBaseUrl((current) =>
        current === runtimeBase ? current : runtimeBase
      );
    }
  }, [meta.envIsReliable]);

  return baseUrl;
}
