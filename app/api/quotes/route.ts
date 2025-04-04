import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: Request) {
  try {
    const { data, error } = await supabase.from("quotes").select("*").order("created_at", { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching quotes:", error)
    return NextResponse.json({ error: "Failed to fetch quotes" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const quote = await request.json()

    // Generate quote number if not provided
    if (!quote.quote_number) {
      quote.quote_number = `QT${Math.floor(Math.random() * 1000000)
        .toString()
        .padStart(7, "0")}`
    }

    // Generate job number if not provided
    if (!quote.job_number) {
      quote.job_number = `JB${Math.floor(Math.random() * 100000)
        .toString()
        .padStart(5, "0")}`
    }

    const { data, error } = await supabase.from("quotes").insert(quote).select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data[0])
  } catch (error) {
    console.error("Error creating quote:", error)
    return NextResponse.json({ error: "Failed to create quote" }, { status: 500 })
  }
}

