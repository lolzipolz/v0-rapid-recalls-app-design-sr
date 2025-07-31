import { Card, CardContent } from "@/components/ui/card"
import { Shield, Loader2 } from "lucide-react"

export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <div className="flex items-center justify-center gap-2 mb-4">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
            <h1 className="text-xl font-semibold text-gray-900">Verifying...</h1>
          </div>
          <p className="text-gray-600">Please wait while we process your login.</p>
        </CardContent>
      </Card>
    </div>
  )
}
