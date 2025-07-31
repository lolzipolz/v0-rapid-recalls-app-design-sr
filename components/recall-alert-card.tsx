"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, ExternalLink, Check, X, Calendar, Package } from "lucide-react"

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
}

export function RecallAlertCard({ recall }: RecallAlertCardProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [localRecall, setLocalRecall] = useState(recall)

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200"
      case "medium":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "low":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "high":
        return <AlertTriangle className="w-4 h-4 text-red-600" />
      case "medium":
        return <AlertTriangle className="w-4 h-4 text-orange-600" />
      case "low":
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-600" />
    }
  }

  const handleAcknowledge = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/recalls/${localRecall.id}/acknowledge`, {
        method: "POST",
      })

      if (response.ok) {
        setLocalRecall((prev) => ({
          ...prev,
          acknowledged_at: new Date().toISOString(),
        }))
      }
    } catch (error) {
      console.error("Failed to acknowledge recall:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleResolve = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/recalls/${localRecall.id}/resolve`, {
        method: "POST",
      })

      if (response.ok) {
        setLocalRecall((prev) => ({
          ...prev,
          resolved_at: new Date().toISOString(),
        }))
      }
    } catch (error) {
      console.error("Failed to resolve recall:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return "text-green-600"
    if (score >= 0.6) return "text-orange-600"
    return "text-red-600"
  }

  return (
    <Card
      className={`border-l-4 ${
        localRecall.severity === "high"
          ? "border-l-red-500"
          : localRecall.severity === "medium"
            ? "border-l-orange-500"
            : "border-l-yellow-500"
      } ${localRecall.resolved_at ? "opacity-60" : ""}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {getSeverityIcon(localRecall.severity)}
              <Badge className={getSeverityColor(localRecall.severity)}>
                {localRecall.severity.toUpperCase()} PRIORITY
              </Badge>
              <Badge variant="outline" className="text-xs">
                {localRecall.agency}
              </Badge>
            </div>
            <CardTitle className="text-lg leading-tight">{localRecall.recall_title}</CardTitle>
            <CardDescription className="flex items-center gap-4 mt-2">
              <span className="flex items-center gap-1">
                <Package className="w-3 h-3" />
                {localRecall.product_name}
                {localRecall.product_brand && ` (${localRecall.product_brand})`}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatDate(localRecall.recall_date)}
              </span>
            </CardDescription>
          </div>

          <div className="flex items-center gap-2 ml-4">
            <div className="text-right">
              <div className="text-xs text-gray-500">Match Confidence</div>
              <div className={`text-sm font-medium ${getConfidenceColor(localRecall.confidence_score)}`}>
                {Math.round(localRecall.confidence_score * 100)}%
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-4">
          {/* Description */}
          <div>
            <p className="text-sm text-gray-700 leading-relaxed">{localRecall.description}</p>
          </div>

          {/* Status Indicators */}
          {(localRecall.acknowledged_at || localRecall.resolved_at) && (
            <div className="flex items-center gap-4 text-sm">
              {localRecall.acknowledged_at && (
                <div className="flex items-center gap-1 text-blue-600">
                  <Check className="w-3 h-3" />
                  Acknowledged {formatDate(localRecall.acknowledged_at)}
                </div>
              )}
              {localRecall.resolved_at && (
                <div className="flex items-center gap-1 text-green-600">
                  <Check className="w-3 h-3" />
                  Resolved {formatDate(localRecall.resolved_at)}
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <div className="flex items-center gap-2">
              {!localRecall.acknowledged_at && (
                <Button variant="outline" size="sm" onClick={handleAcknowledge} disabled={isLoading}>
                  <Check className="w-3 h-3 mr-1" />
                  Acknowledge
                </Button>
              )}

              {!localRecall.resolved_at && (
                <Button variant="outline" size="sm" onClick={handleResolve} disabled={isLoading}>
                  <X className="w-3 h-3 mr-1" />
                  Mark Resolved
                </Button>
              )}
            </div>

            <Button variant="ghost" size="sm" onClick={() => window.open(localRecall.link, "_blank")}>
              <ExternalLink className="w-3 h-3 mr-1" />
              View Details
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
