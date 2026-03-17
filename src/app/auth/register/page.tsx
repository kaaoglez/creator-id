'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { OAuthButtons } from '@/components/Auth/OAuthButtons'
import { useLanguage } from '@/contexts/LanguageContext'

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

  if (success) {
    return (
      <div style={{ maxWidth: '500px', margin: '40px auto', padding: '0 20px', textAlign: 'center' }}>
        <div style={{
          background: '#e8f5e8',
          border: '2px solid #4caf50',
          padding: '30px'
        }}>
          <h1 style={{ color: '#2e7d32', marginBottom: '20px' }}>✅ {t.auth?.successRegister || '¡Registro exitoso!'}</h1>
          <p style={{ marginBottom: '20px' }}>
            {t.auth?.checkEmail?.replace('{email}', email) || `Te hemos enviado un email de confirmación a ${email}. Revisa tu bandeja de entrada.`}
          </p>
          <p style={{ marginBottom: '20px', fontWeight: 'bold', fontSize: '1.1rem' }}>
            ¡Ahora completa tu perfil de creador!
          </p>
          <Link
            href="/register"
            style={{
              display: 'inline-block',
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #4f46e5, #10b981)',
              color: 'white',
              textDecoration: 'none',
              fontWeight: 'bold',
              fontSize: '1.1rem'
            }}
          >
            Crear mi Creator ID
          </Link>
        </div>
      </div>
    )
  }

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
        {t.auth?.createAccount || 'Crear tu cuenta'}
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
        <span>{t.auth?.orRegisterWith || 'o regístrate con email'}</span>
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

      <form onSubmit={handleRegister}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            {t.auth?.email || 'Email'}
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
            {t.auth?.password || 'Contraseña'}
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
                border: '2px solid #e0e0e0',
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
                fontSize: '1.3rem',
                padding: '8px 5px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {showPassword ? '🔓' : '🔒'}
            </button>
          </div>
          <small style={{ color: '#666', display: 'block', marginTop: '5px' }}>
            {t.auth?.passwordLength || 'Mínimo 6 caracteres'}
          </small>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            {t.auth?.confirmPassword || 'Confirmar Contraseña'}
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
                border: '2px solid #e0e0e0',
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
                fontSize: '1.3rem',
                padding: '8px 5px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {showConfirmPassword ? '🔓' : '🔒'}
            </button>
          </div>
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
          {loading ? (t.search?.searching || 'Registrando...') : (t.auth?.register || 'Registrarse')}
        </button>
      </form>

      <div style={{ textAlign: 'center' }}>
        <p>
          {t.auth?.haveAccount || '¿Ya tienes cuenta?'}{' '}
          <Link href="/auth/login" style={{ color: '#4f46e5', fontWeight: 'bold' }}>
            {t.auth?.signIn || 'Inicia sesión'}
          </Link>
        </p>
      </div>
    </div>
  )
}