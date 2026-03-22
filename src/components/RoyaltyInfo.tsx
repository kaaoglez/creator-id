// src/components/RoyaltyInfo.tsx
'use client'

import { useLanguage } from '@/contexts/LanguageContext'

export default function RoyaltyInfo() {
  const { t } = useLanguage()

  return (
    <div style={{ 
      marginTop: '30px', 
      padding: '20px', 
      background: '#e8f5e8',
      borderRadius: '0'
    }}>
      <h3 style={{ marginBottom: '10px', color: '#333' }}>
        {t.royalty?.title || '💰 Sistema de regalías'}
      </h3>
      <div style={{ fontSize: '0.9rem', color: '#666', lineHeight: '1.6' }}>
        <p>• <strong>{t.royalty?.firstSale || 'Primera venta'}</strong>: {t.royalty?.firstSaleDesc || 'el creador recibe el 90% del precio'}</p>
        <p>• <strong>{t.royalty?.resale || 'Reventas futuras'}</strong>: {t.royalty?.resaleDesc || 'el creador original recibe el 20% (regalía perpetua)'}</p>
        <p>• <strong>{t.royalty?.seller || 'Revendedores'}</strong>: {t.royalty?.sellerDesc || 'ganan el 70% de cada reventa'}</p>
        <p>• <strong>{t.royalty?.platform || 'Plataforma'}</strong>: {t.royalty?.platformDesc || 'solo 10% para mantenimiento'}</p>
      </div>
    </div>
  )
}