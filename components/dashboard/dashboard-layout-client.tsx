"use client";

import type React from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { BreadcrumbHeader } from "@/components/dashboard/breadcrumb-header";

interface DashboardLayoutClientProps {
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export function DashboardLayoutClient({
  children,
  defaultOpen,
}: DashboardLayoutClientProps) {
  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <div className="flex h-screen w-full overflow-hidden bg-background">
        <AppSidebar />
        <SidebarInset className="flex w-full flex-col">
          <div className="w-full border-b bg-background">
            <BreadcrumbHeader />
          </div>
          <main className="flex-1 overflow-y-auto">
            <div className="container mx-auto py-6">{children}</div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
