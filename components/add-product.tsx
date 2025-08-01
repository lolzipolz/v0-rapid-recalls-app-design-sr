"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { X, Package, AlertCircle, CheckCircle } from "lucide-react"

interface AddProductProps {
  onSuccess: () => void
  onCancel: () => void
}

export default function AddProduct({ onSuccess, onCancel }: AddProductProps) {
  const [formData, setFormData] = useState({
    name: "",
    brand: "",
    model: "",
    upc: "",
    purchase_date: "",
    purchase_price: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccess("")

    try {
      const response = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name: formData.name.trim(),
          brand: formData.brand.trim() || null,
          model: formData.model.trim() || null,
          upc: formData.upc.trim() || null,
          purchase_date: formData.purchase_date || null,
          purchase_price: formData.purchase_price ? Number.parseFloat(formData.purchase_price) : null,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess("Product added successfully!")
        setTimeout(() => {
          onSuccess()
        }, 1000)
      } else {
        setError(data.error || "Failed to add product")
      }
    } catch (err) {
      setError("Network error. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Package className="h-5 w-5 text-blue-600" />
            <CardTitle>Add Product</CardTitle>
          </div>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription>Add a product to monitor for recalls. Only the product name is required.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Required Field */}
          <div>
            <Label htmlFor="name" className="text-sm font-medium">
              Product Name *
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="e.g., iPhone 15 Pro, Toyota Camry, Cheerios"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              required
              disabled={isLoading}
              className="mt-1"
            />
          </div>

          {/* Optional Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="brand" className="text-sm font-medium text-gray-600">
                Brand (optional)
              </Label>
              <Input
                id="brand"
                type="text"
                placeholder="e.g., Apple, Toyota"
                value={formData.brand}
                onChange={(e) => handleChange("brand", e.target.value)}
                disabled={isLoading}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="model" className="text-sm font-medium text-gray-600">
                Model (optional)
              </Label>
              <Input
                id="model"
                type="text"
                placeholder="e.g., Pro Max, LE"
                value={formData.model}
                onChange={(e) => handleChange("model", e.target.value)}
                disabled={isLoading}
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="upc" className="text-sm font-medium text-gray-600">
              UPC/Barcode (optional)
            </Label>
            <Input
              id="upc"
              type="text"
              placeholder="e.g., 123456789012"
              value={formData.upc}
              onChange={(e) => handleChange("upc", e.target.value)}
              disabled={isLoading}
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="purchase_date" className="text-sm font-medium text-gray-600">
                Purchase Date (optional)
              </Label>
              <Input
                id="purchase_date"
                type="date"
                value={formData.purchase_date}
                onChange={(e) => handleChange("purchase_date", e.target.value)}
                disabled={isLoading}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="purchase_price" className="text-sm font-medium text-gray-600">
                Price (optional)
              </Label>
              <Input
                id="purchase_price"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.purchase_price}
                onChange={(e) => handleChange("purchase_price", e.target.value)}
                disabled={isLoading}
                className="mt-1"
              />
            </div>
          </div>

          {/* Success Message */}
          {success && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}

          {/* Error Message */}
          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          )}

          {/* Submit Button */}
          <div className="flex space-x-3 pt-4">
            <Button type="submit" disabled={isLoading || !formData.name.trim()} className="flex-1">
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Adding Product...
                </div>
              ) : (
                "Add Product"
              )}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
