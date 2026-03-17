'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'

export function OAuthButtons() {
  const [loading, setLoading] = useState<string | null>(null)
  const supabase = createClient()

  const handleOAuthSignIn = async (provider: 'google' | 'github') => {
    try {
      setLoading(provider)
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) throw error
    } catch (error) {
      console.error(`Error con ${provider}:`, error)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <button
        onClick={() => handleOAuthSignIn('google')}
        disabled={loading !== null}
        style={{
          padding: '12px',
          background: 'white',
          color: '#333',
          border: '1px solid #ddd',
          borderRadius: '8px',
          cursor: loading ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          fontWeight: 'bold',
          width: '100%'
        }}
      >
        {loading === 'google' ? 'Conectando...' : 'Continuar con Google'}
      </button>
      
      <button
        onClick={() => handleOAuthSignIn('github')}
        disabled={loading !== null}
        style={{
          padding: '12px',
          background: '#24292e',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: loading ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          fontWeight: 'bold',
          width: '100%'
        }}
      >
        {loading === 'github' ? 'Conectando...' : 'Continuar con GitHub'}
      </button>
    </div>
  )
}