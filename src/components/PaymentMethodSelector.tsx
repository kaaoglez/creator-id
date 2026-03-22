'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useLanguage } from '@/contexts/LanguageContext'

export default function PaymentMethodSelector({ onSelect, selected }: any) {
  const [methods, setMethods] = useState<any[]>([])
  const { t } = useLanguage()

  useEffect(() => {
    loadPaymentMethods()
  }, [])

  const loadPaymentMethods = async () => {
    const { data } = await supabase
      .from('payment_methods')
      .select('*')
      .eq('is_active', true)
      .order('id')
    setMethods(data || [])
  }

  const methodsConfig = [
    { code: 'card', name: 'Tarjeta', icon: '💳', description: 'Visa, Mastercard, American Express' },
    { code: 'paypal', name: 'PayPal', icon: '🅿️', description: 'Cuenta PayPal' },
    { code: 'mercadopago', name: 'MercadoPago', icon: '🟡', description: 'Mercado Pago' },
    { code: 'usdc', name: 'USDC', icon: '💎', description: 'Criptomonedas' },
  ]

  const getMethodConfig = (code: string) => {
    return methodsConfig.find(m => m.code === code) || { name: code, icon: '💰', description: '' }
  }

  return (
    <div style={{ marginBottom: '24px' }}>
      <label style={{ 
        display: 'block', 
        marginBottom: '12px', 
        fontWeight: 'bold',
        color: '#333',
        fontSize: '0.9rem'
      }}>
        {t.purchase?.paymentMethod || 'Método de pago'}
      </label>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '12px'
      }}>
        {methodsConfig.map((method) => (
          <button
            key={method.code}
            onClick={() => onSelect(method.code)}
            style={{
              padding: '14px 12px',
              background: selected === method.code ? '#4f46e5' : 'white',
              color: selected === method.code ? 'white' : '#333',
              border: selected === method.code ? '1px solid #4f46e5' : '1px solid #e0e0e0',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              transition: 'all 0.2s ease',
              boxShadow: selected === method.code ? '0 2px 8px rgba(79,70,229,0.15)' : 'none'
            }}
            onMouseOver={(e) => {
              if (selected !== method.code) {
                e.currentTarget.style.borderColor = '#4f46e5'
                e.currentTarget.style.transform = 'translateY(-1px)'
              }
            }}
            onMouseOut={(e) => {
              if (selected !== method.code) {
                e.currentTarget.style.borderColor = '#e0e0e0'
                e.currentTarget.style.transform = 'translateY(0)'
              }
            }}
          >
            <span style={{ fontSize: '1.5rem' }}>{method.icon}</span>
            <div style={{ textAlign: 'left' }}>
              <div style={{ 
                fontWeight: selected === method.code ? '600' : '500',
                fontSize: '0.9rem'
              }}>
                {method.name}
              </div>
              <div style={{ 
                fontSize: '0.7rem', 
                color: selected === method.code ? 'rgba(255,255,255,0.8)' : '#999',
                marginTop: '2px'
              }}>
                {method.description}
              </div>
            </div>
            {selected === method.code && (
              <span style={{ marginLeft: 'auto', fontSize: '0.9rem' }}>✓</span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}