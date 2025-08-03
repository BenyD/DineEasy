"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star,
  MessageSquare,
  Search,
  Calendar,
  Clock,
  ThumbsUp,
  ThumbsDown,
  ExternalLink,
  Filter,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  getFeedbackAnalytics,
  getRecentFeedback,
} from "@/lib/actions/feedback";
import { useRestaurantSettings } from "@/lib/store/restaurant-settings";
import { toast } from "sonner";
import React from "react";

// Simplified animation variants for better performance
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.3,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.2,
    },
  },
};

type FeedbackSentiment = "positive" | "neutral" | "negative";

interface FeedbackItem {
  id: number;
  customerName: string;
  rating: number;
  comment: string;
  date: string;
  orderNumber: string;
  sentiment: FeedbackSentiment;
  items: string[];
  tableNumber: string;
  timeSpent: string;
}

const sentimentColors: Record<FeedbackSentiment, string> = {
  positive: "bg-green-100 text-green-800",
  neutral: "bg-yellow-100 text-yellow-800",
  negative: "bg-red-100 text-red-800",
};

export default function FeedbackPage() {
  const { restaurant } = useRestaurantSettings();
  const [timeRange, setTimeRange] = useState("month");
  const [selectedRating, setSelectedRating] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sentiment, setSentiment] = useState("all");
  const [analytics, setAnalytics] = useState<any>(null);
  const [recentFeedback, setRecentFeedback] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadFeedbackData = useCallback(async () => {
    try {
      setLoading(true);
      const days =
        timeRange === "day"
          ? 1
          : timeRange === "week"
            ? 7
            : timeRange === "month"
              ? 30
              : 365;

      const [analyticsResult, recentResult] = await Promise.all([
        getFeedbackAnalytics(restaurant!.id, days),
        getRecentFeedback(restaurant!.id, 20),
      ]);

      if (analyticsResult.success) {
        setAnalytics(analyticsResult.analytics);
      }

      if (recentResult.success) {
        setRecentFeedback(recentResult.feedback);
      }
    } catch (error) {
      console.error("Error loading feedback data:", error);
      toast.error("Failed to load feedback data");
    } finally {
      setLoading(false);
    }
  }, [restaurant, timeRange]);

  // Load feedback data
  useEffect(() => {
    if (restaurant?.id) {
      loadFeedbackData();
    }
  }, [loadFeedbackData, restaurant?.id]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadFeedbackData();
    setRefreshing(false);
    toast.success("Feedback data refreshed");
  };

  const filteredFeedback = useMemo(() => {
    return recentFeedback.filter((item) => {
      if (sentiment !== "all" && item.sentiment !== sentiment) return false;
      if (selectedRating !== "all" && item.rating !== parseInt(selectedRating))
        return false;
      if (
        searchTerm &&
        !item.comment?.toLowerCase().includes(searchTerm.toLowerCase())
      )
        return false;
      return true;
    });
  }, [recentFeedback, sentiment, selectedRating, searchTerm]);

  const stats = useMemo(() => {
    if (!analytics) {
      return {
        averageRating: 0,
        totalReviews: 0,
        positivePercentage: 0,
        negativePercentage: 0,
      };
    }

    return {
      averageRating: analytics.averageRating,
      totalReviews: analytics.totalFeedback,
      positivePercentage:
        analytics.sentimentDistribution.positive > 0
          ? Math.round(
              (analytics.sentimentDistribution.positive /
                analytics.totalFeedback) *
                100
            )
          : 0,
      negativePercentage:
        analytics.sentimentDistribution.negative > 0
          ? Math.round(
              (analytics.sentimentDistribution.negative /
                analytics.totalFeedback) *
                100
            )
          : 0,
    };
  }, [analytics]);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        {/* Header Skeleton */}
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-64 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="h-9 w-24 bg-gray-200 rounded animate-pulse" />
        </div>

        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg border p-6 space-y-3">
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
              <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
              <div className="h-3 w-32 bg-gray-200 rounded animate-pulse" />
            </div>
          ))}
        </div>

        {/* Filters Card Skeleton */}
        <div className="bg-white rounded-lg border">
          <div className="p-6 border-b">
            <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-2" />
            <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="h-10 bg-gray-200 rounded animate-pulse col-span-full lg:col-span-2" />
              <div className="h-10 bg-gray-200 rounded animate-pulse" />
              <div className="h-10 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        </div>

        {/* Feedback List Skeleton */}
        <div className="bg-white rounded-lg border">
          <div className="p-6 border-b">
            <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-2" />
            <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="p-6 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-gray-200 rounded-full animate-pulse" />
                    <div className="space-y-1">
                      <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                      <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
                    </div>
                  </div>
                  <div className="h-6 w-16 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="space-y-2">
                  <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="flex items-center gap-4">
                  <div className="h-6 w-20 bg-gray-200 rounded animate-pulse" />
                  <div className="h-6 w-24 bg-gray-200 rounded animate-pulse" />
                  <div className="h-6 w-16 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="p-6 space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header Section */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Customer Feedback
          </h1>
          <p className="text-gray-500">
            Monitor and analyze customer feedback and ratings
          </p>
        </div>
        <Button
          onClick={handleRefresh}
          disabled={refreshing}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <RefreshCw
            className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {/* Filters Card */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters & Search
            </CardTitle>
            <CardDescription>
              Filter and search through customer feedback
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search Input */}
              <div className="relative col-span-full lg:col-span-2">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search feedback..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Time Range Filter */}
              <motion.div whileHover={{ scale: 1.01 }}>
                <Select value={timeRange} onValueChange={setTimeRange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Time Range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day">Last 24 Hours</SelectItem>
                    <SelectItem value="week">Last 7 Days</SelectItem>
                    <SelectItem value="month">Last 30 Days</SelectItem>
                    <SelectItem value="year">Last Year</SelectItem>
                  </SelectContent>
                </Select>
              </motion.div>

              {/* Rating Filter */}
              <div className="flex gap-2">
                <div className="flex-1">
                  <Select
                    value={selectedRating}
                    onValueChange={setSelectedRating}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Rating" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Ratings</SelectItem>
                      <SelectItem value="5">5 Stars</SelectItem>
                      <SelectItem value="4">4 Stars</SelectItem>
                      <SelectItem value="3">3 Stars</SelectItem>
                      <SelectItem value="2">2 Stars</SelectItem>
                      <SelectItem value="1">1 Star</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchTerm("");
                      setSelectedRating("all");
                      setTimeRange("week");
                      setSentiment("all");
                    }}
                    className="shrink-0"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Reset
                  </Button>
                </motion.div>
              </div>
            </div>

            <Separator />

            {/* Sentiment Filters */}
            <motion.div
              className="flex flex-wrap gap-2"
              variants={itemVariants}
            >
              {["all", "positive", "neutral", "negative"].map((type) => (
                <motion.div
                  key={type}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    variant={sentiment === type ? "default" : "outline"}
                    onClick={() => setSentiment(type as any)}
                    className={`flex-1 md:flex-none ${
                      sentiment === type
                        ? "bg-green-600 hover:bg-green-700"
                        : ""
                    }`}
                  >
                    {type === "positive" && (
                      <ThumbsUp className="h-4 w-4 mr-2" />
                    )}
                    {type === "negative" && (
                      <ThumbsDown className="h-4 w-4 mr-2" />
                    )}
                    {type === "all"
                      ? "All Feedback"
                      : type.charAt(0).toUpperCase() + type.slice(1)}
                  </Button>
                </motion.div>
              ))}
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Average Rating Card */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Average Rating
              </CardTitle>
              <Star className="h-4 w-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <motion.div
                className="text-2xl font-bold"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
              >
                {stats.averageRating}
              </motion.div>
              <div className="flex items-center mt-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <motion.div
                    key={star}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: star * 0.1 }}
                  >
                    <Star
                      className={`h-3 w-3 ${
                        star <= stats.averageRating
                          ? "text-yellow-400 fill-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Total Reviews Card */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Reviews
              </CardTitle>
              <MessageSquare className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalReviews}</div>
              <p className="text-xs text-muted-foreground">Last 30 days</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Positive Reviews Card */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Positive</CardTitle>
              <ThumbsUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.positivePercentage}%
              </div>
              <div className="h-2 w-full bg-gray-100 rounded-full mt-2">
                <div
                  className="h-2 bg-green-500 rounded-full transition-all duration-300"
                  style={{ width: `${stats.positivePercentage}%` }}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Negative Reviews Card */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Negative</CardTitle>
              <ThumbsDown className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.negativePercentage}%
              </div>
              <div className="h-2 w-full bg-gray-100 rounded-full mt-2">
                <div
                  className="h-2 bg-red-500 rounded-full transition-all duration-300"
                  style={{ width: `${stats.negativePercentage}%` }}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Feedback List */}
      <motion.div className="space-y-4" variants={itemVariants}>
        {filteredFeedback.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-gray-500">
              No feedback found matching your filters.
            </CardContent>
          </Card>
        ) : (
          <AnimatePresence>
            {filteredFeedback.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card>
                  <CardHeader className="flex flex-row items-start justify-between space-y-0">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base">
                          {item.customerName}
                        </CardTitle>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-muted-foreground hover:text-foreground"
                          onClick={() =>
                            (window.location.href = `/dashboard/orders/history?order=${item.orderNumber}`)
                          }
                        >
                          {item.orderNumber}
                          <ExternalLink className="ml-1 h-3 w-3" />
                        </Button>
                      </div>
                      <CardDescription className="flex items-center gap-2">
                        <Clock className="h-3 w-3" />
                        {item.date} • Table {item.tableNumber} •{" "}
                        {item.timeSpent}
                      </CardDescription>
                    </div>
                    <Badge
                      variant="secondary"
                      className={
                        sentimentColors[item.sentiment as FeedbackSentiment]
                      }
                    >
                      {item.rating} ★
                    </Badge>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-600">{item.comment}</p>
                      <div className="mt-2">
                        <p className="text-sm font-medium text-gray-500">
                          Items Ordered:
                        </p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {item.items.map((itemName: string, index: number) => (
                            <Badge
                              key={index}
                              variant="secondary"
                              className="bg-gray-100"
                            >
                              {itemName}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </motion.div>
    </motion.div>
  );
}
