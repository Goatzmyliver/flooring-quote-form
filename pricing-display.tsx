interface PricingDisplayProps {
  flooringType: string
  pricePerMeter: number
  includesInstallation: boolean
}

export default function PricingDisplay({ flooringType, pricePerMeter, includesInstallation }: PricingDisplayProps) {
  return (
    <div className="border p-4 my-4 bg-gray-50">
      <p className="font-medium">
        {flooringType} {includesInstallation ? "Installed" : "Supply Only"}
        inc Basic Prep (${pricePerMeter.toFixed(2)} + GST m²)
      </p>
    </div>
  )
}

