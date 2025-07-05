"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Percent, Heart, DollarSign } from "lucide-react";
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl p-6 shadow-lg border border-green-100"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="bg-red-50 p-2 rounded-full">
          <Heart className="w-6 h-6 text-red-500" />
        </div>
        <div>
          <h3 className="font-bold text-gray-900 text-xl">Add a Tip</h3>
          <p className="text-gray-600 text-sm">
            Show your appreciation for great service
          </p>
        </div>
      </div>

      {/* Percentage Tips */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {tipPercentages.map((percentage) => {
          const tipAmount = (subtotal * percentage) / 100;
          const isSelected = selectedTip === percentage;

          return (
            <motion.button
              key={percentage}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleTipSelect(percentage)}
              className={`relative p-4 rounded-xl border-2 transition-all duration-200 ${
                isSelected
                  ? "border-green-500 bg-green-50 ring-2 ring-green-200"
                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              }`}
            >
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-2">
                  <Percent className="w-4 h-4 text-gray-600" />
                  <span className="font-bold text-xl">{percentage}%</span>
                </div>
                <span
                  className={`text-sm ${
                    isSelected ? "text-green-700 font-medium" : "text-gray-600"
                  }`}
                >
                  CHF {tipAmount.toFixed(2)}
                </span>
              </div>
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-2 -right-2 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center"
                >
                  <span className="text-white text-xs">✓</span>
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Custom Tip */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Custom Amount
        </label>
        <div className="relative">
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-green-100 p-1.5 rounded-full">
            <DollarSign className="w-4 h-4 text-green-700" />
          </div>
          <Input
            type="number"
            placeholder="Enter custom amount"
            value={customTip}
            onChange={(e) => handleCustomTip(e.target.value)}
            className={`pl-14 h-14 text-lg border-gray-200 focus:border-green-500 focus:ring-green-500 rounded-xl ${
              selectedTip === "custom"
                ? "border-green-500 ring-2 ring-green-200"
                : ""
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
        className={`w-full h-14 rounded-xl text-lg transition-all duration-200 ${
          selectedTip === 0
            ? "border-gray-400 bg-gray-50 font-medium"
            : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
        }`}
      >
        No Tip
      </Button>

      {/* Tip Summary */}
      <AnimatePresence>
        {selectedTip !== 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200"
          >
            <div className="flex justify-between items-center">
              <span className="text-green-700 font-medium">Selected Tip:</span>
              <div className="text-right">
                <span className="text-green-700 font-bold text-xl">
                  CHF{" "}
                  {(selectedTip === "custom"
                    ? Number.parseFloat(customTip) || 0
                    : (subtotal * (selectedTip as number)) / 100
                  ).toFixed(2)}
                </span>
                {selectedTip !== "custom" && (
                  <div className="text-sm text-green-600">
                    ({selectedTip}% of total)
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
