"use client";

import { useState } from "react";
import {
  ThumbsUp,
  ThumbsDown,
  Star,
  MessageSquare,
  Filter,
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

export default function FeedbackPage() {
  const [timeRange, setTimeRange] = useState("week");

  // This would come from your backend
  const feedbackItems = [
    {
      id: 1,
      customerName: "John D.",
      rating: 5,
      comment: "Great food and quick service!",
      date: "2024-03-15",
      orderNumber: "#1234",
      sentiment: "positive",
    },
    {
      id: 2,
      customerName: "Sarah M.",
      rating: 4,
      comment: "Food was delicious but took a bit longer than expected.",
      date: "2024-03-14",
      orderNumber: "#1233",
      sentiment: "neutral",
    },
    // Add more mock data as needed
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Customer Feedback
          </h1>
          <p className="text-muted-foreground">
            View and analyze customer feedback and ratings
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
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Average Rating
            </CardTitle>
            <Star className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.5</div>
            <p className="text-xs text-muted-foreground">
              +0.2 from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
            <MessageSquare className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">128</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Positive</CardTitle>
            <ThumbsUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">85%</div>
            <p className="text-xs text-muted-foreground">109 reviews</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Negative</CardTitle>
            <ThumbsDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">15%</div>
            <p className="text-xs text-muted-foreground">19 reviews</p>
          </CardContent>
        </Card>
      </div>

      {/* Feedback List */}
      <div className="space-y-4">
        {feedbackItems.map((item) => (
          <Card key={item.id}>
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
              <div>
                <CardTitle className="text-base">
                  {item.customerName}{" "}
                  <span className="text-sm text-muted-foreground">
                    {item.orderNumber}
                  </span>
                </CardTitle>
                <CardDescription>{item.date}</CardDescription>
              </div>
              <Badge
                variant={
                  item.sentiment === "positive"
                    ? "success"
                    : item.sentiment === "neutral"
                    ? "secondary"
                    : "destructive"
                }
              >
                {item.rating} ★
              </Badge>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{item.comment}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
