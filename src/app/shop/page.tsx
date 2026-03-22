'use client'

import { useState, useEffect } from 'react'
import { useWorks } from '@/hooks/useWorks'
import { useLanguage } from '@/contexts/LanguageContext'
import Pagination from '@/components/Pagination'
import Link from 'next/link'
import WorkCard from '@/components/WorkCard'

export default function ShopPage() {
  const { t } = useLanguage()
  const [currentPage, setCurrentPage] = useState(1)
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200)
  const itemsPerPage = 12
  const { data: works = [], isLoading, error } = useWorks()

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const isMobile = windowWidth < 768
  const totalPages = Math.ceil(works.length / itemsPerPage)
  const paginatedWorks = works.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

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
        <p>Cargando obras...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <p style={{ color: '#dc2626' }}>Error al cargar las obras</p>
        <button onClick={() => window.location.reload()}>Reintentar</button>
      </div>
    )
  }

  return (
    <div style={{ 
      maxWidth: "1200px", 
      margin: "40px auto", 
      padding: isMobile ? "0 15px" : "0 20px",
      fontFamily: "sans-serif" 
    }}>
      
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '30px',
        flexWrap: 'wrap',
        gap: '15px'
      }}>
        <h1 style={{ 
          fontSize: isMobile ? '1.8rem' : '2.5rem', 
          margin: 0,
          background: 'linear-gradient(135deg, #4f46e5, #10b981)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          🛍️ {t.shop?.title || 'Tienda de Obras'}
        </h1>
        <div style={{
          background: '#f0f7ff',
          padding: '8px 16px',
          color: '#4f46e5',
          fontWeight: 'bold',
          borderRadius: '0'
        }}>
          {works.length} {t.shop?.available || 'obras disponibles'}
        </div>
      </div>

      {/* Grid de obras */}
      {works.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          background: '#f9f9f9',
          borderRadius: '0'
        }}>
          <p style={{ fontSize: '1.2rem', color: '#666' }}>
            {t.shop?.empty || 'No hay obras registradas aún.'}
          </p>
          <Link
            href="/works/new"
            style={{
              display: 'inline-block',
              marginTop: '20px',
              padding: '10px 20px',
              background: '#4f46e5',
              color: 'white',
              textDecoration: 'none',
              fontWeight: 'bold',
              borderRadius: '0'
            }}
          >
            {t.shop?.first || 'Registrar primera obra'}
          </Link>
        </div>
      ) : (
        <>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
            gap: '24px',
            marginBottom: '30px'
          }}>
            {paginatedWorks.map((work) => (
              <WorkCard
                key={work.id}
                work={work}
                showActions={false}
                t={t}
              />
            ))}
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              isMobile={isMobile}
            />
          )}

          {/* Info de resultados */}
          <p style={{
            textAlign: 'center',
            color: '#666',
            fontSize: '0.9rem',
            marginTop: '20px'
          }}>
            Mostrando {paginatedWorks.length} de {works.length} obras
          </p>
        </>
      )}
    </div>
  )
}