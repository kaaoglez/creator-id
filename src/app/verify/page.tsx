'use client'

import { useState, useCallback, useMemo } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useLanguage } from '@/contexts/LanguageContext'
import ContactModal from '@/components/ContactModal'
import Image from 'next/image'

export default function VerifyPage() {
  const [hash, setHash] = useState('')
  const [isContactModalOpen, setIsContactModalOpen] = useState(false)
  const [selectedCreator, setSelectedCreator] = useState<any>(null)
  const { t } = useLanguage()

  // Query para verificar obra por hash
  const { data: result, isLoading, error, refetch } = useQuery({
    queryKey: ['verify', hash],
    queryFn: async () => {
      if (!hash.trim()) return null
      
      const { data, error } = await supabase
        .from('works')
        .select('*')
        .eq('file_hash', hash.trim())

      if (error) throw error
      if (!data || data.length === 0) return null
      return data[0]
    },
    enabled: false, // No ejecutar automáticamente
    staleTime: 5 * 60 * 1000,
  })

  // Query para obtener datos del creador
  const { data: creator, refetch: refetchCreator } = useQuery({
    queryKey: ['creator', result?.creator_id],
    queryFn: async () => {
      if (!result?.creator_id) return null
      
      const { data } = await supabase
        .from('creators')
        .select('full_first_name, full_last_name, first_name, last_name, email, country_name, creator_id')
        .eq('creator_id', result.creator_id)
        .single()
      
      return data
    },
    enabled: false, // Solo cuando se necesita
  })

  const handleVerify = useCallback(async () => {
    if (!hash.trim()) return
    await refetch()
  }, [hash, refetch])

  const handleContactClick = useCallback(async () => {
    if (!result?.creator_id) return
    const { data } = await refetchCreator()
    if (data) {
      setSelectedCreator(data)
      setIsContactModalOpen(true)
    }
  }, [result?.creator_id, refetchCreator])

  const handleCloseModal = useCallback(() => {
    setIsContactModalOpen(false)
    setSelectedCreator(null)
  }, [])

  // Memoizar nombre del creador
  const creatorName = useMemo(() => {
    if (!selectedCreator) return ''
    return selectedCreator.full_first_name && selectedCreator.full_last_name
      ? `${selectedCreator.full_first_name} ${selectedCreator.full_last_name}`
      : `${selectedCreator.first_name || ''} ${selectedCreator.last_name || ''}`.trim()
  }, [selectedCreator])

  return (
    <div style={{ maxWidth: '600px', margin: '40px auto', padding: '0 20px' }}>
      <h1 style={{ 
        fontSize: '2rem', 
        marginBottom: '30px',
        background: 'linear-gradient(135deg, #4f46e5, #10b981)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent'
      }}>
        🔍 {t.verify?.title || 'Verificar obra por hash'}
      </h1>
      
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <input
          type="text"
          value={hash}
          onChange={(e) => setHash(e.target.value)}
          placeholder={t.verify?.placeholder || 'Ej: WORK-A1B2C3D4E5F6'}
          style={{
            flex: 1,
            padding: '12px',
            border: '2px solid #e0e0e0',
            fontSize: '1rem'
          }}
          onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
        />
        <button
          onClick={handleVerify}
          disabled={isLoading}
          style={{
            padding: '12px 24px',
            background: isLoading ? '#ccc' : 'linear-gradient(135deg, #4f46e5, #10b981)',
            color: 'white',
            border: 'none',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            fontSize: '1rem',
            fontWeight: 'bold',
            transition: 'all 0.2s'
          }}
        >
          {isLoading ? (t.verify?.verifying || 'Verificando...') : (t.verify?.button || 'Verificar')}
        </button>
      </div>

      {error && (
        <div style={{
          padding: '15px',
          background: '#ffebee',
          color: '#c62828',
          marginBottom: '20px'
        }}>
          {error instanceof Error ? error.message : t.errors?.genericError || 'Error al verificar'}
        </div>
      )}

      {result && (
        <div style={{
          border: '1px solid #4caf50',
          padding: '20px',
          background: '#e8f5e8'
        }}>
          <h2 style={{ color: '#2e7d32', marginBottom: '15px' }}>
            {t.verify?.verified || '✅ Obra verificada'}
          </h2>
          
          <div style={{ background: 'white', padding: '15px', marginBottom: '15px' }}>
            <p><strong>{t.works?.title || 'Título'}:</strong> {result.title}</p>
            {result.description && (
              <p><strong>{t.work?.description || 'Descripción'}:</strong> {result.description}</p>
            )}
            <p><strong>Creator ID:</strong> {result.creator_id}</p>
            <p><strong>{t.work?.hash || 'Hash'}:</strong></p>
            <code style={{
              background: '#333',
              color: '#0f0',
              padding: '8px 12px',
              display: 'inline-block',
              fontFamily: 'monospace',
              marginTop: '5px'
            }}>
              {result.file_hash}
            </code>
            <p style={{ marginTop: '10px' }}>
              <strong>{t.work?.registered || 'Registrada'}:</strong> {new Date(result.created_at).toLocaleString()}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              href={`/${result.creator_id}`}
              style={{
                padding: '10px 20px',
                background: '#4f46e5',
                color: 'white',
                textDecoration: 'none',
                fontWeight: 'bold',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = '#4338ca'}
              onMouseOut={(e) => e.currentTarget.style.background = '#4f46e5'}
            >
              {t.work?.viewCreator || 'Ver perfil del creador'}
            </Link>
            
            <button
              onClick={handleContactClick}
              disabled={isLoading}
              style={{
                padding: '10px 20px',
                background: 'linear-gradient(135deg, #4f46e5, #10b981)',
                color: 'white',
                border: 'none',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s'
              }}
            >
              <span>📧</span>
              {t.profile?.actions?.registerWork || 'Contactar creador'}
            </button>

            <Link
              href={`/work/${result.id}`}
              style={{
                padding: '10px 20px',
                background: '#666',
                color: 'white',
                textDecoration: 'none',
                fontWeight: 'bold',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = '#4b5563'}
              onMouseOut={(e) => e.currentTarget.style.background = '#666'}
            >
              {t.work?.viewCreator || 'Ver obra completa'}
            </Link>
          </div>
        </div>
      )}

      {/* Modal de contacto */}
      {selectedCreator && (
        <ContactModal
          creatorId={selectedCreator.creator_id}
          creatorName={creatorName}
          creatorEmail={selectedCreator.email}
          isOpen={isContactModalOpen}
          onClose={handleCloseModal}
        />
      )}
    </div>
  )
}