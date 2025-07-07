"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Calculator,
  Calendar,
  CreditCard,
  Settings,
  User,
  Search,
  Command as CommandIcon,
  ChefHat,
  Table,
  Activity,
  Printer,
  Bell,
  CreditCard as PaymentIcon,
  BarChart,
  Clock,
  Utensils,
  Power,
  Trash2,
  Ban,
  DollarSign,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { DialogTitle } from "@/components/ui/dialog";

export function CommandMenu() {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const runCommand = React.useCallback((command: () => unknown) => {
    setOpen(false);
    command();
  }, []);

  return (
    <>
      <Button
        variant="outline"
        className="relative h-9 w-full justify-start text-sm text-muted-foreground sm:pr-12 md:w-40 lg:w-64"
        onClick={() => setOpen(true)}
      >
        <span className="hidden lg:inline-flex">Search commands...</span>
        <span className="inline-flex lg:hidden">Search...</span>
        <kbd className="pointer-events-none absolute right-1.5 top-2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <DialogTitle className="sr-only">Search and Commands</DialogTitle>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Quick Actions">
            <CommandItem
              onSelect={() =>
                runCommand(() => console.log("Toggle restaurant status"))
              }
            >
              <Power className="mr-2 h-4 w-4" />
              Toggle Restaurant Status
              <CommandShortcut>⌘O</CommandShortcut>
            </CommandItem>
            <CommandItem
              onSelect={() =>
                runCommand(() => console.log("Clear all notifications"))
              }
            >
              <Bell className="mr-2 h-4 w-4" />
              Clear All Notifications
              <CommandShortcut>⌘B</CommandShortcut>
            </CommandItem>
            <CommandItem
              onSelect={() =>
                runCommand(() => console.log("Print daily summary"))
              }
            >
              <Printer className="mr-2 h-4 w-4" />
              Print Daily Summary
              <CommandShortcut>⌘P</CommandShortcut>
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Navigation">
            <CommandItem
              onSelect={() => runCommand(() => router.push("/dashboard"))}
            >
              <CommandIcon className="mr-2 h-4 w-4" />
              Dashboard Overview
              <CommandShortcut>⌘H</CommandShortcut>
            </CommandItem>
            <CommandItem
              onSelect={() =>
                runCommand(() => router.push("/dashboard/orders/active"))
              }
            >
              <Utensils className="mr-2 h-4 w-4" />
              Active Orders
              <CommandShortcut>⌘1</CommandShortcut>
            </CommandItem>
            <CommandItem
              onSelect={() =>
                runCommand(() => router.push("/dashboard/orders/history"))
              }
            >
              <Clock className="mr-2 h-4 w-4" />
              Order History
              <CommandShortcut>⌘2</CommandShortcut>
            </CommandItem>
            <CommandItem
              onSelect={() => runCommand(() => router.push("/dashboard/menu"))}
            >
              <ChefHat className="mr-2 h-4 w-4" />
              Menu Management
              <CommandShortcut>⌘3</CommandShortcut>
            </CommandItem>
            <CommandItem
              onSelect={() =>
                runCommand(() => router.push("/dashboard/tables"))
              }
            >
              <Table className="mr-2 h-4 w-4" />
              Table Management
              <CommandShortcut>⌘4</CommandShortcut>
            </CommandItem>
            <CommandItem
              onSelect={() =>
                runCommand(() => router.push("/dashboard/kitchen"))
              }
            >
              <ChefHat className="mr-2 h-4 w-4" />
              Kitchen Display
              <CommandShortcut>⌘5</CommandShortcut>
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Business Tools">
            <CommandItem
              onSelect={() =>
                runCommand(() => router.push("/dashboard/analytics"))
              }
            >
              <BarChart className="mr-2 h-4 w-4" />
              Analytics
              <CommandShortcut>⌘A</CommandShortcut>
            </CommandItem>
            <CommandItem
              onSelect={() =>
                runCommand(() => router.push("/dashboard/payments"))
              }
            >
              <PaymentIcon className="mr-2 h-4 w-4" />
              Payments
              <CommandShortcut>⌘M</CommandShortcut>
            </CommandItem>
            <CommandItem
              onSelect={() => runCommand(() => router.push("/dashboard/staff"))}
            >
              <User className="mr-2 h-4 w-4" />
              Staff Management
              <CommandShortcut>⌘U</CommandShortcut>
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Settings & Support">
            <CommandItem
              onSelect={() =>
                runCommand(() => router.push("/dashboard/settings"))
              }
            >
              <Settings className="mr-2 h-4 w-4" />
              Settings
              <CommandShortcut>⌘S</CommandShortcut>
            </CommandItem>
            <CommandItem
              onSelect={() =>
                runCommand(() => router.push("/dashboard/billing"))
              }
            >
              <DollarSign className="mr-2 h-4 w-4" />
              Billing
              <CommandShortcut>⌘B</CommandShortcut>
            </CommandItem>
            <CommandItem
              onSelect={() => runCommand(() => router.push("/dashboard/help"))}
            >
              <Activity className="mr-2 h-4 w-4" />
              Help & Support
              <CommandShortcut>⌘/</CommandShortcut>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
