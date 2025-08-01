"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, ExternalLink, Check, X, Calendar, Building } from "lucide-react"

interface Recall {
  id: string
  product_name: string
  product_brand?: string
  recall_title: string
  agency: string
  severity: "high" | "medium" | "low"
  description: string
  recall_date: string
  link: string
  confidence_score: number
  acknowledged_at?: string
  resolved_at?: string
  created_at: string
}

interface RecallAlertCardProps {
  recall: Recall
  onUpdate?: () => void
}

export function RecallAlertCard({ recall, onUpdate }: RecallAlertCardProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "destructive"
      case "medium":
        return "secondary"
      case "low":
        return "outline"
      default:
        return "outline"
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "high":
        return "🔴"
      case "medium":
        return "🟡"
      case "low":
        return "🟢"
      default:
        return "⚪"
    }
  }

  const handleAcknowledge = async () => {
    setIsLoading(true)
    setMessage(null)

    try {
      const response = await fetch(`/api/recalls/${recall.id}/acknowledge`, {
        method: "POST",
        credentials: "include",
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({
          type: "success",
          text: "Recall acknowledged successfully.",
        })
        onUpdate?.()
      } else {
        setMessage({
          type: "error",
          text: data.error || "Failed to acknowledge recall.",
        })
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: "Network error. Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleResolve = async () => {
    setIsLoading(true)
    setMessage(null)

    try {
      const response = await fetch(`/api/recalls/${recall.id}/resolve`, {
        method: "POST",
        credentials: "include",
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({
          type: "success",
          text: "Recall marked as resolved.",
        })
        onUpdate?.()
      } else {
        setMessage({
          type: "error",
          text: data.error || "Failed to resolve recall.",
        })
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: "Network error. Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card
      className={`border-l-4 ${
        recall.severity === "high"
          ? "border-l-red-500 bg-red-50"
          : recall.severity === "medium"
            ? "border-l-orange-500 bg-orange-50"
            : "border-l-yellow-500 bg-yellow-50"
      }`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{getSeverityIcon(recall.severity)}</span>
              <Badge variant={getSeverityColor(recall.severity) as any}>{recall.severity.toUpperCase()} PRIORITY</Badge>
              <Badge variant="outline" className="text-xs">
                {Math.round(recall.confidence_score * 100)}% match
              </Badge>
            </div>
            <CardTitle className="text-lg leading-tight">{recall.recall_title}</CardTitle>
            <CardDescription className="mt-1">
              <div className="flex items-center gap-4 text-sm">
                <span className="flex items-center gap-1">
                  <Building className="w-3 h-3" />
                  {recall.agency}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(recall.recall_date).toLocaleDateString()}
                </span>
              </div>
            </CardDescription>
          </div>
          <AlertTriangle
            className={`w-6 h-6 ${
              recall.severity === "high"
                ? "text-red-500"
                : recall.severity === "medium"
                  ? "text-orange-500"
                  : "text-yellow-500"
            }`}
          />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div>
          <h4 className="font-medium text-gray-900 mb-1">Affected Product:</h4>
          <p className="text-gray-700">
            {recall.product_brand && `${recall.product_brand} `}
            {recall.product_name}
          </p>
        </div>

        <div>
          <h4 className="font-medium text-gray-900 mb-1">Description:</h4>
          <p className="text-gray-700 text-sm leading-relaxed">{recall.description}</p>
        </div>

        {message && (
          <Alert
            className={`${message.type === "error" ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}`}
          >
            <AlertDescription className={message.type === "error" ? "text-red-700" : "text-green-700"}>
              {message.text}
            </AlertDescription>
          </Alert>
        )}

        <div className="flex flex-wrap gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={() => window.open(recall.link, "_blank")}>
            <ExternalLink className="w-4 h-4 mr-1" />
            View Details
          </Button>

          {!recall.acknowledged_at && (
            <Button variant="secondary" size="sm" onClick={handleAcknowledge} disabled={isLoading}>
              <Check className="w-4 h-4 mr-1" />
              Acknowledge
            </Button>
          )}

          {!recall.resolved_at && (
            <Button variant="default" size="sm" onClick={handleResolve} disabled={isLoading}>
              <X className="w-4 h-4 mr-1" />
              Mark Resolved
            </Button>
          )}

          {recall.acknowledged_at && (
            <Badge variant="secondary" className="text-xs">
              Acknowledged {new Date(recall.acknowledged_at).toLocaleDateString()}
            </Badge>
          )}

          {recall.resolved_at && (
            <Badge variant="default" className="text-xs">
              Resolved {new Date(recall.resolved_at).toLocaleDateString()}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
