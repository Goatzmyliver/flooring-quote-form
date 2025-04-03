interface QuoteSummaryProps {
  quoteType: string
  flooringType: string
  area: string
  color: string
  estimatedPrice?: number
}

export default function QuoteSummary({ quoteType, flooringType, area, color, estimatedPrice }: QuoteSummaryProps) {
  // Convert area to number and handle empty string
  const areaNum = area ? Number.parseFloat(area) : 0

  return (
    <div className="border p-4 rounded-md bg-gray-50 mb-6">
      <h3 className="font-medium text-lg mb-2">Quote Summary</h3>
      <div className="space-y-2 text-sm">
        <p>
          <span className="font-medium">Quote Type:</span>{" "}
          {quoteType.replace("-", " & ").replace(/(^\w|\s\w)/g, (m) => m.toUpperCase())}
        </p>
        {flooringType && (
          <p>
            <span className="font-medium">Flooring Type:</span>{" "}
            {flooringType.charAt(0).toUpperCase() + flooringType.slice(1)}
          </p>
        )}
        {area && (
          <p>
            <span className="font-medium">Area:</span> {area} m²
          </p>
        )}
        {color && (
          <p>
            <span className="font-medium">Color/Finish:</span> {color}
          </p>
        )}
        {estimatedPrice && (
          <p className="text-lg font-bold mt-4">Estimated Price: ${estimatedPrice.toFixed(2)} + GST</p>
        )}
      </div>
    </div>
  )
}

