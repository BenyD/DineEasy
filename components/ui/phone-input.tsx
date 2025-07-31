"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  COUNTRIES,
  getPhoneCountries,
  type CountryData,
} from "@/lib/constants/countries";

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  onCountryChange?: (countryCode: string) => void;
  defaultCountry?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  error?: boolean;
}

export function PhoneInput({
  value,
  onChange,
  onCountryChange,
  defaultCountry = "CH",
  placeholder = "Enter phone number",
  className,
  disabled = false,
  error = false,
}: PhoneInputProps) {
  const [selectedCountry, setSelectedCountry] = useState<CountryData>(
    COUNTRIES[defaultCountry] || COUNTRIES.CH
  );
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const phoneCountries = getPhoneCountries();

  // Parse phone number to extract country code and number
  useEffect(() => {
    if (value && !value.startsWith("+")) {
      // If no country code, add the selected country's code
      onChange(`${selectedCountry.phoneCode} ${value}`);
    }
  }, [value, selectedCountry, onChange]);

  const handleCountrySelect = (country: CountryData) => {
    setSelectedCountry(country);
    setIsOpen(false);
    setSearchQuery("");

    // Update the phone number with new country code
    const currentNumber = value.replace(/^\+\d+\s*/, "");
    const newValue = `${country.phoneCode} ${currentNumber}`;
    onChange(newValue);

    if (onCountryChange) {
      onCountryChange(country.code);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;

    // If user starts typing a country code, try to detect it
    if (inputValue.startsWith("+")) {
      const countryCode = Object.values(COUNTRIES).find((country) =>
        inputValue.startsWith(country.phoneCode)
      );

      if (countryCode && countryCode.code !== selectedCountry.code) {
        setSelectedCountry(countryCode);
        if (onCountryChange) {
          onCountryChange(countryCode.code);
        }
      }
    }

    onChange(inputValue);
  };

  const filteredCountries = React.useMemo(() => {
    if (!searchQuery) return phoneCountries;

    const query = searchQuery.toLowerCase();
    const allCountries = Object.values(COUNTRIES);

    return {
      popular: allCountries
        .filter(
          (c) =>
            c.name.toLowerCase().includes(query) ||
            c.phoneCode.includes(query) ||
            c.code.toLowerCase().includes(query)
        )
        .slice(0, 8),
      europe: allCountries.filter(
        (c) =>
          phoneCountries.europe.some((ec) => ec.code === c.code) &&
          (c.name.toLowerCase().includes(query) ||
            c.phoneCode.includes(query) ||
            c.code.toLowerCase().includes(query))
      ),
      asia: allCountries.filter(
        (c) =>
          phoneCountries.asia.some((ac) => ac.code === c.code) &&
          (c.name.toLowerCase().includes(query) ||
            c.phoneCode.includes(query) ||
            c.code.toLowerCase().includes(query))
      ),
      americas: allCountries.filter(
        (c) =>
          phoneCountries.americas.some((amc) => amc.code === c.code) &&
          (c.name.toLowerCase().includes(query) ||
            c.phoneCode.includes(query) ||
            c.code.toLowerCase().includes(query))
      ),
      others: allCountries.filter(
        (c) =>
          phoneCountries.others.some((oc) => oc.code === c.code) &&
          (c.name.toLowerCase().includes(query) ||
            c.phoneCode.includes(query) ||
            c.code.toLowerCase().includes(query))
      ),
    };
  }, [searchQuery, phoneCountries]);

  const renderCountryGroup = (title: string, countries: CountryData[]) => {
    if (countries.length === 0) return null;

    return (
      <div key={title}>
        <div className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {title}
        </div>
        {countries.map((country) => (
          <button
            key={country.code}
            type="button"
            className={cn(
              "w-full px-3 py-2 text-left hover:bg-accent hover:text-accent-foreground flex items-center gap-3 transition-colors",
              selectedCountry.code === country.code &&
                "bg-accent text-accent-foreground"
            )}
            onClick={() => handleCountrySelect(country)}
          >
            <span className="text-lg">{country.flag}</span>
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{country.name}</div>
              <div className="text-xs text-muted-foreground truncate">
                {country.phoneCode}
              </div>
            </div>
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className={cn("flex", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={cn(
              "w-auto min-w-[100px] px-2 border-r-0 rounded-r-none flex items-center gap-1.5 h-11 transition-all duration-300 focus:ring-2 focus:ring-offset-2 focus:ring-green-500 shadow-xs",
              error && "border-destructive",
              disabled && "opacity-50 cursor-not-allowed"
            )}
            disabled={disabled}
          >
            <span className="text-base">{selectedCountry.flag}</span>
            <span className="text-xs font-medium">
              {selectedCountry.phoneCode}
            </span>
            <ChevronDown className="h-3 w-3 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="start">
          <div className="p-3 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search countries..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <ScrollArea className="h-80">
            <div className="p-1">
              {renderCountryGroup("Popular", filteredCountries.popular)}
              {renderCountryGroup("Europe", filteredCountries.europe)}
              {renderCountryGroup("Asia", filteredCountries.asia)}
              {renderCountryGroup("Americas", filteredCountries.americas)}
              {renderCountryGroup("Others", filteredCountries.others)}
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>

      <Input
        ref={inputRef}
        type="tel"
        value={value}
        onChange={handleInputChange}
        placeholder={placeholder}
        className={cn(
          "flex-1 rounded-l-none h-11 transition-all duration-300 focus:ring-2 focus:ring-offset-2 focus:ring-green-500",
          error && "border-destructive",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        disabled={disabled}
      />
    </div>
  );
}
