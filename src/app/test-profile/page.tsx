'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function TestProfile() {
  const [user, setUser] = useState<any>(null)
  const [creators, setCreators] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    // 1. Obtener usuario actual
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)

    // 2. Obtener TODOS los creadores
    const { data, error } = await supabase
      .from('creators')
      .select('*')
    
    console.log('Todos los creadores:', data)
    console.log('Error:', error)
    setCreators(data || [])
    setLoading(false)
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>🔧 Diagnóstico</h1>
      
      <div style={{ background: '#f0f0f0', padding: '15px', marginBottom: '20px' }}>
        <h3>Usuario actual:</h3>
        <pre>{JSON.stringify(user, null, 2)}</pre>
      </div>

      <div style={{ background: '#f0f0f0', padding: '15px' }}>
        <h3>Creadores en BD ({creators.length}):</h3>
        <pre>{JSON.stringify(creators, null, 2)}</pre>
      </div>
    </div>
  )
}