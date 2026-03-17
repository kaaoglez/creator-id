'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export function MFAEnroll() {
  const [phoneNumber, setPhoneNumber] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [factorId, setFactorId] = useState('')
  const [challengeId, setChallengeId] = useState('')
  const [step, setStep] = useState<'phone' | 'verify'>('phone')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const enrollPhone = async () => {
    setLoading(true)
    setError(null)

    try {
      // Validar formato de teléfono (debe ser E.164, ej: +521234567890)
      if (!phoneNumber.startsWith('+')) {
        throw new Error('El número debe incluir código de país, ej: +521234567890')
      }

      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'phone',
        phone: phoneNumber,  // ✅ correcto
    })

      if (error) throw error

      setFactorId(data.id)
      
      const challenge = await supabase.auth.mfa.challenge({
        factorId: data.id,
      })

      if (challenge.error) throw challenge.error

      setChallengeId(challenge.data.id)
      setStep('verify')
    } catch (error: any) {
      setError(error.message || 'Error al configurar 2FA')
    } finally {
      setLoading(false)
    }
  }

  const verifyPhone = async () => {
    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.mfa.verify({
        factorId,
        challengeId,
        code: verificationCode,
      })

      if (error) throw error

      alert('✅ 2FA activado correctamente')
      router.refresh()
    } catch (error: any) {
      setError(error.message || 'Código inválido')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: '400px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '20px' }}>🔐 Configurar Autenticación de Dos Factores</h2>

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

      {step === 'phone' ? (
        <div>
          <p style={{ marginBottom: '15px', color: '#666' }}>
            Ingresa tu número de teléfono para recibir códigos de verificación SMS.
          </p>
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="+521234567890"
            style={{
              width: '100%',
              padding: '12px',
              border: '2px solid #e0e0e0',
              borderRadius: '8px',
              fontSize: '1rem',
              marginBottom: '15px'
            }}
          />
          <button
            onClick={enrollPhone}
            disabled={loading || !phoneNumber}
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
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Enviando...' : 'Enviar código de verificación'}
          </button>
        </div>
      ) : (
        <div>
          <p style={{ marginBottom: '15px', color: '#666' }}>
            Ingresa el código que recibiste por SMS.
          </p>
          <input
            type="text"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
            placeholder="123456"
            maxLength={6}
            style={{
              width: '100%',
              padding: '12px',
              border: '2px solid #e0e0e0',
              borderRadius: '8px',
              fontSize: '1rem',
              marginBottom: '15px'
            }}
          />
          <button
            onClick={verifyPhone}
            disabled={loading || !verificationCode}
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
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Verificando...' : 'Verificar código'}
          </button>
        </div>
      )}
    </div>
  )
}