'use client'

import Link from 'next/link'
import { useLanguage } from '@/contexts/LanguageContext'

export default function OfflinePage() {
  const { t } = useLanguage()

  return (
    <div style={{ 
      maxWidth: '600px', 
      margin: '40px auto', 
      padding: '0 20px',
      textAlign: 'center'
    }}>
      <div style={{ fontSize: '4rem', marginBottom: '20px' }}>📴</div>
      <h1 style={{ 
        fontSize: '2rem', 
        marginBottom: '20px',
        color: '#333'
      }}>
        Sin conexión
      </h1>
      <p style={{ marginBottom: '30px', color: '#666', lineHeight: '1.6' }}>
        Parece que no tienes conexión a internet. Algunas funciones pueden no estar disponibles.
      </p>
      <Link
        href="/"
        style={{
          display: 'inline-block',
          padding: '12px 24px',
          background: 'linear-gradient(135deg, #4f46e5, #10b981)',
          color: 'white',
          textDecoration: 'none',
          fontWeight: 'bold'
        }}
      >
        Intentar de nuevo
      </Link>
    </div>
  )
}