'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      // Verificar si necesita MFA
      const { data: mfaData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
      
      if (mfaData?.nextLevel === 'aal2' && mfaData?.currentLevel !== mfaData?.nextLevel) {
        router.push('/auth/mfa')
      } else {
        router.push('/profile')
        router.refresh()
      }
    } catch (error: any) {
      setError(error.message || 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  const handleMagicLink = async () => {
    if (!email) {
      setError('Ingresa tu email primero')
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) throw error

      setSuccess('¡Revisa tu email! Te enviamos un enlace mágico.')
    } catch (error: any) {
      setError(error.message || 'Error al enviar el enlace')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: '400px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '20px' }}>Iniciar Sesión</h2>

      {error && (
        <div style={{
          padding: '12px',
          background: '#ffebee',
          color: '#c62828',
          borderRadius: '8px',
          marginBottom: '15px'
        }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{
          padding: '12px',
          background: '#e8f5e8',
          color: '#2e7d32',
          borderRadius: '8px',
          marginBottom: '15px'
        }}>
          {success}
        </div>
      )}

      <form onSubmit={handleLogin}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '12px',
              border: '2px solid #e0e0e0',
              borderRadius: '8px',
              fontSize: '1rem'
            }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Contraseña
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '12px',
              border: '2px solid #e0e0e0',
              borderRadius: '8px',
              fontSize: '1rem'
            }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '14px',
            background: 'linear-gradient(135deg, #4f46e5, #10b981)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '1rem',
            fontWeight: 'bold',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
            marginBottom: '10px'
          }}
        >
          {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
        </button>
      </form>

      <button
        onClick={handleMagicLink}
        disabled={loading}
        style={{
          width: '100%',
          padding: '12px',
          background: 'white',
          color: '#4f46e5',
          border: '2px solid #4f46e5',
          borderRadius: '8px',
          fontSize: '0.95rem',
          fontWeight: 'bold',
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.7 : 1,
          marginBottom: '20px'
        }}
      >
        Enviar enlace mágico (sin contraseña)
      </button>

      <div style={{ marginTop: '20px', textAlign: 'center' }}>
        <p>
          ¿No tienes cuenta?{' '}
          <Link href="/auth/register" style={{ color: '#4f46e5', fontWeight: 'bold' }}>
            Regístrate
          </Link>
        </p>
      </div>
    </div>
  )
}