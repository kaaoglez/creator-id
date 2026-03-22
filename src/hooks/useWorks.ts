'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export function useWorks(creatorId?: string, limit?: number) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['works', creatorId, limit],
    queryFn: async () => {
      let query = supabase
        .from('works')
        .select('*')
        .order('created_at', { ascending: false })

      if (creatorId) {
        query = query.eq('creator_id', creatorId)
      }

      if (limit) {
        query = query.limit(limit)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching works:', error)
        throw error
      }

      return data || []
    },
    staleTime: 5 * 60 * 1000,
  })
}