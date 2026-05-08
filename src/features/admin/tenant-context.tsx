"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { applyTenantTheme } from "@/features/admin/helpers";
import type { Tenant } from "@/features/admin/types";

const DEFAULT_TENANT: Tenant = {
  id: "loading",
  restaurantId: "",
  restaurantName: "Cargando…",
  branches: [],
  activeBranchId: "",
  branding: {
    primary: "#581c22",
    secondary: "#7b4b52",
    accent: "#d97706",
    background: "#ffe5e5",
    defaultMode: "light",
  },
  settings: {
    currency: "COP",
    timezone: "America/Bogota",
    taxRate: 19,
    tipSuggestion: 10,
    enabledPayments: ["cash", "card", "transfer"],
    cancellationPolicy: "",
    reservationToleranceMin: 15,
    maxReservationDurationMin: 120,
    shifts: [],
    notifications: {
      lowStock: true,
      cashDiff: true,
      payrollReminders: true,
      upcomingReservations: true,
    },
  },
  featureFlags: { multiBranch: false, payroll: true, chatbot: false },
};

type ConfigResponse = {
  restaurantId: string;
  restaurant: { name: string; address: string; phone: string };
  branding: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    backgroundColor: string;
    logoUrl: string | null;
  };
  settings: {
    currency: string;
    timezone: string;
    taxRate: number;
    tipSuggestion: number;
  };
  branches: { id: string; name: string; city: string }[];
};

type TenantContextValue = {
  tenant: Tenant;
  branchId: string;
  setBranchId: (id: string) => void;
};

const TenantContext = createContext<TenantContextValue | null>(null);

export function AdminTenantProvider({ children }: { children: ReactNode }) {
  const [tenant, setTenant] = useState<Tenant>(DEFAULT_TENANT);
  const [branchId, setBranchId] = useState("");

  useEffect(() => {
    applyTenantTheme(DEFAULT_TENANT.branding);
    fetch("/api/admin/configuracion")
      .then((r) => {
        if (!r.ok) throw new Error("fetch failed");
        return r.json() as Promise<ConfigResponse>;
      })
      .then((d) => {
        const t: Tenant = {
          id: "tenant",
          restaurantId: d.restaurantId,
          restaurantName: d.restaurant.name,
          branches: d.branches,
          activeBranchId: d.branches[0]?.id ?? "",
          branding: {
            primary: d.branding.primaryColor,
            secondary: d.branding.secondaryColor,
            accent: d.branding.accentColor,
            background: d.branding.backgroundColor,
            defaultMode: "light",
          },
          settings: {
            currency: d.settings.currency as "COP" | "USD" | "EUR",
            timezone: d.settings.timezone,
            taxRate: d.settings.taxRate,
            tipSuggestion: d.settings.tipSuggestion,
            enabledPayments: ["cash", "card", "transfer"],
            cancellationPolicy: "",
            reservationToleranceMin: 15,
            maxReservationDurationMin: 120,
            shifts: [],
            notifications: {
              lowStock: true,
              cashDiff: true,
              payrollReminders: true,
              upcomingReservations: true,
            },
          },
          featureFlags: {
            multiBranch: d.branches.length > 1,
            payroll: true,
            chatbot: false,
          },
        };
        setTenant(t);
        setBranchId(t.activeBranchId);
        applyTenantTheme(t.branding);
      })
      .catch(() => {
        applyTenantTheme(DEFAULT_TENANT.branding);
      });
  }, []);

  const value = useMemo(
    () => ({ tenant, branchId, setBranchId }),
    [tenant, branchId],
  );
  return (
    <TenantContext.Provider value={value}>{children}</TenantContext.Provider>
  );
}

export function useAdminTenant() {
  const ctx = useContext(TenantContext);
  if (!ctx)
    throw new Error("useAdminTenant must be used inside AdminTenantProvider");
  return ctx;
}
