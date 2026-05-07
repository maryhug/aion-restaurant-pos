import type { ReactNode } from "react";
import { AdminTenantProvider } from "@/features/admin/tenant-context";
import { AdminShell } from "@/features/admin/components/admin-shell";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AdminTenantProvider>
      <AdminShell>{children}</AdminShell>
    </AdminTenantProvider>
  );
}
