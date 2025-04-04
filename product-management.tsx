"use client"

import { Label } from "@/components/ui/label"

import { Input } from "@/components/ui/input"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Pencil, Trash2, Plus, Save, X, Database } from "lucide-react"
import ProductUpload from "./product-upload"
import type { Product } from "./lib/supabase"

interface ProductManagementProps {
  onProductsChange: (products: Product[]) => void
  initialProducts?: Product[]
}

export default function ProductManagement({ onProductsChange, initialProducts = [] }: ProductManagementProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [activeTab, setActiveTab] = useState("browse")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load products from Supabase on initial render
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
        setError("Failed to load products. Please try again.")
        // Fall back to initial products if provided
        if (initialProducts.length > 0) {
          setProducts(initialProducts)
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchProducts()
  }, [initialProducts])

  // Update filtered products when products, search term, or category filter changes
  useEffect(() => {
    let filtered = [...products]

    if (searchTerm) {
      filtered = filtered.filter((product) => product.name.toLowerCase().includes(searchTerm.toLowerCase()))
    }

    if (categoryFilter) {
      filtered = filtered.filter((product) => product.category === categoryFilter)
    }

    setFilteredProducts(filtered)
  }, [products, searchTerm, categoryFilter])

  // Notify parent component when products change
  useEffect(() => {
    onProductsChange(products)
  }, [products, onProductsChange])

  const handleProductsUploaded = async (newProducts: Product[]) => {
    try {
      setIsLoading(true)
      setError(null)

      // Insert each product via the API
      const uploadPromises = newProducts.map((product) =>
        fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(product),
        }),
      )

      await Promise.all(uploadPromises)

      // Refresh the product list
      const response = await fetch("/api/products")
      if (!response.ok) throw new Error("Failed to refresh products")

      const data = await response.json()
      setProducts(data)
      setActiveTab("browse")
    } catch (err) {
      console.error("Error uploading products:", err)
      setError("Failed to upload products. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddProduct = () => {
    const newProduct = {
      id: 0, // Will be assigned by the database
      name: "New Product",
      category: "carpet",
      price: 0,
      image: "/placeholder.svg?height=100&width=100",
      colors: [],
    }

    setEditingProduct(newProduct)
    setActiveTab("edit")
  }

  const handleEditProduct = (product: Product) => {
    setEditingProduct({ ...product })
    setActiveTab("edit")
  }

  const handleDeleteProduct = async (productId: number) => {
    if (confirm("Are you sure you want to delete this product?")) {
      try {
        setError(null)

        const response = await fetch(`/api/products/${productId}`, {
          method: "DELETE",
        })

        if (!response.ok) {
          throw new Error("Failed to delete product")
        }

        // Update local state
        const updatedProducts = products.filter((p) => p.id !== productId)
        setProducts(updatedProducts)
      } catch (err) {
        console.error("Error deleting product:", err)
        setError("Failed to delete product. Please try again.")
      }
    }
  }

  const handleSaveProduct = async () => {
    if (!editingProduct) return

    try {
      setError(null)

      const isNewProduct = !editingProduct.id || editingProduct.id === 0

      const response = await fetch(isNewProduct ? "/api/products" : `/api/products/${editingProduct.id}`, {
        method: isNewProduct ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingProduct),
      })

      if (!response.ok) {
        throw new Error(`Failed to ${isNewProduct ? "create" : "update"} product`)
      }

      const savedProduct = await response.json()

      // Update local state
      let updatedProducts
      if (isNewProduct) {
        updatedProducts = [...products, savedProduct]
      } else {
        updatedProducts = products.map((p) => (p.id === savedProduct.id ? savedProduct : p))
      }

      setProducts(updatedProducts)
      setEditingProduct(null)
      setActiveTab("browse")
    } catch (err) {
      console.error("Error saving product:", err)
      setError("Failed to save product. Please try again.")
    }
  }

  const handleCancelEdit = () => {
    setEditingProduct(null)
    setActiveTab("browse")
  }

  const handleEditField = (field: string, value: any) => {
    if (!editingProduct) return

    setEditingProduct({
      ...editingProduct,
      [field]: value,
    })
  }

  const handleEditColors = (colorsString: string) => {
    if (!editingProduct) return

    const colorsArray = colorsString
      .split(",")
      .map((color) => color.trim())
      .filter((color) => color !== "")

    setEditingProduct({
      ...editingProduct,
      colors: colorsArray,
    })
  }

  // Get unique categories for filter
  const categories = Array.from(new Set(products.map((p) => p.category)))

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="browse">Browse Products</TabsTrigger>
          <TabsTrigger value="upload">Upload CSV</TabsTrigger>
          <TabsTrigger value="edit">{editingProduct ? "Edit Product" : "Add Product"}</TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
            <div className="flex-1">
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={categoryFilter === null ? "default" : "outline"}
                size="sm"
                onClick={() => setCategoryFilter(null)}
              >
                All
              </Button>
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={categoryFilter === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCategoryFilter(category)}
                >
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </Button>
              ))}
            </div>
            <Button onClick={handleAddProduct} size="sm" className="whitespace-nowrap">
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </div>

          {products.length === 0 ? (
            <div className="text-center p-8 border rounded-md bg-gray-50">
              <Database className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">No Products Found</h3>
              <p className="text-gray-600 mb-4">
                You haven't added any products yet. Upload a CSV file or add products manually.
              </p>
              <div className="flex justify-center gap-4">
                <Button onClick={() => setActiveTab("upload")}>Upload CSV</Button>
                <Button variant="outline" onClick={handleAddProduct}>
                  Add Manually
                </Button>
              </div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center p-8 border rounded-md">
              <p>No products match your search criteria.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProducts.map((product) => (
                <Card key={product.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-base">{product.name}</CardTitle>
                        <CardDescription>
                          {product.category.charAt(0).toUpperCase() + product.category.slice(1)}
                        </CardDescription>
                      </div>
                      <Badge>${Number(product.price).toFixed(2)}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="aspect-[4/3] bg-gray-100 rounded-md overflow-hidden mb-2">
                      <img
                        src={product.image || "/placeholder.svg?height=200&width=300"}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {product.rollWidth && <p className="text-sm text-gray-500">Roll Width: {product.rollWidth}m</p>}
                    {product.colors && product.colors.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm font-medium mb-1">Available Colors:</p>
                        <div className="flex flex-wrap gap-1">
                          {product.colors.map((color: string, i: number) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {color}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter>
                    <div className="flex justify-between w-full">
                      <Button variant="outline" size="sm" onClick={() => handleEditProduct(product)}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteProduct(product.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="upload">
          <ProductUpload onProductsUploaded={handleProductsUploaded} />
        </TabsContent>

        <TabsContent value="edit">
          {editingProduct && (
            <div className="border p-6 rounded-md bg-gray-50">
              <h3 className="text-xl font-medium mb-4">
                {products.some((p) => p.id === editingProduct.id) ? "Edit Product" : "Add New Product"}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="product-name">Product Name</Label>
                    <Input
                      id="product-name"
                      value={editingProduct.name}
                      onChange={(e) => handleEditField("name", e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="product-category">Category</Label>
                    <select
                      id="product-category"
                      value={editingProduct.category}
                      onChange={(e) => handleEditField("category", e.target.value)}
                      className="w-full px-3 py-2 border rounded-md"
                    >
                      <option value="carpet">Carpet</option>
                      <option value="vinyl">Vinyl</option>
                      <option value="laminate">Laminate</option>
                      <option value="hardwood">Hardwood</option>
                      <option value="tile">Tile</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="product-price">Price (per m²)</Label>
                    <Input
                      id="product-price"
                      type="number"
                      step="0.01"
                      value={editingProduct.price}
                      onChange={(e) => handleEditField("price", Number(e.target.value))}
                    />
                  </div>

                  {editingProduct.category === "carpet" && (
                    <div>
                      <Label htmlFor="product-roll-width">Roll Width (m)</Label>
                      <Input
                        id="product-roll-width"
                        type="number"
                        step="0.01"
                        value={editingProduct.rollWidth || ""}
                        onChange={(e) => handleEditField("rollWidth", e.target.value ? Number(e.target.value) : "")}
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="product-image">Image URL</Label>
                    <Input
                      id="product-image"
                      value={editingProduct.image || ""}
                      onChange={(e) => handleEditField("image", e.target.value)}
                      placeholder="/images/product.jpg or https://..."
                    />
                  </div>

                  <div>
                    <Label htmlFor="product-colors">Colors (comma-separated)</Label>
                    <Input
                      id="product-colors"
                      value={(editingProduct.colors || []).join(", ")}
                      onChange={(e) => handleEditColors(e.target.value)}
                      placeholder="Beige, Gray, Navy Blue"
                    />
                  </div>

                  <div className="mt-4">
                    <p className="text-sm font-medium mb-2">Image Preview</p>
                    <div className="aspect-[4/3] bg-gray-100 rounded-md overflow-hidden">
                      <img
                        src={editingProduct.image || "/placeholder.svg?height=200&width=300"}
                        alt={editingProduct.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = "/placeholder.svg?height=200&width=300"
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={handleCancelEdit}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={handleSaveProduct}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Product
                </Button>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

