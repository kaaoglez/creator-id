'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export function useWorkDetails(workId: string | null) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['work', workId],
    queryFn: async () => {
      if (!workId) return null

      // Obtener obra
      const { data: work, error: workError } = await supabase
        .from('works')
        .select('*')
        .eq('id', workId)
        .single()

      if (workError) throw workError

      // Obtener creador
      const { data: creator, error: creatorError } = await supabase
        .from('creators')
        .select('full_first_name, full_last_name, creator_id, country_name, email, avatar_url')
        .eq('creator_id', work.creator_id)
        .single()

      if (creatorError && creatorError.code !== 'PGRST116') {
        console.error('Error fetching creator:', creatorError)
      }

      return { ...work, creator }
    },
    enabled: !!workId,
    staleTime: 5 * 60 * 1000,
  })
}