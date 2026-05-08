import type { ReactNode } from "react";
import { getCazuelaBrandingTokens } from "@/lib/cazuela/branding";
import { CazuelaBrandingProvider } from "@/lib/cazuela/branding-context";

export default async function CazuelaLayout({
  children,
}: {
  children: ReactNode;
}) {
  const tokens = await getCazuelaBrandingTokens();

  return (
    <CazuelaBrandingProvider tokens={tokens}>
      <div
        className="min-h-dvh"
        style={{
          backgroundColor: tokens.colors.pageBg,
          color: tokens.colors.text,
          fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
        }}
      >
        {children}
      </div>
    </CazuelaBrandingProvider>
  );
}
