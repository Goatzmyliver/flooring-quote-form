"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { XCircle, ArrowLeft } from "lucide-react"

export default function PaymentCancelledPage() {
  return (
    <div className="container mx-auto py-12 px-4 max-w-3xl">
      <Card className="w-full">
        <CardHeader className="text-center">
          <div className="mx-auto bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mb-4">
            <XCircle className="h-8 w-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl text-red-600">Payment Cancelled</CardTitle>
          <CardDescription>Your payment process was cancelled. No charges have been made.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-center">
              If you experienced any issues during the payment process or have questions about your quote, please don't
              hesitate to contact our customer service team.
            </p>
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="font-medium mb-2">What would you like to do next?</h3>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>Return to your quote to review the details</li>
                <li>Try the payment again</li>
                <li>Contact our customer service for assistance</li>
                <li>Choose a different payment method</li>
              </ul>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Link href="/" passHref>
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Return to Quote
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}

