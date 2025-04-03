"use client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Trash2 } from "lucide-react"

interface Room {
  name: string
  length: string
  width: string
  carpetRequired: number
  rotation?: boolean // true = rotated 90 degrees
}

interface RoomCalculatorProps {
  rooms: Room[]
  onAddRoom: () => void
  onRemoveRoom: (index: number) => void
  onUpdateRoom: (index: number, field: string, value: string) => void
  totalCarpetRequired: number
}

export default function RoomCalculator({
  rooms,
  onAddRoom,
  onRemoveRoom,
  onUpdateRoom,
  totalCarpetRequired,
}: RoomCalculatorProps) {
  return (
    <div className="border p-4 rounded-md bg-gray-50">
      <p className="text-sm text-gray-600 mb-4">
        Enter your room dimensions below to calculate how much 3.66m wide carpet you'll need. We'll automatically add 5%
        for wastage.
      </p>

      {rooms.map((room, index) => (
        <div key={index} className="mb-4 p-3 border rounded-md bg-white">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center">
              <Input
                className="w-40 mr-2"
                placeholder="Room name"
                value={room.name}
                onChange={(e) => onUpdateRoom(index, "name", e.target.value)}
              />
            </div>
            {rooms.length > 1 && (
              <Button variant="ghost" size="sm" onClick={() => onRemoveRoom(index)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Label htmlFor={`room-${index}-length`}>Length (m)</Label>
              <Input
                id={`room-${index}-length`}
                type="number"
                step="0.01"
                placeholder="e.g. 5.2"
                value={room.length}
                onChange={(e) => onUpdateRoom(index, "length", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor={`room-${index}-width`}>Width (m)</Label>
              <Input
                id={`room-${index}-width`}
                type="number"
                step="0.01"
                placeholder="e.g. 4.3"
                value={room.width}
                onChange={(e) => onUpdateRoom(index, "width", e.target.value)}
              />
            </div>
            <div>
              <Label>Carpet Required (m²)</Label>
              <div className="h-10 px-3 py-2 border rounded-md bg-gray-100">{room.carpetRequired || "-"}</div>
            </div>
          </div>
        </div>
      ))}

      <Button variant="outline" size="sm" onClick={onAddRoom} className="mt-2">
        <Plus className="h-4 w-4 mr-2" />
        Add Another Room
      </Button>

      <div className="mt-4 p-3 border rounded-md bg-white">
        <div className="flex justify-between">
          <span className="font-medium">Total Carpet Required:</span>
          <span className="font-bold">{totalCarpetRequired.toFixed(2)} m²</span>
        </div>
      </div>
    </div>
  )
}

