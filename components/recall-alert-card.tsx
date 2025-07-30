import { AlertTriangle, ExternalLink, Check } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface RecallAlertCardProps {
  recall: {
    id: number
    productName: string
    recallReason: string
    agency: string
    severity: "high" | "medium" | "low"
    date: string
  }
}

export function RecallAlertCard({ recall }: RecallAlertCardProps) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "bg-red-50 border-red-200"
      case "medium":
        return "bg-yellow-50 border-yellow-200"
      case "low":
        return "bg-orange-50 border-orange-200"
      default:
        return "bg-gray-50 border-gray-200"
    }
  }

  const getSeverityIcon = (severity: string) => {
    const iconClass =
      severity === "high" ? "text-red-600" : severity === "medium" ? "text-yellow-600" : "text-orange-600"
    return <AlertTriangle className={`w-5 h-5 ${iconClass} flex-shrink-0`} />
  }

  const getSeverityBadge = (severity: string) => {
    const badgeClass =
      severity === "high"
        ? "bg-red-100 text-red-800"
        : severity === "medium"
          ? "bg-yellow-100 text-yellow-800"
          : "bg-orange-100 text-orange-800"
    return <Badge className={`${badgeClass} capitalize`}>{severity} Priority</Badge>
  }

  return (
    <Card className={`border-0 shadow-sm ${getSeverityColor(recall.severity)}`}>
      <CardContent className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-start gap-3">
          {getSeverityIcon(recall.severity)}
          <div className="flex-1 space-y-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-gray-900 leading-tight">{recall.productName}</h3>
              {getSeverityBadge(recall.severity)}
            </div>
            <p className="text-sm text-gray-600">Issued by {recall.agency}</p>
            <p className="text-xs text-gray-500">{recall.date}</p>
          </div>
        </div>

        {/* Recall Reason */}
        <div className="bg-white/60 rounded-lg p-3">
          <p className="text-sm text-gray-800 leading-relaxed">{recall.recallReason}</p>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button variant="outline" className="flex-1 h-10 rounded-lg border-gray-300 bg-transparent">
            <ExternalLink className="w-4 h-4 mr-2" />
            Read More
          </Button>
          <Button variant="outline" className="flex-1 h-10 rounded-lg border-gray-300 bg-transparent">
            <Check className="w-4 h-4 mr-2" />
            Mark Resolved
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
