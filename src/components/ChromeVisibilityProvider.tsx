"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

interface ChromeVisibilityContextType {
  setChromeHidden: (hidden: boolean) => void;
  isChromeHidden: boolean;
}

const ChromeVisibilityContext = createContext<ChromeVisibilityContextType | null>(null);

export function useChromeVisibility() {
  const context = useContext(ChromeVisibilityContext);
  if (!context) {
    throw new Error("useChromeVisibility must be used within a ChromeVisibilityProvider");
  }
  return context;
}

export function ChromeVisibilityProvider({ children }: { children: React.ReactNode }) {
  const [isChromeHidden, setIsChromeHidden] = useState(false);

  useEffect(() => {
    // Remove any leftover chrome-hidden class on mount
    document.body.classList.remove("chrome-hidden");
  }, []);

  const setChromeHidden = (hidden: boolean) => {
    setIsChromeHidden(hidden);
    if (hidden) {
      document.body.classList.add("chrome-hidden");
    } else {
      document.body.classList.remove("chrome-hidden");
    }
  };

  return (
    <ChromeVisibilityContext.Provider value={{ isChromeHidden, setChromeHidden }}>
      {children}
    </ChromeVisibilityContext.Provider>
  );
}