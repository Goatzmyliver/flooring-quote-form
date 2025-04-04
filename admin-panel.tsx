"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Settings, Package, FileText, Users, ArrowLeft, Loader2 } from "lucide-react"
import ProductManagement from "./product-management"
import type { Product } from "./lib/supabase"

interface AdminPanelProps {
  onExit: () => void
  mockProducts: any[]
}

export default function AdminPanel({ onExit, mockProducts }: AdminPanelProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const response = await fetch("/api/products")

        if (!response.ok) {
          throw new Error("Failed to fetch products")
        }

        const data = await response.json()
        setProducts(data)
      } catch (err) {
        console.error("Error loading products:", err)
        setError("Failed to load products. Using mock data instead.")
        // Fall back to mock products
        setProducts(mockProducts)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProducts()
  }, [mockProducts])

  const handleProductsChange = (updatedProducts: Product[]) => {
    setProducts(updatedProducts)
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="space-y-4 mb-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Admin Panel</h1>
          <Button variant="outline" onClick={onExit} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Quote Form
          </Button>
        </div>
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                <strong>Admin Dashboard</strong> - This interface is only accessible to authorized personnel. You can
                bookmark the admin login page for future access.
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
          <span className="ml-2 text-gray-500">Loading...</span>
        </div>
      ) : (
        <Tabs defaultValue="products">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="products" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Products
            </TabsTrigger>
            <TabsTrigger value="quotes" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Quotes
            </TabsTrigger>
            <TabsTrigger value="customers" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Customers
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="products">
            <ProductManagement onProductsChange={handleProductsChange} initialProducts={products} />
          </TabsContent>

          <TabsContent value="quotes">
            <Card>
              <CardHeader>
                <CardTitle>Quote Management</CardTitle>
                <CardDescription>View and manage customer quotes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center p-8">
                  <p className="text-gray-500">Quote management functionality coming soon.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="customers">
            <Card>
              <CardHeader>
                <CardTitle>Customer Management</CardTitle>
                <CardDescription>View and manage your customers</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center p-8">
                  <p className="text-gray-500">Customer management functionality coming soon.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>System Settings</CardTitle>
                <CardDescription>Configure system settings and preferences</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border p-4 rounded-md">
                      <h3 className="font-medium mb-2">Company Information</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Update your company details that appear on quotes and invoices.
                      </p>
                      <Button size="sm">Edit Company Details</Button>
                    </div>

                    <div className="border p-4 rounded-md">
                      <h3 className="font-medium mb-2">Tax Settings</h3>
                      <p className="text-sm text-gray-600 mb-4">Configure tax rates and GST settings.</p>
                      <div className="flex items-center justify-between">
                        <span>GST Rate: 15%</span>
                        <Button size="sm" variant="outline">
                          Change
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="border p-4 rounded-md">
                    <h3 className="font-medium mb-2">Data Management</h3>
                    <p className="text-sm text-gray-600 mb-4">Manage your product data and system backups.</p>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        Export All Data
                      </Button>
                      <Button size="sm" variant="outline">
                        Clear Product Data
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}

