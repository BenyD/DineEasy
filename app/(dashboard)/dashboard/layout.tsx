import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { BreadcrumbHeader } from "@/components/dashboard/breadcrumb-header";
import { DashboardFooter } from "@/components/dashboard/dashboard-footer";
import DashboardLayoutClient from "@/components/dashboard/dashboard-layout-client";
import { RestaurantStoreInitializer } from "@/components/dashboard/restaurant-store-initializer";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();

  // Check if user is authenticated
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  // Check if user has completed onboarding
  const { data: restaurants } = await supabase
    .from("restaurants")
    .select("id, subscription_status")
    .eq("owner_id", user.id)
    .single();

  // If no restaurant, redirect to setup
  if (!restaurants) {
    redirect("/setup");
  }

  // If no active subscription, redirect to select-plan
  if (
    !restaurants.subscription_status ||
    restaurants.subscription_status === "inactive"
  ) {
    redirect("/select-plan");
  }

  return (
    <SidebarProvider defaultOpen>
      <RestaurantStoreInitializer />
      <DashboardLayoutClient />
      <div className="flex h-screen w-full overflow-hidden bg-background">
        <AppSidebar />
        <SidebarInset className="flex w-full flex-col">
          <div className="w-full border-b bg-background">
            <BreadcrumbHeader />
          </div>
          <main className="flex-1 overflow-y-auto">
            <div className="container mx-auto py-6">{children}</div>
          </main>
          <DashboardFooter />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
