"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Info,
  FileText,
  Mail,
  Heart,
  Shield,
  CreditCard,
  BookOpen,
  Globe,
  Lock,
} from "lucide-react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { DialogTitle } from "@/components/ui/dialog";

export function SearchCommand() {
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
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-2 rounded-lg bg-gray-50 px-4 py-2 text-sm text-gray-500 transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 md:w-64"
      >
        <Search className="h-4 w-4" />
        <span className="hidden md:inline-flex">Search pages...</span>
        <kbd className="pointer-events-none ml-auto hidden select-none rounded border bg-white px-1.5 py-0.5 font-mono text-xs text-gray-400 md:inline-flex">
          ⌘K
        </kbd>
      </button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <DialogTitle className="sr-only">Search pages</DialogTitle>
        <CommandInput placeholder="Search pages..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Main Pages">
            <CommandItem onSelect={() => runCommand(() => router.push("/"))}>
              <Globe className="mr-2 h-4 w-4" />
              Home
            </CommandItem>
            <CommandItem
              onSelect={() => runCommand(() => router.push("/about"))}
            >
              <Info className="mr-2 h-4 w-4" />
              About Us
            </CommandItem>
            <CommandItem
              onSelect={() => runCommand(() => router.push("/features"))}
            >
              <Heart className="mr-2 h-4 w-4" />
              Features
            </CommandItem>
            <CommandItem
              onSelect={() => runCommand(() => router.push("/pricing"))}
            >
              <CreditCard className="mr-2 h-4 w-4" />
              Pricing
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Support">
            <CommandItem
              onSelect={() => runCommand(() => router.push("/contact"))}
            >
              <Mail className="mr-2 h-4 w-4" />
              Contact
            </CommandItem>
            <CommandItem
              onSelect={() => runCommand(() => router.push("/setup-guide"))}
            >
              <BookOpen className="mr-2 h-4 w-4" />
              Setup Guide
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Legal">
            <CommandItem
              onSelect={() => runCommand(() => router.push("/privacy"))}
            >
              <Shield className="mr-2 h-4 w-4" />
              Privacy Policy
            </CommandItem>
            <CommandItem
              onSelect={() => runCommand(() => router.push("/terms"))}
            >
              <FileText className="mr-2 h-4 w-4" />
              Terms of Service
            </CommandItem>
            <CommandItem
              onSelect={() => runCommand(() => router.push("/security"))}
            >
              <Lock className="mr-2 h-4 w-4" />
              Security
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
