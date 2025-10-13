"use client";

import { useEffect, useState } from "react";
import Router from "next/router";
import { FullScreenLoader } from "@/components/ui/FullScreenLoader";

const SHOW_DELAY_MS = 120;

export function RouteLoader() {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let delayTimeout: ReturnType<typeof setTimeout> | null = null;

    const start = () => {
      if (delayTimeout) clearTimeout(delayTimeout);
      delayTimeout = setTimeout(() => setLoading(true), SHOW_DELAY_MS);
    };

    const end = () => {
      if (delayTimeout) {
        clearTimeout(delayTimeout);
        delayTimeout = null;
      }
      setLoading(false);
    };

    Router.events.on("routeChangeStart", start);
    Router.events.on("routeChangeComplete", end);
    Router.events.on("routeChangeError", end);

    return () => {
      Router.events.off("routeChangeStart", start);
      Router.events.off("routeChangeComplete", end);
      Router.events.off("routeChangeError", end);
      if (delayTimeout) {
        clearTimeout(delayTimeout);
      }
    };
  }, []);

  if (!loading) return null;

  return <FullScreenLoader label="Loading the next view..." />;
}
