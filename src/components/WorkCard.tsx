'use client'

import { useState, useEffect, memo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'

interface WorkCardProps {
  work: any
  showActions?: boolean
  onDelete?: (workId: string) => void
  t?: any
}

const WorkCard = memo(function WorkCard({ work, showActions = false, onDelete, t }: WorkCardProps) {
  const [visits, setVisits] = useState(0)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [imageError, setImageError] = useState(false)

  useEffect(() => {
    let isMounted = true

    const loadVisits = async () => {
      const { count } = await supabase
        .from('work_visits')
        .select('*', { count: 'exact', head: true })
        .eq('work_id', work.id)
      
      if (isMounted) {
        setVisits(count || 0)
      }
    }

    loadVisits()

    return () => {
      isMounted = false
    }
  }, [work.id])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  }

  const truncateText = (text: string, maxLength: number = 80) => {
    if (!text) return ''
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
  }

  const registerVisit = async (e: React.MouseEvent) => {
    e.preventDefault()
    await supabase
      .from('work_visits')
      .insert([{ 
        work_id: work.id,
        visitor_ip: 'anon'
      }])
  }

  const hasImage = work.file_url && work.file_type?.startsWith('image/') && !imageError
  const imageUrl = hasImage ? work.file_url : null

  const handleCardClick = async (e: React.MouseEvent) => {
    await registerVisit(e)
    window.location.href = `/work/${work.id}`
  }

  return (
    <div
      style={{
        background: 'white',
        border: '1px solid #eaeaea',
        borderRadius: '8px',
        overflow: 'hidden',
        transition: 'all 0.2s',
        boxShadow: isHovered ? '0 4px 15px rgba(0,0,0,0.1)' : '0 2px 5px rgba(0,0,0,0.05)',
        transform: isHovered ? 'translateY(-2px)' : 'none',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        cursor: 'pointer'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleCardClick}
    >
      {/* Imagen de la obra */}
      <div style={{
        height: '160px',
        background: '#f5f5f5',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={work.title}
            width={400}
            height={200}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transition: 'transform 0.3s ease',
              transform: isHovered ? 'scale(1.05)' : 'scale(1)',
              opacity: imageLoaded ? 1 : 0
            }}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
            loading="lazy"
            quality={75}
          />
        ) : (
          <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #4f46e5, #10b981)',
            color: 'white',
            fontSize: '2rem'
          }}>
            🎨
          </div>
        )}
        
        {/* Badge de visitas */}
        <div style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          color: 'white',
          padding: '4px 10px',
          fontSize: '0.8rem',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          zIndex: 2,
          borderRadius: '20px'
        }}>
          <span>👁️</span>
          <span>{visits}</span>
        </div>
      </div>

      {/* Contenido */}
      <div style={{
        padding: '15px',
        display: 'flex',
        flexDirection: 'column',
        flex: 1
      }}>
        <h3 style={{
          fontSize: '1.1rem',
          margin: '0 0 8px 0',
          color: '#333',
          fontWeight: 600,
          height: '2.4rem',
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          lineHeight: '1.2'
        }}>
          {work.title}
        </h3>

        <p style={{
          fontSize: '0.9rem',
          color: '#666',
          marginBottom: '10px',
          height: '4rem',
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          lineHeight: '1.4'
        }}>
          {truncateText(work.description || 'Sin descripción', 120)}
        </p>

        <div style={{
          background: '#f9f9f9',
          padding: '8px',
          borderRadius: '4px',
          marginBottom: '12px',
          fontSize: '0.8rem',
          color: '#666'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span>📅 {formatDate(work.created_at)}</span>
            {work.price && (
              <span style={{ fontWeight: 'bold', color: '#4f46e5' }}>${work.price}</span>
            )}
          </div>
          <code style={{
            background: '#333',
            color: '#0f0',
            padding: '2px 4px',
            fontSize: '0.7rem',
            display: 'block',
            textAlign: 'center',
            wordBreak: 'break-all'
          }}>
            {work.file_hash?.substring(0, 16) || 'HASH'}...
          </code>
        </div>

        {/* Botones de acción */}
    {showActions ? (
  <div style={{
    display: 'flex',
    gap: '8px',
    marginTop: 'auto'
  }}>
    {/* Botón Editar - NARANJA, va a /works/{id}/edit */}
    <Link
      href={`/works/${work.id}/edit`}
      onClick={(e) => e.stopPropagation()}
      style={{
        flex: 1,
        padding: '8px',
        background: '#f59e0b',  // Naranja
        color: 'white',
        textDecoration: 'none',
        textAlign: 'center',
        fontSize: '0.9rem',
        borderRadius: '4px',
        cursor: 'pointer'
      }}
    >
      ✏️ Editar
    </Link>
    
    {/* Botón Ver - AZUL, va a /work/{id} */}
    <Link
      href={`/work/${work.id}`}
      onClick={(e) => e.stopPropagation()}
      style={{
        flex: 1,
        padding: '8px',
        background: '#4f46e5',  // Azul
        color: 'white',
        textDecoration: 'none',
        textAlign: 'center',
        fontSize: '0.9rem',
        borderRadius: '4px',
        cursor: 'pointer'
      }}
    >
      👁️ Ver
    </Link>
    
    {/* Botón Eliminar - ROJO */}
    <button
      onClick={(e) => {
        e.stopPropagation()
        onDelete?.(work.id)
      }}
      style={{
        flex: 1,
        padding: '8px',
        background: '#dc2626',  // Rojo
        color: 'white',
        border: 'none',
        cursor: 'pointer',
        fontSize: '0.9rem',
        fontWeight: 'bold',
        borderRadius: '4px'
      }}
    >
      🗑️
    </button>
  </div>
) : (
  <div style={{
    marginTop: 'auto',
    paddingTop: '16px'
  }}>
    <Link
      href={`/work/${work.id}`}
      onClick={(e) => e.stopPropagation()}
      style={{
        display: 'block',
        padding: '8px',
        background: '#4f46e5',
        color: 'white',
        textDecoration: 'none',
        textAlign: 'center',
        fontSize: '0.9rem',
        cursor: 'pointer',
        borderRadius: '4px'
      }}
    >
      👁️ Ver detalles
    </Link>
  </div>
)}
      </div>
    </div>
  )
})

WorkCard.displayName = 'WorkCard'

export default WorkCard