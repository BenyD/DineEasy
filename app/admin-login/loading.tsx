import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function AdminLoginLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <Skeleton className="h-12 w-12 rounded-xl mx-auto" />
          <Skeleton className="h-8 w-48 mx-auto" />
          <Skeleton className="h-4 w-64 mx-auto" />
        </div>

        <Card className="border-0 shadow-lg">
          <CardHeader className="space-y-1 pb-4">
            <Skeleton className="h-6 w-32 mx-auto" />
            <Skeleton className="h-4 w-48 mx-auto" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-11 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-11 w-full" />
            </div>
            <Skeleton className="h-11 w-full" />
          </CardContent>
        </Card>

        <div className="text-center space-y-4">
          <Skeleton className="h-4 w-32 mx-auto" />
          <Skeleton className="h-3 w-40 mx-auto" />
        </div>
      </div>
    </div>
  )
}
