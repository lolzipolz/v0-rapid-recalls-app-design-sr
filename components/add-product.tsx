"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, Scan, Plus, Package, AlertCircle, CheckCircle } from "lucide-react"

interface AddProductProps {
  userId: string
  onProductAdded?: () => void
}

export function AddProduct({ userId, onProductAdded }: AddProductProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  // Manual entry form state
  const [manualForm, setManualForm] = useState({
    name: "",
    brand: "",
    model: "",
    upc: "",
    purchaseDate: "",
    purchasePrice: "",
  })

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!manualForm.name.trim()) return

    setIsLoading(true)
    setMessage(null)

    try {
      const response = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          userId,
          name: manualForm.name,
          brand: manualForm.brand || null,
          model: manualForm.model || null,
          upc: manualForm.upc || null,
          purchaseDate: manualForm.purchaseDate || null,
          purchasePrice: manualForm.purchasePrice ? Number.parseFloat(manualForm.purchasePrice) : null,
          source: "manual",
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({
          type: "success",
          text: "Product added successfully! We'll monitor it for recalls.",
        })
        setManualForm({
          name: "",
          brand: "",
          model: "",
          upc: "",
          purchaseDate: "",
          purchasePrice: "",
        })
        onProductAdded?.()
      } else {
        setMessage({
          type: "error",
          text: data.error || "Failed to add product. Please try again.",
        })
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: "Network error. Please check your connection and try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsLoading(true)
    setMessage(null)

    const formData = new FormData()
    formData.append("receipt", file)
    formData.append("userId", userId)

    try {
      const response = await fetch("/api/products/upload-receipt", {
        method: "POST",
        credentials: "include",
        body: formData,
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({
          type: "success",
          text: `Successfully processed receipt! Added ${data.productsAdded} products.`,
        })
        onProductAdded?.()
      } else {
        setMessage({
          type: "error",
          text: data.error || "Failed to process receipt. Please try again.",
        })
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: "Network error. Please check your connection and try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Add Products</h1>
        <p className="text-gray-600">Add products to your monitoring list to receive recall alerts</p>
      </div>

      {message && (
        <Alert
          className={`mb-6 ${message.type === "error" ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}`}
        >
          {message.type === "error" ? (
            <AlertCircle className="h-4 w-4 text-red-600" />
          ) : (
            <CheckCircle className="h-4 w-4 text-green-600" />
          )}
          <AlertDescription className={message.type === "error" ? "text-red-700" : "text-green-700"}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="manual" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="manual">
            <Plus className="w-4 h-4 mr-2" />
            Manual Entry
          </TabsTrigger>
          <TabsTrigger value="receipt">
            <Upload className="w-4 h-4 mr-2" />
            Upload Receipt
          </TabsTrigger>
          <TabsTrigger value="barcode">
            <Scan className="w-4 h-4 mr-2" />
            Scan Barcode
          </TabsTrigger>
        </TabsList>

        <TabsContent value="manual">
          <Card>
            <CardHeader>
              <CardTitle>Add Product Manually</CardTitle>
              <CardDescription>Enter product details manually. Only product name is required.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleManualSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Product Name *</Label>
                  <Input
                    id="name"
                    value={manualForm.name}
                    onChange={(e) => setManualForm({ ...manualForm, name: e.target.value })}
                    placeholder="e.g., iPhone 15 Pro"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="brand">Brand</Label>
                    <Input
                      id="brand"
                      value={manualForm.brand}
                      onChange={(e) => setManualForm({ ...manualForm, brand: e.target.value })}
                      placeholder="e.g., Apple"
                    />
                  </div>
                  <div>
                    <Label htmlFor="model">Model</Label>
                    <Input
                      id="model"
                      value={manualForm.model}
                      onChange={(e) => setManualForm({ ...manualForm, model: e.target.value })}
                      placeholder="e.g., A3108"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="upc">UPC/Barcode</Label>
                  <Input
                    id="upc"
                    value={manualForm.upc}
                    onChange={(e) => setManualForm({ ...manualForm, upc: e.target.value })}
                    placeholder="e.g., 123456789012"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="purchaseDate">Purchase Date</Label>
                    <Input
                      id="purchaseDate"
                      type="date"
                      value={manualForm.purchaseDate}
                      onChange={(e) => setManualForm({ ...manualForm, purchaseDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="purchasePrice">Purchase Price</Label>
                    <Input
                      id="purchasePrice"
                      type="number"
                      step="0.01"
                      value={manualForm.purchasePrice}
                      onChange={(e) => setManualForm({ ...manualForm, purchasePrice: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Adding Product...
                    </>
                  ) : (
                    <>
                      <Package className="w-4 h-4 mr-2" />
                      Add Product
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="receipt">
          <Card>
            <CardHeader>
              <CardTitle>Upload Receipt</CardTitle>
              <CardDescription>
                Upload a photo of your receipt and we'll automatically extract product information.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <div className="space-y-2">
                    <Label htmlFor="receipt-upload" className="cursor-pointer">
                      <span className="text-blue-600 hover:text-blue-500">Click to upload</span> or drag and drop
                    </Label>
                    <p className="text-sm text-gray-500">PNG, JPG, PDF up to 10MB</p>
                  </div>
                  <Input
                    id="receipt-upload"
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleReceiptUpload}
                    className="hidden"
                    disabled={isLoading}
                  />
                </div>

                {isLoading && (
                  <div className="text-center py-4">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-gray-600">Processing receipt...</p>
                  </div>
                )}

                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">Tips for better results:</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Ensure the receipt is clearly visible and well-lit</li>
                    <li>• Include the entire receipt in the photo</li>
                    <li>• Avoid shadows and glare</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="barcode">
          <Card>
            <CardHeader>
              <CardTitle>Scan Barcode</CardTitle>
              <CardDescription>Use your device's camera to scan product barcodes for quick addition.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Scan className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Barcode Scanner</h3>
                <p className="text-gray-600 mb-6">This feature will be available soon!</p>
                <Badge variant="secondary">Coming Soon</Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
