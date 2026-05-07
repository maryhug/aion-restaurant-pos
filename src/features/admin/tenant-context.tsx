"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { adminTenantMock } from "@/features/admin/mocks";
import { applyTenantTheme } from "@/features/admin/helpers";
import type { Tenant } from "@/features/admin/types";

type TenantContextValue = {
  tenant: Tenant;
  branchId: string;
  setBranchId: (id: string) => void;
};

const TenantContext = createContext<TenantContextValue | null>(null);

export function AdminTenantProvider({ children }: { children: ReactNode }) {
  const [tenant] = useState<Tenant>(adminTenantMock);
  const [branchId, setBranchId] = useState(tenant.activeBranchId);

  useEffect(() => {
    applyTenantTheme(tenant.branding);
  }, [tenant.branding]);

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
