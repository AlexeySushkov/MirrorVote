export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface NormalizationParams {
  brightness?: number
  contrast?: number
  warmth?: number
  cropTop?: number
  cropBottom?: number
  cropLeft?: number
  cropRight?: number
  scale?: number
  description?: string
}

export interface PhotoAnalysis {
  overall_score: number
  fit_score: number
  style_score: number
  color_score: number
  description: string
  pros: string[]
  cons: string[]
  style_tips: string[]
}

export interface Database {
  public: {
    Tables: {
      mirror_sessions: {
        Row: {
          id: string
          user_id: string
          title: string
          store_name: string | null
          status: 'uploading' | 'normalizing' | 'ready' | 'analyzed'
          best_photo_id: string | null
          ai_recommendation: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title?: string
          store_name?: string | null
          status?: 'uploading' | 'normalizing' | 'ready' | 'analyzed'
          best_photo_id?: string | null
          ai_recommendation?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          store_name?: string | null
          status?: 'uploading' | 'normalizing' | 'ready' | 'analyzed'
          best_photo_id?: string | null
          ai_recommendation?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      mirror_photos: {
        Row: {
          id: string
          session_id: string
          user_id: string
          storage_path: string
          photo_url: string
          original_filename: string
          sort_order: number
          normalization: NormalizationParams | null
          analysis: PhotoAnalysis | null
          status: 'uploaded' | 'normalizing' | 'ready' | 'error'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          session_id: string
          user_id: string
          storage_path: string
          photo_url: string
          original_filename: string
          sort_order?: number
          normalization?: NormalizationParams | null
          analysis?: PhotoAnalysis | null
          status?: 'uploaded' | 'normalizing' | 'ready' | 'error'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          user_id?: string
          storage_path?: string
          photo_url?: string
          original_filename?: string
          sort_order?: number
          normalization?: NormalizationParams | null
          analysis?: PhotoAnalysis | null
          status?: 'uploaded' | 'normalizing' | 'ready' | 'error'
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

export type Session = Database['public']['Tables']['mirror_sessions']['Row']
export type Photo = Database['public']['Tables']['mirror_photos']['Row']
