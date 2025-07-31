"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Camera, Upload, FileText, Package, CheckCircle, AlertCircle, Loader2 } from "lucide-react"

interface AddProductProps {
  onBack: () => void
}

export function AddProduct({ onBack }: AddProductProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  // Manual entry state
  const [manualProduct, setManualProduct] = useState({
    name: "",
    brand: "",
    model: "",
    upc: "",
    purchase_date: "",
    price: "",
  })

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!manualProduct.name.trim()) {
      setMessage({ type: "error", text: "Product name is required" })
      return
    }

    setIsLoading(true)
    setMessage(null)

    try {
      const formData = new FormData()
      formData.append("userId", "current-user-id") // This should come from auth context
      formData.append("source", "manual")
      formData.append("name", manualProduct.name)
      formData.append("brand", manualProduct.brand)
      formData.append("model", manualProduct.model)
      formData.append("upc", manualProduct.upc)
      formData.append("purchase_date", manualProduct.purchase_date)
      formData.append("price", manualProduct.price)

      const response = await fetch("/api/products", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({ type: "success", text: "Product added successfully!" })
        setManualProduct({
          name: "",
          brand: "",
          model: "",
          upc: "",
          purchase_date: "",
          price: "",
        })
      } else {
        setMessage({ type: "error", text: data.error || "Failed to add product" })
      }
    } catch (error) {
      console.error("Failed to add product:", error)
      setMessage({ type: "error", text: "Network error. Please try again." })
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileUpload = async (file: File, source: string) => {
    setIsLoading(true)
    setMessage(null)

    try {
      const formData = new FormData()
      formData.append("userId", "current-user-id") // This should come from auth context
      formData.append("source", source)

      if (source === "receipt_ocr") {
        formData.append("receipt", file)
      } else if (source === "amazon_csv") {
        formData.append("amazon_csv", file)
      }

      const response = await fetch("/api/products", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({
          type: "success",
          text: `Successfully added ${data.products?.length || 0} products!`,
        })
      } else {
        setMessage({ type: "error", text: data.error || "Failed to process file" })
      }
    } catch (error) {
      console.error("Failed to upload file:", error)
      setMessage({ type: "error", text: "Network error. Please try again." })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center">
            <Button variant="ghost" onClick={onBack} className="mr-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="text-xl font-bold text-gray-900">Add Products</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {message && (
            <Alert variant={message.type === "error" ? "destructive" : "default"} className="mb-6">
              {message.type === "error" ? <AlertCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
              <AlertDescription>{message.text}</AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="manual" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="manual">Manual Entry</TabsTrigger>
              <TabsTrigger value="scan">Scan Barcode</TabsTrigger>
              <TabsTrigger value="receipt">Upload Receipt</TabsTrigger>
              <TabsTrigger value="amazon">Amazon CSV</TabsTrigger>
            </TabsList>

            {/* Manual Entry */}
            <TabsContent value="manual">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Package className="w-5 h-5 mr-2" />
                    Manual Entry
                  </CardTitle>
                  <CardDescription>Enter product details manually for precise tracking</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleManualSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Product Name *</Label>
                        <Input
                          id="name"
                          value={manualProduct.name}
                          onChange={(e) => setManualProduct((prev) => ({ ...prev, name: e.target.value }))}
                          placeholder="e.g., iPhone 15 Pro"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="brand">Brand</Label>
                        <Input
                          id="brand"
                          value={manualProduct.brand}
                          onChange={(e) => setManualProduct((prev) => ({ ...prev, brand: e.target.value }))}
                          placeholder="e.g., Apple"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="model">Model</Label>
                        <Input
                          id="model"
                          value={manualProduct.model}
                          onChange={(e) => setManualProduct((prev) => ({ ...prev, model: e.target.value }))}
                          placeholder="e.g., A3108"
                        />
                      </div>
                      <div>
                        <Label htmlFor="upc">UPC/Barcode</Label>
                        <Input
                          id="upc"
                          value={manualProduct.upc}
                          onChange={(e) => setManualProduct((prev) => ({ ...prev, upc: e.target.value }))}
                          placeholder="e.g., 194252707234"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="purchase_date">Purchase Date</Label>
                        <Input
                          id="purchase_date"
                          type="date"
                          value={manualProduct.purchase_date}
                          onChange={(e) => setManualProduct((prev) => ({ ...prev, purchase_date: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="price">Purchase Price</Label>
                        <Input
                          id="price"
                          type="number"
                          step="0.01"
                          value={manualProduct.price}
                          onChange={(e) => setManualProduct((prev) => ({ ...prev, price: e.target.value }))}
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    <Button type="submit" disabled={isLoading} className="w-full">
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
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

            {/* Barcode Scan */}
            <TabsContent value="scan">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Camera className="w-5 h-5 mr-2" />
                    Scan Barcode
                  </CardTitle>
                  <CardDescription>Use your camera to scan product barcodes for instant lookup</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <Camera className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Camera Scanner</h3>
                    <p className="text-gray-600 mb-6">This feature will be available soon. Use manual entry for now.</p>
                    <Button disabled variant="outline">
                      <Camera className="w-4 h-4 mr-2" />
                      Open Camera Scanner
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Receipt Upload */}
            <TabsContent value="receipt">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Upload className="w-5 h-5 mr-2" />
                    Upload Receipt
                  </CardTitle>
                  <CardDescription>Upload a photo of your receipt to automatically extract products</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Upload Receipt Photo</h3>
                    <p className="text-gray-600 mb-4">Drag and drop or click to select a receipt image</p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          handleFileUpload(file, "receipt_ocr")
                        }
                      }}
                      className="hidden"
                      id="receipt-upload"
                      disabled={isLoading}
                    />
                    <Button asChild disabled={isLoading}>
                      <label htmlFor="receipt-upload" className="cursor-pointer">
                        {isLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 mr-2" />
                            Choose File
                          </>
                        )}
                      </label>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Amazon CSV */}
            <TabsContent value="amazon">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="w-5 h-5 mr-2" />
                    Amazon Order History
                  </CardTitle>
                  <CardDescription>Import your Amazon purchase history from a CSV file</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-medium text-blue-900 mb-2">How to get your Amazon CSV:</h4>
                      <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                        <li>Go to Amazon.com → Your Account → Download order reports</li>
                        <li>Select date range and click "Request Report"</li>
                        <li>Download the CSV file when ready</li>
                        <li>Upload it here to import all your purchases</li>
                      </ol>
                    </div>

                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                      <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Upload Amazon CSV</h3>
                      <p className="text-gray-600 mb-4">Select your Amazon order history CSV file</p>
                      <input
                        type="file"
                        accept=".csv"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            handleFileUpload(file, "amazon_csv")
                          }
                        }}
                        className="hidden"
                        id="amazon-upload"
                        disabled={isLoading}
                      />
                      <Button asChild disabled={isLoading}>
                        <label htmlFor="amazon-upload" className="cursor-pointer">
                          {isLoading ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <FileText className="w-4 h-4 mr-2" />
                              Choose CSV File
                            </>
                          )}
                        </label>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
