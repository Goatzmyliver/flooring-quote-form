import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json()

    // In a real implementation, you would use proper password hashing
    // This is a simplified version for demonstration purposes
    const { data, error } = await supabase
      .from("admin_users")
      .select("*")
      .eq("username", username)
      .eq("password_hash", password)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: "Invalid username or password" }, { status: 401 })
    }

    // Update last login timestamp
    await supabase.from("admin_users").update({ last_login: new Date().toISOString() }).eq("id", data.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error during login:", error)
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 })
  }
}

