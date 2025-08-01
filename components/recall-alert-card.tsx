"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, ExternalLink, Check, X, Package } from "lucide-react"

interface Product {
  id: string
  name: string
  brand: string
  model: string
  upc: string
  purchase_date: string
  purchase_price: number
  source: string
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
  product: Product
  recall: Recall
  match_type: string
  confidence_score: number
  acknowledged_at: string | null
  resolved_at: string | null
  created_at: string
}

interface RecallAlertCardProps {
  matchedRecall: MatchedRecall
  onUpdate: () => void
}

export default function RecallAlertCard({ matchedRecall, onUpdate }: RecallAlertCardProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const { product, recall, match_type, confidence_score, acknowledged_at, resolved_at } = matchedRecall

  const handleAcknowledge = async () => {
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch(`/api/recalls/${recall.id}/acknowledge`, {
        method: "POST",
        credentials: "include",
      })

      if (response.ok) {
        onUpdate()
      } else {
        const data = await response.json()
        setError(data.error || "Failed to acknowledge recall")
      }
    } catch (err) {
      setError("Network error. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleResolve = async () => {
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch(`/api/recalls/${recall.id}/resolve`, {
        method: "POST",
        credentials: "include",
      })

      if (response.ok) {
        onUpdate()
      } else {
        const data = await response.json()
        setError(data.error || "Failed to resolve recall")
      }
    } catch (err) {
      setError("Network error. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "low":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getMatchTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "upc":
        return "bg-blue-100 text-blue-800"
      case "name":
        return "bg-purple-100 text-purple-800"
      case "brand":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <Card
      className={`${resolved_at ? "opacity-75" : ""} ${!acknowledged_at && !resolved_at ? "border-red-200 bg-red-50" : ""}`}
    >
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="flex items-center space-x-2 text-lg">
              <AlertTriangle className={`h-5 w-5 ${resolved_at ? "text-gray-400" : "text-red-600"}`} />
              <span>{recall.title}</span>
            </CardTitle>
            <CardDescription className="mt-2">
              <div className="flex items-center space-x-2 text-sm">
                <Package className="h-4 w-4" />
                <span>{product.name}</span>
                {product.brand && <span>by {product.brand}</span>}
              </div>
            </CardDescription>
          </div>
          <div className="flex flex-col space-y-2">
            <Badge className={getSeverityColor(recall.severity)}>{recall.severity.toUpperCase()}</Badge>
            <Badge variant="outline" className={getMatchTypeColor(match_type)}>
              {match_type.toUpperCase()} Match
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Recall Description */}
          <div>
            <p className="text-gray-700">{recall.description}</p>
          </div>

          {/* Match Details */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-600">Agency:</span>
                <span className="ml-2">{recall.agency}</span>
              </div>
              <div>
                <span className="font-medium text-gray-600">Confidence:</span>
                <span className="ml-2">{Math.round(confidence_score * 100)}%</span>
              </div>
              <div>
                <span className="font-medium text-gray-600">Recall Date:</span>
                <span className="ml-2">{new Date(recall.recall_date).toLocaleDateString()}</span>
              </div>
              <div>
                <span className="font-medium text-gray-600">Match Type:</span>
                <span className="ml-2">{match_type}</span>
              </div>
            </div>
          </div>

          {/* Product Details */}
          <div className="bg-blue-50 p-3 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Affected Product:</h4>
            <div className="text-sm space-y-1">
              <div>
                <span className="font-medium">Name:</span> {product.name}
              </div>
              {product.brand && (
                <div>
                  <span className="font-medium">Brand:</span> {product.brand}
                </div>
              )}
              {product.model && (
                <div>
                  <span className="font-medium">Model:</span> {product.model}
                </div>
              )}
              {product.upc && (
                <div>
                  <span className="font-medium">UPC:</span> {product.upc}
                </div>
              )}
              {product.purchase_date && (
                <div>
                  <span className="font-medium">Purchase Date:</span>{" "}
                  {new Date(product.purchase_date).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>

          {/* Status */}
          {acknowledged_at && (
            <Alert className="border-yellow-200 bg-yellow-50">
              <Check className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                Acknowledged on {new Date(acknowledged_at).toLocaleDateString()}
              </AlertDescription>
            </Alert>
          )}

          {resolved_at && (
            <Alert className="border-green-200 bg-green-50">
              <Check className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Resolved on {new Date(resolved_at).toLocaleDateString()}
              </AlertDescription>
            </Alert>
          )}

          {/* Error Message */}
          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          )}

          {/* Actions */}
          <div className="flex justify-between items-center pt-4 border-t">
            <div className="flex space-x-2">
              {recall.link && (
                <Button variant="outline" size="sm" asChild>
                  <a href={recall.link} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Details
                  </a>
                </Button>
              )}
            </div>

            {!resolved_at && (
              <div className="flex space-x-2">
                {!acknowledged_at && (
                  <Button variant="outline" size="sm" onClick={handleAcknowledge} disabled={isLoading}>
                    <Check className="h-4 w-4 mr-2" />
                    Acknowledge
                  </Button>
                )}
                <Button size="sm" onClick={handleResolve} disabled={isLoading}>
                  <X className="h-4 w-4 mr-2" />
                  Mark Resolved
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
