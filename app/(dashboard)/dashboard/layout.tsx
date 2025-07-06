import { cookies } from "next/headers";
import { DashboardLayoutClient } from "@/components/dashboard/dashboard-layout-client";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Get the sidebar state from cookies in the server component
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value === "true";

  return (
    <DashboardLayoutClient defaultOpen={defaultOpen}>
      {children}
    </DashboardLayoutClient>
  );
}
