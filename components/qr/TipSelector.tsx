"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Percent, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface TipSelectorProps {
  subtotal: number;
  onTipChange: (tip: number) => void;
}

const tipPercentages = [15, 18, 20, 25];

export function TipSelector({ subtotal, onTipChange }: TipSelectorProps) {
  const [selectedTip, setSelectedTip] = useState<number | "custom">(0);
  const [customTip, setCustomTip] = useState("");

  const handleTipSelect = (percentage: number) => {
    const tipAmount = (subtotal * percentage) / 100;
    setSelectedTip(percentage);
    setCustomTip("");
    onTipChange(tipAmount);
  };

  const handleCustomTip = (value: string) => {
    setCustomTip(value);
    setSelectedTip("custom");
    const tipAmount = Number.parseFloat(value) || 0;
    onTipChange(tipAmount);
  };

  const handleNoTip = () => {
    setSelectedTip(0);
    setCustomTip("");
    onTipChange(0);
  };

  const getTipAmount = () => {
    if (selectedTip === "custom") {
      return Number.parseFloat(customTip) || 0;
    }
    return (subtotal * (selectedTip as number)) / 100;
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
          <Percent className="w-4 h-4 text-green-600" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">Add a Tip</h3>
          <p className="text-sm text-gray-600">Support our staff</p>
        </div>
      </div>

      {/* Percentage Tips */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {tipPercentages.map((percentage) => {
          const tipAmount = (subtotal * percentage) / 100;
          const isSelected = selectedTip === percentage;

          return (
            <Button
              key={percentage}
              variant={isSelected ? "default" : "outline"}
              size="sm"
              onClick={() => handleTipSelect(percentage)}
              className={`h-12 flex flex-col items-center justify-center gap-1 ${
                isSelected
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              }`}
            >
              <span className="font-semibold text-sm">{percentage}%</span>
              <span className="text-xs opacity-80">
                CHF {tipAmount.toFixed(2)}
              </span>
            </Button>
          );
        })}
      </div>

      {/* Custom Tip */}
      <div className="mb-4">
        <div className="relative">
          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="number"
            placeholder="Custom amount"
            value={customTip}
            onChange={(e) => handleCustomTip(e.target.value)}
            className={`pl-10 h-12 ${
              selectedTip === "custom"
                ? "border-green-500 ring-1 ring-green-200"
                : "border-gray-200"
            }`}
            step="0.50"
            min="0"
          />
        </div>
      </div>

      {/* No Tip Option */}
      <Button
        variant="outline"
        onClick={handleNoTip}
        className={`w-full h-12 ${
          selectedTip === 0
            ? "border-gray-400 bg-gray-50 font-medium"
            : "border-gray-200 hover:border-gray-300"
        }`}
      >
        No Tip
      </Button>

      {/* Tip Summary */}
      {selectedTip !== 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm text-green-700 font-medium">
              Tip Amount:
            </span>
            <span className="text-green-700 font-bold">
              CHF {getTipAmount().toFixed(2)}
            </span>
          </div>
        </motion.div>
      )}
    </div>
  );
}
