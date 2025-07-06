"use client";

import { useState } from "react";
import {
  Star,
  MessageSquare,
  Search,
  Calendar,
  Clock,
  ThumbsUp,
  ThumbsDown,
  ExternalLink,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import React from "react";

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
  const [selectedTab, setSelectedTab] = useState("all");

  const filteredFeedback = feedbackItems.filter((item) => {
    if (selectedTab !== "all" && item.sentiment !== selectedTab) return false;
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
    <div className="p-6 space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Customer Feedback
          </h1>
          <p className="text-muted-foreground">
            View customer feedback and ratings
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Last 24 Hours</SelectItem>
              <SelectItem value="week">Last 7 Days</SelectItem>
              <SelectItem value="month">Last 30 Days</SelectItem>
              <SelectItem value="year">Last Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon">
            <Calendar className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Average Rating
              </CardTitle>
              <Star className="h-4 w-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.averageRating}</div>
              <div className="flex items-center mt-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-3 w-3 ${
                      star <= stats.averageRating
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
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

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
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
                  className="h-2 bg-green-500 rounded-full"
                  style={{ width: `${stats.positivePercentage}%` }}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
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
                  className="h-2 bg-red-500 rounded-full"
                  style={{ width: `${stats.negativePercentage}%` }}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search feedback..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <Select value={selectedRating} onValueChange={setSelectedRating}>
              <SelectTrigger className="w-[140px]">
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
        </CardContent>
      </Card>

      {/* Feedback Tabs and List */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="all">All Feedback</TabsTrigger>
          <TabsTrigger value="positive">Positive</TabsTrigger>
          <TabsTrigger value="neutral">Neutral</TabsTrigger>
          <TabsTrigger value="negative">Negative</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab} className="mt-6">
          <div className="space-y-4">
            {filteredFeedback.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
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
                      className={sentimentColors[item.sentiment]}
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
                          {item.items.map((itemName, index) => (
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
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
