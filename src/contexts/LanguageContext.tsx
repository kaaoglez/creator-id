'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { es } from '@/lib/i18n/es'
import { en } from '@/lib/i18n/en'

type Language = 'es' | 'en'

// Definir el tipo completo basado en es
type Texts = {
  nav: typeof es.nav;
  home: typeof es.home;
  profile: typeof es.profile & {
    footer: {
      description: string;
      quickLinks: string;
      home: string;
      search: string;
      createId: string;
      registerWork: string;
      support: string;
      faq: string;
      contact: string;
      terms: string;
      privacy: string;
      community: string;
      creators: string;
      works: string;
      countries: string;
      royalty: string;
      rights: string;
      madeWith: string;
    }
  };
  work: typeof es.work;
  works: typeof es.works;
  search: typeof es.search;
  messages: typeof es.messages;
  auth: typeof es.auth;
  register: typeof es.register;
  verify: typeof es.verify;
  errors: typeof es.errors;
  shop: {  // 👈 AÑADE ESTA SECCIÓN
    title: string;
    available: string;
    empty: string;
    first: string;
    contact: string;
    details: string;
  };
}

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

  // Hacemos un cast para que TypeScript sepa que en tiene la misma estructura que es
  const t = (language === 'es' ? es : en) as Texts

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