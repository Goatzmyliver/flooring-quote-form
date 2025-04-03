import { NextResponse } from "next/server"
import Stripe from "stripe"

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2023-10-16", // Use the latest API version
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { amount, quoteNumber, customerName, customerEmail, productName, isDeposit } = body

    // Create a Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "nzd",
            product_data: {
              name: isDeposit
                ? `Deposit for ${productName} - Quote #${quoteNumber}`
                : `${productName} - Quote #${quoteNumber}`,
              description: `Flooring quote ${quoteNumber} for ${customerName}`,
            },
            unit_amount: Math.round(amount * 100), // Stripe requires amount in cents
          },
          quantity: 1,
        },
      ],
      metadata: {
        quoteNumber,
        customerName,
        isDeposit: isDeposit ? "true" : "false",
      },
      customer_email: customerEmail,
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment-cancelled`,
    })

    return NextResponse.json({ sessionId: session.id, url: session.url })
  } catch (error: any) {
    console.error("Error creating checkout session:", error)
    return NextResponse.json({ error: { message: error.message } }, { status: 500 })
  }
}

