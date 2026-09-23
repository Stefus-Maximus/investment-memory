import type { SupabaseClient } from '@supabase/supabase-js'

import type { Database } from '@/lib/supabase/database.types'

export interface Lesson {
  id: string
  content: string
  createdAt: string
}

export async function getLessons(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<Lesson[]> {
  const { data, error } = await supabase
    .from('lessons')
    .select('id, content, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error

  return (data ?? []).map((row) => ({
    id: row.id,
    content: row.content,
    createdAt: row.created_at,
  }))
}

export async function getLessonsCount(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<number> {
  const { count, error } = await supabase
    .from('lessons')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)

  if (error) throw error
  return count ?? 0
}
