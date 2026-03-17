'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  setLoading(true)
  setError(null)

  try {
    // Versión SIMPLIFICADA - sin redirect_to anidado
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'http://localhost:3000/auth/update-password', // DIRECTAMENTE a update-password
    })

    if (error) throw error
    setSuccess(true)
  } catch (error: any) {
    console.error("Error detallado:", error) // Para ver más detalles
    setError(error.message || 'Error al enviar el email de recuperación')
  } finally {
    setLoading(false)
  }
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
        Recuperar contraseña
      </h1>

      {success ? (
        <div style={{
          background: '#e8f5e8',
          border: '2px solid #4caf50',
          borderRadius: '0',
          padding: '30px',
          textAlign: 'center'
        }}>
          <h2 style={{ color: '#2e7d32', marginBottom: '15px' }}>✅ Email enviado</h2>
          <p style={{ marginBottom: '20px' }}>
            Hemos enviado un enlace de recuperación a <strong>{email}</strong>.
            Revisa tu bandeja de entrada y sigue las instrucciones.
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
            Volver a iniciar sesión
          </Link>
        </div>
      ) : (
        <>
          <p style={{ textAlign: 'center', marginBottom: '30px', color: '#666' }}>
            Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña.
          </p>

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
            <div style={{ marginBottom: '20px' }}>
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
                  borderRadius: '0',
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
                background: loading ? '#ccc' : 'linear-gradient(135deg, #4f46e5, #10b981)',
                color: 'white',
                border: 'none',
                borderRadius: '0',
                fontSize: '1rem',
                fontWeight: 'bold',
                cursor: loading ? 'not-allowed' : 'pointer',
                marginBottom: '15px'
              }}
            >
              {loading ? 'Enviando...' : 'Enviar enlace de recuperación'}
            </button>

            <div style={{ textAlign: 'center' }}>
              <Link href="/auth/login" style={{ color: '#4f46e5' }}>
                Volver a iniciar sesión
              </Link>
            </div>
          </form>
        </>
      )}
    </div>
  )
}