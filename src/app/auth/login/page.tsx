'use client'

import { useState, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { OAuthButtons } from '@/components/Auth/OAuthButtons'
import { useLanguage } from '@/contexts/LanguageContext'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()
  const { t } = useLanguage()

  const handleLogin = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      router.push('/profile')
      router.refresh()
    } catch (error: any) {
      setError(error.message || (t.auth?.loginError || t.errors?.genericError || 'Error al iniciar sesión'))
    } finally {
      setLoading(false)
    }
  }, [email, password, router, supabase, t.auth?.loginError])

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword(prev => !prev)
  }, [])

  // Memoizar textos para evitar re-renders innecesarios
  const texts = useMemo(() => ({
    title: t.auth?.login || 'Iniciar Sesión',
    orContinueWith: t.auth?.orContinueWith || 'o continúa con email',
    email: t.auth?.email || 'Email',
    password: t.auth?.password || 'Contraseña',
    forgotPassword: t.auth?.forgotPassword || '¿Olvidaste tu contraseña?',
    loginButton: loading ? (t.search?.searching || 'Iniciando sesión...') : (t.auth?.login || 'Iniciar Sesión'),
    needAccount: t.auth?.needAccount || '¿No tienes cuenta?',
    signUp: t.auth?.signUp || 'Regístrate'
  }), [t, loading])

  return (
    <div style={{ maxWidth: '500px', margin: '40px auto', padding: '0 20px' }}>
      <h1 style={{ 
        fontSize: '2rem', 
        marginBottom: '30px',
        textAlign: 'center',
        background: 'linear-gradient(135deg, #4f46e5, #10b981)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent'
      }}>
        {texts.title}
      </h1>

      <div style={{ marginBottom: '30px' }}>
        <OAuthButtons />
      </div>

      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '10px',
        marginBottom: '30px',
        color: '#999'
      }}>
        <hr style={{ flex: 1, border: 'none', borderTop: '1px solid #ddd' }} />
        <span>{texts.orContinueWith}</span>
        <hr style={{ flex: 1, border: 'none', borderTop: '1px solid #ddd' }} />
      </div>

      {error && (
        <div style={{
          padding: '12px',
          background: '#ffebee',
          color: '#c62828',
          marginBottom: '15px'
        }}>
          {error}
        </div>
      )}

      <form onSubmit={handleLogin}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            {texts.email}
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
              fontSize: '1rem',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            {texts.password}
          </label>
          <div style={{ 
            position: 'relative',
            display: 'flex',
            alignItems: 'center'
          }}>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px',
                paddingRight: '50px',
                border: '2px solid #e0e0e0',
                fontSize: '1rem',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
            <button
              type="button"
              onClick={togglePasswordVisibility}
              style={{
                position: 'absolute',
                right: '10px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '1.3rem',
                padding: '8px 5px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'transform 0.2s',
                transform: showPassword ? 'scale(1.1)' : 'scale(1)'
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.2)'}
              onMouseOut={(e) => e.currentTarget.style.transform = showPassword ? 'scale(1.1)' : 'scale(1)'}
            >
              {showPassword ? '🔓' : '🔒'}
            </button>
          </div>
        </div>

        <div style={{ textAlign: 'right', marginBottom: '20px' }}>
          <Link href="/auth/forgot-password" style={{ color: '#4f46e5', fontSize: '0.9rem' }}>
            {texts.forgotPassword}
          </Link>
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '14px',
            background: loading ? '#ccc' : 'linear-gradient(135deg, #4f46e5, #10b981)',
            color: 'white',
            border: 'none',
            fontSize: '1rem',
            fontWeight: 'bold',
            cursor: loading ? 'not-allowed' : 'pointer',
            marginBottom: '20px',
            transition: 'transform 0.2s'
          }}
          onMouseOver={(e) => !loading && (e.currentTarget.style.transform = 'scale(1.02)')}
          onMouseOut={(e) => !loading && (e.currentTarget.style.transform = 'scale(1)')}
        >
          {texts.loginButton}
        </button>
      </form>

      <div style={{ textAlign: 'center' }}>
        <p>
          {texts.needAccount}{' '}
          <Link href="/auth/register" style={{ color: '#4f46e5', fontWeight: 'bold' }}>
            {texts.signUp}
          </Link>
        </p>
      </div>
    </div>
  )
}