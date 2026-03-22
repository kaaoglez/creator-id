'use client'

import { useState } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import PurchaseModal from './PurchaseModal'

export default function PurchaseButton({ work, creatorName }: { work: any; creatorName: string }) {
  const { t } = useLanguage()
  const [showModal, setShowModal] = useState(false)

  if (!work.price || work.isOwner) return null

  return (
    <>
      <div style={{ 
        marginTop: '40px', 
        padding: '20px', 
        background: '#f0f7ff',
        textAlign: 'center',
        borderRadius: '0'
      }}>
        <h3 style={{ marginBottom: '15px', color: '#333' }}>
          {t.work?.interested || '¿Interesado en esta obra?'}
        </h3>
        
        <button
          onClick={() => setShowModal(true)}
          style={{
            padding: '12px 30px',
            background: 'linear-gradient(135deg, #4f46e5, #10b981)',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: 'bold'
          }}
        >
          {t.work?.buy || 'Comprar'} ${work.price}
        </button>

        <p style={{ marginTop: '15px', color: '#666', fontSize: '0.9rem' }}>
          {t.work?.securePayment || 'Pago seguro con Stripe'}
        </p>
      </div>

      {showModal && (
        <PurchaseModal
          work={work}
          creatorName={creatorName}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false)
            alert(t.messages?.purchaseSuccess || '✅ Compra realizada con éxito')
          }}
        />
      )}
    </>
  )
}