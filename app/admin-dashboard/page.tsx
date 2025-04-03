"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import AdminPanel from "../../admin-panel"
import { mockProducts } from "../../data/mock-products"

export default function AdminDashboardPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = () => {
      const authData = localStorage.getItem("adminAuth")

      if (!authData) {
        router.push("/admin-login")
        return
      }

      try {
        const { authenticated, timestamp } = JSON.parse(authData)

        // Check if auth is valid and not expired (24 hour expiry)
        const isValid = authenticated && Date.now() - timestamp < 24 * 60 * 60 * 1000

        if (!isValid) {
          localStorage.removeItem("adminAuth")
          router.push("/admin-login")
          return
        }

        setIsAuthenticated(true)
      } catch (error) {
        localStorage.removeItem("adminAuth")
        router.push("/admin-login")
      }

      setIsLoading(false)
    }

    checkAuth()
  }, [router])

  const handleExit = () => {
    router.push("/")
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin panel...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null // Will redirect in useEffect
  }

  return <AdminPanel onExit={handleExit} mockProducts={mockProducts} />
}

