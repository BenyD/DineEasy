import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function TableLayoutEditorLoading() {
  return (
    <div className="p-6 space-y-6">
      {/* Header Skeleton */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-80" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-32" />
        </div>
      </div>

      {/* Settings Panel Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="h-5 w-32" />
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, j) => (
                    <div key={j} className="flex items-center justify-between">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-6 w-12" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Canvas Skeleton */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-5 w-24" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-9 w-28" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="w-full h-[600px] bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-lg relative overflow-hidden">
            {/* Grid Pattern */}
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: `
                  linear-gradient(to right, #e5e7eb 1px, transparent 1px),
                  linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
                `,
                backgroundSize: "20px 20px",
              }}
            />

            {/* Table Skeletons */}
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="absolute"
                style={{
                  left: 100 + (i % 4) * 120,
                  top: 100 + Math.floor(i / 4) * 120,
                }}
              >
                <Skeleton className="w-16 h-16 rounded-lg" />
              </div>
            ))}

            {/* Element Skeletons */}
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={`element-${i}`}
                className="absolute"
                style={{
                  left: 50 + i * 200,
                  top: 50,
                }}
              >
                <Skeleton className="w-20 h-12 rounded-lg" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Element Library Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="flex flex-col items-center gap-2 p-4 border rounded-lg"
              >
                <Skeleton className="w-12 h-12 rounded-lg" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
