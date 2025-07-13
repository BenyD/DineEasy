"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CreditCard,
  Banknote,
  ExternalLink,
  Calendar,
  DollarSign,
  Loader2,
} from "lucide-react";
import { PaymentTransaction } from "@/lib/actions/payments";
import { formatCurrency } from "@/lib/utils/currency";

interface PaymentTransactionsProps {
  transactions: PaymentTransaction[];
  isLoading?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function PaymentTransactions({
  transactions,
  isLoading = false,
  onLoadMore,
  hasMore = false,
}: PaymentTransactionsProps) {
  const [expandedTransaction, setExpandedTransaction] = useState<string | null>(
    null
  );

  // Validate and filter transactions
  const validTransactions = transactions.filter((transaction) => {
    return (
      transaction?.id &&
      typeof transaction.amount === "number" &&
      transaction.currency &&
      transaction.status &&
      transaction.method &&
      transaction.created_at
    );
  });

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);

      // Check if date is valid
      if (isNaN(date.getTime())) {
        return "Invalid date";
      }

      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      console.error("Error formatting date:", dateString, error);
      return "Invalid date";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "failed":
        return "bg-red-100 text-red-800";
      case "refunded":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method?.toLowerCase()) {
      case "card":
        return <CreditCard className="h-4 w-4" />;
      case "cash":
        return <Banknote className="h-4 w-4" />;
      default:
        return <DollarSign className="h-4 w-4" />;
    }
  };

  const toggleExpanded = (transactionId: string) => {
    setExpandedTransaction(
      expandedTransaction === transactionId ? null : transactionId
    );
  };

  if (isLoading && transactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
        <p className="text-sm text-gray-500">
          Your latest payment transactions and orders
        </p>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <div className="text-center py-8">
            <Banknote className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No transactions yet
            </h3>
            <p className="text-gray-500">
              Once you start accepting payments, your transactions will appear
              here.
            </p>
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-4"
          >
            {validTransactions.map((transaction) => (
              <motion.div
                key={transaction.id}
                variants={itemVariants}
                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      {getMethodIcon(transaction.method)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">
                          {formatCurrency(
                            transaction.amount,
                            transaction.currency
                          )}
                        </p>
                        <Badge className={getStatusColor(transaction.status)}>
                          {transaction.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(transaction.created_at)}
                        </span>
                        {transaction.order_id && (
                          <span>Order #{transaction.order_id}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {(transaction.stripe_payment_id ||
                      transaction.refund_id) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleExpanded(transaction.id)}
                      >
                        {expandedTransaction === transaction.id
                          ? "Hide"
                          : "Details"}
                      </Button>
                    )}
                  </div>
                </div>

                {/* Expanded details */}
                {expandedTransaction === transaction.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 pt-4 border-t space-y-2"
                  >
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Transaction ID</p>
                        <p className="font-mono text-xs">{transaction.id}</p>
                      </div>
                      {transaction.stripe_payment_id && (
                        <div>
                          <p className="text-gray-500">Stripe Payment ID</p>
                          <div className="flex items-center gap-2">
                            <p className="font-mono text-xs">
                              {transaction.stripe_payment_id}
                            </p>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                window.open(
                                  `https://dashboard.stripe.com/payments/${transaction.stripe_payment_id}`,
                                  "_blank"
                                )
                              }
                            >
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      )}
                      {transaction.refund_id && (
                        <div>
                          <p className="text-gray-500">Refund ID</p>
                          <p className="font-mono text-xs">
                            {transaction.refund_id}
                          </p>
                        </div>
                      )}
                      <div>
                        <p className="text-gray-500">Payment Method</p>
                        <p className="capitalize">{transaction.method}</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ))}

            {hasMore && (
              <div className="text-center pt-4">
                <Button
                  variant="outline"
                  onClick={onLoadMore}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Loading...
                    </>
                  ) : (
                    "Load More Transactions"
                  )}
                </Button>
              </div>
            )}
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
