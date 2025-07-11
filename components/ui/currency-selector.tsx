"use client";

import { Globe } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CURRENCIES, CURRENCY_NAMES } from "@/lib/constants";

interface CurrencySelectorProps {
  value: keyof typeof CURRENCIES;
  onValueChange: (value: keyof typeof CURRENCIES) => void;
  className?: string;
  showLabel?: boolean;
}

export function CurrencySelector({
  value,
  onValueChange,
  className = "",
  showLabel = true,
}: CurrencySelectorProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {showLabel && (
        <>
          <Globe className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Currency:</span>
        </>
      )}
      <Select
        value={value}
        onValueChange={(val) => onValueChange(val as keyof typeof CURRENCIES)}
      >
        <SelectTrigger className="w-32 border-0 bg-transparent shadow-none focus:ring-0">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(CURRENCIES).map(([code, symbol]) => (
            <SelectItem key={code} value={code}>
              <div className="flex items-center gap-2">
                <span className="font-medium">{symbol}</span>
                <span className="text-gray-500">
                  ({CURRENCY_NAMES[code as keyof typeof CURRENCIES]})
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
