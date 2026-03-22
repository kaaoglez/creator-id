// src/hooks/useTranslation.ts
import { useState, useEffect } from 'react'
import { translateText } from '@/lib/translate'
import { useLanguage } from '@/contexts/LanguageContext'

export function useTranslation(originalText: string) {
  const { language } = useLanguage()
  const [translatedText, setTranslatedText] = useState(originalText)
  const [isTranslating, setIsTranslating] = useState(false)

  useEffect(() => {
    if (!originalText) {
      setTranslatedText('')
      return
    }

    // Si el idioma es español, mostrar texto original
    if (language === 'es') {
      setTranslatedText(originalText)
      return
    }

    const translate = async () => {
      setIsTranslating(true)
      try {
        const translated = await translateText(originalText, language)
        setTranslatedText(translated)
      } catch (error) {
        console.error('Translation error:', error)
        setTranslatedText(originalText)
      } finally {
        setIsTranslating(false)
      }
    }

    translate()
  }, [originalText, language])

  return { translatedText, isTranslating }
}