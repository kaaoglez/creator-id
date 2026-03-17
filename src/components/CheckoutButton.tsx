'use client'

import { useState } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'

interface CheckoutButtonProps {
  workId: number
  workTitle: string
  price: number
  creatorName: string
}

export default function CheckoutButton({ workId, workTitle, price, creatorName }: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [buyerName, setBuyerName] = useState('')
  const [buyerEmail, setBuyerEmail] = useState('')
  const { t } = useLanguage()

  const handleBuyClick = () => {
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workId,
          buyerName,
          buyerEmail,
          successUrl: `${window.location.origin}/work/${workId}?success=true`,
          cancelUrl: `${window.location.origin}/work/${workId}?canceled=true`,
        }),
      })

      const data = await response.json()

      if (data.url) {
        // Redirigir a Stripe Checkout
        window.location.href = data.url
      } else {
        alert('Error al procesar la compra')
        setLoading(false)
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al procesar la compra')
      setLoading(false)
    }
  }

  if (showForm) {
    return (
      <div style={{
        marginTop: '20px',
        padding: '20px',
        background: 'white',
        border: '1px solid #eaeaea'
      }}>
        <h4 style={{ marginTop: 0, marginBottom: '15px' }}>
          {t.work?.checkoutInfo || 'Completa tus datos para continuar'}
        </h4>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              {t.work?.name || 'Nombre completo'} *
            </label>
            <input
              type="text"
              value={buyerName}
              onChange={(e) => setBuyerName(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ccc',
                fontSize: '1rem'
              }}
            />
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              {t.auth?.email || 'Email'} *
            </label>
            <input
              type="email"
              value={buyerEmail}
              onChange={(e) => setBuyerEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ccc',
                fontSize: '1rem'
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              style={{
                flex: 1,
                padding: '12px',
                background: 'white',
                color: '#666',
                border: '1px solid #ccc',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              {t.profile?.cancel || 'Cancelar'}
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 1,
                padding: '12px',
                background: loading ? '#ccc' : 'linear-gradient(135deg, #4f46e5, #10b981)',
                color: 'white',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontWeight: 'bold'
              }}
            >
              {loading ? (t.search?.searching || 'Procesando...') : (t.work?.confirm || 'Confirmar compra')}
            </button>
          </div>
        </form>
      </div>
    )
  }

  return (
    <button
      onClick={handleBuyClick}
      style={{
        padding: '15px 40px',
        background: 'linear-gradient(135deg, #4f46e5, #10b981)',
        color: 'white',
        border: 'none',
        fontSize: '1.2rem',
        fontWeight: 'bold',
        cursor: 'pointer'
      }}
    >
      {t.work?.buy || 'Comprar por'} ${price}
    </button>
  )
}