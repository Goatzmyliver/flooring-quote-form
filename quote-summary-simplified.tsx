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
    <div className="border p-6 rounded-lg bg-green-50 border-green-200">
      <h3 className="font-medium text-lg mb-4">Quote Summary</h3>

      <div className="grid grid-cols-2 gap-y-3 mb-4">
        <div className="text-gray-600">Quote Type:</div>
        <div className="font-medium">{quoteType === "supply-only" ? "Supply Only" : "Supply & Install"}</div>

        <div className="text-gray-600">Flooring Type:</div>
        <div className="font-medium">{flooringType.charAt(0).toUpperCase() + flooringType.slice(1)}</div>

        {area && (
          <>
            <div className="text-gray-600">Area:</div>
            <div className="font-medium">{area} m²</div>
          </>
        )}

        {color && (
          <>
            <div className="text-gray-600">Color/Finish:</div>
            <div className="font-medium">{color}</div>
          </>
        )}
      </div>

      {estimatedPrice && (
        <div className="border-t pt-4 mt-4">
          <div className="flex justify-between items-center">
            <span className="text-lg font-medium">Estimated Price:</span>
            <span className="text-xl font-bold">${estimatedPrice.toFixed(2)} + GST</span>
          </div>

          {quoteType === "supply-install" && (
            <div className="mt-2 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Deposit (50%):</span>
                <span className="font-medium">${(estimatedPrice * 0.5).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Balance after installation:</span>
                <span className="font-medium">${(estimatedPrice * 0.5).toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

