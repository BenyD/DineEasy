"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Package, TrendingUp, CheckCircle, XCircle } from "lucide-react";

interface MenuStatsProps {
  totalItems: number;
  availableItems: number;
  unavailableItems: number;
  popularItems: number;
  averagePrice: number;
  currencySymbol: string;
}

export function MenuStats({
  totalItems,
  availableItems,
  unavailableItems,
  popularItems,
  averagePrice,
  currencySymbol,
}: MenuStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-50 rounded-full">
              <Package className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalItems}</p>
              <p className="text-sm text-muted-foreground">Total Items</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-50 rounded-full">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <div className="flex items-baseline gap-1">
                <p className="text-2xl font-bold">{availableItems}</p>
                <p className="text-sm text-muted-foreground">/ {totalItems}</p>
              </div>
              <p className="text-sm text-muted-foreground">Available</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-50 rounded-full">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <div className="flex items-baseline gap-1">
                <p className="text-2xl font-bold">{unavailableItems}</p>
                <p className="text-sm text-muted-foreground">/ {totalItems}</p>
              </div>
              <p className="text-sm text-muted-foreground">Unavailable</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-50 rounded-full">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {currencySymbol}
                {averagePrice.toFixed(2)}
              </p>
              <p className="text-sm text-muted-foreground">Average Price</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 