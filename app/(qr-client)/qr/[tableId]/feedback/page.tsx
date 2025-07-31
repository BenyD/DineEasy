"use client";

import { use, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Star, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import {
  submitFeedback,
  getOrderFeedback,
  getOrderForFeedback,
  getFeedbackByOrderNumber,
} from "@/lib/actions/feedback";
import { getTableInfo } from "@/lib/actions/qr-client";
import { toast } from "sonner";

export default function FeedbackPage({
  params,
  searchParams,
}: {
  params: Promise<{ tableId: string }>;
  searchParams: Promise<{ order?: string }>;
}) {
  const resolvedParams = use(params);
  const resolvedSearchParams = use(searchParams);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [existingFeedback, setExistingFeedback] = useState<any>(null);
  const [orderData, setOrderData] = useState<any>(null);

  const orderNumber = resolvedSearchParams.order || "000";

  // Load table and order information
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // Get table info to get restaurant ID
        const tableResult = await getTableInfo(resolvedParams.tableId);
        if (tableResult.success && tableResult.data) {
          setRestaurantId(tableResult.data.restaurants.id);

          // If we have an order number, try to find the order ID
          if (orderNumber && orderNumber !== "000") {
            console.log("Order number for feedback:", orderNumber);

            // Get order information for feedback
            const orderResult = await getOrderForFeedback(
              orderNumber,
              tableResult.data.restaurants.id
            );
            if (orderResult.success && orderResult.order) {
              setOrderData(orderResult.order);
              setOrderId(orderResult.order.orderId);

              // Check if feedback already exists for this order
              if (orderResult.order.hasFeedback) {
                const feedbackResult = await getFeedbackByOrderNumber(
                  orderNumber,
                  tableResult.data.restaurants.id
                );
                if (feedbackResult.success && feedbackResult.feedback) {
                  setExistingFeedback(feedbackResult.feedback);
                }
              }
            } else if (orderResult.error) {
              console.log("Order not found:", orderResult.error);
              // Order not found, but we can still collect general feedback
            }
          }
        }
      } catch (error) {
        console.error("Error loading table data:", error);
        toast.error("Failed to load page data");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [resolvedParams.tableId, orderNumber]);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }

    if (!restaurantId) {
      toast.error("Restaurant information not available");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await submitFeedback({
        restaurantId,
        orderId: orderId || undefined,
        orderNumber: orderNumber !== "000" ? orderNumber : undefined,
        rating,
        comment: comment.trim() || undefined,
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      setIsSubmitted(true);
      toast.success("Thank you for your feedback!");
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast.error("Failed to submit feedback. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-green-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading feedback form...</p>
        </div>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-md"
        >
          <div className="w-24 h-24 mx-auto mb-8 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-2xl">
            <span className="text-4xl">🙏</span>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-3">Thank You!</h1>
          <p className="text-gray-600 mb-8 text-lg leading-relaxed">
            Your feedback helps us improve our service and food quality.
          </p>

          <Link href={`/qr/${resolvedParams.tableId}`}>
            <Button className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 px-8 py-3 rounded-full text-lg shadow-lg">
              Back to Menu
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  // Check if feedback already exists for this order
  if (existingFeedback) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-md"
        >
          <div className="w-24 h-24 mx-auto mb-8 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center shadow-2xl">
            <span className="text-4xl">✅</span>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            Feedback Submitted!
          </h1>
          <p className="text-gray-600 mb-8 text-lg leading-relaxed">
            You've already provided feedback for this order. Thank you!
          </p>

          <Link href={`/qr/${resolvedParams.tableId}`}>
            <Button className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 px-8 py-3 rounded-full text-lg shadow-lg">
              Back to Menu
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Enhanced Header */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-lg border-b border-gray-100 shadow-sm">
        <div className="flex items-center gap-4 px-4 py-4">
          <Link
            href={{
              pathname: `/qr/${resolvedParams.tableId}/confirmation`,
              query: { order: orderNumber },
            }}
          >
            <Button
              variant="ghost"
              size="sm"
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-lg font-bold">Rate Your Experience</h1>
            <p className="text-sm text-gray-500">
              {orderData
                ? `Order #${orderData.orderNumber}`
                : `Order #${orderNumber}`}
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 py-8">
        {/* Order Information */}
        {orderData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 mb-8"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Order Details
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Order Number:</span>
                <p className="font-medium text-gray-900">
                  #{orderData.orderNumber}
                </p>
              </div>
              <div>
                <span className="text-gray-500">Total Amount:</span>
                <p className="font-medium text-gray-900">
                  CHF {orderData.totalAmount.toFixed(2)}
                </p>
              </div>
              {orderData.customerName && (
                <div>
                  <span className="text-gray-500">Customer:</span>
                  <p className="font-medium text-gray-900">
                    {orderData.customerName}
                  </p>
                </div>
              )}
              <div>
                <span className="text-gray-500">Date:</span>
                <p className="font-medium text-gray-900">
                  {new Date(orderData.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Enhanced Rating Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: orderData ? 0.1 : 0 }}
          className="text-center mb-8"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            How was your experience?
          </h2>
          <p className="text-gray-600 mb-8 text-lg">
            Your feedback helps us serve you better
          </p>

          {/* Enhanced Star Rating */}
          <div className="flex justify-center gap-3 mb-8">
            {[1, 2, 3, 4, 5].map((star) => (
              <motion.button
                key={star}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                className="p-2"
              >
                <Star
                  className={`w-12 h-12 transition-all duration-200 ${
                    star <= (hoveredRating || rating)
                      ? "text-yellow-400 fill-yellow-400 drop-shadow-lg"
                      : "text-gray-300 hover:text-gray-400"
                  }`}
                />
              </motion.button>
            ))}
          </div>

          {/* Enhanced Rating Labels */}
          {rating > 0 && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xl font-bold text-green-700 mb-8"
            >
              {rating === 1 && "Poor 😞"}
              {rating === 2 && "Fair 😐"}
              {rating === 3 && "Good 🙂"}
              {rating === 4 && "Very Good 😊"}
              {rating === 5 && "Excellent! 🤩"}
            </motion.p>
          )}
        </motion.div>

        {/* Enhanced Comment Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: orderData ? 0.2 : 0.2 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 mb-8"
        >
          <label className="block text-lg font-semibold text-gray-900 mb-3">
            Tell us more (optional)
          </label>
          <Textarea
            placeholder="What did you like? What could we improve? Any special mentions for our staff?"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="min-h-[120px] border-gray-200 focus:border-green-500 focus:ring-green-500 resize-none rounded-xl text-base"
          />
        </motion.div>

        {/* Enhanced Submit Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: orderData ? 0.3 : 0.4 }}
        >
          <Button
            onClick={handleSubmit}
            disabled={rating === 0 || isSubmitting}
            size="lg"
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white h-16 disabled:opacity-50 rounded-2xl text-lg font-semibold shadow-lg"
          >
            {isSubmitting ? (
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Submitting Feedback...
              </div>
            ) : (
              <>
                <Send className="w-5 h-5 mr-2" />
                Submit Feedback
              </>
            )}
          </Button>
        </motion.div>

        {/* Enhanced Skip Option */}
        <div className="text-center mt-6">
          <Link href={`/qr/${resolvedParams.tableId}`}>
            <Button
              variant="ghost"
              className="text-gray-500 hover:text-gray-700 text-lg rounded-2xl"
            >
              Skip for now
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
