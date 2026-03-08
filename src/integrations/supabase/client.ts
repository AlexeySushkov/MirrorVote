import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './types'

const env = (import.meta as { env: Record<string, string> }).env
const supabaseUrl = env.VITE_SUPABASE_URL ?? ''
const supabaseAnonKey = env.VITE_SUPABASE_PUBLISHABLE_KEY ?? env.VITE_SUPABASE_ANON_KEY ?? ''

const isLikelyValidSupabaseKey = (key: string) => {
  // Supabase can use legacy JWT anon key (starts with eyJ...) or modern publishable key (starts with sb_publishable_)
  if (key.startsWith('eyJ')) return key.length > 40
  if (key.startsWith('sb_publishable_')) return key.length > 'sb_publishable_'.length + 20
  return false
}

// Placeholder for dev without .env — auth will fail but app won't crash
const url = supabaseUrl || 'https://placeholder.supabase.co'
const key = supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder'

export const supabase: SupabaseClient<Database> = createClient<Database>(url, key)

export const isSupabaseConfigured = Boolean(supabaseUrl && isLikelyValidSupabaseKey(supabaseAnonKey))

export const supabaseConfigError =
  'Supabase не настроен или ключ выглядит некорректным. Проверьте VITE_SUPABASE_URL и полный VITE_SUPABASE_PUBLISHABLE_KEY (или VITE_SUPABASE_ANON_KEY) в .env, затем перезапустите npm run dev.'
