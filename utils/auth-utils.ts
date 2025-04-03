// Simple authentication utility functions

/**
 * Check if the user is authenticated as an admin
 * @returns boolean indicating if the user is authenticated
 */
export function isAdminAuthenticated(): boolean {
  if (typeof window === "undefined") {
    return false
  }

  try {
    const authData = localStorage.getItem("adminAuth")
    if (!authData) return false

    const { authenticated, timestamp } = JSON.parse(authData)

    // Check if auth is valid and not expired (24 hour expiry)
    return authenticated && Date.now() - timestamp < 24 * 60 * 60 * 1000
  } catch (error) {
    return false
  }
}

/**
 * Log out the admin user
 */
export function logoutAdmin(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem("adminAuth")
  }
}

/**
 * Get the authentication timestamp
 * @returns timestamp of authentication or null if not authenticated
 */
export function getAuthTimestamp(): number | null {
  if (typeof window === "undefined") {
    return null
  }

  try {
    const authData = localStorage.getItem("adminAuth")
    if (!authData) return null

    const { timestamp } = JSON.parse(authData)
    return timestamp
  } catch (error) {
    return null
  }
}

