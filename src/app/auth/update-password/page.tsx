'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setIsAuthenticated(true)
      } else {
        router.push('/auth/login')
      }
    }
    checkAuth()
  }, [router, supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      setLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) throw error
      setSuccess(true)
      
      setTimeout(() => {
        router.push('/auth/login')
      }, 3000)
    } catch (error: any) {
      setError(error.message || 'Error al actualizar la contraseña')
    } finally {
      setLoading(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <div style={{ maxWidth: '500px', margin: '40px auto', textAlign: 'center' }}>
        <p>Verificando sesión...</p>
      </div>
    )
  }

  if (success) {
    return (
      <div style={{ maxWidth: '500px', margin: '40px auto', padding: '0 20px', textAlign: 'center' }}>
        <div style={{
          background: '#e8f5e8',
          border: '2px solid #4caf50',
          borderRadius: '0',
          padding: '30px'
        }}>
          <h2 style={{ color: '#2e7d32', marginBottom: '15px' }}>✅ Contraseña actualizada</h2>
          <p style={{ marginBottom: '20px' }}>
            Tu contraseña ha sido cambiada exitosamente.
            Serás redirigido al login en unos segundos.
          </p>
          <Link
            href="/auth/login"
            style={{
              display: 'inline-block',
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #4f46e5, #10b981)',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '0',
              fontWeight: 'bold'
            }}
          >
            Ir a iniciar sesión ahora
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
        Establecer nueva contraseña
      </h1>

      {error && (
        <div style={{
          padding: '12px',
          background: '#ffebee',
          color: '#c62828',
          borderRadius: '0',
          marginBottom: '15px'
        }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{
        background: 'white',
        padding: '30px',
        borderRadius: '0',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}>
        {/* Campo Nueva Contraseña */}
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Nueva contraseña
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
                borderRadius: '0',
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

        {/* Campo Confirmar Contraseña */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Confirmar nueva contraseña
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
                borderRadius: '0',
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
                transition: 'transform 0.2s',
                transform: showConfirmPassword ? 'scale(1.1)' : 'scale(1)'
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.2)'}
              onMouseOut={(e) => e.currentTarget.style.transform = showConfirmPassword ? 'scale(1.1)' : 'scale(1)'}
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
            borderRadius: '0',
            fontSize: '1rem',
            fontWeight: 'bold',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'transform 0.2s'
          }}
          onMouseOver={(e) => !loading && (e.currentTarget.style.transform = 'scale(1.02)')}
          onMouseOut={(e) => !loading && (e.currentTarget.style.transform = 'scale(1)')}
        >
          {loading ? 'Actualizando...' : 'Actualizar contraseña'}
        </button>
      </form>
    </div>
  )
}