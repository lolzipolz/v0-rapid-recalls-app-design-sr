"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { X, Upload, Scan, Plus, Loader2, Package, Receipt, Barcode } from "lucide-react"

interface AddProductProps {
  onClose: () => void
  onProductAdded: () => void
}

export default function AddProduct({ onClose, onProductAdded }: AddProductProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [activeTab, setActiveTab] = useState("manual")

  // Manual form state
  const [manualForm, setManualForm] = useState({
    name: "",
    brand: "",
    model: "",
    upc: "",
    purchase_date: "",
    purchase_price: "",
  })

  // Receipt upload state
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null)

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage("")

    try {
      const response = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...manualForm,
          source: "manual",
          purchase_price: manualForm.purchase_price ? Number.parseFloat(manualForm.purchase_price) : null,
          purchase_date: manualForm.purchase_date || null,
        }),
        credentials: "include",
      })

      const data = await response.json()

      if (response.ok) {
        setMessage("Product added successfully!")
        setTimeout(() => {
          onProductAdded()
        }, 1000)
      } else {
        setMessage(data.error || "Failed to add product")
      }
    } catch (error) {
      setMessage("Network error. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleReceiptUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!receiptFile) {
      setMessage("Please select a receipt image")
      return
    }

    setIsLoading(true)
    setMessage("")

    try {
      const formData = new FormData()
      formData.append("receipt", receiptFile)

      const response = await fetch("/api/products/upload-receipt", {
        method: "POST",
        body: formData,
        credentials: "include",
      })

      const data = await response.json()

      if (response.ok) {
        setMessage(`Successfully extracted ${data.products?.length || 0} products from receipt!`)
        setTimeout(() => {
          onProductAdded()
        }, 2000)
      } else {
        setMessage(data.error || "Failed to process receipt")
      }
    } catch (error) {
      setMessage("Network error. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setReceiptFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setReceiptPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleUPCSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const formData = new FormData(e.target as HTMLFormElement)
    const upc = formData.get("upc") as string

    if (!upc) {
      setMessage("Please enter a UPC code")
      return
    }

    setIsLoading(true)
    setMessage("")

    try {
      const response = await fetch("/api/products/lookup-upc", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ upc }),
        credentials: "include",
      })

      const data = await response.json()

      if (response.ok) {
        setMessage("Product added successfully!")
        setTimeout(() => {
          onProductAdded()
        }, 1000)
      } else {
        setMessage(data.error || "Failed to lookup UPC")
      }
    } catch (error) {
      setMessage("Network error. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Add Product</CardTitle>
              <CardDescription>Add products to monitor for recalls</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="manual">
                <Plus className="h-4 w-4 mr-2" />
                Manual
              </TabsTrigger>
              <TabsTrigger value="receipt">
                <Receipt className="h-4 w-4 mr-2" />
                Receipt
              </TabsTrigger>
              <TabsTrigger value="upc">
                <Barcode className="h-4 w-4 mr-2" />
                UPC Scan
              </TabsTrigger>
            </TabsList>

            <TabsContent value="manual" className="space-y-4">
              <form onSubmit={handleManualSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
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
                  <div>
                    <Label htmlFor="brand">Brand</Label>
                    <Input
                      id="brand"
                      value={manualForm.brand}
                      onChange={(e) => setManualForm({ ...manualForm, brand: e.target.value })}
                      placeholder="e.g., Apple"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="model">Model</Label>
                    <Input
                      id="model"
                      value={manualForm.model}
                      onChange={(e) => setManualForm({ ...manualForm, model: e.target.value })}
                      placeholder="e.g., A3108"
                    />
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
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="purchase_date">Purchase Date</Label>
                    <Input
                      id="purchase_date"
                      type="date"
                      value={manualForm.purchase_date}
                      onChange={(e) => setManualForm({ ...manualForm, purchase_date: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="purchase_price">Purchase Price</Label>
                    <Input
                      id="purchase_price"
                      type="number"
                      step="0.01"
                      value={manualForm.purchase_price}
                      onChange={(e) => setManualForm({ ...manualForm, purchase_price: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding Product...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Product
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="receipt" className="space-y-4">
              <div className="text-center">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Upload Receipt</h3>
                <p className="text-gray-600 mb-4">
                  Upload a photo of your receipt and we'll extract the products automatically
                </p>
              </div>

              <form onSubmit={handleReceiptUpload} className="space-y-4">
                <div>
                  <Label htmlFor="receipt">Receipt Image</Label>
                  <Input id="receipt" type="file" accept="image/*" onChange={handleFileChange} required />
                </div>

                {receiptPreview && (
                  <div className="mt-4">
                    <img
                      src={receiptPreview || "/placeholder.svg"}
                      alt="Receipt preview"
                      className="max-w-full h-48 object-contain mx-auto border rounded"
                    />
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={isLoading || !receiptFile}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing Receipt...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Process Receipt
                    </>
                  )}
                </Button>
              </form>

              <Alert>
                <AlertDescription>
                  <strong>Tip:</strong> Make sure the receipt is clear and well-lit for best results.
                </AlertDescription>
              </Alert>
            </TabsContent>

            <TabsContent value="upc" className="space-y-4">
              <div className="text-center">
                <Barcode className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">UPC Lookup</h3>
                <p className="text-gray-600 mb-4">Enter or scan a UPC barcode to automatically add product details</p>
              </div>

              <form onSubmit={handleUPCSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="upc">UPC Code</Label>
                  <Input name="upc" placeholder="Enter UPC barcode (e.g., 123456789012)" required />
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Looking up Product...
                    </>
                  ) : (
                    <>
                      <Scan className="mr-2 h-4 w-4" />
                      Lookup Product
                    </>
                  )}
                </Button>
              </form>

              <Alert>
                <AlertDescription>
                  <strong>Coming Soon:</strong> Camera barcode scanning will be available in the next update.
                </AlertDescription>
              </Alert>
            </TabsContent>
          </Tabs>

          {message && (
            <Alert className="mt-4">
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
