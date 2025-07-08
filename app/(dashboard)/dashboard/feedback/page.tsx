"use client";

import { useState } from "react";
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
import React from "react";

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
    },
  },
};

const cardHoverVariants = {
  hover: {
    scale: 1.02,
    transition: {
      type: "spring",
      stiffness: 400,
    },
  },
};

const progressBarVariants = {
  hidden: { width: 0 },
  visible: (width: number) => ({
    width: `${width}%`,
    transition: {
      duration: 0.8,
      ease: "easeOut",
    },
  }),
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

const feedbackItems: FeedbackItem[] = [
  {
    id: 1,
    customerName: "John D.",
    rating: 5,
    comment:
      "Great food and quick service! The new menu items are fantastic. Will definitely come back again.",
    date: "2024-03-15",
    orderNumber: "#1234",
    sentiment: "positive",
    items: ["Margherita Pizza", "Tiramisu"],
    tableNumber: "12",
    timeSpent: "45 mins",
  },
  {
    id: 2,
    customerName: "Sarah M.",
    rating: 4,
    comment:
      "Food was delicious but took a bit longer than expected. The staff was very apologetic and professional about it though.",
    date: "2024-03-14",
    orderNumber: "#1233",
    sentiment: "neutral",
    items: ["Pasta Carbonara", "Caesar Salad"],
    tableNumber: "8",
    timeSpent: "65 mins",
  },
  {
    id: 3,
    customerName: "Mike R.",
    rating: 2,
    comment:
      "The food was cold when it arrived. Very disappointing experience.",
    date: "2024-03-14",
    orderNumber: "#1232",
    sentiment: "negative",
    items: ["Steak", "Fries"],
    tableNumber: "15",
    timeSpent: "55 mins",
  },
];

const sentimentColors: Record<FeedbackSentiment, string> = {
  positive: "bg-green-100 text-green-800",
  neutral: "bg-yellow-100 text-yellow-800",
  negative: "bg-red-100 text-red-800",
};

export default function FeedbackPage() {
  const [timeRange, setTimeRange] = useState("week");
  const [selectedRating, setSelectedRating] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sentiment, setSentiment] = useState("all");

  const filteredFeedback = feedbackItems.filter((item) => {
    if (sentiment !== "all" && item.sentiment !== sentiment) return false;
    if (selectedRating !== "all" && item.rating !== parseInt(selectedRating))
      return false;
    if (
      searchTerm &&
      !item.comment.toLowerCase().includes(searchTerm.toLowerCase())
    )
      return false;
    return true;
  });

  const stats = {
    averageRating: 4.2,
    totalReviews: feedbackItems.length,
    positivePercentage: 85,
    negativePercentage: 15,
  };

  return (
    <motion.div
      className="p-6 space-y-6"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Header Section */}
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl font-bold text-gray-900">Customer Feedback</h1>
        <p className="text-gray-500">
          Monitor and analyze customer feedback and ratings
        </p>
      </motion.div>

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
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
              variants={itemVariants}
            >
              {/* Search Input */}
              <motion.div
                className="relative col-span-full lg:col-span-2"
                whileHover={{ scale: 1.01 }}
              >
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search feedback..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </motion.div>

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
              <motion.div className="flex gap-2" whileHover={{ scale: 1.01 }}>
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
              </motion.div>
            </motion.div>

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
      <motion.div
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
        variants={containerVariants}
      >
        {/* Average Rating Card */}
        <motion.div
          variants={itemVariants}
          whileHover={cardHoverVariants.hover}
        >
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
        <motion.div
          variants={itemVariants}
          whileHover={cardHoverVariants.hover}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Reviews
              </CardTitle>
              <MessageSquare className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <motion.div
                className="text-2xl font-bold"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
              >
                {stats.totalReviews}
              </motion.div>
              <p className="text-xs text-muted-foreground">Last 30 days</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Positive Reviews Card */}
        <motion.div
          variants={itemVariants}
          whileHover={cardHoverVariants.hover}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Positive</CardTitle>
              <ThumbsUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <motion.div
                className="text-2xl font-bold"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
              >
                {stats.positivePercentage}%
              </motion.div>
              <div className="h-2 w-full bg-gray-100 rounded-full mt-2">
                <motion.div
                  className="h-2 bg-green-500 rounded-full"
                  initial="hidden"
                  animate="visible"
                  variants={progressBarVariants}
                  custom={stats.positivePercentage}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Negative Reviews Card */}
        <motion.div
          variants={itemVariants}
          whileHover={cardHoverVariants.hover}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Negative</CardTitle>
              <ThumbsDown className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <motion.div
                className="text-2xl font-bold"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
              >
                {stats.negativePercentage}%
              </motion.div>
              <div className="h-2 w-full bg-gray-100 rounded-full mt-2">
                <motion.div
                  className="h-2 bg-red-500 rounded-full"
                  initial="hidden"
                  animate="visible"
                  variants={progressBarVariants}
                  custom={stats.negativePercentage}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Feedback List */}
      <motion.div className="space-y-4" variants={containerVariants}>
        <AnimatePresence mode="wait">
          {filteredFeedback.length === 0 ? (
            <motion.div
              key="no-feedback"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <CardContent className="p-6 text-center text-gray-500">
                  No feedback found matching your filters.
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            filteredFeedback.map((item, index) => (
              <motion.div
                key={item.id}
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
                whileHover={cardHoverVariants.hover}
              >
                <Card>
                  <CardHeader className="flex flex-row items-start justify-between space-y-0">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base">
                          {item.customerName}
                        </CardTitle>
                        <motion.div whileHover={{ scale: 1.05 }}>
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
                        </motion.div>
                      </div>
                      <CardDescription className="flex items-center gap-2">
                        <Clock className="h-3 w-3" />
                        {item.date} • Table {item.tableNumber} •{" "}
                        {item.timeSpent}
                      </CardDescription>
                    </div>
                    <motion.div whileHover={{ scale: 1.1 }}>
                      <Badge
                        variant="secondary"
                        className={sentimentColors[item.sentiment]}
                      >
                        {item.rating} ★
                      </Badge>
                    </motion.div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-600">{item.comment}</p>
                      <div className="mt-2">
                        <p className="text-sm font-medium text-gray-500">
                          Items Ordered:
                        </p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {item.items.map((itemName, index) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, scale: 0 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: index * 0.1 }}
                              whileHover={{ scale: 1.1 }}
                            >
                              <Badge
                                variant="secondary"
                                className="bg-gray-100"
                              >
                                {itemName}
                              </Badge>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
