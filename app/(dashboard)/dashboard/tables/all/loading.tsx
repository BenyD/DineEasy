import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function TablesLoading() {
  return (
    <div className="p-6 space-y-6">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-32" />
        </div>
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="space-y-1 flex-1">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters and Search Skeleton */}
      <Card className="overflow-hidden">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-6 w-32" />
          </div>
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative col-span-full lg:col-span-2">
              <Skeleton className="absolute left-2.5 top-2.5 h-4 w-4" />
              <Skeleton className="h-10 w-full pl-8" />
            </div>
            <Skeleton className="h-10 w-full" />
            <div className="flex gap-2">
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 w-20" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Operations Skeleton */}
      <Card className="overflow-hidden">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-6 w-40" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-28" />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tables Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card
            key={i}
            className="overflow-hidden hover:shadow-lg transition-shadow"
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-5 w-20" />
                </div>
                <Skeleton className="h-5 w-16" />
              </div>
              <div className="flex items-center gap-1.5">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-32" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* QR Code Skeleton */}
              <div className="flex justify-center">
                <div className="relative">
                  <Skeleton className="w-32 h-32 rounded-lg" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Skeleton className="w-16 h-16 rounded-lg" />
                  </div>
                </div>
              </div>

              {/* QR Status Skeleton */}
              <div className="flex items-center justify-center gap-2">
                <Skeleton className="h-4 w-4 rounded-full" />
                <Skeleton className="h-4 w-20" />
              </div>

              {/* Quick Stats Skeleton */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-lg p-3">
                  <Skeleton className="h-3 w-8 mb-1" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <Skeleton className="h-3 w-8 mb-1" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>

              {/* Action Buttons Skeleton */}
              <div className="grid grid-cols-3 gap-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full col-span-2" />
              </div>

              {/* Secondary Actions Skeleton */}
              <Skeleton className="h-9 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination Skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-32" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-9" />
          <Skeleton className="h-9 w-9" />
          <Skeleton className="h-9 w-9" />
          <Skeleton className="h-9 w-9" />
        </div>
      </div>
    </div>
  );
}
