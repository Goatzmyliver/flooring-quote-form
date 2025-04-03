interface CarpetCalculatorProps {
  width: number
  length: number
  rollWidth?: number
}

export default function calculateCarpetRequired({ width, length, rollWidth = 3.66 }: CarpetCalculatorProps) {
  // Calculate how many strips of carpet are needed
  const stripsNeeded = Math.ceil(width / rollWidth)

  // Add 200mm (0.2m) cutting margin to each strip's length
  const carpetRequired = stripsNeeded * (length + 0.2)

  return {
    squareMeters: Number.parseFloat(carpetRequired.toFixed(2)),
    broadloomMeters: Number.parseFloat((carpetRequired / rollWidth).toFixed(2)),
  }
}

