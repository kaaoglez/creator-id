'use client'

import { useLanguage } from '@/contexts/LanguageContext'

export default function LanguageSelector() {
  const { language, changeLanguage } = useLanguage()

  return (
    <div style={{
      display: 'flex',
      gap: '2px',
      marginLeft: '10px'
    }}>
      <button
        onClick={() => changeLanguage('es')}
        style={{
          padding: '4px 8px',
          background: language === 'es' ? '#4f46e5' : '#eaeaea',
          color: language === 'es' ? 'white' : '#333',
          border: 'none',
          cursor: 'pointer',
          fontSize: '0.9rem',
          fontWeight: language === 'es' ? 'bold' : 'normal'
        }}
      >
        ES
      </button>
      <button
        onClick={() => changeLanguage('en')}
        style={{
          padding: '4px 8px',
          background: language === 'en' ? '#4f46e5' : '#eaeaea',
          color: language === 'en' ? 'white' : '#333',
          border: 'none',
          cursor: 'pointer',
          fontSize: '0.9rem',
          fontWeight: language === 'en' ? 'bold' : 'normal'
        }}
      >
        EN
      </button>
    </div>
  )
}