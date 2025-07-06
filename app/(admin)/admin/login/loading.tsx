import { Loader2 } from "lucide-react"

export default function AdminLoginLoading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-muted/50 to-muted">
      <div className="flex flex-col items-center gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <h2 className="text-xl font-medium">Loading admin portal...</h2>
      </div>
    </div>
  )
}
