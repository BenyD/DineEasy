"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Percent, Heart } from "lucide-react";
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
      className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200"
    >
      <div className="flex items-center gap-2 mb-4">
        <Heart className="w-5 h-5 text-red-500" />
        <h3 className="font-bold text-gray-900 text-lg">Add a Tip</h3>
      </div>
      <p className="text-gray-600 mb-6">
        Show your appreciation for great service
      </p>

      {/* Percentage Tips */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {tipPercentages.map((percentage) => {
          const tipAmount = (subtotal * percentage) / 100;
          const isSelected = selectedTip === percentage;

          return (
            <motion.button
              key={percentage}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleTipSelect(percentage)}
              className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                isSelected
                  ? "border-green-500 bg-green-50 ring-2 ring-green-200"
                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              }`}
            >
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Percent className="w-4 h-4 text-gray-600" />
                  <span className="font-bold text-lg">{percentage}%</span>
                </div>
                <span className="text-sm text-gray-600">
                  CHF {tipAmount.toFixed(2)}
                </span>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Custom Tip */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Custom Amount
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
            CHF
          </span>
          <Input
            type="number"
            placeholder="0.00"
            value={customTip}
            onChange={(e) => handleCustomTip(e.target.value)}
            className={`pl-12 h-12 border-gray-200 focus:border-green-500 focus:ring-green-500 rounded-xl text-base ${
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
        className={`w-full h-12 rounded-xl transition-all duration-200 ${
          selectedTip === 0
            ? "border-gray-400 bg-gray-50"
            : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
        }`}
      >
        No Tip
      </Button>

      {/* Tip Summary */}
      {selectedTip !== 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mt-4 p-3 bg-green-50 rounded-xl border border-green-200"
        >
          <div className="flex justify-between items-center">
            <span className="text-green-700 font-medium">Tip Amount:</span>
            <span className="text-green-700 font-bold">
              CHF{" "}
              {(selectedTip === "custom"
                ? Number.parseFloat(customTip) || 0
                : (subtotal * (selectedTip as number)) / 100
              ).toFixed(2)}
            </span>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
