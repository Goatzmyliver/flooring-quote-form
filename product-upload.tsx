"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Upload, FileUp, AlertCircle, CheckCircle2 } from "lucide-react"
import { parseProductCSV } from "./utils/csv-parser"

interface ProductUploadProps {
  onProductsUploaded: (products: any[]) => void
}

export default function ProductUpload({ onProductsUploaded }: ProductUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [previewData, setPreviewData] = useState<any[] | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setError(null)
      setSuccess(null)
      setPreviewData(null)
    }
  }

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a CSV file first")
      return
    }

    if (!file.name.endsWith(".csv")) {
      setError("Please upload a valid CSV file")
      return
    }

    setIsUploading(true)
    setError(null)
    setSuccess(null)

    try {
      const reader = new FileReader()

      reader.onload = (event) => {
        try {
          const csvContent = event.target?.result as string
          const products = parseProductCSV(csvContent)

          if (products.length === 0) {
            throw new Error("No valid product data found in the CSV file")
          }

          setPreviewData(products.slice(0, 3)) // Show first 3 products as preview
          setSuccess(`Successfully parsed ${products.length} products`)
          onProductsUploaded(products)
        } catch (err: any) {
          setError(`Error parsing CSV: ${err.message}`)
        } finally {
          setIsUploading(false)
        }
      }

      reader.onerror = () => {
        setError("Error reading the file")
        setIsUploading(false)
      }

      reader.readAsText(file)
    } catch (err: any) {
      setError(`Error uploading file: ${err.message}`)
      setIsUploading(false)
    }
  }

  return (
    <div className="border p-6 rounded-md bg-gray-50">
      <h3 className="text-xl font-medium mb-4">Product Catalog Upload</h3>
      <p className="text-sm text-gray-600 mb-4">
        Upload your product catalog as a CSV file. The file should include columns for id, name, category, price, image,
        rollWidth (for carpet), and colors (comma-separated).
      </p>

      <div className="mb-4">
        <Label htmlFor="csv-file" className="block mb-2">
          Select CSV File
        </Label>
        <div className="flex gap-2">
          <Input id="csv-file" type="file" accept=".csv" onChange={handleFileChange} className="flex-1" />
          <Button onClick={handleUpload} disabled={!file || isUploading} className="flex items-center gap-2">
            {isUploading ? (
              <>Uploading...</>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Upload
              </>
            )}
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-4 border-green-500 text-green-700">
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {previewData && previewData.length > 0 && (
        <div className="mt-4">
          <h4 className="font-medium mb-2">Preview (First 3 Products)</h4>
          <div className="border rounded-md overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="text-left p-2">Name</th>
                  <th className="text-left p-2">Category</th>
                  <th className="text-right p-2">Price</th>
                </tr>
              </thead>
              <tbody>
                {previewData.map((product, index) => (
                  <tr key={index} className="border-t">
                    <td className="p-2">{product.name}</td>
                    <td className="p-2">{product.category}</td>
                    <td className="p-2 text-right">${Number(product.price).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {previewData.length < 3 ? "All" : "First 3"} products shown. {success}
          </p>
        </div>
      )}

      <div className="mt-4">
        <h4 className="font-medium mb-2">CSV Format Example</h4>
        <div className="bg-gray-100 p-3 rounded-md overflow-x-auto">
          <pre className="text-xs">
            id,name,category,price,image,rollWidth,colors 1,"Luxury Wool
            Carpet",carpet,89.99,/images/wool-carpet.jpg,3.66,"Beige,Gray,Navy Blue" 2,"Premium Vinyl
            Planks",vinyl,49.99,/images/vinyl-planks.jpg,,"Oak,Maple,Walnut"
          </pre>
        </div>
      </div>

      <div className="mt-4">
        <Button
          variant="outline"
          className="flex items-center gap-2"
          onClick={() => window.open("/sample-products.csv")}
        >
          <FileUp className="h-4 w-4" />
          Download Sample CSV
        </Button>
      </div>
    </div>
  )
}

