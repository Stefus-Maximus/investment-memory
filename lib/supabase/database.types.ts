// Hand-written to match supabase/migrations/0001_initial_schema.sql.
// Regenerate with `supabase gen types typescript` once the project is linked
// to the Supabase CLI, and keep this file in sync with future migrations.

export type CompanyStatus = 'portfolio' | 'watchlist'
export type MomentType = 'note' | 'source' | 'conviction_change'

export interface Database {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string
          user_id: string
          name: string
          ticker: string
          exchange: string
          logo_url: string | null
          status: CompanyStatus
          conviction: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          ticker: string
          exchange: string
          logo_url?: string | null
          status?: CompanyStatus
          conviction?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          ticker?: string
          exchange?: string
          logo_url?: string | null
          status?: CompanyStatus
          conviction?: number | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      thesis: {
        Row: {
          id: string
          company_id: string
          user_id: string
          thesis_text: string | null
          invalidation_text: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          user_id: string
          thesis_text?: string | null
          invalidation_text?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          user_id?: string
          thesis_text?: string | null
          invalidation_text?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'thesis_company_id_fkey'
            columns: ['company_id']
            isOneToOne: true
            referencedRelation: 'companies'
            referencedColumns: ['id']
          },
        ]
      }
      moments: {
        Row: {
          id: string
          company_id: string
          user_id: string
          type: MomentType
          content: string | null
          price_at_time: number | null
          price_currency: string | null
          source_url: string | null
          source_title: string | null
          conviction_from: number | null
          conviction_to: number | null
          occurred_at: string
          created_at: string
        }
        Insert: {
          id?: string
          company_id: string
          user_id: string
          type: MomentType
          content?: string | null
          price_at_time?: number | null
          price_currency?: string | null
          source_url?: string | null
          source_title?: string | null
          conviction_from?: number | null
          conviction_to?: number | null
          occurred_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          user_id?: string
          type?: MomentType
          content?: string | null
          price_at_time?: number | null
          price_currency?: string | null
          source_url?: string | null
          source_title?: string | null
          conviction_from?: number | null
          conviction_to?: number | null
          occurred_at?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'moments_company_id_fkey'
            columns: ['company_id']
            isOneToOne: false
            referencedRelation: 'companies'
            referencedColumns: ['id']
          },
        ]
      }
      lessons: {
        Row: {
          id: string
          user_id: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          content?: string
          created_at?: string
        }
        Relationships: []
      }
      investment_rules: {
        Row: {
          id: string
          user_id: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          content?: string
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
