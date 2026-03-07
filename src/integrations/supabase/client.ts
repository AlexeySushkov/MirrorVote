import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './types'

const supabaseUrl = (import.meta as { env: Record<string, string> }).env.VITE_SUPABASE_URL ?? ''
const supabaseAnonKey = (import.meta as { env: Record<string, string> }).env.VITE_SUPABASE_PUBLISHABLE_KEY ?? ''

// Placeholder for dev without .env — auth will fail but app won't crash
const url = supabaseUrl || 'https://placeholder.supabase.co'
const key = supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder'

export const supabase: SupabaseClient<Database> = createClient<Database>(url, key)
