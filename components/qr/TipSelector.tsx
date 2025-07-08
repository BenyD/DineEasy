"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Percent, Heart, DollarSign, Sparkles } from "lucide-react";
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
      <div className="flex items-center gap-4 mb-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
          className="bg-gradient-to-br from-red-50 to-pink-50 p-3 rounded-xl shadow-sm"
        >
          <Heart className="w-7 h-7 text-red-500" />
        </motion.div>
        <div>
          <motion.h3
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="font-bold text-gray-900 text-xl mb-1"
          >
            Add a Tip
          </motion.h3>
          <motion.p
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-gray-600"
          >
            Show your appreciation for great service
          </motion.p>
        </div>
      </div>

      {/* Percentage Tips */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {tipPercentages.map((percentage, index) => {
          const tipAmount = (subtotal * percentage) / 100;
          const isSelected = selectedTip === percentage;

          return (
            <motion.button
              key={percentage}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleTipSelect(percentage)}
              className={`relative p-4 rounded-xl border-2 transition-all duration-200 ${
                isSelected
                  ? "border-green-500 bg-green-50 ring-2 ring-green-200 shadow-md"
                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              }`}
            >
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-2">
                  <div
                    className={`p-1.5 rounded-lg ${
                      isSelected ? "bg-green-100" : "bg-gray-100"
                    }`}
                  >
                    <Percent
                      className={`w-4 h-4 ${
                        isSelected ? "text-green-600" : "text-gray-600"
                      }`}
                    />
                  </div>
                  <span
                    className={`font-bold text-xl ${
                      isSelected ? "text-green-700" : "text-gray-700"
                    }`}
                  >
                    {percentage}%
                  </span>
                </div>
                <span
                  className={`text-sm ${
                    isSelected ? "text-green-700 font-medium" : "text-gray-600"
                  }`}
                >
                  CHF {tipAmount.toFixed(2)}
                </span>
              </div>
              <AnimatePresence>
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-lg"
                  >
                    <Sparkles className="w-3 h-3 text-white" />
                  </motion.div>
                )}
              </AnimatePresence>
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
          <div
            className={`absolute left-4 top-1/2 transform -translate-y-1/2 p-2 rounded-lg transition-colors ${
              selectedTip === "custom" ? "bg-green-100" : "bg-gray-100"
            }`}
          >
            <DollarSign
              className={`w-5 h-5 ${
                selectedTip === "custom" ? "text-green-600" : "text-gray-600"
              }`}
            />
          </div>
          <Input
            type="number"
            placeholder="Enter custom amount"
            value={customTip}
            onChange={(e) => handleCustomTip(e.target.value)}
            className={`pl-16 h-14 text-lg border-2 focus:border-green-500 focus:ring-green-500 rounded-xl ${
              selectedTip === "custom"
                ? "border-green-500 ring-2 ring-green-200 shadow-md"
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
        className={`w-full h-14 rounded-xl text-lg transition-all duration-200 border-2 ${
          selectedTip === 0
            ? "border-gray-400 bg-gray-50 font-medium shadow-sm"
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
            className="mt-6 overflow-hidden"
          >
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="bg-green-100 p-1.5 rounded-lg">
                    <Heart className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="text-green-700 font-medium">
                    Selected Tip
                  </span>
                </div>
                <div className="text-right">
                  <motion.span
                    key={selectedTip}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="block text-green-700 font-bold text-xl"
                  >
                    CHF{" "}
                    {(selectedTip === "custom"
                      ? Number.parseFloat(customTip) || 0
                      : (subtotal * (selectedTip as number)) / 100
                    ).toFixed(2)}
                  </motion.span>
                  {selectedTip !== "custom" && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-sm text-green-600 font-medium"
                    >
                      ({selectedTip}% of total)
                    </motion.div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
