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
  verdict?: string
  pros: string[]
  cons: string[]
  style_tips: string[]
}

export interface AnalysisQuota {
  used: number
  limit_count: number | null
  remaining: number | null
  plan_code: string
  period_yyyymm: number
}

export interface Database {
  public: {
    Tables: {
      mirror_sessions: {
        Relationships: []
        Row: {
          id: string
          user_id: string
          title: string
          store_name: string | null
          status: 'uploading' | 'normalizing' | 'ready' | 'analyzed'
          best_photo_id: string | null
          ai_recommendation: string | null
          share_token: string | null
          background: string | null
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
          share_token?: string | null
          background?: string | null
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
          share_token?: string | null
          background?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      mirror_photos: {
        Relationships: []
        Row: {
          id: string
          session_id: string
          user_id: string
          storage_path: string
          photo_url: string
          processed_photo_url: string | null
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
          processed_photo_url?: string | null
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
          processed_photo_url?: string | null
          original_filename?: string
          sort_order?: number
          normalization?: NormalizationParams | null
          analysis?: PhotoAnalysis | null
          status?: 'uploaded' | 'normalizing' | 'ready' | 'error'
          created_at?: string
          updated_at?: string
        }
      }
      billing_plan_limits: {
        Relationships: []
        Row: {
          plan_code: string
          analysis_limit_monthly: number | null
          updated_at: string
        }
        Insert: {
          plan_code: string
          analysis_limit_monthly?: number | null
          updated_at?: string
        }
        Update: {
          plan_code?: string
          analysis_limit_monthly?: number | null
          updated_at?: string
        }
      }
      billing_subscriptions: {
        Relationships: []
        Row: {
          user_id: string
          plan_code: string
          status: 'active' | 'past_due' | 'canceled'
          provider: string | null
          provider_subscription_id: string | null
          current_period_start: string | null
          current_period_end: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          plan_code?: string
          status?: 'active' | 'past_due' | 'canceled'
          provider?: string | null
          provider_subscription_id?: string | null
          current_period_start?: string | null
          current_period_end?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          plan_code?: string
          status?: 'active' | 'past_due' | 'canceled'
          provider?: string | null
          provider_subscription_id?: string | null
          current_period_start?: string | null
          current_period_end?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      usage_analytics_monthly: {
        Relationships: []
        Row: {
          user_id: string
          period_yyyymm: number
          used_count: number
          limit_count: number | null
          plan_code: string
          updated_at: string
          created_at: string
        }
        Insert: {
          user_id: string
          period_yyyymm: number
          used_count?: number
          limit_count?: number | null
          plan_code: string
          updated_at?: string
          created_at?: string
        }
        Update: {
          user_id?: string
          period_yyyymm?: number
          used_count?: number
          limit_count?: number | null
          plan_code?: string
          updated_at?: string
          created_at?: string
        }
      }
      billing_payment_events: {
        Relationships: []
        Row: {
          payment_id: string
          event_name: string
          payload: Json
          created_at: string
        }
        Insert: {
          payment_id: string
          event_name: string
          payload: Json
          created_at?: string
        }
        Update: {
          payment_id?: string
          event_name?: string
          payload?: Json
          created_at?: string
        }
      }
    }
    Views: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
    Functions: {
      consume_analysis_credit: {
        Args: Record<string, never>
        Returns: AnalysisQuota[]
      }
      get_analysis_quota: {
        Args: Record<string, never>
        Returns: AnalysisQuota[]
      }
      get_public_session: {
        Args: {
          p_token: string
        }
        Returns: Json
      }
      submit_rating: {
        Args: {
          p_token: string
          p_photo_id: string
          p_fingerprint: string
          p_rating: number
        }
        Returns: Json
      }
    }
  }
}

export type Session = Database['public']['Tables']['mirror_sessions']['Row']
export type Photo = Database['public']['Tables']['mirror_photos']['Row']
