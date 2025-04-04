import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const flooringType = searchParams.get("flooringType")

    let query = supabase.from("additional_services").select("*")

    if (flooringType) {
      // If a flooring type is specified, filter services that apply to this type
      // This uses Postgres array contains operator to check if the flooring_types array contains the specified type
      query = query.filter("flooring_types", "cs", `{${flooringType}}`)
    }

    const { data, error } = await query.order("label")

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching additional services:", error)
    return NextResponse.json({ error: "Failed to fetch additional services" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const service = await request.json()

    const { data, error } = await supabase.from("additional_services").insert(service).select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data[0])
  } catch (error) {
    console.error("Error creating additional service:", error)
    return NextResponse.json({ error: "Failed to create additional service" }, { status: 500 })
  }
}

