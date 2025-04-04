import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Type definitions for our database tables
export type Product = {
  id: number
  name: string
  category: string
  price: number
  image: string
  roll_width?: number
  colors?: string[]
  created_at?: string
  updated_at?: string
}

export type AdditionalService = {
  id: number
  label: string
  price: number
  description: string
  flooring_types: string[] // Array of flooring types this service applies to
  created_at?: string
  updated_at?: string
}

export type Quote = {
  id?: number
  quote_number: string
  job_number: string
  customer_name: string
  customer_email: string
  customer_phone: string
  customer_address?: string
  customer_postcode?: string
  preferred_contact: string
  project_timeline: string
  quote_type: string
  flooring_type: string
  area: string
  color?: string
  additional_info?: string
  selected_products: any[]
  rooms: any[]
  extra_services: string[]
  payment_method?: string
  total_cost: number
  deposit_amount?: number
  status?: string
  created_at?: string
  updated_at?: string
}

