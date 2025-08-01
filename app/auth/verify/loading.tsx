import { Card, CardContent } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

export default function VerifyLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
            <h2 className="text-xl font-semibold">Verifying...</h2>
            <p className="text-gray-600">Please wait while we verify your login.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
