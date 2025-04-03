"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Printer, Download, Home } from "lucide-react"

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get("session_id")
  const [paymentDetails, setPaymentDetails] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // In a real implementation, you would verify the payment on the server
    // and fetch the payment details from your database
    if (sessionId) {
      // Simulate fetching payment details
      setTimeout(() => {
        setPaymentDetails({
          amount: localStorage.getItem("paymentAmount") || "0",
          quoteNumber: localStorage.getItem("quoteNumber") || "Unknown",
          customerName: localStorage.getItem("customerName") || "Customer",
          isDeposit: localStorage.getItem("isDeposit") === "true",
          date: new Date().toLocaleDateString("en-NZ"),
          time: new Date().toLocaleTimeString("en-NZ"),
          paymentId: sessionId.substring(0, 8) + "...",
        })
        setLoading(false)
      }, 1000)
    } else {
      setLoading(false)
    }
  }, [sessionId])

  const handlePrintReceipt = () => {
    window.print()
  }

  const handleDownloadReceipt = () => {
    // In a real implementation, you would generate a PDF receipt
    alert("Download receipt functionality would be implemented here")
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verifying your payment...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-12 px-4 max-w-3xl">
      <Card className="w-full">
        <CardHeader className="text-center">
          <div className="mx-auto bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl text-green-600">Payment Successful!</CardTitle>
          <CardDescription>
            Thank you for your payment. Your transaction has been completed successfully.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {paymentDetails ? (
            <div className="space-y-6">
              <div className="border-t border-b py-4">
                <h3 className="font-medium text-lg mb-4">Payment Receipt</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Quote Number</p>
                    <p className="font-medium">{paymentDetails.quoteNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Amount Paid</p>
                    <p className="font-medium">${Number(paymentDetails.amount).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Payment Type</p>
                    <p className="font-medium">{paymentDetails.isDeposit ? "Deposit (50%)" : "Full Payment"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Date & Time</p>
                    <p className="font-medium">
                      {paymentDetails.date} at {paymentDetails.time}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Customer</p>
                    <p className="font-medium">{paymentDetails.customerName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Payment ID</p>
                    <p className="font-medium">{paymentDetails.paymentId}</p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-md">
                <h3 className="font-medium mb-2">What happens next?</h3>
                {paymentDetails.isDeposit ? (
                  <p className="text-sm">
                    We've received your deposit and will contact you shortly to arrange installation. The remaining
                    balance will be due within 10 days of installation.
                  </p>
                ) : (
                  <p className="text-sm">
                    We've received your payment and will contact you shortly to arrange delivery or collection of your
                    flooring products.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <p>Payment information not available.</p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-3 justify-between print:hidden">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handlePrintReceipt}>
              <Printer className="h-4 w-4 mr-2" />
              Print Receipt
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownloadReceipt}>
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          </div>
          <Link href="/" passHref>
            <Button>
              <Home className="h-4 w-4 mr-2" />
              Return to Home
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}

