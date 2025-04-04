"use client"

import { useState, useEffect } from "react"
import { X, CheckCircle, AlertCircle } from "lucide-react"

interface ToastNotificationProps {
  message: string
  type: "success" | "error"
  onClose: () => void
  duration?: number
}

export default function ToastNotification({ message, type, onClose, duration = 5000 }: ToastNotificationProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(onClose, 300) // Allow time for exit animation
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  return (
    <div
      className={`fixed bottom-4 right-4 max-w-md p-4 rounded-lg shadow-lg transition-all duration-300 z-50
        ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}
        ${type === "success" ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {type === "success" ? (
            <CheckCircle className="h-5 w-5 text-green-500" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-500" />
          )}
        </div>
        <div className="ml-3 flex-1">
          <p className={`text-sm font-medium ${type === "success" ? "text-green-800" : "text-red-800"}`}>{message}</p>
        </div>
        <button
          type="button"
          className="ml-3 flex-shrink-0 inline-flex text-gray-400 hover:text-gray-500"
          onClick={() => {
            setIsVisible(false)
            setTimeout(onClose, 300)
          }}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

