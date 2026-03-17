'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { es } from '@/lib/i18n/es'
import { en } from '@/lib/i18n/en'

type Language = 'es' | 'en'
type Texts = typeof es

interface LanguageContextType {
  language: Language
  t: Texts
  changeLanguage: (lang: Language) => void
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('es')

  useEffect(() => {
    // Detectar idioma del navegador
    const browserLang = navigator.language.split('-')[0] as Language
    if (browserLang === 'en' || browserLang === 'es') {
      setLanguage(browserLang)
    }
    
    // Recuperar idioma guardado
    const saved = localStorage.getItem('language') as Language
    if (saved && (saved === 'es' || saved === 'en')) {
      setLanguage(saved)
    }
  }, [])

  const changeLanguage = (lang: Language) => {
    setLanguage(lang)
    localStorage.setItem('language', lang)
  }

  const t = language === 'es' ? es : en

  return (
    <LanguageContext.Provider value={{ language, t, changeLanguage }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}