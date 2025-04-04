"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { X, Mail, Loader2 } from "lucide-react"
import { sendQuoteEmail } from "./actions/send-email"

interface EmailQuoteModalProps {
  isOpen: boolean
  onClose: () => void
  quoteHtml: string
  customerName: string
  customerEmail: string
  quoteNumber: string
  onSuccess: () => void
  onError: (message: string) => void
}

export default function EmailQuoteModal({
  isOpen,
  onClose,
  quoteHtml,
  customerName,
  customerEmail,
  quoteNumber,
  onSuccess,
  onError,
}: EmailQuoteModalProps) {
  const [emailData, setEmailData] = useState({
    to: customerEmail || "",
    subject: `Your Carpetland Quote #${quoteNumber}`,
    message: "Thank you for your interest in Carpetland. Please find your quote attached below.",
  })
  const [isSending, setIsSending] = useState(false)

  if (!isOpen) return null

  const handleChange = (field: string, value: string) => {
    setEmailData({ ...emailData, [field]: value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSending(true)

    try {
      const result = await sendQuoteEmail({
        ...emailData,
        quoteHtml,
        customerName,
        quoteNumber,
      })

      if (result.success) {
        onSuccess()
        onClose()
      } else {
        onError(result.error || "Failed to send email")
      }
    } catch (error) {
      onError((error as Error).message || "An unexpected error occurred")
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-medium">Email Quote</h3>
          <Button variant="ghost" size="icon" onClick={onClose} disabled={isSending}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="to">Email To</Label>
            <Input
              id="to"
              type="email"
              value={emailData.to}
              onChange={(e) => handleChange("to", e.target.value)}
              placeholder="recipient@example.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={emailData.subject}
              onChange={(e) => handleChange("subject", e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              value={emailData.message}
              onChange={(e) => handleChange("message", e.target.value)}
              rows={3}
              required
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSending}>
              {isSending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Send Quote
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

