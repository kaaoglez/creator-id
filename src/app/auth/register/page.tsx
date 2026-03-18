'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useLanguage } from '@/contexts/LanguageContext'

declare global {
  interface Window {
    google?: any;
  }
}

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const { t } = useLanguage()

  // Inicializar Google One Tap (opcional, si quieres también en registro)
  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    
    script.onload = () => {
      window.google?.accounts.id.initialize({
        client_id: '220485474651-6ilivjedvlvqnr1abehq5dnmutcu0q9s.apps.googleusercontent.com',
        callback: handleGoogleCredential,
        auto_select: false, // No auto-select en registro
        cancel_on_tap_outside: false,
        context: 'signup', // Contexto de registro
        use_fedcm_for_prompt: true,
      })
    }
    
    document.body.appendChild(script)

    return () => {
      document.body.removeChild(script)
    }
  }, [])

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (password !== confirmPassword) {
      setError(t.auth?.passwordError || 'Las contraseñas no coinciden')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError(t.auth?.passwordLength || 'La contraseña debe tener al menos 6 caracteres')
      setLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) throw error

      setSuccess(true)
    } catch (error: any) {
      setError(error.message || (t.errors?.genericError || 'Error al registrarse'))
    } finally {
      setLoading(false)
    }
  }

  // Callback de Google One Tap
  const handleGoogleCredential = async (response: any) => {
    try {
      setLoading(true)
      
      const { error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: response.credential,
      })

      if (error) throw error

      router.push('/profile')
      router.refresh()
    } catch (error: any) {
      console.error('❌ Error en Google One Tap:', error)
      setError(error.message || 'Error al registrarse con Google')
      setLoading(false)
    }
  }

  // Función para login con Google (One Tap con fallback)
  const handleGoogleLogin = () => {
    try {
      window.google?.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          console.log('⚠️ One Tap no disponible, usando método tradicional')
          handleGoogleLoginTraditional()
        }
      })
    } catch (error) {
      console.log('⚠️ Error en One Tap, usando método tradicional')
      handleGoogleLoginTraditional()
    }
  }

  // Método tradicional de Google (redirección)
  const handleGoogleLoginTraditional = async () => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) throw error
    } catch (error: any) {
      setError(error.message || 'Error al conectar con Google')
      setLoading(false)
    }
  }

  // Función para login con Facebook
  const handleFacebookLogin = async () => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'facebook',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) throw error
    } catch (error: any) {
      setError(error.message || 'Error al conectar con Facebook')
      setLoading(false)
    }
  }

  // Función para login con Apple
  const handleAppleLogin = async () => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) throw error
    } catch (error: any) {
      setError(error.message || 'Error al conectar con Apple')
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        background: '#f5f5f5'
      }}>
        <div style={{
          maxWidth: '400px',
          width: '100%',
          background: 'white',
          padding: '40px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            background: 'linear-gradient(135deg, #4f46e5, #10b981)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 15px',
            color: 'white',
            fontSize: '30px'
          }}>
            ✅
          </div>
          <h1 style={{ color: '#2e7d32', marginBottom: '20px' }}>
            {t.auth?.successRegister || '¡Registro exitoso!'}
          </h1>
          <p style={{ marginBottom: '20px' }}>
            {t.auth?.checkEmail?.replace('{email}', email) || `Te hemos enviado un email de confirmación a ${email}.`}
          </p>
          <Link
            href="/auth/login"
            style={{
              display: 'inline-block',
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #4f46e5, #10b981)',
              color: 'white',
              textDecoration: 'none',
              fontWeight: 'bold'
            }}
          >
            {t.auth?.goToLogin || 'Ir a iniciar sesión'}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      background: '#f5f5f5'
    }}>
      <div style={{
        maxWidth: '400px',
        width: '100%',
        background: 'white',
        padding: '40px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
      }}>
        
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{
            width: '60px',
            height: '60px',
            background: 'linear-gradient(135deg, #4f46e5, #10b981)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 15px',
            color: 'white',
            fontSize: '30px'
          }}>
            🆔
          </div>
          <h1 style={{ 
            fontSize: '1.8rem', 
            margin: 0,
            color: '#333'
          }}>
            {t.auth?.createAccount || 'Create your account'}
          </h1>
          <p style={{ color: '#666', marginTop: '8px' }}>
            {t.auth?.signUp || 'Sign up to get started'}
          </p>
        </div>

        {/* Botones de redes sociales - Solo Google */}
<div style={{ 
  display: 'flex', 
  justifyContent: 'center', 
  marginBottom: '30px' 
}}>
  {/* Google - Botón más grande y visible */}
  <button
    onClick={handleGoogleLogin}
    disabled={loading}
    style={{
      width: '100%',
      maxWidth: '300px',
      padding: '12px',
      background: 'white',
      border: '1px solid #ddd',
      borderRadius: '8px',
      cursor: loading ? 'not-allowed' : 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '10px',
      opacity: loading ? 0.6 : 1,
      transition: 'all 0.2s',
      boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
      fontSize: '1rem',
      fontWeight: '500'
    }}
    onMouseOver={(e) => !loading && (e.currentTarget.style.transform = 'scale(1.02)')}
    onMouseOut={(e) => !loading && (e.currentTarget.style.transform = 'scale(1)')}
  >
    <svg width="20" height="20" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
    Continue with Google
  </button>
</div>
        {/* Separador */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '10px',
          marginBottom: '25px',
          color: '#999'
        }}>
          <hr style={{ flex: 1, border: 'none', borderTop: '1px solid #ddd' }} />
          <span style={{ fontSize: '0.9rem' }}>OR</span>
          <hr style={{ flex: 1, border: 'none', borderTop: '1px solid #ddd' }} />
        </div>

        {/* Formulario de registro */}
        <form onSubmit={handleRegister}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#333' }}>
              {t.auth?.email || 'Email'}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="your@email.com"
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                fontSize: '1rem',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#333' }}>
              {t.auth?.password || 'Password'}
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
                minLength={6}
                style={{
                  width: '100%',
                  padding: '12px',
                  paddingRight: '50px',
                  border: '1px solid #ddd',
                  fontSize: '1rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '1.2rem',
                  padding: '8px 5px'
                }}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#333' }}>
              {t.auth?.confirmPassword || 'Confirm Password'}
            </label>
            <div style={{ 
              position: 'relative',
              display: 'flex',
              alignItems: 'center'
            }}>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                style={{
                  width: '100%',
                  padding: '12px',
                  paddingRight: '50px',
                  border: '1px solid #ddd',
                  fontSize: '1rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '1.2rem',
                  padding: '8px 5px'
                }}
              >
                {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              background: loading ? '#ccc' : '#4f46e5',
              color: 'white',
              border: 'none',
              fontSize: '1rem',
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer',
              marginBottom: '20px'
            }}
          >
            {loading ? (t.search?.searching || 'Creating account...') : (t.auth?.register || 'Sign up')}
          </button>
        </form>

        {/* Link a login */}
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#666' }}>
            {t.auth?.haveAccount || 'Already have an account?'}{' '}
            <Link href="/auth/login" style={{ color: '#4f46e5', fontWeight: 'bold' }}>
              {t.auth?.signIn || 'Sign in'}
            </Link>
          </p>
        </div>

        {/* Mensaje de error */}
        {error && (
          <div style={{
            marginTop: '20px',
            padding: '12px',
            background: '#ffebee',
            color: '#c62828',
            border: '1px solid #ffcdd2'
          }}>
            {error}
          </div>
        )}
      </div>
    </div>
  )
}