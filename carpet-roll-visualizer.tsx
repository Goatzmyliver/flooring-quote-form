"use client"

import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download } from "lucide-react"

// Helper function to shade a color (make it lighter or darker)
function shadeColor(color, percent) {
  // Convert hex to RGB
  let R = Number.parseInt(color.substring(1, 3), 16)
  let G = Number.parseInt(color.substring(3, 5), 16)
  let B = Number.parseInt(color.substring(5, 7), 16)

  // Apply shading
  R = Math.round((R * (100 + percent)) / 100)
  G = Math.round((G * (100 + percent)) / 100)
  B = Math.round((B * (100 + percent)) / 100)

  // Ensure values are in valid range
  R = Math.min(255, Math.max(0, R))
  G = Math.min(255, Math.max(0, G))
  B = Math.min(255, Math.max(0, B))

  // Convert back to hex
  const RR = R.toString(16).length === 1 ? "0" + R.toString(16) : R.toString(16)
  const GG = G.toString(16).length === 1 ? "0" + G.toString(16) : G.toString(16)
  const BB = B.toString(16).length === 1 ? "0" + B.toString(16) : B.toString(16)

  return "#" + RR + GG + BB
}

interface Room {
  name: string
  length: string
  width: string
  carpetRequired: number
  area?: number
  stripsNeeded?: number
  isStairs?: boolean
  stairs?: number
}

interface CarpetRollVisualizerProps {
  rooms: Room[]
  rollWidth: number
  onUpdateRoom: (index: number, field: string, value: any) => void
}

// Define a space on the carpet roll
interface Space {
  x: number
  y: number
  width: number
  height: number
}

// Define a placed piece
interface PlacedPiece {
  roomIndex: number
  roomName: string
  isStairs: boolean
  stripIndex?: number
  totalStrips?: number
  stairNumber?: number
  width: number
  length: number
  isRotated?: boolean
  x: number
  y: number
}

const CarpetRollVisualizer = forwardRef(({ rooms, rollWidth = 3.66, onUpdateRoom }: CarpetRollVisualizerProps, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [scale, setScale] = useState(20) // pixels per meter
  const [showLabels, setShowLabels] = useState(true)
  const [optimizedLayout, setOptimizedLayout] = useState<{ totalLength: number; layout: PlacedPiece[] }>({
    totalLength: 0,
    layout: [],
  })

  // Filter out rooms with invalid dimensions
  const validRooms = rooms.filter((room) => {
    const length = Number.parseFloat(room.length)
    const width = Number.parseFloat(room.width)
    return !isNaN(length) && !isNaN(width) && length > 0 && width > 0
  })

  // Calculate total carpet length needed with optimized layout
  const calculateOptimizedLayout = () => {
    if (validRooms.length === 0) return { totalLength: 0, layout: [] }

    // Convert room dimensions to numbers
    const roomsWithDimensions = validRooms.map((room) => {
      const length = Number.parseFloat(room.length)
      const width = Number.parseFloat(room.width)
      return {
        ...room,
        numLength: length,
        numWidth: width,
        area: length * width,
      }
    })

    // First, identify all strips needed for all rooms
    const allPieces = []

    roomsWithDimensions.forEach((room, roomIndex) => {
      // Check if this is a staircase
      if (room.isStairs && room.stairs) {
        const stairWidth = room.numWidth
        const stairDepth = 0.5 // 500mm per stair
        const stairs = Number.parseInt(room.stairs.toString()) || 0

        // For staircases, create individual pieces for each stair
        for (let i = 0; i < stairs; i++) {
          allPieces.push({
            roomIndex,
            roomName: `${room.name}`,
            isStairs: true,
            width: stairWidth,
            length: stairDepth,
            stripIndex: i,
            totalStrips: stairs,
            stairNumber: i + 1,
          })
        }

        // Skip the rest of the processing for staircases
        return
      }

      // Regular room processing
      // Determine best orientation for regular rooms
      let bestWidth, bestLength
      let isRotated = false

      // For regular rooms, choose the orientation that minimizes waste
      // Option 1: Original orientation
      const option1 = {
        width: room.numWidth,
        length: room.numLength,
      }

      // Option 2: Rotated 90 degrees
      const option2 = {
        width: room.numLength,
        length: room.numWidth,
      }

      // Choose the best option
      if (option1.width <= rollWidth && option2.width <= rollWidth) {
        // Both orientations fit within roll width, choose the one that's more efficient
        if (option1.width <= option2.width) {
          bestWidth = option1.width
          bestLength = option1.length
        } else {
          bestWidth = option2.width
          bestLength = option2.length
          isRotated = true
        }
      } else if (option1.width <= rollWidth) {
        bestWidth = option1.width
        bestLength = option1.length
      } else if (option2.width <= rollWidth) {
        bestWidth = option2.width
        bestLength = option2.length
        isRotated = true
      } else {
        // Room is wider than roll in both orientations, need multiple strips
        // Choose orientation that minimizes the number of strips
        const strips1 = Math.ceil(option1.width / rollWidth)
        const strips2 = Math.ceil(option2.width / rollWidth)

        if (strips1 <= strips2) {
          bestWidth = option1.width
          bestLength = option1.length
        } else {
          bestWidth = option2.width
          bestLength = option2.length
          isRotated = true
        }
      }

      // If room is wider than roll width, it needs multiple strips
      if (bestWidth > rollWidth) {
        const stripsNeeded = Math.ceil(bestWidth / rollWidth)

        // Create individual strips
        for (let i = 0; i < stripsNeeded; i++) {
          const stripWidth = i < stripsNeeded - 1 ? rollWidth : bestWidth - rollWidth * (stripsNeeded - 1)

          allPieces.push({
            roomIndex,
            roomName: room.name,
            isStairs: false,
            stripIndex: i,
            totalStrips: stripsNeeded,
            width: stripWidth,
            length: bestLength,
            isRotated,
          })
        }
      } else {
        // Room fits within roll width
        allPieces.push({
          roomIndex,
          roomName: room.name,
          isStairs: false,
          stripIndex: 0,
          totalStrips: 1,
          width: bestWidth,
          length: bestLength,
          isRotated,
        })
      }
    })

    // Sort pieces by area (descending) to place larger pieces first
    allPieces.sort((a, b) => {
      // Calculate area (with cutting margin for regular pieces)
      const aArea = a.width * (a.length + (a.isStairs ? 0 : 0.2))
      const bArea = b.width * (b.length + (b.isStairs ? 0 : 0.2))
      return bArea - aArea
    })

    // Initialize the layout
    const layout: PlacedPiece[] = []

    // Initialize the spaces list with a single space covering the entire roll
    // We don't know the length yet, so we'll use a very large number
    const spaces: Space[] = [{ x: 0, y: 0, width: rollWidth, height: 1000 }]

    // Place each piece
    allPieces.forEach((piece) => {
      // Add cutting margin for regular pieces
      const pieceHeight = piece.length + (piece.isStairs ? 0 : 0.2)

      // Find the best space for this piece
      let bestSpace = null
      let bestY = Number.POSITIVE_INFINITY

      for (let i = 0; i < spaces.length; i++) {
        const space = spaces[i]

        // Check if the piece fits in this space
        if (piece.width <= space.width && pieceHeight <= space.height) {
          // This space works - is it better than our current best?
          if (space.y < bestY) {
            bestSpace = { spaceIndex: i, space }
            bestY = space.y
          }
        }
      }

      // If we found a space, place the piece
      if (bestSpace) {
        const { spaceIndex, space } = bestSpace

        // Place the piece at the top-left of the space
        const placedPiece: PlacedPiece = {
          ...piece,
          x: space.x,
          y: space.y,
        }

        layout.push(placedPiece)

        // Remove the used space
        spaces.splice(spaceIndex, 1)

        // Create new spaces from the remaining area
        // Space to the right of the piece
        if (space.width > piece.width) {
          spaces.push({
            x: space.x + piece.width,
            y: space.y,
            width: space.width - piece.width,
            height: pieceHeight,
          })
        }

        // Space below the piece
        if (space.height > pieceHeight) {
          spaces.push({
            x: space.x,
            y: space.y + pieceHeight,
            width: piece.width,
            height: space.height - pieceHeight,
          })
        }

        // Space to the right and below the piece
        if (space.width > piece.width && space.height > pieceHeight) {
          spaces.push({
            x: space.x + piece.width,
            y: space.y + pieceHeight,
            width: space.width - piece.width,
            height: space.height - pieceHeight,
          })
        }
      } else {
        // No space found - this shouldn't happen with our large initial space
        console.error("No space found for piece", piece)
      }
    })

    // Calculate the total length by finding the maximum y + height of all pieces
    const totalLength = layout.reduce((max, piece) => {
      const pieceBottom = piece.y + piece.length + (piece.isStairs ? 0 : 0.2)
      return Math.max(max, pieceBottom)
    }, 0)

    return { totalLength, layout }
  }

  // Expose functions to parent component
  useImperativeHandle(
    ref,
    () => ({
      getTotalBroadloomMeters: () => {
        return optimizedLayout.totalLength
      },
    }),
    [optimizedLayout.totalLength],
  )

  // Calculate and store the optimized layout
  useEffect(() => {
    // Calculate the optimized layout
    const layout = calculateOptimizedLayout()
    setOptimizedLayout(layout)

    // Force a parent component update by triggering the ref callback
    if (ref) {
      // @ts-ignore - This is a hack to force the parent to update
      if (typeof ref === "function") {
        ref({ getTotalBroadloomMeters: () => layout.totalLength })
      } else if (ref.current) {
        ref.current.getTotalBroadloomMeters = () => layout.totalLength
      }
    }
  }, [rooms, rollWidth])

  // Draw the carpet roll visualization
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    if (validRooms.length === 0) {
      // Draw empty roll
      const rollLength = 5 // Default length if no rooms

      // Set canvas dimensions
      canvas.width = Math.max(rollWidth * scale + 100, 400)
      canvas.height = Math.max(rollLength * scale + 100, 300)

      // Draw roll background
      ctx.fillStyle = "#f5f5f5"
      ctx.fillRect(50, 50, rollWidth * scale, rollLength * scale)

      // Draw roll border
      ctx.strokeStyle = "#999"
      ctx.lineWidth = 2
      ctx.strokeRect(50, 50, rollWidth * scale, rollLength * scale)

      // Draw roll width label
      ctx.fillStyle = "#000"
      ctx.font = "14px Arial"
      ctx.textAlign = "center"
      ctx.fillText(`${rollWidth}m`, 50 + (rollWidth * scale) / 2, 40)

      // Draw roll length label
      ctx.save()
      ctx.translate(30, 50 + (rollLength * scale) / 2)
      ctx.rotate(-Math.PI / 2)
      ctx.textAlign = "center"
      ctx.fillText(`${rollLength}m (example)`, 0, 0)
      ctx.restore()

      // Draw message
      ctx.fillStyle = "#666"
      ctx.textAlign = "center"
      ctx.fillText(
        "Add room dimensions to see carpet layout",
        50 + (rollWidth * scale) / 2,
        50 + (rollLength * scale) / 2,
      )

      return
    }

    // Get optimized layout
    const { totalLength, layout } = optimizedLayout

    // Set canvas dimensions
    canvas.width = Math.max(rollWidth * scale + 150, 400)
    canvas.height = Math.max(totalLength * scale + 100, 300)

    // Draw roll background
    ctx.fillStyle = "#f5f5f5"
    ctx.fillRect(50, 50, rollWidth * scale, totalLength * scale)

    // Draw roll border
    ctx.strokeStyle = "#999"
    ctx.lineWidth = 2
    ctx.strokeRect(50, 50, rollWidth * scale, totalLength * scale)

    // Draw roll width label
    ctx.fillStyle = "#000"
    ctx.font = "14px Arial"
    ctx.textAlign = "center"
    ctx.fillText(`${rollWidth}m`, 50 + (rollWidth * scale) / 2, 40)

    // Draw roll length label
    ctx.save()
    ctx.translate(30, 50 + (totalLength * scale) / 2)
    ctx.rotate(-Math.PI / 2)
    ctx.textAlign = "center"
    ctx.fillText(`${totalLength.toFixed(2)}m broadloom`, 0, 0)
    ctx.restore()

    // Colors for rooms
    const colors = [
      "#ffcccc",
      "#ccffcc",
      "#ccccff",
      "#ffffcc",
      "#ffccff",
      "#ccffff",
      "#ffddaa",
      "#ddffaa",
      "#aaddff",
      "#ffaadd",
      "#aaffdd",
      "#ddaaff",
    ]

    // Draw each piece in the layout
    layout.forEach((piece) => {
      const colorIndex = piece.roomIndex % colors.length
      const baseColor = colors[colorIndex]

      // For stair pieces, use a slightly different shade
      const color = piece.isStairs ? shadeColor(baseColor, -10) : baseColor

      const x = 50 + piece.x * scale
      const y = 50 + piece.y * scale
      const width = piece.width * scale
      const height = piece.length * scale

      // Draw room rectangle
      ctx.fillStyle = color
      ctx.fillRect(x, y, width, height)

      // Draw room border
      ctx.strokeStyle = "#666"
      ctx.lineWidth = 1
      ctx.strokeRect(x, y, width, height)

      // Draw cutting margin for regular pieces (not stair pieces)
      if (!piece.isStairs) {
        ctx.fillStyle = "rgba(255, 0, 0, 0.2)"
        ctx.fillRect(x, y + height, width, 0.2 * scale)
      }

      // Draw room label if enabled
      if (showLabels) {
        ctx.fillStyle = "#000"

        if (piece.isStairs) {
          // For stairs, show a special label
          ctx.font = "12px Arial"
          ctx.textAlign = "center"

          // Show the stair number information
          ctx.fillText(`${piece.roomName} ${piece.stairNumber}/${piece.totalStrips}`, x + width / 2, y + height / 2 - 5)

          // Dimensions
          ctx.font = "10px Arial"
          ctx.fillText(`${piece.width.toFixed(1)}m × ${piece.length.toFixed(1)}m`, x + width / 2, y + height / 2 + 10)
        } else {
          // Regular room labels
          ctx.font = "12px Arial"
          ctx.textAlign = "center"

          // Room name with strip info if multiple strips
          const stripText = piece.totalStrips > 1 ? ` (Strip ${piece.stripIndex + 1}/${piece.totalStrips})` : ""

          ctx.fillText(`${piece.roomName}${stripText}`, x + width / 2, y + height / 2 - 5)

          // Dimensions
          ctx.font = "10px Arial"
          ctx.fillText(`${piece.width.toFixed(1)}m × ${piece.length.toFixed(1)}m`, x + width / 2, y + height / 2 + 10)

          // Show if rotated
          if (piece.isRotated) {
            ctx.fillText("(rotated)", x + width / 2, y + height / 2 + 25)
          }
        }
      }
    })

    // Draw horizontal lines to show rows
    // Group pieces by their y-coordinate to identify rows
    const rows = layout.reduce((acc, piece) => {
      const y = piece.y
      const height = piece.length + (piece.isStairs ? 0 : 0.2)

      // Find if this piece belongs to an existing row
      const rowIndex = acc.findIndex((row) => Math.abs(row.y - y) < 0.01)

      if (rowIndex === -1) {
        // Create a new row
        acc.push({
          y,
          height,
          pieces: [piece],
        })
      } else {
        // Add to existing row
        acc[rowIndex].height = Math.max(acc[rowIndex].height, height)
        acc[rowIndex].pieces.push(piece)
      }

      return acc
    }, [])

    // Sort rows by y-coordinate
    rows.sort((a, b) => a.y - b.y)

    // Draw row markers
    rows.forEach((row, index) => {
      const rowY = row.y + row.height

      // Draw a line showing the row boundary
      ctx.strokeStyle = "rgba(0, 0, 0, 0.3)"
      ctx.setLineDash([5, 5])
      ctx.beginPath()
      ctx.moveTo(50, 50 + rowY * scale)
      ctx.lineTo(50 + rollWidth * scale, 50 + rowY * scale)
      ctx.stroke()
      ctx.setLineDash([])

      // Count stair pieces and regular pieces in this row
      const stairPieces = row.pieces.filter((p) => p.isStairs).length
      const regularPieces = row.pieces.filter((p) => !p.isStairs).length

      // Draw row label
      ctx.fillStyle = "#333"
      ctx.font = "12px Arial"
      ctx.textAlign = "left"

      let rowLabel = `Row ${index + 1}: ${row.height.toFixed(2)}m`
      if (stairPieces > 0 && regularPieces > 0) {
        rowLabel += ` (${regularPieces} room + ${stairPieces} stair)`
      } else if (stairPieces > 0) {
        rowLabel += ` (${stairPieces} stair pieces)`
      } else if (regularPieces > 1) {
        rowLabel += ` (${regularPieces} pieces)`
      }

      ctx.fillText(rowLabel, 50 + rollWidth * scale + 10, 50 + (row.y + row.height / 2) * scale)
    })
  }, [rooms, scale, showLabels, rollWidth, optimizedLayout])

  // Function to download the visualization as an image
  const downloadImage = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const link = document.createElement("a")
    link.download = "carpet-layout.png"
    link.href = canvas.toDataURL("image/png")
    link.click()
  }

  // Get the total broadloom meters required
  const getTotalBroadloomMeters = () => {
    return optimizedLayout.totalLength
  }

  // Add a method to explain the interlocking calculation
  const explainInterlocking = () => {
    if (!optimizedLayout.layout || optimizedLayout.layout.length === 0) {
      return "Add rooms to see the interlocking calculation."
    }

    // Group pieces by their y-coordinate to identify rows
    const rows = optimizedLayout.layout.reduce((acc, piece) => {
      const y = piece.y
      const height = piece.length + (piece.isStairs ? 0 : 0.2)

      // Find if this piece belongs to an existing row
      const rowIndex = acc.findIndex((row) => Math.abs(row.y - y) < 0.01)

      if (rowIndex === -1) {
        // Create a new row
        acc.push({
          y,
          height,
          pieces: [piece],
        })
      } else {
        // Add to existing row
        acc[rowIndex].height = Math.max(acc[rowIndex].height, height)
        acc[rowIndex].pieces.push(piece)
      }

      return acc
    }, [])

    // Sort rows by y-coordinate
    rows.sort((a, b) => a.y - b.y)

    // Count stair pieces
    const stairPieces = optimizedLayout.layout.filter((piece) => piece.isStairs).length

    // Count mixed rows (rows with both regular pieces and stair pieces)
    const mixedRows = rows.filter((row) => {
      const hasStairs = row.pieces.some((p) => p.isStairs)
      const hasRegular = row.pieces.some((p) => !p.isStairs)
      return hasStairs && hasRegular
    }).length

    return (
      <div className="text-sm">
        <p className="mb-2">The total broadloom meters is calculated by adding the height of each row:</p>
        <ul className="list-disc pl-5 space-y-1">
          {rows.map((row, index) => {
            const stairPiecesInRow = row.pieces.filter((p) => p.isStairs).length
            const regularPiecesInRow = row.pieces.filter((p) => !p.isStairs).length

            let rowDescription = ""
            if (stairPiecesInRow > 0 && regularPiecesInRow > 0) {
              rowDescription = ` (${regularPiecesInRow} room + ${stairPiecesInRow} stair)`
            } else if (stairPiecesInRow > 0) {
              rowDescription = ` (${stairPiecesInRow} stair pieces)`
            } else if (regularPiecesInRow > 1) {
              rowDescription = ` (${regularPiecesInRow} pieces)`
            }

            return (
              <li key={index}>
                Row {index + 1}: {row.height.toFixed(2)}m{rowDescription}
              </li>
            )
          })}
          <li className="font-medium">Total: {optimizedLayout.totalLength.toFixed(2)}m</li>
        </ul>
        {stairPieces > 0 && (
          <p className="mt-2 text-green-600">
            Optimized layout includes {stairPieces} stair pieces with {mixedRows} mixed rows to minimize waste.
          </p>
        )}
      </div>
    )
  }

  // Count how many stair pieces are in the layout
  const stairPieceCount = optimizedLayout.layout ? optimizedLayout.layout.filter((piece) => piece.isStairs).length : 0

  return (
    <div className="border p-4 rounded-md bg-white">
      <h3 className="font-medium">Carpet Roll Layout ({rollWidth}m wide)</h3>
      <p className="text-sm text-gray-600 mb-4">
        The layout below shows the most efficient way to cut your carpet with interlocked strips.
        {stairPieceCount > 0 && ` Individual stair pieces (${stairPieceCount}) are arranged to minimize waste.`}
      </p>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-2">
        <div className="flex flex-wrap gap-2">
          <Select value={scale.toString()} onValueChange={(value) => setScale(Number.parseInt(value))}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Zoom" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">Zoom: 10%</SelectItem>
              <SelectItem value="15">Zoom: 15%</SelectItem>
              <SelectItem value="20">Zoom: 20%</SelectItem>
              <SelectItem value="30">Zoom: 30%</SelectItem>
              <SelectItem value="40">Zoom: 40%</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" onClick={() => setShowLabels(!showLabels)}>
            {showLabels ? "Hide Labels" : "Show Labels"}
          </Button>

          <Button variant="outline" size="sm" onClick={downloadImage}>
            <Download className="h-4 w-4 mr-2" />
            Save
          </Button>
        </div>
      </div>

      <div className="overflow-auto border rounded-md p-2 bg-gray-50 mb-4">
        <canvas ref={canvasRef} className="min-w-full" />
      </div>

      <div className="mt-4 p-3 border rounded-md bg-white">
        <div className="flex justify-between items-start">
          <span className="font-medium">Total Carpet Required:</span>
          <div className="text-right">
            <span className="font-bold">{getTotalBroadloomMeters().toFixed(2)} broadloom meters</span>
            <div className="mt-2">{explainInterlocking()}</div>
          </div>
        </div>
      </div>

      <div className="space-y-4 mt-4">
        <h4 className="font-medium">Room Summary</h4>
        <p className="text-sm text-gray-600">A 200mm cutting margin is added to each length for proper installation.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {rooms.map((room, index) => {
            const length = Number.parseFloat(room.length)
            const width = Number.parseFloat(room.width)
            const isValid = !isNaN(length) && !isNaN(width) && length > 0 && width > 0

            if (!isValid) return null

            return (
              <div key={index} className="border rounded-md p-3 bg-gray-50">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium flex items-center gap-2">
                    {room.name}
                    {room.isStairs && <span className="text-xs bg-gray-200 px-2 py-1 rounded">Stairs</span>}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <div className="flex items-center">
                    <span className="mr-1">Width:</span>
                    <span className="font-medium">{width.toFixed(2)}m</span>
                  </div>
                  <span className="mx-1">×</span>
                  <div className="flex items-center">
                    <span className="mr-1">Length:</span>
                    <span className="font-medium">{length.toFixed(2)}m</span>
                  </div>
                  {room.isStairs && (
                    <div className="flex items-center ml-2">
                      <span className="mr-1">Stairs:</span>
                      <span className="font-medium">{room.stairs}</span>
                    </div>
                  )}
                </div>

                <div className="mt-2 text-xs">
                  <div>Area: {room.area || (length * width).toFixed(2)} m²</div>
                </div>

                {width > rollWidth && (
                  <div className="mt-2 text-xs text-amber-600">
                    This {room.isStairs ? "staircase" : "room"} is wider than the roll width and will require multiple
                    strips.
                  </div>
                )}

                {room.isStairs && (
                  <div className="mt-2 text-xs text-green-600">
                    Stair pieces will be arranged individually for optimal material usage.
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
})

export default CarpetRollVisualizer

