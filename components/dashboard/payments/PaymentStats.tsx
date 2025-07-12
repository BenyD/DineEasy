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

interface PaymentStatsProps {
  stats: PaymentStats;
  isLoading?: boolean;
  onRefresh?: () => void;
}

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

export default function PaymentStats({
  stats,
  isLoading = false,
  onRefresh,
}: PaymentStatsProps) {
  const statCards = [
    {
      title: "Total Revenue",
      value: formatCurrency(stats.totalRevenue, "USD"),
      subtitle: "All time",
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Total Transactions",
      value: stats.totalTransactions.toString(),
      subtitle: "Completed payments",
      icon: TrendingUp,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Average Order",
      value: formatCurrency(stats.averageOrderValue, "USD"),
      subtitle: "Per transaction",
      icon: Banknote,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      title: "This Month",
      value: formatCurrency(stats.thisMonthRevenue, "USD"),
      subtitle: "Current month",
      icon: CreditCard,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
  ];

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
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {isLoading ? null : card.value}
                    </p>
                    {isLoading ? (
                      <div className="h-8 w-20 bg-gray-200 rounded animate-pulse mt-1" />
                    ) : null}
                    <p className="text-xs text-gray-500 mt-1">
                      {card.subtitle}
                    </p>
                  </div>
                  <div className={`p-3 rounded-lg ${card.bgColor}`}>
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
                    {formatCurrency(stats.thisMonthRevenue, "USD")} revenue
                  </p>
                </div>
              </div>
              <Badge variant="secondary">
                {stats.thisMonthTransactions} transactions
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
                    {formatCurrency(stats.lastMonthRevenue, "USD")} revenue
                  </p>
                </div>
              </div>
              <Badge variant="secondary">
                {stats.lastMonthTransactions} transactions
              </Badge>
            </div>
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
                  {formatCurrency(stats.refundedAmount, "USD")}
                </p>
                <p className="text-xs text-gray-500">
                  {stats.totalTransactions > 0
                    ? `${((stats.refundedAmount / stats.totalRevenue) * 100).toFixed(1)}% of revenue`
                    : "0% of revenue"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
