"use client";

import { usePathname } from "next/navigation";
import { ChevronRight, PanelLeft } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";

interface BreadcrumbItem {
  label: string;
  href: string;
}

interface BreadcrumbHeaderProps {
  items?: BreadcrumbItem[];
}

export function BreadcrumbHeader({ items }: BreadcrumbHeaderProps = {}) {
  const pathname = usePathname();
  const { toggleSidebar } = useSidebar();

  // Generate breadcrumbs from pathname or use provided items
  const generateBreadcrumbs = () => {
    if (items) {
      return items.map((item, index) => ({
        ...item,
        isLast: index === items.length - 1,
      }));
    }

    const segments = pathname.split("/").filter(Boolean);
    const breadcrumbs = [];

    // Always start with Dashboard
    breadcrumbs.push({
      label: "Dashboard",
      href: "/dashboard",
      isLast: segments.length === 1,
    });

    // Add subsequent segments
    for (let i = 1; i < segments.length; i++) {
      const segment = segments[i];
      const href = "/" + segments.slice(0, i + 1).join("/");
      const isLast = i === segments.length - 1;

      // Format segment name
      const label = segment
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

      breadcrumbs.push({
        label,
        href,
        isLast,
      });
    }

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();
  const currentPage = breadcrumbs[breadcrumbs.length - 1]?.label || "Dashboard";

  return (
    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
      <div className="flex items-center gap-2">
        {/* Sidebar Toggle Button */}
        <SidebarTrigger className="-ml-1">
          <PanelLeft className="h-4 w-4" />
          <span className="sr-only">Toggle Sidebar</span>
        </SidebarTrigger>

        <Separator orientation="vertical" className="mr-2 h-4" />
      </div>

      {/* Breadcrumbs - Hidden on mobile, show page title instead */}
      <div className="flex items-center gap-2 overflow-hidden">
        <Breadcrumb className="hidden md:flex">
          <BreadcrumbList>
            {breadcrumbs.map((breadcrumb, index) => (
              <div key={breadcrumb.href} className="flex items-center gap-2">
                <BreadcrumbItem>
                  {breadcrumb.isLast ? (
                    <BreadcrumbPage className="font-medium">
                      {breadcrumb.label}
                    </BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink
                      href={breadcrumb.href}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      {breadcrumb.label}
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
                {!breadcrumb.isLast && (
                  <BreadcrumbSeparator>
                    <ChevronRight className="h-4 w-4" />
                  </BreadcrumbSeparator>
                )}
              </div>
            ))}
          </BreadcrumbList>
        </Breadcrumb>

        {/* Mobile: Show only current page title */}
        <div className="md:hidden">
          <h1 className="font-semibold text-foreground">{currentPage}</h1>
        </div>
      </div>

      {/* Right side actions can be added here */}
      <div className="ml-auto flex items-center gap-2">
        {/* Future: Add search, notifications, user menu, etc. */}
      </div>
    </header>
  );
}
