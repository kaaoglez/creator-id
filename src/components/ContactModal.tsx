'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface ContactModalProps {
  creatorId: string
  creatorName: string
  creatorEmail: string
  isOpen: boolean
  onClose: () => void
}

export default function ContactModal({ 
  creatorId, 
  creatorName, 
  creatorEmail, 
  isOpen, 
  onClose 
}: ContactModalProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // 1. Guardar en la base de datos
      const { error: dbError } = await supabase
        .from('contact_messages')
        .insert([{
          creator_id: creatorId,
          sender_name: name,
          sender_email: email,
          message: message
        }])

      if (dbError) throw dbError

      // 2. Intentar enviar email al creador
      try {
        // Esta llamada irá a la Edge Function que crearemos después
        const { error: emailError } = await supabase.functions.invoke('send-contact-email', {
          body: {
            to: creatorEmail,
            fromName: name,
            fromEmail: email,
            message: message,
            creatorName: creatorName
          }
        })

        if (emailError) {
          console.error('Error enviando email:', emailError)
          // No mostramos error al usuario, el mensaje ya se guardó
        }
      } catch (emailError) {
        console.error('Error al invocar la función de email:', emailError)
        // No mostramos error al usuario
      }

      setSuccess(true)
      
      setTimeout(() => {
        setSuccess(false)
        onClose()
        setName('')
        setEmail('')
        setMessage('')
      }, 3000)

    } catch (err: any) {
      setError(err.message || 'Error al enviar el mensaje')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000
    }}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '30px',
        maxWidth: '500px',
        width: '90%',
        maxHeight: '80vh',
        overflow: 'auto',
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '20px',
          borderBottom: '1px solid #eaeaea',
          paddingBottom: '15px'
        }}>
          <h2 style={{ 
            margin: 0, 
            color: '#333',
            fontSize: '1.5rem',
            background: 'linear-gradient(135deg, #4f46e5, #10b981)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Contactar a {creatorName}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: '#666',
              padding: '5px 10px',
              borderRadius: '5px',
              transition: 'background 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = '#f0f0f0'}
            onMouseOut={(e) => e.currentTarget.style.background = 'none'}
          >
            ✕
          </button>
        </div>

        {success ? (
          <div style={{
            padding: '30px',
            background: '#e8f5e8',
            color: '#2e7d32',
            borderRadius: '8px',
            textAlign: 'center',
            border: '1px solid #a5d6a7'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '15px' }}>✅</div>
            <h3 style={{ margin: '0 0 10px 0', color: '#2e7d32' }}>¡Mensaje enviado!</h3>
            <p style={{ margin: 0 }}>
              {creatorName} recibirá tu mensaje por email y te responderá a la brevedad.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && (
              <div style={{
                padding: '12px',
                background: '#ffebee',
                color: '#c62828',
                borderRadius: '8px',
                marginBottom: '20px',
                border: '1px solid #ffcdd2'
              }}>
                <strong>Error:</strong> {error}
              </div>
            )}

            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '5px', 
                fontWeight: 'bold', 
                color: '#333' 
              }}>
                Tu nombre <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Ej: Juan Pérez"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #e0e0e0',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  transition: 'border-color 0.2s',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => e.target.style.borderColor = '#4f46e5'}
                onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '5px', 
                fontWeight: 'bold', 
                color: '#333' 
              }}>
                Tu email <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="ejemplo@email.com"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #e0e0e0',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  transition: 'border-color 0.2s',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => e.target.style.borderColor = '#4f46e5'}
                onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
              />
            </div>

            <div style={{ marginBottom: '25px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '5px', 
                fontWeight: 'bold', 
                color: '#333' 
              }}>
                Mensaje <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                rows={5}
                placeholder="Escribe tu mensaje para el creador..."
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #e0e0e0',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  transition: 'border-color 0.2s',
                  outline: 'none',
                  boxSizing: 'border-box',
                  resize: 'vertical',
                  fontFamily: 'inherit'
                }}
                onFocus={(e) => e.target.style.borderColor = '#4f46e5'}
                onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
              />
            </div>

            <div style={{ 
              display: 'flex', 
              gap: '10px', 
              justifyContent: 'flex-end',
              borderTop: '1px solid #eaeaea',
              paddingTop: '20px'
            }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: '12px 24px',
                  background: 'white',
                  color: '#666',
                  border: '1px solid #ccc',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = '#f0f0f0'
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'white'
                }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: '12px 24px',
                  background: loading ? '#ccc' : 'linear-gradient(135deg, #4f46e5, #10b981)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  opacity: loading ? 0.7 : 1,
                  minWidth: '120px'
                }}
              >
                {loading ? 'Enviando...' : 'Enviar mensaje'}
              </button>
            </div>

            <p style={{
              marginTop: '15px',
              fontSize: '0.85rem',
              color: '#888',
              textAlign: 'center'
            }}>
              Tu email será compartido solo con el creador para que pueda responderte.
            </p>
          </form>
        )}
      </div>
    </div>
  )
}