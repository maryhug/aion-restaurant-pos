"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { TokenShape } from "@/lib/aion/token-types";
import { cazuela as fallback } from "./tokens";

const CazuelaBrandingContext = createContext<TokenShape>(fallback);

export function CazuelaBrandingProvider({
  tokens,
  children,
}: {
  tokens: TokenShape;
  children: ReactNode;
}) {
  return (
    <CazuelaBrandingContext.Provider value={tokens}>
      {children}
    </CazuelaBrandingContext.Provider>
  );
}

export function useCazuelaBranding(): TokenShape {
  return useContext(CazuelaBrandingContext);
}
