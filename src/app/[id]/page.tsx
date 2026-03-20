'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useLanguage } from '@/contexts/LanguageContext'
import Image from 'next/image'

export default function WorkDetailPage() {
  const params = useParams()
  const workId = params?.id as string
  const router = useRouter()
  const supabase = createClient()
  const { t } = useLanguage()
  const [imageError, setImageError] = useState(false)

  // Query para obtener los datos de la obra
  const { data: work, isLoading, error } = useQuery({
    queryKey: ['work', workId],
    queryFn: async () => {
      if (!workId) return null
      
      const { data, error } = await supabase
        .from('works')
        .select(`
          *,
          creators (
            creator_id,
            full_first_name,
            full_last_name,
            avatar_url,
            email,
            country_name,
            region
          )
        `)
        .eq('id', workId)
        .single()

      if (error) throw error
      return data
    },
    enabled: !!workId,
  })

  if (isLoading) {
    return (
      <div style={{ maxWidth: '600px', margin: '40px auto', textAlign: 'center' }}>
        <div style={{
          border: '3px solid #f3f3f3',
          borderTop: '3px solid #4f46e5',
          borderRadius: '50%',
          width: '50px',
          height: '50px',
          animation: 'spin 1s linear infinite',
          margin: '20px auto'
        }} />
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
        <p>Cargando obra...</p>
      </div>
    )
  }

  if (error || !work) {
    return (
      <div style={{ maxWidth: '600px', margin: '40px auto', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2rem', color: '#dc2626', marginBottom: '20px' }}>
          😕 Obra no encontrada
        </h1>
        <p style={{ color: '#666', marginBottom: '30px' }}>
          La obra que buscas no existe o el ID es incorrecto.
        </p>
        <Link
          href="/"
          style={{
            padding: '12px 24px',
            background: 'linear-gradient(135deg, #4f46e5, #10b981)',
            color: 'white',
            textDecoration: 'none',
            fontWeight: 'bold',
            borderRadius: '4px'
          }}
        >
          ← Volver al inicio
        </Link>
      </div>
    )
  }

  const creatorName = work.creators?.full_first_name && work.creators?.full_last_name
    ? `${work.creators.full_first_name} ${work.creators.full_last_name}`
    : work.creators?.full_first_name || 'Creador'

  return (
    <div style={{ maxWidth: '800px', margin: '40px auto', padding: '0 20px' }}>
      {/* Botón volver */}
      <button
        onClick={() => router.back()}
        style={{
          marginBottom: '20px',
          padding: '8px 16px',
          background: 'none',
          border: '1px solid #e0e0e0',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}
      >
        ← Volver
      </button>

      {/* Tarjeta de la obra */}
      <div style={{
        background: 'white',
        border: '1px solid #eaeaea',
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
      }}>
        {/* Imagen */}
        {work.file_url && !imageError ? (
          <div style={{ position: 'relative', height: '400px' }}>
            <img
              src={work.file_url}
              alt={work.title}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                background: '#f5f5f5'
              }}
              onError={() => setImageError(true)}
            />
          </div>
        ) : (
          <div style={{
            height: '200px',
            background: 'linear-gradient(135deg, #4f46e5, #10b981)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '4rem'
          }}>
            🎨
          </div>
        )}

        {/* Información */}
        <div style={{ padding: '24px' }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '16px', color: '#333' }}>
            {work.title}
          </h1>

          {work.description && (
            <div style={{
              marginBottom: '20px',
              padding: '16px',
              background: '#f8fafc',
              borderRadius: '8px',
              borderLeft: '4px solid #4f46e5'
            }}>
              <p style={{ margin: 0, color: '#334155', lineHeight: '1.6' }}>
                {work.description}
              </p>
            </div>
          )}

          {work.price && (
            <p style={{ marginBottom: '16px' }}>
              <strong>Precio:</strong>{' '}
              <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#4f46e5' }}>
                ${work.price}
              </span>
            </p>
          )}

          <div style={{
            marginBottom: '20px',
            padding: '12px',
            background: '#f0f7ff',
            borderRadius: '4px'
          }}>
            <p style={{ marginBottom: '4px' }}>
              <strong>🆔 Hash de verificación:</strong>
            </p>
            <code style={{
              background: '#333',
              color: '#0f0',
              padding: '8px',
              display: 'block',
              borderRadius: '4px',
              wordBreak: 'break-all'
            }}>
              {work.file_hash}
            </code>
          </div>

          {/* Info del creador */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            padding: '16px',
            background: '#f9f9f9',
            borderRadius: '8px',
            marginTop: '20px'
          }}>
            {work.creators?.avatar_url ? (
              <img
                src={work.creators.avatar_url}
                alt={creatorName}
                style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  objectFit: 'cover'
                }}
              />
            ) : (
              <div style={{
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #4f46e5, #10b981)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '1.5rem'
              }}>
                {creatorName.charAt(0)}
              </div>
            )}
            <div>
              <p style={{ margin: 0, fontWeight: 'bold' }}>{creatorName}</p>
              <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>
                {work.creators?.country_name}
              </p>
            </div>
            <Link
              href={`/${work.creators?.creator_id}`}
              style={{
                marginLeft: 'auto',
                padding: '8px 16px',
                background: '#4f46e5',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '4px',
                fontSize: '0.9rem'
              }}
            >
              Ver perfil
            </Link>
          </div>

          <div style={{
            marginTop: '20px',
            paddingTop: '20px',
            borderTop: '1px solid #eaeaea',
            color: '#666',
            fontSize: '0.85rem',
            textAlign: 'center'
          }}>
            Registrada el {new Date(work.created_at).toLocaleDateString()}
          </div>
        </div>
      </div>
    </div>
  )
}