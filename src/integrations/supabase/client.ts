import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './types'

type AppConfig = { SUPABASE_URL?: string; SUPABASE_KEY?: string }
const runtime: AppConfig =
  (window as unknown as { __APP_CONFIG__?: AppConfig }).__APP_CONFIG__ ?? {}

const env = (import.meta as { env: Record<string, string> }).env

// Runtime config (config.js on server) wins over build-time .env.
const supabaseUrl = runtime.SUPABASE_URL || env.VITE_SUPABASE_URL || ''
const supabaseAnonKey =
  runtime.SUPABASE_KEY || env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_ANON_KEY || ''

const isLikelyValidSupabaseKey = (key: string) => {
  // Supabase can use legacy JWT anon key (starts with eyJ...) or modern publishable key (starts with sb_publishable_)
  if (key.startsWith('eyJ')) return key.length > 40
  if (key.startsWith('sb_publishable_')) return key.length > 'sb_publishable_'.length + 20
  return false
}

// Placeholder for dev without config — auth will fail but app won't crash
const url = supabaseUrl || 'https://placeholder.supabase.co'
const key = supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder'

export const supabase: SupabaseClient<Database> = createClient<Database>(url, key)

export const isSupabaseConfigured = Boolean(supabaseUrl && isLikelyValidSupabaseKey(supabaseAnonKey))

export const supabaseConfigError =
  'Supabase не настроен или ключ выглядит некорректным. Заполните SUPABASE_URL и SUPABASE_KEY в /app/config.js на сервере (или VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY в .env для локальной разработки), затем обновите страницу.'
