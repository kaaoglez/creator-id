'use client'

import { useState } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { createClient } from '@/lib/supabase/client'

export default function ContactPage() {
  const { t } = useLanguage()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  })
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')
  const supabase = createClient()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('sending')

    try {
      const { error } = await supabase
        .from('contact_messages')
        .insert([{
          sender_name: formData.name,
          sender_email: formData.email,
          subject: formData.subject,
          message: formData.message,
          is_read: false
        }])

      if (error) throw error

      setStatus('success')
      setFormData({ name: '', email: '', subject: '', message: '' })
      
      setTimeout(() => setStatus('idle'), 5000)
    } catch (error) {
      console.error('Error sending message:', error)
      setStatus('error')
      setTimeout(() => setStatus('idle'), 5000)
    }
  }

  return (
    <div style={{ 
      maxWidth: "800px", 
      margin: "40px auto", 
      padding: "0 20px",
      fontFamily: "sans-serif" 
    }}>
      
      <h1 style={{ 
        fontSize: "2.5rem", 
        marginBottom: "20px",
        background: "linear-gradient(135deg, #4f46e5, #10b981)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        display: "inline-block"
      }}>
        📧 Contacto
      </h1>
      
      <p style={{ color: '#666', marginBottom: '40px' }}>
        ¿Tienes preguntas, sugerencias o necesitas ayuda? Escríbenos y te responderemos a la brevedad.
      </p>

      <form onSubmit={handleSubmit} style={{
        background: 'white',
        padding: '30px',
        border: '1px solid #eaeaea',
        borderRadius: '8px'
      }}>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            Nombre completo *
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '1rem'
            }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            Email *
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '1rem'
            }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            Asunto *
          </label>
          <select
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            required
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '1rem',
              background: 'white'
            }}
          >
            <option value="">Selecciona un asunto</option>
            <option value="Soporte técnico">Soporte técnico</option>
            <option value="Problema con mi cuenta">Problema con mi cuenta</option>
            <option value="Problema con una obra">Problema con una obra</option>
            <option value="Sugerencia">Sugerencia</option>
            <option value="Otro">Otro</option>
          </select>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            Mensaje *
          </label>
          <textarea
            name="message"
            value={formData.message}
            onChange={handleChange}
            required
            rows={6}
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '1rem',
              resize: 'vertical'
            }}
          />
        </div>

        {status === 'success' && (
          <div style={{
            padding: '12px',
            background: '#e8f5e8',
            color: '#2e7d32',
            borderRadius: '4px',
            marginBottom: '20px'
          }}>
            ✅ ¡Mensaje enviado con éxito! Te responderemos pronto.
          </div>
        )}

        {status === 'error' && (
          <div style={{
            padding: '12px',
            background: '#ffebee',
            color: '#c62828',
            borderRadius: '4px',
            marginBottom: '20px'
          }}>
            ❌ Error al enviar el mensaje. Por favor, inténtalo de nuevo.
          </div>
        )}

        <button
          type="submit"
          disabled={status === 'sending'}
          style={{
            width: '100%',
            padding: '14px',
            background: status === 'sending' ? '#ccc' : 'linear-gradient(135deg, #4f46e5, #10b981)',
            color: 'white',
            border: 'none',
            fontSize: '1.1rem',
            fontWeight: 'bold',
            cursor: status === 'sending' ? 'not-allowed' : 'pointer',
            borderRadius: '4px'
          }}
        >
          {status === 'sending' ? 'Enviando...' : 'Enviar mensaje'}
        </button>
      </form>
    </div>
  )
}