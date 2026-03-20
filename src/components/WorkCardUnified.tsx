'use client'

import Link from 'next/link'
import { useState } from 'react'
import Image from 'next/image'

interface WorkCardUnifiedProps {
  work: any
  showActions?: boolean
  onDelete?: (workId: string) => void
  isMobile?: boolean
}

export default function WorkCardUnified({ work, showActions = false, onDelete, isMobile = false }: WorkCardUnifiedProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [imageError, setImageError] = useState(false)

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
        minHeight: '380px'
      }}
      onMouseOver={() => setIsHovered(true)}
      onMouseOut={() => setIsHovered(false)}
    >
      {/* Imagen de la obra - altura fija */}
      <div style={{
        height: '160px',
        background: '#f5f5f5',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {work.file_url && !imageError ? (
          <img
            src={work.file_url}
            alt={work.title}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
            onError={() => setImageError(true)}
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
      </div>

      {/* Contenido - altura flexible pero controlada */}
      <div style={{
        padding: '15px',
        display: 'flex',
        flexDirection: 'column',
        flex: 1
      }}>
        {/* Título con altura fija para 2 líneas */}
        <h3 style={{
          fontSize: '1.1rem',
          margin: '0 0 8px 0',
          color: '#333',
          fontWeight: 600,
          height: '2.4rem',
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical'
        }}>
          {work.title}
        </h3>

        {/* Descripción con altura fija para 3 líneas */}
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

        {/* Fecha y hash - siempre igual */}
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
            textAlign: 'center'
          }}>
            {work.file_hash || 'HASH'}
          </code>
        </div>

        {/* Botones de acción - SIEMPRE AL MISMO LUGAR gracias a margin-top: auto */}
        {showActions ? (
          <div style={{
            display: 'flex',
            gap: '8px',
            marginTop: 'auto'
          }}>
            <Link
              href={`/works/${work.id}`}
              style={{
                flex: 1,
                padding: '8px',
                background: '#4f46e5',
                color: 'white',
                textDecoration: 'none',
                textAlign: 'center',
                fontSize: '0.9rem',
                borderRadius: '4px'
              }}
            >
              Ver
            </Link>
            <button
              onClick={() => onDelete?.(work.id)}
              style={{
                flex: 1,
                padding: '8px',
                background: '#ef4444',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.9rem',
                borderRadius: '4px'
              }}
            >
              Eliminar
            </button>
          </div>
        ) : (
          <Link
            href={`/works/${work.id}`}
            style={{
              display: 'block',
              padding: '8px',
              background: '#4f46e5',
              color: 'white',
              textDecoration: 'none',
              textAlign: 'center',
              fontSize: '0.9rem',
              borderRadius: '4px',
              marginTop: 'auto'
            }}
          >
            Ver detalles
          </Link>
        )}
      </div>
    </div>
  )
}