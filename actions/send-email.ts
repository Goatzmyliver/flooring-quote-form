"use server"

// Mock email sending function for preview environment
export async function sendQuoteEmail(data: {
  to: string
  subject: string
  message: string
  quoteHtml: string
  customerName: string
  quoteNumber: string
}) {
  try {
    // Log the email data for debugging
    console.log("Email would be sent with the following data:", {
      to: data.to,
      subject: data.subject,
      message: data.message,
      customerName: data.customerName,
      quoteNumber: data.quoteNumber,
    })

    // In a real implementation, this would use nodemailer
    // For preview purposes, we'll simulate a successful email send

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    return {
      success: true,
      messageId: `mock-message-id-${Date.now()}`,
      message: "Email would be sent in production environment",
    }
  } catch (error) {
    console.error("Error sending email:", error)
    return { success: false, error: (error as Error).message }
  }
}

