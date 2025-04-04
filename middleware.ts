import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // Check if the request is for the admin dashboard
  if (request.nextUrl.pathname.startsWith("/admin-dashboard")) {
    // In a real implementation, you would verify the JWT token
    // For now, we'll rely on client-side auth check

    // Allow the request to continue
    return NextResponse.next()
  }

  // For all other routes, allow the request to continue
  return NextResponse.next()
}

export const config = {
  matcher: ["/admin-dashboard/:path*"],
}

