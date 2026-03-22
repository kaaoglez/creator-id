'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/providers/AuthProvider'
import { useLanguage } from '@/contexts/LanguageContext'

export default function PurchaseModal({ work, onClose, onSuccess, creatorName }: any) {
  const { user } = useAuth()
  const { t } = useLanguage()
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')
  const [config, setConfig] = useState<any>(null)
  const [isFirstSale, setIsFirstSale] = useState(true)
  const [selectedMethod, setSelectedMethod] = useState('card')

  useEffect(() => {
    loadConfig()
    checkIfFirstSale()
  }, [])

  const loadConfig = async () => {
    const { data } = await supabase
      .from('platform_config')
      .select('*')
    const configObj: any = {}
    data?.forEach((c: any) => { configObj[c.key] = c.value })
    setConfig(configObj)
  }

  const checkIfFirstSale = async () => {
    const { count } = await supabase
      .from('sales')
      .select('*', { count: 'exact', head: true })
      .eq('work_id', work.id)
    setIsFirstSale(count === 0)
  }

  const handlePurchase = async () => {
    if (!user) {
      alert(t.auth?.loginRequired || 'Inicia sesión para comprar')
      return
    }

    setProcessing(true)
    setError('')
    
    try {
      const response = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workId: work.id,
          workTitle: work.title,
          price: work.price,
          creatorId: work.creator_id,
          creatorName: creatorName,
          paymentMethod: selectedMethod
        })
      })

      const data = await response.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error(data.error || 'Error al crear sesión de pago')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setProcessing(false)
    }
  }

  const paymentMethods = [
    { id: 'card', name: 'Tarjeta de crédito', icon: '💳', description: 'Visa, Mastercard, American Express' },
    { id: 'paypal', name: 'PayPal', icon: '🅿️', description: 'Pago con tu cuenta PayPal' },
    { id: 'mercadopago', name: 'Mercado Pago', icon: '🟡', description: 'Mercado Pago' },
    { id: 'usdc', name: 'Criptomonedas', icon: '💎', description: 'USDC, Bitcoin, Ethereum' },
  ]

  if (!config) return null

  return (
    <div style={overlayStyles}>
      <div style={modalStyles}>
        {/* Header */}
        <div style={headerStyles}>
          <h2 style={titleStyles}>{t.purchase?.title || 'Comprar obra'}</h2>
          <button onClick={onClose} style={closeButtonStyles}>✕</button>
        </div>

        {/* Contenido */}
        <div style={contentStyles}>
          {/* Info de la obra */}
          <div style={workInfoStyles}>
            <h3 style={workTitleStyles}>{work.title}</h3>
            <div style={priceStyles}>
              <span style={priceLabelStyles}>{t.purchase?.price || 'Precio'}</span>
              <span style={priceValueStyles}>${work.price}</span>
            </div>
          </div>

          {/* Distribución de regalías */}
          <div style={royaltyBoxStyles}>
            <p style={royaltyTitleStyles}>{t.purchase?.distribution || '💰 Distribución del pago'}</p>
            <div style={royaltyListStyles}>
              <div style={royaltyItemStyles}>
                <span style={royaltyPercentStyles}>{config.initial_sale_creator || 90}%</span>
                <span>{t.purchase?.creator || 'Creador'}</span>
                <span style={royaltyAmountStyles}>${(work.price * (config.initial_sale_creator || 90) / 100).toFixed(2)}</span>
              </div>
              <div style={royaltyItemStyles}>
                <span style={royaltyPercentStyles}>{config.initial_sale_platform || 10}%</span>
                <span>{t.purchase?.platform || 'Plataforma'}</span>
                <span style={royaltyAmountStyles}>${(work.price * (config.initial_sale_platform || 10) / 100).toFixed(2)}</span>
              </div>
            </div>
            <p style={royaltyNoteStyles}>
              💡 {t.purchase?.firstSaleInfo || 'El creador recibe el 90% de esta venta. En reventas futuras, seguirá ganando el 20% de cada transacción.'}
            </p>
          </div>

          {/* Métodos de pago */}
          <div style={paymentSectionStyles}>
            <p style={paymentTitleStyles}>{t.purchase?.paymentMethod || 'Método de pago'}</p>
            <div style={paymentGridStyles}>
              {paymentMethods.map((method) => (
                <button
                  key={method.id}
                  onClick={() => setSelectedMethod(method.id)}
                  style={{
                    ...paymentButtonStyles,
                    background: selectedMethod === method.id ? '#f3f4f6' : 'white',
                    borderColor: selectedMethod === method.id ? '#4f46e5' : '#e5e7eb',
                  }}
                >
                  <span style={paymentIconStyles}>{method.icon}</span>
                  <div style={paymentInfoStyles}>
                    <div style={paymentNameStyles}>{method.name}</div>
                    <div style={paymentDescStyles}>{method.description}</div>
                  </div>
                  {selectedMethod === method.id && <span style={checkStyles}>✓</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && <div style={errorStyles}>{error}</div>}

          {/* Botones de acción */}
          <div style={actionStyles}>
            <button
              onClick={handlePurchase}
              disabled={processing}
              style={{
                ...confirmButtonStyles,
                background: processing ? '#9ca3af' : '#4f46e5',
                cursor: processing ? 'not-allowed' : 'pointer'
              }}
            >
              {processing ? (t.purchase?.processing || 'Procesando...') : `${t.purchase?.confirm || 'Confirmar compra'} $${work.price}`}
            </button>
            <button
              onClick={onClose}
              style={cancelButtonStyles}
            >
              {t.purchase?.cancel || 'Cancelar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Estilos
const overlayStyles: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'rgba(0,0,0,0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
}

const modalStyles: React.CSSProperties = {
  background: 'white',
  maxWidth: '520px',
  width: '90%',
  maxHeight: '90vh',
  overflowY: 'auto',
  boxShadow: '0 20px 35px -10px rgba(0,0,0,0.2)',
}

const headerStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '20px 24px',
  borderBottom: '1px solid #f0f0f0',
}

const titleStyles: React.CSSProperties = {
  fontSize: '1.25rem',
  fontWeight: 600,
  margin: 0,
  color: '#111827',
}

const closeButtonStyles: React.CSSProperties = {
  background: 'none',
  border: 'none',
  fontSize: '1.25rem',
  cursor: 'pointer',
  color: '#9ca3af',
  padding: '4px 8px',
}

const contentStyles: React.CSSProperties = {
  padding: '24px',
}

const workInfoStyles: React.CSSProperties = {
  marginBottom: '24px',
  paddingBottom: '16px',
  borderBottom: '1px solid #f0f0f0',
}

const workTitleStyles: React.CSSProperties = {
  fontSize: '1.1rem',
  fontWeight: 500,
  margin: '0 0 8px 0',
  color: '#111827',
}

const priceStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'baseline',
}

const priceLabelStyles: React.CSSProperties = {
  color: '#6b7280',
  fontSize: '0.85rem',
}

const priceValueStyles: React.CSSProperties = {
  fontSize: '1.5rem',
  fontWeight: 700,
  color: '#4f46e5',
}

const royaltyBoxStyles: React.CSSProperties = {
  background: '#f8fafc',
  padding: '16px',
  marginBottom: '24px',
  borderRadius: '0',
}

const royaltyTitleStyles: React.CSSProperties = {
  fontSize: '0.85rem',
  fontWeight: 600,
  margin: '0 0 12px 0',
  color: '#1f2937',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
}

const royaltyListStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  marginBottom: '12px',
}

const royaltyItemStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: '0.9rem',
  color: '#374151',
}

const royaltyPercentStyles: React.CSSProperties = {
  fontWeight: 600,
  width: '40px',
}

const royaltyAmountStyles: React.CSSProperties = {
  fontWeight: 500,
  color: '#4f46e5',
}

const royaltyNoteStyles: React.CSSProperties = {
  fontSize: '0.75rem',
  color: '#6b7280',
  margin: '8px 0 0 0',
  paddingTop: '8px',
  borderTop: '1px solid #e2e8f0',
}

const paymentSectionStyles: React.CSSProperties = {
  marginBottom: '24px',
}

const paymentTitleStyles: React.CSSProperties = {
  fontSize: '0.85rem',
  fontWeight: 600,
  margin: '0 0 12px 0',
  color: '#374151',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
}

const paymentGridStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
}

const paymentButtonStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '12px 16px',
  border: '1px solid #e5e7eb',
  background: 'white',
  cursor: 'pointer',
  transition: 'all 0.2s',
  textAlign: 'left',
  width: '100%',
}

const paymentIconStyles: React.CSSProperties = {
  fontSize: '1.5rem',
}

const paymentInfoStyles: React.CSSProperties = {
  flex: 1,
}

const paymentNameStyles: React.CSSProperties = {
  fontSize: '0.9rem',
  fontWeight: 500,
  color: '#111827',
}

const paymentDescStyles: React.CSSProperties = {
  fontSize: '0.7rem',
  color: '#9ca3af',
  marginTop: '2px',
}

const checkStyles: React.CSSProperties = {
  color: '#4f46e5',
  fontSize: '1rem',
  fontWeight: 'bold',
}

const errorStyles: React.CSSProperties = {
  background: '#fee2e2',
  color: '#dc2626',
  padding: '12px',
  fontSize: '0.85rem',
  marginBottom: '16px',
  textAlign: 'center',
}

const actionStyles: React.CSSProperties = {
  display: 'flex',
  gap: '12px',
  marginTop: '8px',
}

const confirmButtonStyles: React.CSSProperties = {
  flex: 2,
  padding: '12px',
  border: 'none',
  color: 'white',
  fontWeight: 600,
  fontSize: '0.9rem',
  transition: 'background 0.2s',
}

const cancelButtonStyles: React.CSSProperties = {
  flex: 1,
  padding: '12px',
  background: 'white',
  border: '1px solid #e5e7eb',
  color: '#6b7280',
  fontWeight: 500,
  fontSize: '0.9rem',
  cursor: 'pointer',
  transition: 'all 0.2s',
}