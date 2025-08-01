"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { X, Package, AlertCircle, CheckCircle, Loader2 } from "lucide-react"

interface AddProductProps {
  onClose: () => void
  onProductAdded: () => void
}

export default function AddProduct({ onClose, onProductAdded }: AddProductProps) {
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

    if (!formData.name.trim()) {
      setError("Product name is required")
      return
    }

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
        setSuccess("Product added successfully! We'll monitor it for recalls.")
        setTimeout(() => {
          onProductAdded()
          onClose()
        }, 1500)
      } else {
        setError(data.error || "Failed to add product")
      }
    } catch (err) {
      console.error("Add product error:", err)
      setError("Network error. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
    // Clear errors when user starts typing
    if (error) setError("")
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Package className="h-5 w-5 text-blue-600" />
                <span>Add Product</span>
              </CardTitle>
              <CardDescription>Add a product to monitor for recalls</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} disabled={isLoading}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-sm font-medium">
                Product Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g., iPhone 15 Pro, Samsung TV, etc."
                required
                disabled={isLoading}
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Only the product name is required. We'll use fuzzy matching to find recalls.
              </p>
            </div>

            <div>
              <Label htmlFor="brand" className="text-sm font-medium">
                Brand (Optional)
              </Label>
              <Input
                id="brand"
                name="brand"
                value={formData.brand}
                onChange={handleChange}
                placeholder="e.g., Apple, Samsung, Sony"
                disabled={isLoading}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="model" className="text-sm font-medium">
                Model (Optional)
              </Label>
              <Input
                id="model"
                name="model"
                value={formData.model}
                onChange={handleChange}
                placeholder="e.g., A2848, UN55TU8000"
                disabled={isLoading}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="upc" className="text-sm font-medium">
                UPC/Barcode (Optional)
              </Label>
              <Input
                id="upc"
                name="upc"
                value={formData.upc}
                onChange={handleChange}
                placeholder="e.g., 194252707234"
                disabled={isLoading}
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="purchase_date" className="text-sm font-medium">
                  Purchase Date
                </Label>
                <Input
                  id="purchase_date"
                  name="purchase_date"
                  type="date"
                  value={formData.purchase_date}
                  onChange={handleChange}
                  disabled={isLoading}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="purchase_price" className="text-sm font-medium">
                  Price
                </Label>
                <Input
                  id="purchase_price"
                  name="purchase_price"
                  type="number"
                  step="0.01"
                  value={formData.purchase_price}
                  onChange={handleChange}
                  placeholder="0.00"
                  disabled={isLoading}
                  className="mt-1"
                />
              </div>
            </div>

            {/* Success Message */}
            {success && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800 font-medium">{success}</AlertDescription>
              </Alert>
            )}

            {/* Error Message */}
            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800 font-medium">{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
                className="flex-1 bg-transparent"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading || !formData.name.trim()} className="flex-1">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Package className="mr-2 h-4 w-4" />
                    Add Product
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
