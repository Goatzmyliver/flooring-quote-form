"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Minus } from "lucide-react"

interface StairCalculatorProps {
  rollWidth: number
  onAddToQuote: (stairData: {
    name: string
    carpetRequired: number
    area: number
    width: number
    stairs: number
    length: number
    isStairs: boolean
  }) => void
}

export default function StairCalculator({ rollWidth, onAddToQuote }: StairCalculatorProps) {
  const [stairWidth, setStairWidth] = useState<string>("1")
  const [numberOfStairs, setNumberOfStairs] = useState<string>("12")
  const [stairName, setStairName] = useState<string>("Staircase")

  // Standard measurement for each stair (riser + tread)
  const STAIR_DEPTH = 0.5 // 500mm

  const incrementStairs = () => {
    const current = Number.parseInt(numberOfStairs) || 0
    setNumberOfStairs((current + 1).toString())
  }

  const decrementStairs = () => {
    const current = Number.parseInt(numberOfStairs) || 0
    if (current > 1) {
      setNumberOfStairs((current - 1).toString())
    }
  }

  const calculateStairCarpet = () => {
    const width = Number.parseFloat(stairWidth) || 0
    const stairs = Number.parseInt(numberOfStairs) || 0

    if (width <= 0 || stairs <= 0) return { area: 0, broadloom: 0 }

    // Calculate total length without cutting margin
    const length = stairs * STAIR_DEPTH

    // Calculate area
    const area = Number.parseFloat((width * length).toFixed(2))

    // For stairs, we calculate the minimum broadloom meters needed
    // Each stair is treated as an individual piece that can be placed anywhere
    // We calculate how many complete stair pieces can fit across the roll width
    const stairsPerRow = Math.floor(rollWidth / width)

    // Calculate how many rows we need
    const rows = Math.ceil(stairs / stairsPerRow)

    // Total broadloom meters is rows × stair depth (no cutting margin for stairs)
    const broadloom = Number.parseFloat((rows * STAIR_DEPTH).toFixed(2))

    return { area, broadloom }
  }

  const handleAddToQuote = () => {
    const width = Number.parseFloat(stairWidth) || 0
    const stairs = Number.parseInt(numberOfStairs) || 0

    if (width <= 0 || stairs <= 0) return

    const { area, broadloom } = calculateStairCarpet()

    onAddToQuote({
      name: stairName || "Staircase",
      area: area,
      carpetRequired: broadloom,
      width: width,
      stairs: stairs,
      length: stairs * STAIR_DEPTH + 0.2,
      isStairs: true, // Explicitly mark as stairs
    })
  }

  return (
    <div className="border p-4 rounded-md bg-gray-50">
      <h3 className="font-medium mb-3">Quick Stairs Calculator</h3>
      <p className="text-sm text-gray-600 mb-4">
        Calculate carpet required for stairs based on a standard 500mm measurement for each stair (riser + tread).
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <Label htmlFor="stair-name">Staircase Name</Label>
          <Input
            id="stair-name"
            value={stairName}
            onChange={(e) => setStairName(e.target.value)}
            placeholder="e.g. Main Staircase"
          />
        </div>

        <div>
          <Label htmlFor="stair-width">Stair Width (m)</Label>
          <Input
            id="stair-width"
            type="number"
            step="0.01"
            value={stairWidth}
            onChange={(e) => setStairWidth(e.target.value)}
            placeholder="e.g. 1.0"
          />
        </div>

        <div>
          <Label htmlFor="number-of-stairs">Number of Stairs</Label>
          <div className="flex items-center">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={decrementStairs}
              className="h-10 w-10 rounded-r-none"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <Input
              id="number-of-stairs"
              type="number"
              value={numberOfStairs}
              onChange={(e) => setNumberOfStairs(e.target.value)}
              className="rounded-none text-center"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={incrementStairs}
              className="h-10 w-10 rounded-l-none"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="p-3 border rounded-md bg-white mb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div className="flex justify-between">
            <span>Total Length:</span>
            <span className="font-medium">
              {((Number.parseInt(numberOfStairs) || 0) * STAIR_DEPTH + 0.2).toFixed(2)}m
            </span>
          </div>
          <div className="flex justify-between">
            <span>Area:</span>
            <span className="font-medium">{calculateStairCarpet().area} m²</span>
          </div>
          <div className="flex justify-between">
            <span>Broadloom Meters:</span>
            <span className="font-medium">{calculateStairCarpet().broadloom} broadloom meters</span>
          </div>
        </div>
      </div>

      <Button onClick={handleAddToQuote} className="w-full">
        Add Staircase to Quote
      </Button>
    </div>
  )
}

