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
  isMobile?: boolean 
}

const WorkCard = memo(function WorkCard({ work, showActions = false, onDelete, t }: WorkCardProps) {
  const [visits, setVisits] = useState(0)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

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

  const registerVisit = async (e: React.MouseEvent) => {
    e.preventDefault()
    await supabase
      .from('work_visits')
      .insert([{ 
        work_id: work.id,
        visitor_ip: 'anon'
      }])
  }

  const hasImage = work.file_url && work.file_type?.startsWith('image/')
  const imageUrl = hasImage ? work.file_url : '/placeholder-image.jpg'

  const handleCardClick = async (e: React.MouseEvent) => {
    await registerVisit(e)
    window.location.href = `/work/${work.id}`
  }

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        border: '1px solid #eaeaea',
        background: 'white',
        boxShadow: isHovered 
          ? '0 10px 15px -3px rgba(0,0,0,0.1)'
          : '0 1px 3px rgba(0,0,0,0.05)',
        transition: 'all 0.2s ease',
        transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        height: '100%'
      }}
    >
      {/* Imagen destacada - clickeable */}
      <div
        onClick={handleCardClick}
        style={{
          position: 'relative',
          height: '200px',
          background: '#f3f4f6',
          overflow: 'hidden',
          cursor: 'pointer'
        }}
      >
        {hasImage ? (
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
            fontSize: '3rem'
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
          zIndex: 2
        }}>
          <span>👁️</span>
          <span>{visits}</span>
        </div>
      </div>

      {/* Información de la obra */}
      <div style={{
        padding: '16px',
        flex: 1,
        display: 'flex',
        flexDirection: 'column'
      }}>
        <h3 style={{
          margin: '0 0 8px 0',
          fontSize: '1.1rem',
          fontWeight: 600,
          color: '#1f2937',
          lineHeight: 1.4,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {work.title}
        </h3>

        {work.description && (
          <p style={{
            margin: '0 0 12px 0',
            fontSize: '0.9rem',
            color: '#6b7280',
            lineHeight: 1.5,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {work.description}
          </p>
        )}

        {/* Fecha */}
        <div style={{
          fontSize: '0.8rem',
          color: '#9ca3af',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          marginBottom: '8px'
        }}>
          <span>📅</span>
          <span>{new Date(work.created_at).toLocaleDateString()}</span>
        </div>

        {/* Hash abreviado */}
        <div style={{
          padding: '6px 10px',
          background: '#f3f4f6',
          fontSize: '0.75rem',
          fontFamily: 'monospace',
          color: '#4f46e5',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <span style={{ fontSize: '0.9rem' }}>🔐</span>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {work.file_hash.substring(0, 16)}...
          </span>
        </div>

        {/* ✅ BOTONES DE ACCIÓN (si showActions es true) */}
        {showActions && (
          <div style={{
            marginTop: 'auto',
            display: 'flex',
            gap: '8px',
            borderTop: '1px solid #eaeaea',
            paddingTop: '16px'
          }}>
            {/* Botón Ver */}
            <Link
              href={`/work/${work.id}`}
              onClick={(e) => e.stopPropagation()}
              style={{
                flex: 1,
                padding: '8px',
                background: '#4f46e5',
                color: 'white',
                textDecoration: 'none',
                textAlign: 'center',
                fontSize: '0.9rem',
                cursor: 'pointer'
              }}
            >
              👁️ Ver
            </Link>
            
            {/* Botón Eliminar */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDelete?.(work.id)
              }}
              style={{
                flex: 1,  
                padding: '8px',
                background: '#dc2626',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: 'bold'
              }}
            >
              🗑️
            </button>
          </div>
        )}
      </div>
    </div>
  )
})

WorkCard.displayName = 'WorkCard'

export default WorkCard