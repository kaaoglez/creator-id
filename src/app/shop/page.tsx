'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useLanguage } from '@/contexts/LanguageContext'
import Pagination from '@/components/Pagination'
import Link from 'next/link'
import ContactModal from '@/components/ContactModal'

export default function ShopPage() {
  const { t } = useLanguage()
  const [currentPage, setCurrentPage] = useState(1)
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200)
  const [selectedCreator, setSelectedCreator] = useState<{ id: string; name: string; email: string } | null>(null)
  const [isContactModalOpen, setIsContactModalOpen] = useState(false)
  const itemsPerPage = 12 // 12 obras por página (4 filas de 3)
  const supabase = createClient()

  // Detectar tamaño de pantalla para responsive
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const isMobile = windowWidth < 768

  // Query para obtener todas las obras (con datos del creador)
  const { data: works = [], isLoading, error } = useQuery({
    queryKey: ['shop-works'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('works')
        .select(`
          *,
          creators (
            full_first_name,
            full_last_name,
            avatar_url,
            creator_id,
            email
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    },
    staleTime: 5 * 60 * 1000,
  })

  // Paginación
  const totalPages = Math.ceil(works.length / itemsPerPage)
  const paginatedWorks = works.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleContactClick = (creator: any) => {
    const fullName = creator.full_first_name && creator.full_last_name
      ? `${creator.full_first_name} ${creator.full_last_name}`
      : creator.full_first_name || 'Creador'
    
    setSelectedCreator({
      id: creator.creator_id,
      name: fullName,
      email: creator.email
    })
    setIsContactModalOpen(true)
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
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
        <p>{t.search?.searching || 'Cargando obras...'}</p>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ maxWidth: '600px', margin: '40px auto', textAlign: 'center' }}>
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
          borderRadius: '4px'
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
          borderRadius: '8px'
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
              borderRadius: '4px'
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
              <div key={work.id} style={{
                background: 'white',
                border: '1px solid #eaeaea',
                borderRadius: '8px',
                overflow: 'hidden',
                transition: 'all 0.2s',
                display: 'flex',
                flexDirection: 'column',
                height: '100%'
              }}>
                {/* Imagen */}
                <div style={{
                  height: '180px',
                  background: '#f5f5f5',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  {work.file_url && work.file_type?.startsWith('image/') ? (
                    <img
                      src={work.file_url}
                      alt={work.title}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
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
                </div>

                {/* Contenido */}
                <div style={{ padding: '15px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <h3 style={{
                    fontSize: '1.1rem',
                    margin: '0 0 8px 0',
                    color: '#333',
                    fontWeight: 600,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {work.title}
                  </h3>

                  {/* Precio */}
                  {work.price && (
                    <div style={{
                      fontSize: '1.3rem',
                      fontWeight: 'bold',
                      color: '#4f46e5',
                      marginBottom: '8px'
                    }}>
                      ${typeof work.price === 'number' ? work.price.toFixed(2) : work.price}
                    </div>
                  )}

                  {/* Descripción corta */}
                  {work.description && (
                    <p style={{
                      fontSize: '0.85rem',
                      color: '#666',
                      marginBottom: '12px',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {work.description.length > 80 ? work.description.substring(0, 80) + '...' : work.description}
                    </p>
                  )}

                  {/* Creador */}
                  {work.creators && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '12px',
                      paddingTop: '8px',
                      borderTop: '1px solid #f0f0f0'
                    }}>
                      {work.creators.avatar_url ? (
                        <img
                          src={work.creators.avatar_url}
                          alt={work.creators.full_first_name}
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            objectFit: 'cover'
                          }}
                        />
                      ) : (
                        <div style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #4f46e5, #10b981)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: '0.8rem'
                        }}>
                          {work.creators.full_first_name?.charAt(0) || '👤'}
                        </div>
                      )}
                      <span style={{ fontSize: '0.85rem', color: '#666' }}>
                        {work.creators.full_first_name} {work.creators.full_last_name}
                      </span>
                    </div>
                  )}

                  {/* Botones */}
                  <div style={{
                    display: 'flex',
                    gap: '8px',
                    marginTop: 'auto'
                  }}>
                    <Link
                      href={`/work/${work.id}`}
                      style={{
                        flex: 1,
                        padding: '8px',
                        background: '#4f46e5',
                        color: 'white',
                        textDecoration: 'none',
                        textAlign: 'center',
                        fontSize: '0.85rem',
                        borderRadius: '4px'
                      }}
                    >
                      {t.shop?.details || 'Ver detalles'}
                    </Link>
                    {work.creators && (
                      <button
                        onClick={() => handleContactClick(work.creators)}
                        style={{
                          flex: 1,
                          padding: '8px',
                          background: '#10b981',
                          color: 'white',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                          borderRadius: '4px'
                        }}
                      >
                        📧 {t.shop?.contact || 'Contactar'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
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

      {/* Modal de contacto */}
      {selectedCreator && (
        <ContactModal
          creatorId={selectedCreator.id}
          creatorName={selectedCreator.name}
          creatorEmail={selectedCreator.email}
          isOpen={isContactModalOpen}
          onClose={() => {
            setIsContactModalOpen(false)
            setSelectedCreator(null)
          }}
        />
      )}
    </div>
  )
}