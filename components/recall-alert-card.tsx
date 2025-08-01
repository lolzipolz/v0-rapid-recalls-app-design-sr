"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, ExternalLink, Check, X, Calendar, Package, Loader2 } from "lucide-react"

interface Product {
  id: string
  name: string
  brand: string | null
  model: string | null
  upc: string | null
}

interface Recall {
  id: string
  title: string
  description: string
  agency: string
  severity: string
  recall_date: string
  link: string
}

interface MatchedRecall {
  id: string
  product_id: string
  recall_id: string
  match_type: string
  confidence_score: number
  acknowledged_at: string | null
  resolved_at: string | null
  created_at: string
  product: Product
  recall: Recall
}

interface RecallAlertCardProps {
  matchedRecall: MatchedRecall
  onUpdate: () => void
}

export default function RecallAlertCard({ matchedRecall, onUpdate }: RecallAlertCardProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")

  const { product, recall } = matchedRecall

  const handleAcknowledge = async () => {
    setIsLoading(true)
    setMessage("")

    try {
      const response = await fetch(`/api/recalls/${matchedRecall.id}/acknowledge`, {
        method: "POST",
        credentials: "include",
      })

      const data = await response.json()

      if (response.ok) {
        setMessage("Recall acknowledged")
        onUpdate()
      } else {
        setMessage(data.error || "Failed to acknowledge recall")
      }
    } catch (error) {
      setMessage("Network error. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleResolve = async () => {
    setIsLoading(true)
    setMessage("")

    try {
      const response = await fetch(`/api/recalls/${matchedRecall.id}/resolve`, {
        method: "POST",
        credentials: "include",
      })

      const data = await response.json()

      if (response.ok) {
        setMessage("Recall marked as resolved")
        onUpdate()
      } else {
        setMessage(data.error || "Failed to resolve recall")
      }
    } catch (error) {
      setMessage("Network error. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "high":
        return "destructive"
      case "medium":
        return "default"
      case "low":
        return "secondary"
      default:
        return "default"
    }
  }

  const getMatchTypeLabel = (matchType: string) => {
    switch (matchType) {
      case "upc_exact":
        return "Exact UPC Match"
      case "title_fuzzy":
        return "Product Name Match"
      case "brand_fuzzy":
        return "Brand Match"
      default:
        return "Match Found"
    }
  }

  const isResolved = !!matchedRecall.resolved_at
  const isAcknowledged = !!matchedRecall.acknowledged_at

  return (
    <Card className={`${isResolved ? "opacity-75" : ""} ${recall.severity === "high" ? "border-red-200" : ""}`}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className={`h-5 w-5 ${recall.severity === "high" ? "text-red-500" : "text-yellow-500"}`} />
              <Badge variant={getSeverityColor(recall.severity)}>{recall.severity.toUpperCase()}</Badge>
              <Badge variant="outline">{recall.agency}</Badge>
              {isResolved && (
                <Badge variant="secondary">
                  <Check className="h-3 w-3 mr-1" />
                  Resolved
                </Badge>
              )}
              {isAcknowledged && !isResolved && <Badge variant="outline">Acknowledged</Badge>}
            </div>
            <CardTitle className="text-lg">{recall.title}</CardTitle>
            <CardDescription className="mt-2">
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <Package className="h-4 w-4" />
                  <span>{product.name}</span>
                  {product.brand && <span>by {product.brand}</span>}
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(recall.recall_date).toLocaleDateString()}</span>
                </div>
              </div>
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Recall Description */}
          <div>
            <p className="text-sm text-gray-700 leading-relaxed">{recall.description}</p>
          </div>

          {/* Match Information */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="flex justify-between items-center text-sm">
              <span className="font-medium">Match Details:</span>
              <Badge variant="outline">{getMatchTypeLabel(matchedRecall.match_type)}</Badge>
            </div>
            <div className="mt-2 text-sm text-gray-600">
              <div>Confidence: {Math.round(matchedRecall.confidence_score * 100)}%</div>
              {product.upc && <div>UPC: {product.upc}</div>}
            </div>
          </div>

          {/* Actions */}
          {!isResolved && (
            <div className="flex gap-2 pt-2">
              {!isAcknowledged && (
                <Button variant="outline" size="sm" onClick={handleAcknowledge} disabled={isLoading}>
                  {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
                  Acknowledge
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={handleResolve} disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <X className="h-4 w-4 mr-2" />}
                Mark Resolved
              </Button>
              {recall.link && (
                <Button variant="outline" size="sm" asChild>
                  <a href={recall.link} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Details
                  </a>
                </Button>
              )}
            </div>
          )}

          {message && (
            <Alert>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
