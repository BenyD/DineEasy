"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign,
  CreditCard,
  Banknote,
  TrendingUp,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import type { PaymentStats } from "@/lib/actions/payments";
import { formatCurrency, formatCurrencyCompact } from "@/lib/utils/currency";
import { useMemo } from "react";
import { memo } from "react";

interface PaymentStatsProps {
  stats: PaymentStats;
  isLoading?: boolean;
  onRefresh?: () => void;
  currency?: string; // Add currency prop
}

const PaymentStats = memo(function PaymentStats({
  stats,
  isLoading = false,
  onRefresh,
  currency = "CHF", // Default to CHF
}: PaymentStatsProps) {
  // Validate and provide fallbacks for stats data
  const safeStats = useMemo(
    () => ({
      totalRevenue: stats?.totalRevenue ?? 0,
      totalTransactions: stats?.totalTransactions ?? 0,
      averageOrderValue: stats?.averageOrderValue ?? 0,
      thisMonthRevenue: stats?.thisMonthRevenue ?? 0,
      thisMonthTransactions: stats?.thisMonthTransactions ?? 0,
      lastMonthRevenue: stats?.lastMonthRevenue ?? 0,
      lastMonthTransactions: stats?.lastMonthTransactions ?? 0,
      revenueGrowth: stats?.revenueGrowth ?? 0,
      transactionGrowth: stats?.transactionGrowth ?? 0,
      refundedAmount: stats?.refundedAmount ?? 0,
      refundedTransactions: stats?.refundedTransactions ?? 0,
      // Payment method specific stats
      cardRevenue: stats?.cardRevenue ?? 0,
      cardTransactions: stats?.cardTransactions ?? 0,
      cashRevenue: stats?.cashRevenue ?? 0,
      cashTransactions: stats?.cashTransactions ?? 0,
      cardRevenueThisMonth: stats?.cardRevenueThisMonth ?? 0,
      cardTransactionsThisMonth: stats?.cardTransactionsThisMonth ?? 0,
      cashRevenueThisMonth: stats?.cashRevenueThisMonth ?? 0,
      cashTransactionsThisMonth: stats?.cashTransactionsThisMonth ?? 0,
    }),
    [stats]
  );

  // Calculate refund percentage safely
  const refundPercentage = useMemo(
    () =>
      safeStats.totalRevenue > 0
        ? ((safeStats.refundedAmount / safeStats.totalRevenue) * 100).toFixed(1)
        : "0.0",
    [safeStats.totalRevenue, safeStats.refundedAmount]
  );

  const statCards = useMemo(
    () => [
      {
        title: "Total Revenue",
        value: formatCurrency(safeStats.totalRevenue, currency),
        subtitle: "All time",
        icon: DollarSign,
        color: "text-green-600",
        bgColor: "bg-green-100",
      },
      {
        title: "Total Transactions",
        value: safeStats.totalTransactions.toString(),
        subtitle: "Completed payments",
        icon: TrendingUp,
        color: "text-blue-600",
        bgColor: "bg-blue-100",
      },
      {
        title: "Card Payments",
        value: formatCurrency(safeStats.cardRevenue, currency),
        subtitle: `${safeStats.cardTransactions} transactions`,
        icon: CreditCard,
        color: "text-blue-600",
        bgColor: "bg-blue-100",
      },
      {
        title: "Cash Payments",
        value: formatCurrency(safeStats.cashRevenue, currency),
        subtitle: `${safeStats.cashTransactions} transactions`,
        icon: Banknote,
        color: "text-green-600",
        bgColor: "bg-green-100",
      },
    ],
    [safeStats, currency]
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
    hover: { y: -5, transition: { duration: 0.2 } },
  };

  return (
    <div className="space-y-6">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid gap-6 md:grid-cols-2 lg:grid-cols-4"
      >
        {statCards.map((card, index) => (
          <motion.div
            key={card.title}
            variants={cardVariants}
            whileHover="hover"
            className="transform transition-all duration-200"
          >
            <Card className="h-full">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      {card.title}
                    </p>
                    <p
                      className="text-2xl font-bold text-gray-900 mt-1"
                      aria-label={`${card.title}: ${card.value}`}
                    >
                      {isLoading ? null : card.value}
                    </p>
                    {isLoading ? (
                      <div
                        className="h-8 w-20 bg-gray-200 rounded animate-pulse mt-1"
                        aria-label="Loading"
                      />
                    ) : null}
                    <p className="text-xs text-gray-500 mt-1">
                      {card.subtitle}
                    </p>
                  </div>
                  <div
                    className={`p-3 rounded-lg ${card.bgColor}`}
                    aria-hidden="true"
                  >
                    <card.icon className={`h-6 w-6 ${card.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Additional Stats */}
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="show"
        className="grid gap-6 md:grid-cols-2"
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Payment Method Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <CreditCard className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium">Card Payments</p>
                  <p className="text-sm text-gray-500">
                    {formatCurrency(safeStats.cardRevenue, currency)} total
                  </p>
                </div>
              </div>
              <Badge variant="secondary">
                {safeStats.cardTransactions} transactions
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Banknote className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium">Cash Payments</p>
                  <p className="text-sm text-gray-500">
                    {formatCurrency(safeStats.cashRevenue, currency)} total
                  </p>
                </div>
              </div>
              <Badge variant="secondary">
                {safeStats.cashTransactions} transactions
              </Badge>
            </div>
            <div className="pt-2 border-t">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Average Order Value</span>
                <span className="font-medium">
                  {formatCurrency(safeStats.averageOrderValue, currency)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">This Month Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <CreditCard className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium">Card Revenue</p>
                  <p className="text-sm text-gray-500">
                    {formatCurrency(safeStats.cardRevenueThisMonth, currency)}
                  </p>
                </div>
              </div>
              <Badge variant="secondary">
                {safeStats.cardTransactionsThisMonth} transactions
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Banknote className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium">Cash Revenue</p>
                  <p className="text-sm text-gray-500">
                    {formatCurrency(safeStats.cashRevenueThisMonth, currency)}
                  </p>
                </div>
              </div>
              <Badge variant="secondary">
                {safeStats.cashTransactionsThisMonth} transactions
              </Badge>
            </div>
            <div className="pt-2 border-t">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Total This Month</span>
                <span className="font-medium">
                  {formatCurrency(safeStats.thisMonthRevenue, currency)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Monthly Comparison */}
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="show"
        className="grid gap-6 md:grid-cols-2"
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Monthly Comparison</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium">This Month</p>
                  <p className="text-sm text-gray-500">
                    {formatCurrency(safeStats.thisMonthRevenue, currency)}{" "}
                    revenue
                  </p>
                </div>
              </div>
              <Badge variant="secondary">
                {safeStats.thisMonthTransactions} transactions
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Banknote className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium">Last Month</p>
                  <p className="text-sm text-gray-500">
                    {formatCurrency(safeStats.lastMonthRevenue, currency)}{" "}
                    revenue
                  </p>
                </div>
              </div>
              <Badge variant="secondary">
                {safeStats.lastMonthTransactions} transactions
              </Badge>
            </div>
            {(safeStats.revenueGrowth !== 0 ||
              safeStats.transactionGrowth !== 0) && (
              <div className="pt-2 border-t space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Revenue Growth</span>
                  <span
                    className={`font-medium ${safeStats.revenueGrowth >= 0 ? "text-green-600" : "text-red-600"}`}
                  >
                    {safeStats.revenueGrowth >= 0 ? "+" : ""}
                    {safeStats.revenueGrowth.toFixed(1)}%
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Transaction Growth</span>
                  <span
                    className={`font-medium ${safeStats.transactionGrowth >= 0 ? "text-green-600" : "text-red-600"}`}
                  >
                    {safeStats.transactionGrowth >= 0 ? "+" : ""}
                    {safeStats.transactionGrowth.toFixed(1)}%
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Refunds & Returns</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="font-medium">Refunded Amount</p>
                  <p className="text-sm text-gray-500">
                    Total refunds processed
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium text-red-600">
                  {formatCurrency(safeStats.refundedAmount, currency)}
                </p>
                <p className="text-xs text-gray-500">
                  {refundPercentage}% of revenue
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
});

export default PaymentStats;
