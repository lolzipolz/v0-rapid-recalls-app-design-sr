"use client"

import { useState } from "react"
import { ArrowLeft, Edit3, Scan, Camera, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useUser } from "@/components/user-provider"

interface AddProductProps {
  onBack: () => void
}

export function AddProduct({ onBack }: AddProductProps) {
  const { user } = useUser()
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [upcInput, setUpcInput] = useState("")
  const [manualForm, setManualForm] = useState({
    name: "",
    brand: "",
    model: "",
    upc: "",
    purchase_date: "",
  })

  const handleUPCScan = async () => {
    if (!upcInput.trim()) {
      alert("Please enter a UPC code")
      return
    }

    setIsLoading(true)
    try {
      const formData = new FormData()
      formData.append("userId", user!.id)
      formData.append("source", "upc_scan")
      formData.append("upc", upcInput.trim())

      const response = await fetch("/api/products", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to add product")
      }

      setSuccess(true)
      setUpcInput("")
      setTimeout(() => {
        setSuccess(false)
        onBack()
      }, 2000)
    } catch (error) {
      console.error("Failed to add product:", error)
      alert(error instanceof Error ? error.message : "Failed to add product")
    } finally {
      setIsLoading(false)
    }
  }

  const handleManualSubmit = async () => {
    if (!manualForm.name.trim()) {
      alert("Please enter a product name")
      return
    }

    setIsLoading(true)
    try {
      const formData = new FormData()
      formData.append("userId", user!.id)
      formData.append("source", "manual")
      formData.append("name", manualForm.name)
      formData.append("brand", manualForm.brand)
      formData.append("model", manualForm.model)
      formData.append("upc", manualForm.upc)
      formData.append("purchase_date", manualForm.purchase_date)

      const response = await fetch("/api/products", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to add product")
      }

      setSuccess(true)
      setManualForm({ name: "", brand: "", model: "", upc: "", purchase_date: "" })
      setTimeout(() => {
        setSuccess(false)
        onBack()
      }, 2000)
    } catch (error) {
      console.error("Failed to add product:", error)
      alert(error instanceof Error ? error.message : "Failed to add product")
    } finally {
      setIsLoading(false)
    }
  }

  const handleReceiptUpload = async (file: File) => {
    setIsLoading(true)
    try {
      const formData = new FormData()
      formData.append("userId", user!.id)
      formData.append("source", "receipt_ocr")
      formData.append("receipt", file)

      const response = await fetch("/api/products", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to process receipt")
      }

      const result = await response.json()
      alert(`Successfully added ${result.products.length} products from receipt!`)
      onBack()
    } catch (error) {
      console.error("Failed to process receipt:", error)
      alert(error instanceof Error ? error.message : "Failed to process receipt")
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Product Added!</h3>
          <p className="text-gray-600">We'll monitor this product for recalls</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Add Product</h1>
            <p className="text-sm text-gray-600">Choose how to add your product</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* UPC Scan */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Scan Barcode</h2>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Scan className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">UPC/Barcode Lookup</h3>
                  <p className="text-sm text-gray-600">Enter the barcode number from your product</p>
                </div>
              </div>

              <div className="space-y-3">
                <Input
                  placeholder="Enter UPC/barcode (e.g., 012345678901)"
                  value={upcInput}
                  onChange={(e) => setUpcInput(e.target.value)}
                  className="h-12 rounded-xl border-gray-200 font-mono"
                />
                <Button
                  onClick={handleUPCScan}
                  disabled={isLoading || !upcInput.trim()}
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700 rounded-xl"
                >
                  {isLoading ? "Looking up product..." : "Add Product"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Receipt Upload */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Upload Receipt</h2>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <Camera className="w-6 h-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">Receipt Scanner</h3>
                  <p className="text-sm text-gray-600">Upload a photo of your receipt to extract products</p>
                </div>
              </div>

              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleReceiptUpload(file)
                }}
                className="w-full h-12 border border-gray-200 rounded-xl px-3 py-2 text-sm"
                disabled={isLoading}
              />
            </CardContent>
          </Card>
        </div>

        {/* Manual Entry */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Manual Entry</h2>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <Edit3 className="w-5 h-5 text-gray-600" />
                Product Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="product-name">Product Name *</Label>
                <Input
                  id="product-name"
                  placeholder="e.g., iPhone 15 Pro, Instant Pot Duo"
                  value={manualForm.name}
                  onChange={(e) => setManualForm({ ...manualForm, name: e.target.value })}
                  className="h-12 rounded-xl border-gray-200"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="brand">Brand</Label>
                <Input
                  id="brand"
                  placeholder="e.g., Apple, Samsung, KitchenAid"
                  value={manualForm.brand}
                  onChange={(e) => setManualForm({ ...manualForm, brand: e.target.value })}
                  className="h-12 rounded-xl border-gray-200"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="model">Model Number</Label>
                <Input
                  id="model"
                  placeholder="e.g., A3108, SM-G998U"
                  value={manualForm.model}
                  onChange={(e) => setManualForm({ ...manualForm, model: e.target.value })}
                  className="h-12 rounded-xl border-gray-200"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="upc-manual">UPC/Barcode (Optional)</Label>
                <Input
                  id="upc-manual"
                  placeholder="e.g., 012345678901"
                  value={manualForm.upc}
                  onChange={(e) => setManualForm({ ...manualForm, upc: e.target.value })}
                  className="h-12 rounded-xl border-gray-200 font-mono"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="purchase-date">Purchase Date</Label>
                <Input
                  id="purchase-date"
                  type="date"
                  value={manualForm.purchase_date}
                  onChange={(e) => setManualForm({ ...manualForm, purchase_date: e.target.value })}
                  className="h-12 rounded-xl border-gray-200"
                />
              </div>

              <Button
                onClick={handleManualSubmit}
                disabled={isLoading || !manualForm.name.trim()}
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 rounded-xl mt-6"
              >
                {isLoading ? "Adding product..." : "Add Product"}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Help Text */}
        <div className="text-center space-y-2 pt-4">
          <p className="text-sm text-gray-600">We'll monitor this product for recalls from FDA, CPSC, USDA & NHTSA</p>
          <div className="flex justify-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
  )
}
