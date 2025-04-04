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

    // First, identify all pieces needed for all rooms
    const allPieces = []

    // Process regular rooms first
    const regularRooms = roomsWithDimensions.filter((room) => !room.isStairs)

    // Determine if rotating all pieces would be more efficient
    let totalAreaWithoutRotation = 0
    let totalAreaWithRotation = 0
    let totalLengthWithoutRotation = 0
    let totalLengthWithRotation = 0

    regularRooms.forEach((room) => {
      // Calculate area (same regardless of rotation)
      const area = room.numLength * room.numWidth
      totalAreaWithoutRotation += area
      totalAreaWithRotation += area

      // Calculate length needed without rotation
      const stripsNeededWithoutRotation = Math.ceil(room.numWidth / rollWidth)
      const lengthWithoutRotation = stripsNeededWithoutRotation * (room.numLength + 0.2)
      totalLengthWithoutRotation += lengthWithoutRotation

      // Calculate length needed with rotation
      const stripsNeededWithRotation = Math.ceil(room.numLength / rollWidth)
      const lengthWithRotation = stripsNeededWithRotation * (room.numWidth + 0.2)
      totalLengthWithRotation += lengthWithRotation
    })

    // Decide whether to rotate all pieces based on which orientation uses less carpet
    // But allow user to override with the rotateAll state
    const shouldRotateAll = totalLengthWithRotation < totalLengthWithoutRotation

    // Process regular rooms with the chosen rotation strategy
    regularRooms.forEach((room, roomIndex) => {
      // Apply the same rotation strategy to all rooms
      const width = shouldRotateAll ? room.numLength : room.numWidth
      const length = shouldRotateAll ? room.numWidth : room.numLength

      // If width is greater than roll width, we need to split into strips
      if (width > rollWidth) {
        const stripsNeeded = Math.ceil(width / rollWidth)

        for (let i = 0; i < stripsNeeded; i++) {
          const stripWidth = i < stripsNeeded - 1 ? rollWidth : width - rollWidth * (stripsNeeded - 1)

          allPieces.push({
            roomIndex,
            roomName: room.name,
            isStairs: false,
            stripIndex: i,
            totalStrips: stripsNeeded,
            width: stripWidth,
            length: length,
            isRotated: shouldRotateAll,
            area: stripWidth * length,
          })
        }
      } else {
        // Room fits within roll width as a single piece
        allPieces.push({
          roomIndex,
          roomName: room.name,
          isStairs: false,
          stripIndex: 0,
          totalStrips: 1,
          width: width,
          length: length,
          isRotated: shouldRotateAll,
          area: width * length,
        })
      }
    })

    // Now process stair pieces
    roomsWithDimensions.forEach((room, roomIndex) => {
      if (room.isStairs && room.stairs) {
        const stairWidth = room.numWidth
        const stairDepth = 0.5 // 500mm per stair
        const stairs = Number.parseInt(room.stairs.toString()) || 0

        // For stairs, treat each stair as an individual piece that can be placed anywhere
        // This maximizes efficiency while maintaining the constraint that stairs are never rotated
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
            area: stairWidth * stairDepth,
            isRotated: false, // Stairs are NEVER rotated
          })
        }
      }
    })

    // Sort pieces by height (length) descending for better packing
    allPieces.sort((a, b) => {
      // First sort by length (height in the bin)
      const lengthDiff = b.length + (b.isStairs ? 0 : 0.2) - (a.length + (a.isStairs ? 0 : 0.2))
      if (Math.abs(lengthDiff) > 0.01) return lengthDiff

      // If lengths are similar, sort by width descending
      return b.width - a.width
    })

    // Initialize the layout
    const layout = []

    // We'll use a shelf-based bin packing algorithm
    // Each "shelf" is a horizontal strip across the roll width
    const shelves = []

    // Process each piece
    allPieces.forEach((piece) => {
      // Add cutting margin for regular pieces
      const pieceHeight = piece.length + (piece.isStairs ? 0 : 0.2)

      // Try to place the piece on an existing shelf
      let placed = false

      for (let i = 0; i < shelves.length; i++) {
        const shelf = shelves[i]

        // Check if there's enough space on this shelf
        if (shelf.remainingWidth >= piece.width) {
          // Place the piece on this shelf
          const placedPiece = {
            ...piece,
            x: shelf.currentX,
            y: shelf.y,
          }

          layout.push(placedPiece)

          // Update shelf information
          shelf.currentX += piece.width
          shelf.remainingWidth -= piece.width
          shelf.height = Math.max(shelf.height, pieceHeight)

          placed = true
          break
        }
      }

      // If the piece couldn't be placed on any existing shelf, create a new shelf
      if (!placed) {
        // Calculate the y-coordinate for the new shelf
        const y = shelves.length > 0 ? shelves[shelves.length - 1].y + shelves[shelves.length - 1].height : 0

        // Create a new shelf
        const newShelf = {
          y,
          currentX: piece.width,
          remainingWidth: rollWidth - piece.width,
          height: pieceHeight,
        }

        shelves.push(newShelf)

        // Place the piece on the new shelf
        const placedPiece = {
          ...piece,
          x: 0,
          y,
        }

        layout.push(placedPiece)
      }
    })

    // Calculate the total length by finding the bottom of the last shelf
    const totalLength = shelves.length > 0 ? shelves[shelves.length - 1].y + shelves[shelves.length - 1].height : 0

    return { totalLength, layout }
  }

  // Add this function after the calculateOptimizedLayout function
  const calculateLayoutEfficiency = () => {
    if (!optimizedLayout.layout || optimizedLayout.layout.length === 0) {
      return { efficiency: 0, totalArea: 0, usedArea: 0 }
    }

    // Calculate the total area of all pieces
    const totalPieceArea = optimizedLayout.layout.reduce((sum, piece) => {
      const pieceArea = piece.width * piece.length
      return sum + pieceArea
    }, 0)

    // Calculate the total area of the carpet roll
    const totalRollArea = rollWidth * optimizedLayout.totalLength

    // Calculate efficiency as a percentage
    const efficiency = (totalPieceArea / totalRollArea) * 100

    return {
      efficiency: Math.round(efficiency),
      totalArea: totalRollArea,
      usedArea: totalPieceArea,
    }
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
    layout.forEach((piece, index) => {
      const colorIndex = piece.roomIndex % colors.length
      const baseColor = colors[colorIndex]

      // For stair pieces, use a slightly different shade
      // For different strips of the same room, use different shades
      let color = baseColor
      if (piece.isStairs) {
        color = shadeColor(baseColor, -10)
      } else if (piece.stripIndex > 0) {
        // Alternate shades for different strips of the same room
        color = shadeColor(baseColor, piece.stripIndex % 2 === 0 ? 10 : -10)
      }

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

          // Show the stair information
          ctx.fillText(`${piece.roomName}`, x + width / 2, y + height / 2 - 5)

          // Show stair count
          if (piece.stairCount) {
            ctx.font = "10px Arial"
            ctx.fillText(`${piece.stairCount} stairs`, x + width / 2, y + height / 2 + 10)
          }

          // Dimensions
          ctx.font = "10px Arial"
          ctx.fillText(`${piece.width.toFixed(1)}m × ${piece.length.toFixed(1)}m`, x + width / 2, y + height / 2 + 25)
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

      // For stair pieces, draw lines to indicate individual stairs
      if (piece.isStairs && piece.stairCount && piece.stairCount > 1) {
        const stairDepth = 0.5 // 500mm per stair
        ctx.strokeStyle = "rgba(0, 0, 0, 0.3)"
        ctx.setLineDash([2, 2])

        // Draw horizontal lines to indicate individual stairs
        for (let i = 1; i < piece.stairCount; i++) {
          const stairY = y + i * stairDepth * scale
          ctx.beginPath()
          ctx.moveTo(x, stairY)
          ctx.lineTo(x + width, stairY)
          ctx.stroke()
        }

        ctx.setLineDash([])
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
        rowLabel += ` (${stairPieces} stair strips)`
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

    // Group pieces by their y-coordinate to identify shelves
    const shelves = optimizedLayout.layout.reduce((acc, piece) => {
      const y = piece.y
      const height = piece.length + (piece.isStairs ? 0 : 0.2)

      // Find if this piece belongs to an existing shelf
      const shelfIndex = acc.findIndex((shelf) => Math.abs(shelf.y - y) < 0.01)

      if (shelfIndex === -1) {
        // Create a new shelf
        acc.push({
          y,
          height,
          pieces: [piece],
        })
      } else {
        // Add to existing shelf
        acc[shelfIndex].height = Math.max(acc[shelfIndex].height, height)
        acc[shelfIndex].pieces.push(piece)
      }

      return acc
    }, [])

    // Sort shelves by y-coordinate
    shelves.sort((a, b) => a.y - b.y)

    // Count stair pieces
    const stairPieces = optimizedLayout.layout.filter((piece) => piece.isStairs).length

    // Count mixed shelves (shelves with both regular pieces and stair pieces)
    const mixedShelves = shelves.filter((shelf) => {
      const hasStairs = shelf.pieces.some((p) => p.isStairs)
      const hasRegular = shelf.pieces.some((p) => !p.isStairs)
      return hasStairs && hasRegular
    }).length

    // Count pieces that were rotated
    const rotatedPieces = optimizedLayout.layout.filter((piece) => piece.isRotated).length
    const totalPieces = optimizedLayout.layout.length

    // Count stair strips (grouped stair pieces)
    const stairStrips = optimizedLayout.layout.filter((piece) => piece.isStairs).length

    return (
      <div className="text-sm">
        <p className="mb-2">The carpet is laid out in {shelves.length} horizontal shelves across the roll width:</p>
        <ul className="list-disc pl-5 space-y-1">
          {shelves.map((shelf, index) => {
            const stairPiecesInShelf = shelf.pieces.filter((p) => p.isStairs).length
            const regularPiecesInShelf = shelf.pieces.filter((p) => !p.isStairs).length
            const totalWidthUsed = shelf.pieces.reduce((sum, p) => sum + p.width, 0)
            const efficiencyPercent = Math.min(100, Math.round((totalWidthUsed / rollWidth) * 100))

            let shelfDescription = ""
            if (stairPiecesInShelf > 0 && regularPiecesInShelf > 0) {
              shelfDescription = ` (${regularPiecesInShelf} room + ${stairPiecesInShelf} stair)`
            } else if (stairPiecesInShelf > 0) {
              shelfDescription = ` (${stairPiecesInShelf} stair strips)`
            } else if (regularPiecesInShelf > 1) {
              shelfDescription = ` (${regularPiecesInShelf} pieces)`
            }

            return (
              <li key={index}>
                Shelf {index + 1}: {shelf.height.toFixed(2)}m high, {efficiencyPercent}% width utilized
                {shelfDescription}
              </li>
            )
          })}
          <li className="font-medium">Total: {optimizedLayout.totalLength.toFixed(2)}m</li>
        </ul>
        {rotatedPieces > 0 && (
          <p className="mt-2 text-blue-600">
            All regular room pieces are rotated for optimal material usage (carpet nap direction is maintained). The
            algorithm automatically determined this is the most efficient layout.
          </p>
        )}
        {stairStrips > 0 && (
          <p className="mt-2 text-green-600">
            Stair pieces are placed individually to minimize carpet usage while maintaining proper orientation. Stairs
            are never rotated regardless of the main carpet direction.
          </p>
        )}
        <p className="mt-2 text-blue-600">
          This bin packing algorithm places pieces on horizontal shelves across the roll width, maximizing material
          usage while respecting carpet nap direction for regular rooms and proper orientation for stairs.
        </p>
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
        {stairPieceCount > 0 &&
          ` Stair pieces are placed individually to minimize carpet usage while maintaining proper orientation.`}
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
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-start">
            <span className="font-medium">Total Carpet Required:</span>
            <div className="text-right">
              <span className="font-bold">{getTotalBroadloomMeters().toFixed(2)} broadloom meters</span>
              {optimizedLayout.layout.length > 0 && (
                <div className="mt-1 text-sm">
                  <div className="flex items-center justify-end gap-2">
                    <span>Efficiency:</span>
                    <div className="w-24 h-4 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500"
                        style={{ width: `${calculateLayoutEfficiency().efficiency}%` }}
                      ></div>
                    </div>
                    <span className="font-medium">{calculateLayoutEfficiency().efficiency}%</span>
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    {calculateLayoutEfficiency().usedArea.toFixed(2)}m² used of{" "}
                    {calculateLayoutEfficiency().totalArea.toFixed(2)}m² total
                  </div>
                </div>
              )}
              <div className="mt-2">{explainInterlocking()}</div>
            </div>
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

            // Find all pieces in the layout for this room
            const roomPieces = optimizedLayout.layout.filter((piece) => piece.roomIndex === index)
            const isRotated = roomPieces.some((piece) => piece.isRotated)
            const totalPieces = roomPieces.length

            return (
              <div key={index} className="border rounded-md p-3 bg-gray-50">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium flex items-center gap-2">
                    {room.name}
                    {room.isStairs && <span className="text-xs bg-gray-200 px-2 py-1 rounded">Stairs</span>}
                    {isRotated && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Rotated</span>}
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
                  {totalPieces > 1 && !room.isStairs && (
                    <div className="text-blue-600">Cut into {totalPieces} pieces for optimal layout</div>
                  )}
                </div>

                {width > rollWidth && (
                  <div className="mt-2 text-xs text-amber-600">
                    This {room.isStairs ? "staircase" : "room"} is wider than the roll width and will require multiple
                    strips.
                  </div>
                )}

                {room.isStairs && (
                  <div className="mt-2 text-xs text-green-600">
                    Stair pieces are placed individually to minimize carpet usage. Stairs are never rotated regardless
                    of the main carpet direction.
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

