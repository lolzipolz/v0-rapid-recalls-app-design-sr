"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, ExternalLink, Check, X, Calendar, Building, Package } from "lucide-react"

interface Recall {
  id: string
  title: string
  description: string
  agency: string
  severity: string
  recall_date: string
  link: string
  match_type: string
  confidence_score: number
  acknowledged_at?: string
  resolved_at?: string
  product_name: string
}

interface RecallAlertCardProps {
  recall: Recall
  onUpdate: () => void
}

export default function RecallAlertCard({ recall, onUpdate }: RecallAlertCardProps) {
  const [loading, setLoading] = useState(false)

  async function handleAcknowledge() {
    setLoading(true)
    try {
      const response = await fetch(`/api/recalls/${recall.id}/acknowledge`, {
        method: "POST",
        credentials: "include",
      })
      if (response.ok) {
        onUpdate()
      }
    } catch (error) {
      console.error("Failed to acknowledge recall:", error)
    } finally {
      setLoading(false)
    }
  }

  async function handleResolve() {
    setLoading(true)
    try {
      const response = await fetch(`/api/recalls/${recall.id}/resolve`, {
        method: "POST",
        credentials: "include",
      })
      if (response.ok) {
        onUpdate()
      }
    } catch (error) {
      console.error("Failed to resolve recall:", error)
    } finally {
      setLoading(false)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
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

  const getMatchTypeColor = (matchType: string) => {
    switch (matchType) {
      case "upc_exact":
        return "bg-green-100 text-green-800"
      case "title_fuzzy":
        return "bg-blue-100 text-blue-800"
      case "brand_fuzzy":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <Card
      className={`border-l-4 ${
        recall.severity === "high"
          ? "border-l-red-500"
          : recall.severity === "medium"
            ? "border-l-orange-500"
            : "border-l-yellow-500"
      }`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle
              className={`h-5 w-5 ${
                recall.severity === "high"
                  ? "text-red-600"
                  : recall.severity === "medium"
                    ? "text-orange-600"
                    : "text-yellow-600"
              }`}
            />
            <Badge className={getSeverityColor(recall.severity)}>{recall.severity.toUpperCase()}</Badge>
            <Badge variant="outline" className={getMatchTypeColor(recall.match_type)}>
              {recall.match_type.replace("_", " ")}
            </Badge>
          </div>
          <div className="text-right text-sm text-gray-500">
            <div className="flex items-center space-x-1">
              <Calendar className="h-3 w-3" />
              <span>{new Date(recall.recall_date).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        <CardTitle className="text-lg leading-tight">{recall.title}</CardTitle>

        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <div className="flex items-center space-x-1">
            <Package className="h-3 w-3" />
            <span>{recall.product_name}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Building className="h-3 w-3" />
            <span>{recall.agency}</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <CardDescription className="mb-4 line-clamp-3">{recall.description}</CardDescription>

        <div className="flex items-center justify-between">
          <div className="flex space-x-2">
            {!recall.acknowledged_at && (
              <Button size="sm" variant="outline" onClick={handleAcknowledge} disabled={loading}>
                <Check className="h-4 w-4 mr-1" />
                Acknowledge
              </Button>
            )}

            {!recall.resolved_at && (
              <Button size="sm" variant="outline" onClick={handleResolve} disabled={loading}>
                <X className="h-4 w-4 mr-1" />
                Mark Resolved
              </Button>
            )}
          </div>

          {recall.link && (
            <Button size="sm" variant="ghost" asChild>
              <a href={recall.link} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-1" />
                View Details
              </a>
            </Button>
          )}
        </div>

        {recall.acknowledged_at && (
          <div className="mt-3 text-xs text-green-600 bg-green-50 p-2 rounded">
            ✓ Acknowledged on {new Date(recall.acknowledged_at).toLocaleDateString()}
          </div>
        )}

        {recall.resolved_at && (
          <div className="mt-3 text-xs text-gray-600 bg-gray-50 p-2 rounded">
            ✓ Resolved on {new Date(recall.resolved_at).toLocaleDateString()}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
