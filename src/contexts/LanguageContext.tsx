'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { es } from '@/lib/i18n/es'
import { en } from '@/lib/i18n/en'

type Language = 'es' | 'en'

// Definir el tipo completo basado en es
type Texts = {
  nav: typeof es.nav;
  home: typeof es.home;
  profile: {
    title: string;
    personalInfo: string;
    editButton: string;
    yourCreatorId: string;
    stats: {
      works: string;
      firstWork: string;
      lastWork: string;
      profileVisits: string;
      totalMessages: string;
      unreadMessages: string;
      mostViewed: string;
      inventory: string;
      visits: string;
      noCreatorId: string;
      createOne: string;
    };
    actions: {
      registerWork: string;
      viewPublic: string;
      contact: string;  // 👈 AÑADIDO
    };
    myWorks: string;
    noWorks: string;
    registerFirst: string;
    dangerZone: string;
    deleteWarning: string;
    deleteButton: string;
    confirmDelete: string;
    deleteItems: string;
    deleteList: string[];
    confirmYes: string;
    cancel: string;
    sales: {
      title: string;
      totalSales: string;
      completedSales: string;
      pendingSales: string;
      failedSales: string;
      grossRevenue: string;
      platformFee: string;
      earnings: string;
      byWork: string;
      byMonth: string;
      recent: string;
      noSales: string;
      sale: string;
      sales: string;
      buyer: string;
      date: string;
      amount: string;
      status: string;
    };
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
    };
  };
  work: typeof es.work;
  works: typeof es.works;
  search: typeof es.search;
  messages: typeof es.messages;
  auth: typeof es.auth;
  register: typeof es.register;
  verify: typeof es.verify;
  errors: typeof es.errors;
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