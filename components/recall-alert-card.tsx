"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, CheckCircle, Clock, ExternalLink, X } from "lucide-react"

interface Recall {
  id: string
  title: string
  description: string
  severity: "low" | "medium" | "high" | "critical"
  date_published: string
  source: string
  product_name: string
  brand?: string
  model?: string
  upc?: string
  status: "new" | "acknowledged" | "resolved"
  matched_products: string[]
}

interface RecallAlertCardProps {
  recall: Recall
  onUpdate: () => void
}

export function RecallAlertCard({ recall, onUpdate }: RecallAlertCardProps) {
  const [isLoading, setIsLoading] = useState(false)

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-100 text-red-800 border-red-200"
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "low":
        return "bg-blue-100 text-blue-800 border-blue-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
      case "high":
        return <AlertTriangle className="h-4 w-4" />
      case "medium":
        return <Clock className="h-4 w-4" />
      case "low":
        return <CheckCircle className="h-4 w-4" />
      default:
        return <AlertTriangle className="h-4 w-4" />
    }
  }

  const handleAcknowledge = async () => {
    setIsLoading(true)
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
      setIsLoading(false)
    }
  }

  const handleResolve = async () => {
    setIsLoading(true)
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
      setIsLoading(false)
    }
  }

  return (
    <Card className="border-l-4 border-l-red-500">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <Badge className={getSeverityColor(recall.severity)}>
                {getSeverityIcon(recall.severity)}
                <span className="ml-1 capitalize">{recall.severity}</span>
              </Badge>
              <Badge variant="outline" className="text-xs">
                {recall.source}
              </Badge>
            </div>
            <CardTitle className="text-lg text-red-900">{recall.title}</CardTitle>
            <CardDescription className="text-gray-600">
              Affects: {recall.product_name}
              {recall.brand && ` by ${recall.brand}`}
              {recall.model && ` (Model: ${recall.model})`}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">{recall.description}</AlertDescription>
          </Alert>

          {recall.matched_products.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Your affected products:</h4>
              <div className="space-y-1">
                {recall.matched_products.map((product, index) => (
                  <div key={index} className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded">
                    {product}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-xs text-gray-500">
              Published: {new Date(recall.date_published).toLocaleDateString()}
            </div>
            <div className="flex space-x-2">
              {recall.status === "new" && (
                <>
                  <Button variant="outline" size="sm" onClick={handleAcknowledge} disabled={isLoading}>
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Acknowledge
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleResolve}
                    disabled={isLoading}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Mark Resolved
                  </Button>
                </>
              )}
              <Button variant="outline" size="sm" asChild>
                <a href="#" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Details
                </a>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
