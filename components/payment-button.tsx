"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { CreditCard, Loader2 } from "lucide-react"
import { loadStripe } from "@stripe/stripe-js"

// Initialize Stripe with your publishable key
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "")

interface PaymentButtonProps {
  amount: number
  quoteNumber: string
  customerName: string
  customerEmail: string
  productName: string
  isDeposit?: boolean
  className?: string
}

export default function PaymentButton({
  amount,
  quoteNumber,
  customerName,
  customerEmail,
  productName,
  isDeposit = false,
  className = "",
}: PaymentButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handlePayment = async () => {
    setIsLoading(true)

    try {
      // Store payment details in localStorage for the success page
      // In a real app, you would store this in your database
      localStorage.setItem("paymentAmount", amount.toString())
      localStorage.setItem("quoteNumber", quoteNumber)
      localStorage.setItem("customerName", customerName)
      localStorage.setItem("isDeposit", isDeposit ? "true" : "false")

      // Create a checkout session
      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount,
          quoteNumber,
          customerName,
          customerEmail,
          productName,
          isDeposit,
        }),
      })

      const { url } = await response.json()

      // Redirect to Stripe Checkout
      if (url) {
        window.location.href = url
      } else {
        throw new Error("Failed to create checkout session")
      }
    } catch (error) {
      console.error("Payment error:", error)
      alert("There was an error processing your payment. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button onClick={handlePayment} disabled={isLoading} className={className}>
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Processing...
        </>
      ) : (
        <>
          <CreditCard className="h-4 w-4 mr-2" />
          Pay {isDeposit ? "Deposit" : "Now"} (${amount.toFixed(2)})
        </>
      )}
    </Button>
  )
}

