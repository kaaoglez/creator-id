'use client'

import { useState, useEffect } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'

export default function InstallPrompt() {
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const { t } = useLanguage()

  useEffect(() => {
    // Detectar iOS
    setIsIOS(
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
    )

    // Detectar si ya está instalado
    setIsStandalone(window.matchMedia('(display-mode: standalone)').matches)

    // Capturar evento beforeinstallprompt para Android/Chrome
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowPrompt(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    console.log(`User response to the install prompt: ${outcome}`)
    setDeferredPrompt(null)
    setShowPrompt(false)
  }

  if (isStandalone) return null

  return (
    <>
      {/* Para Android/Chrome */}
      {showPrompt && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          left: '20px',
          right: '20px',
          background: 'white',
          border: '1px solid #4f46e5',
          padding: '16px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 2000,
          maxWidth: '400px',
          margin: '0 auto'
        }}>
          <p style={{ margin: '0 0 12px 0', color: '#333' }}>
            Instala la app en tu dispositivo para acceder más rápido
          </p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button
              onClick={() => setShowPrompt(false)}
              style={{
                padding: '8px 16px',
                background: 'white',
                color: '#666',
                border: '1px solid #ccc',
                cursor: 'pointer'
              }}
            >
              Cancelar
            </button>
            <button
              onClick={handleInstallClick}
              style={{
                padding: '8px 16px',
                background: '#4f46e5',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              Instalar
            </button>
          </div>
        </div>
      )}

      {/* Para iOS - instrucciones */}
      {isIOS && !isStandalone && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          left: '20px',
          right: '20px',
          background: 'white',
          border: '1px solid #4f46e5',
          padding: '16px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 2000,
          maxWidth: '400px',
          margin: '0 auto'
        }}>
          <p style={{ margin: '0 0 8px 0', color: '#333' }}>
            Para instalar en iOS:
          </p>
          <p style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>
            1. Toca el botón compartir <span style={{ fontSize: '1.2rem' }}>⎋</span>
          </p>
          <p style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>
            2. Selecciona "Agregar a pantalla de inicio" <span style={{ fontSize: '1.2rem' }}>➕</span>
          </p>
        </div>
      )}
    </>
  )
}