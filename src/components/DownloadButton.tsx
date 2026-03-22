// src/components/DownloadButton.tsx
'use client'

import { useState } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'

export default function DownloadButton({ work, onPurchase }: any) {
  const { user } = useAuth()
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDownload = async () => {
    if (work.access_type === 'paid' && !user) {
      alert('Inicia sesión para comprar esta obra')
      return
    }

    if (work.access_type === 'nfc_locked') {
      alert('Esta obra requiere escanear un dispositivo NFC')
      return
    }

    setIsDownloading(true)
    try {
      // Registrar descarga
      const response = await fetch(`/api/download/${work.id}`)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = work.original_filename || 'archivo'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading:', error)
      alert('Error al descargar')
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <button
      onClick={handleDownload}
      disabled={isDownloading}
      style={{
        padding: '10px 20px',
        background: '#4f46e5',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer'
      }}
    >
      {isDownloading ? 'Descargando...' : 'Descargar'}
    </button>
  )
}