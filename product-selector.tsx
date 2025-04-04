"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Plus, Check } from "lucide-react"

interface Product {
  id: number
  name: string
  category: string
  price: number
  image: string
  roll_width?: number
  colors?: string[]
}

interface ProductSelectorProps {
  products: Product[]
  selectedProducts: any[]
  onAddProduct: (product: Product) => void
  onRemoveProduct: (productId: number) => void
}

export default function ProductSelector({
  products,
  selectedProducts,
  onAddProduct,
  onRemoveProduct,
}: ProductSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredProducts = products.filter((product) => product.name.toLowerCase().includes(searchTerm.toLowerCase()))

  const isProductSelected = (productId: number) => {
    return selectedProducts.some((p) => p.id === productId)
  }

  return (
    <div>
      <div className="mb-4">
        <Input
          type="text"
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {filteredProducts.length === 0 ? (
        <p className="text-gray-500">No products found matching your search.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="overflow-hidden">
              <div className="aspect-square relative">
                <img
                  src={product.image || "/placeholder.svg"}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <CardContent className="p-4">
                <div className="mb-2">
                  <h3 className="font-medium">{product.name}</h3>
                  <p className="text-sm text-gray-500">
                    ${(product.price * (product.roll_width || 3.66)).toFixed(2)} per broadloom meter
                    <span className="text-xs block">(${product.price.toFixed(2)} per m²)</span>
                  </p>
                  {product.category === "carpet" && (
                    <span className="text-xs text-gray-500 block">{product.roll_width || 3.66}m wide roll</span>
                  )}
                </div>
                <Button
                  variant={isProductSelected(product.id) ? "secondary" : "default"}
                  size="sm"
                  className="w-full"
                  onClick={() => (isProductSelected(product.id) ? onRemoveProduct(product.id) : onAddProduct(product))}
                >
                  {isProductSelected(product.id) ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Selected
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Add to Quote
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

