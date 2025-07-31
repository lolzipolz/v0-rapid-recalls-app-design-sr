import { Card, CardContent } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

export default function VerifyLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Verifying Login</h2>
          <p className="text-gray-600">Please wait while we log you in...</p>
        </CardContent>
      </Card>
    </div>
  )
}
