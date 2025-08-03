"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CreditCard,
  Banknote,
  ExternalLink,
  Calendar,
  DollarSign,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Eye,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  User,
  Hash,
  Receipt,
} from "lucide-react";
import { PaymentTransaction, createRefund } from "@/lib/actions/payments";
import { formatCurrency } from "@/lib/utils/currency";
import { toast } from "sonner";

interface PaymentTransactionsProps {
  transactions: PaymentTransaction[];
  isLoading?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
  totalCount?: number;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  pageSize?: number;
  onStatsRefresh?: () => void;
  currency?: string;
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
  totalCount = 0,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  pageSize = 20,
  onStatsRefresh,
  currency,
}: PaymentTransactionsProps) {
  const [expandedTransaction, setExpandedTransaction] = useState<string | null>(
    null
  );
  const [selectedTransaction, setSelectedTransaction] =
    useState<PaymentTransaction | null>(null);
  const [isRefunding, setIsRefunding] = useState(false);
  const [showRefundDialog, setShowRefundDialog] = useState(false);
  const [transactionToRefund, setTransactionToRefund] =
    useState<PaymentTransaction | null>(null);

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
        return "bg-green-100 text-green-800 border-green-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "failed":
        return "bg-red-100 text-red-800 border-red-200";
      case "refunded":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return <CheckCircle className="h-4 w-4" />;
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "failed":
        return <AlertTriangle className="h-4 w-4" />;
      case "refunded":
        return <RefreshCw className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method?.toLowerCase()) {
      case "card":
        return <CreditCard className="h-5 w-5" />;
      case "cash":
        return <Banknote className="h-5 w-5" />;
      case "credit_card":
        return <CreditCard className="h-5 w-5" />;
      case "debit_card":
        return <CreditCard className="h-5 w-5" />;
      default:
        return <DollarSign className="h-5 w-5" />;
    }
  };

  const getMethodColor = (method: string) => {
    switch (method?.toLowerCase()) {
      case "card":
      case "credit_card":
      case "debit_card":
        return "bg-blue-100 text-blue-600 border-blue-200";
      case "cash":
        return "bg-green-100 text-green-600 border-green-200";
      default:
        return "bg-gray-100 text-gray-600 border-gray-200";
    }
  };

  const getMethodDisplayText = (method: string) => {
    switch (method?.toLowerCase()) {
      case "card":
      case "credit_card":
      case "debit_card":
        return "Card Payment";
      case "cash":
        return "Cash Payment";
      default:
        return capitalizeFirst(method || "Unknown");
    }
  };

  const capitalizeFirst = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  const toggleExpanded = (transactionId: string) => {
    setExpandedTransaction(
      expandedTransaction === transactionId ? null : transactionId
    );
  };

  const handleRefund = async (transaction: PaymentTransaction) => {
    if (!transaction.stripe_payment_id) {
      toast.error("Only card payments can be refunded");
      return;
    }

    setTransactionToRefund(transaction);
    setShowRefundDialog(true);
  };

  const confirmRefund = async () => {
    if (!transactionToRefund) return;

    setIsRefunding(true);
    try {
      const result = await createRefund({
        paymentId: transactionToRefund.id,
        reason: "requested_by_customer",
      });

      if (result.success) {
        toast.success("Refund processed successfully");
        setShowRefundDialog(false);
        setTransactionToRefund(null);
        // Refresh stats instead of reloading the page
        onStatsRefresh?.();
      } else {
        toast.error(result.error || "Failed to process refund");
      }
    } catch (error) {
      console.error("Error processing refund:", error);
      toast.error("Failed to process refund");
    } finally {
      setIsRefunding(false);
    }
  };

  const handlePageChange = (page: number) => {
    if (onPageChange && page >= 1 && page <= totalPages) {
      onPageChange(page);
    }
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  if (isLoading && transactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>All Transactions</CardTitle>
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
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Transactions</CardTitle>
              <p className="text-sm text-gray-500">
                Complete payment transaction history
              </p>
            </div>
            {totalCount > 0 && (
              <div className="text-sm text-gray-500">
                {totalCount} transaction{totalCount !== 1 ? "s" : ""} total
              </div>
            )}
          </div>
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
            <>
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
                    className="border rounded-lg p-6 hover:bg-gray-50 transition-all duration-200 hover:shadow-sm"
                  >
                    <div className="flex items-start justify-between">
                      {/* Left side - Main transaction info */}
                      <div className="flex items-start gap-4 flex-1">
                        {/* Payment method icon */}
                        <div
                          className={`p-3 rounded-lg ${getMethodColor(transaction.method)}`}
                        >
                          {getMethodIcon(transaction.method)}
                        </div>

                        {/* Transaction details */}
                        <div className="flex-1 space-y-3">
                          {/* Primary info row */}
                          <div className="flex items-center gap-3">
                            <h3 className="text-xl font-semibold text-gray-900">
                              {formatCurrency(
                                Number(transaction.amount) || 0,
                                transaction.currency
                              )}
                            </h3>
                            <Badge
                              className={`${getStatusColor(transaction.status)} flex items-center gap-1`}
                            >
                              {getStatusIcon(transaction.status)}
                              {capitalizeFirst(transaction.status)}
                            </Badge>
                          </div>

                          {/* Secondary info row */}
                          <div className="flex items-center gap-6 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              <span>{formatDate(transaction.created_at)}</span>
                            </div>
                            {transaction.customer_name && (
                              <div className="flex items-center gap-1">
                                <User className="h-4 w-4" />
                                <span className="font-medium">
                                  {transaction.customer_name}
                                </span>
                              </div>
                            )}
                            {transaction.table_number && (
                              <div className="flex items-center gap-1">
                                <Hash className="h-4 w-4" />
                                <span className="font-medium text-blue-600">
                                  Table {transaction.table_number}
                                </span>
                              </div>
                            )}
                            {transaction.orderNumber && (
                              <div className="flex items-center gap-1">
                                <Receipt className="h-4 w-4" />
                                <span className="font-mono font-medium">
                                  {transaction.orderNumber}
                                </span>
                              </div>
                            )}
                            {!transaction.orderNumber &&
                              transaction.order_id && (
                                <div className="flex items-center gap-1">
                                  <Receipt className="h-4 w-4" />
                                  <span className="font-mono">
                                    #
                                    {transaction.order_id
                                      .slice(-8)
                                      .toUpperCase()}
                                  </span>
                                </div>
                              )}
                          </div>
                        </div>
                      </div>

                      {/* Right side - Actions */}
                      <div className="flex items-center gap-2">
                        <Sheet>
                          <SheetTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setSelectedTransaction(transaction)
                              }
                              className="flex items-center gap-2"
                            >
                              <Eye className="h-4 w-4" />
                              View Details
                            </Button>
                          </SheetTrigger>
                        </Sheet>
                        {transaction.status === "completed" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              window.open(
                                `/dashboard/orders/history?order=${transaction.orderNumber}`,
                                "_blank"
                              )
                            }
                            className="flex items-center gap-2"
                          >
                            <Receipt className="h-4 w-4" />
                            View Order
                          </Button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    Showing {(currentPage - 1) * pageSize + 1} to{" "}
                    {Math.min(currentPage * pageSize, totalCount)} of{" "}
                    {totalCount} transactions
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1 || isLoading}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>

                    <div className="flex items-center gap-1">
                      {getPageNumbers().map((page, index) => (
                        <div key={index}>
                          {page === "..." ? (
                            <span className="px-3 py-2 text-gray-500">...</span>
                          ) : (
                            <Button
                              variant={
                                currentPage === page ? "default" : "outline"
                              }
                              size="sm"
                              onClick={() => handlePageChange(page as number)}
                              disabled={isLoading}
                              className="w-10 h-10"
                            >
                              {page}
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages || isLoading}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Legacy Load More Button (for backward compatibility) */}
              {hasMore && !onPageChange && (
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
            </>
          )}
        </CardContent>
      </Card>

      {/* Refund Confirmation Dialog */}
      <Dialog open={showRefundDialog} onOpenChange={setShowRefundDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Refund</DialogTitle>
            <DialogDescription>
              Are you sure you want to refund this payment? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-lg font-semibold text-gray-900">
              {transactionToRefund
                ? formatCurrency(
                    Number(transactionToRefund.amount) || 0,
                    transactionToRefund.currency
                  )
                : "N/A"}
            </p>
            <p className="text-sm text-gray-600">
              Refund amount for payment ID:{" "}
              {transactionToRefund?.stripe_payment_id || "N/A"}
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRefundDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmRefund}
              disabled={isRefunding}
            >
              {isRefunding ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              {isRefunding ? "Refunding..." : "Confirm Refund"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AnimatePresence>
        {selectedTransaction && (
          <Sheet
            open={!!selectedTransaction}
            onOpenChange={(open) => !open && setSelectedTransaction(null)}
          >
            <SheetContent className="w-full sm:max-w-xl overflow-y-auto p-0">
              <SheetHeader className="px-6 py-4 border-b">
                <SheetTitle>Transaction Details</SheetTitle>
              </SheetHeader>

              {selectedTransaction && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  {/* Transaction Overview */}
                  <div className="flex-none px-6 py-4 border-b bg-gray-50">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-3 rounded-lg ${getMethodColor(selectedTransaction.method)}`}
                        >
                          {getMethodIcon(selectedTransaction.method)}
                        </div>
                        <div>
                          <h2 className="text-lg font-semibold text-gray-900">
                            {formatCurrency(
                              Number(selectedTransaction.amount) || 0,
                              selectedTransaction.currency
                            )}
                          </h2>
                          <p className="text-sm text-gray-600 capitalize">
                            {getMethodDisplayText(selectedTransaction.method)}
                          </p>
                        </div>
                      </div>
                      <Badge
                        className={`${getStatusColor(selectedTransaction.status)} flex items-center gap-1`}
                      >
                        {getStatusIcon(selectedTransaction.status)}
                        {capitalizeFirst(selectedTransaction.status)}
                      </Badge>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 overflow-y-auto">
                    <div className="px-6 py-4 space-y-6">
                      {/* Transaction Information */}
                      <div>
                        <h3 className="text-sm font-medium text-gray-900 mb-3">
                          Transaction Information
                        </h3>
                        <div className="bg-white rounded-lg border p-4 space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Date</p>
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-gray-400" />
                                <span className="text-sm font-medium">
                                  {new Date(
                                    selectedTransaction.created_at
                                  ).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Time</p>
                              <span className="text-sm font-medium">
                                {new Date(
                                  selectedTransaction.created_at
                                ).toLocaleTimeString()}
                              </span>
                            </div>
                          </div>

                          {selectedTransaction.customer_name && (
                            <div>
                              <p className="text-xs text-gray-500 mb-1">
                                Customer
                              </p>
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-gray-400" />
                                <span className="text-sm font-medium">
                                  {selectedTransaction.customer_name}
                                </span>
                              </div>
                            </div>
                          )}

                          {selectedTransaction.table_number && (
                            <div>
                              <p className="text-xs text-gray-500 mb-1">
                                Table
                              </p>
                              <div className="flex items-center gap-2">
                                <Hash className="w-4 h-4 text-gray-400" />
                                <span className="text-sm font-medium">
                                  Table {selectedTransaction.table_number}
                                </span>
                              </div>
                            </div>
                          )}

                          <div>
                            <p className="text-xs text-gray-500 mb-1">
                              Transaction ID
                            </p>
                            <p className="font-mono text-xs bg-gray-50 p-2 rounded break-all">
                              {selectedTransaction.id}
                            </p>
                          </div>

                          {selectedTransaction.orderNumber && (
                            <div>
                              <p className="text-xs text-gray-500 mb-1">
                                Order Number
                              </p>
                              <div className="flex items-center gap-2">
                                <Receipt className="w-4 h-4 text-gray-400" />
                                <p className="font-mono text-xs bg-gray-50 p-2 rounded break-all">
                                  {selectedTransaction.orderNumber}
                                </p>
                              </div>
                            </div>
                          )}
                          {!selectedTransaction.orderNumber &&
                            selectedTransaction.order_id && (
                              <div>
                                <p className="text-xs text-gray-500 mb-1">
                                  Order ID
                                </p>
                                <div className="flex items-center gap-2">
                                  <Receipt className="w-4 h-4 text-gray-400" />
                                  <p className="font-mono text-xs bg-gray-50 p-2 rounded break-all">
                                    #
                                    {selectedTransaction.order_id
                                      .slice(-8)
                                      .toUpperCase()}
                                  </p>
                                </div>
                              </div>
                            )}
                        </div>
                      </div>

                      {/* Stripe Information */}
                      {selectedTransaction.stripe_payment_id ? (
                        <div>
                          <h3 className="text-sm font-medium text-gray-900 mb-3">
                            Stripe Information
                          </h3>
                          <div className="bg-white rounded-lg border p-4 space-y-3">
                            <div>
                              <p className="text-xs text-gray-500 mb-1">
                                Stripe Payment ID
                              </p>
                              <div className="flex items-center gap-2">
                                <p className="font-mono text-xs bg-gray-50 p-2 rounded flex-1 break-all">
                                  {selectedTransaction.stripe_payment_id}
                                </p>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    window.open(
                                      `https://dashboard.stripe.com/payments/${selectedTransaction.stripe_payment_id}`,
                                      "_blank"
                                    )
                                  }
                                >
                                  <ExternalLink className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                            {selectedTransaction.refund_id && (
                              <div>
                                <p className="text-xs text-gray-500 mb-1">
                                  Refund ID
                                </p>
                                <p className="font-mono text-xs bg-gray-50 p-2 rounded break-all">
                                  {selectedTransaction.refund_id}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : selectedTransaction.method === "card" ? (
                        <div>
                          <h3 className="text-sm font-medium text-gray-900 mb-3">
                            Stripe Information
                          </h3>
                          <div className="bg-white rounded-lg border p-4">
                            <div className="flex items-center gap-2 text-amber-600">
                              <AlertTriangle className="h-4 w-4" />
                              <p className="text-sm">
                                Stripe payment ID not available for this
                                transaction
                              </p>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                              This may be a legacy payment or the Stripe
                              integration was not fully configured at the time
                              of payment.
                            </p>
                          </div>
                        </div>
                      ) : null}

                      {/* Actions */}
                      <div>
                        <h3 className="text-sm font-medium text-gray-900 mb-3">
                          Actions
                        </h3>
                        <div className="bg-white rounded-lg border p-4 space-y-3">
                          {selectedTransaction.stripe_payment_id &&
                            selectedTransaction.status === "completed" && (
                              <Button
                                variant="outline"
                                onClick={() =>
                                  handleRefund(selectedTransaction)
                                }
                                disabled={isRefunding}
                                className="flex items-center gap-2 w-full"
                              >
                                {isRefunding ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <RefreshCw className="h-4 w-4" />
                                )}
                                {isRefunding
                                  ? "Processing..."
                                  : "Refund Payment"}
                              </Button>
                            )}
                          {!selectedTransaction.stripe_payment_id &&
                            selectedTransaction.method === "card" &&
                            selectedTransaction.status === "completed" && (
                              <Button
                                variant="outline"
                                disabled
                                className="flex items-center gap-2 w-full text-gray-400"
                              >
                                <RefreshCw className="h-4 w-4" />
                                Refund Not Available
                              </Button>
                            )}
                          {selectedTransaction.method === "cash" &&
                            selectedTransaction.status === "completed" && (
                              <>
                                <Button
                                  variant="outline"
                                  onClick={() =>
                                    window.open(
                                      `/dashboard/orders/history?order=${selectedTransaction.orderNumber}`,
                                      "_blank"
                                    )
                                  }
                                  className="flex items-center gap-2 w-full"
                                >
                                  <Receipt className="h-4 w-4" />
                                  View Order Details
                                </Button>
                                <Button
                                  variant="outline"
                                  onClick={() =>
                                    window.open(
                                      `/dashboard/orders/active?order=${selectedTransaction.orderNumber}`,
                                      "_blank"
                                    )
                                  }
                                  className="flex items-center gap-2 w-full"
                                >
                                  <Clock className="h-4 w-4" />
                                  Check Active Orders
                                </Button>
                              </>
                            )}
                          {selectedTransaction.stripe_payment_id ? (
                            <Button
                              variant="outline"
                              onClick={() =>
                                window.open(
                                  `https://dashboard.stripe.com/payments/${selectedTransaction.stripe_payment_id}`,
                                  "_blank"
                                )
                              }
                              className="flex items-center gap-2 w-full"
                            >
                              <ExternalLink className="h-4 w-4" />
                              View in Stripe
                            </Button>
                          ) : selectedTransaction.method === "card" ? (
                            <Button
                              variant="outline"
                              disabled
                              className="flex items-center gap-2 w-full text-gray-400"
                            >
                              <ExternalLink className="h-4 w-4" />
                              Stripe ID Not Available
                            </Button>
                          ) : selectedTransaction.method === "cash" ? (
                            <Button
                              variant="outline"
                              disabled
                              className="flex items-center gap-2 w-full text-gray-400"
                            >
                              <Banknote className="h-4 w-4" />
                              Cash Payment - No External Link
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div className="flex-none border-t px-6 py-4 bg-gray-50">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setSelectedTransaction(null)}
                      >
                        Close
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </SheetContent>
          </Sheet>
        )}
      </AnimatePresence>
    </>
  );
}
